###########################################################
# Blue-Green Deployment Infrastructure for BCBS Application
###########################################################

# ECS Cluster for running the application containers
resource "aws_ecs_cluster" "bcbs_cluster" {
  name = "${var.project}-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.project}-cluster-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# Task Definition for the application
resource "aws_ecs_task_definition" "bcbs_task" {
  family                   = "${var.project}-task-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.app_cpu
  memory                   = var.app_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "${var.project}-container"
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true
      
      portMappings = [
        {
          containerPort = 5000
          hostPort      = 5000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.bcbs_db.endpoint}/${var.db_name}"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_cluster.bcbs_redis.cache_nodes.0.address}:6379"
        },
        {
          name  = "DEPLOYMENT_ID"
          value = var.deployment_id
        },
        {
          name  = "DEPLOYMENT_COLOR"
          value = var.target_environment
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project}-${var.environment}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = var.target_environment
        }
      }
    }
  ])

  tags = {
    Name        = "${var.project}-task-${var.environment}"
    Environment = var.environment
    Project     = var.project
    Color       = var.target_environment
  }
}

# Blue service
resource "aws_ecs_service" "blue" {
  name            = "${var.project}-service-blue-${var.environment}"
  cluster         = aws_ecs_cluster.bcbs_cluster.id
  task_definition = aws_ecs_task_definition.bcbs_task.arn
  desired_count   = var.target_environment == "blue" ? var.app_count : 0
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.app_sg.id]
    subnets          = aws_subnet.private.*.id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "${var.project}-container"
    container_port   = 5000
  }

  # Allow external changes without Terraform plan difference
  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = {
    Name        = "${var.project}-service-blue-${var.environment}"
    Environment = var.environment
    Project     = var.project
    Color       = "blue"
  }
}

# Green service
resource "aws_ecs_service" "green" {
  name            = "${var.project}-service-green-${var.environment}"
  cluster         = aws_ecs_cluster.bcbs_cluster.id
  task_definition = aws_ecs_task_definition.bcbs_task.arn
  desired_count   = var.target_environment == "green" ? var.app_count : 0
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.app_sg.id]
    subnets          = aws_subnet.private.*.id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "${var.project}-container"
    container_port   = 5000
  }

  # Allow external changes without Terraform plan difference
  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = {
    Name        = "${var.project}-service-green-${var.environment}"
    Environment = var.environment
    Project     = var.project
    Color       = "green"
  }
}

# Application Load Balancer
resource "aws_lb" "bcbs_alb" {
  name               = "${var.project}-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public.*.id

  enable_deletion_protection = var.environment == "prod" ? true : false

  tags = {
    Name        = "${var.project}-alb-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# Blue target group
resource "aws_lb_target_group" "blue" {
  name        = "${var.project}-tg-blue-${var.environment}"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.bcbs_vpc.id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = {
    Name        = "${var.project}-tg-blue-${var.environment}"
    Environment = var.environment
    Project     = var.project
    Color       = "blue"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Green target group
resource "aws_lb_target_group" "green" {
  name        = "${var.project}-tg-green-${var.environment}"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.bcbs_vpc.id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = {
    Name        = "${var.project}-tg-green-${var.environment}"
    Environment = var.environment
    Project     = var.project
    Color       = "green"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Listener Rule for HTTP to HTTPS redirect
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.bcbs_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS listener - this will be used for production traffic
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.bcbs_alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = var.active_environment == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
  }

  lifecycle {
    ignore_changes = [default_action]
  }
}

# Test Listener - will be used during deployment to test the new environment before switching
resource "aws_lb_listener" "test" {
  load_balancer_arn = aws_lb.bcbs_alb.arn
  port              = 8443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = var.active_environment == "blue" ? aws_lb_target_group.green.arn : aws_lb_target_group.blue.arn
  }

  lifecycle {
    ignore_changes = [default_action]
  }
}

# ALB Security Group
resource "aws_security_group" "alb_sg" {
  name        = "${var.project}-alb-sg-${var.environment}"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.bcbs_vpc.id

  # Allow HTTP from anywhere
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS from anywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow test port from anywhere
  ingress {
    from_port   = 8443
    to_port     = 8443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project}-alb-sg-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# IAM Roles for ECS
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project}-ecs-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  ]

  tags = {
    Name        = "${var.project}-ecs-execution-role-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project}-ecs-task-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  inline_policy {
    name = "bcbs-app-permissions"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Action = [
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ]
          Resource = "*"
        }
      ]
    })
  }

  tags = {
    Name        = "${var.project}-ecs-task-role-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "bcbs_logs" {
  name              = "/ecs/${var.project}-${var.environment}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project}-logs-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# CloudWatch Alarms for high error rates (useful for automated rollbacks)
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.project}-high-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors error rate"
  
  dimensions = {
    LoadBalancer = aws_lb.bcbs_alb.arn_suffix
    TargetGroup  = var.active_environment == "blue" ? aws_lb_target_group.blue.arn_suffix : aws_lb_target_group.green.arn_suffix
  }

  alarm_actions = [
    aws_sns_topic.alerts.arn
  ]
}

# SNS Topic for alerts and notifications
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts-${var.environment}"

  tags = {
    Name        = "${var.project}-alerts-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# Route 53 record for the application
resource "aws_route53_record" "bcbs_app" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.bcbs_alb.dns_name
    zone_id                = aws_lb.bcbs_alb.zone_id
    evaluate_target_health = true
  }
}

# Outputs for the Blue-Green deployment
output "alb_dns_name" {
  value = aws_lb.bcbs_alb.dns_name
}

output "app_url" {
  value = var.domain_name
}

output "blue_target_group_arn" {
  value = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  value = aws_lb_target_group.green.arn
}

output "active_environment" {
  value = var.active_environment
}

output "target_environment" {
  value = var.target_environment
}