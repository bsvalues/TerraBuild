/**
 * TerraFusion Compute Module
 * 
 * This module provisions ECS cluster, task definitions, and services for TerraFusion
 */

# Create ECR Repository for container images
resource "aws_ecr_repository" "app" {
  name                 = "${var.environment}-terrafusion"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-terrafusion-cluster"
  
  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create CloudWatch Log Group for ECS logs
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/${var.environment}-terrafusion-app"
  retention_in_days = var.log_retention_days
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create IAM role for ECS task execution
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.environment}-terrafusion-ecs-execution-role"
  
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
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Attach policies to ECS execution role
resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Create IAM role for ECS task
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.environment}-terrafusion-ecs-task-role"
  
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
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create policy for ECS task to access resources
resource "aws_iam_policy" "ecs_task_policy" {
  name        = "${var.environment}-terrafusion-ecs-task-policy"
  description = "Policy for TerraFusion ECS tasks"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          var.db_secret_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          aws_s3_bucket.app_storage.arn,
          "${aws_s3_bucket.app_storage.arn}/*"
        ]
      }
    ]
  })
}

# Attach policy to ECS task role
resource "aws_iam_role_policy_attachment" "ecs_task_policy_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_policy.arn
}

# Create S3 bucket for application storage
resource "aws_s3_bucket" "app_storage" {
  bucket = "${var.environment}-terrafusion-storage"
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Configure S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Configure S3 bucket lifecycle policy
resource "aws_s3_bucket_lifecycle_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  
  rule {
    id     = "temp-files-cleanup"
    status = "Enabled"
    
    expiration {
      days = 7
    }
    
    filter {
      prefix = "temp/"
    }
  }
}

# Create Application Load Balancer
resource "aws_lb" "app" {
  name               = "${var.environment}-terrafusion-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = var.environment == "prod"
  
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "${var.environment}-alb-logs"
    enabled = true
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create S3 bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.environment}-terrafusion-alb-logs"
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Configure ALB logs S3 bucket policy
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_elb_service_account.current.id}:root"
        }
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/${var.environment}-alb-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
      }
    ]
  })
}

# Create Target Group for Blue environment
resource "aws_lb_target_group" "blue" {
  name        = "${var.environment}-terrafusion-blue-tg"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    path                = "/api/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
    matcher             = "200"
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create Target Group for Green environment
resource "aws_lb_target_group" "green" {
  name        = "${var.environment}-terrafusion-green-tg"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    path                = "/api/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
    matcher             = "200"
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create HTTP listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
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

# Create HTTPS listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }
}

# Create ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.environment}-terrafusion-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name         = "terrafusion-app"
      image        = "${aws_ecr_repository.app.repository_url}:${var.app_version}"
      essential    = true
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
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.db_secret_arn}:connection_url::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create ECS Service
resource "aws_ecs_service" "app" {
  name            = "${var.environment}-terrafusion-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.service_desired_count
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.app_security_group_id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "terrafusion-app"
    container_port   = 5000
  }
  
  deployment_controller {
    type = "ECS"
  }
  
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
  
  lifecycle {
    ignore_changes = [
      load_balancer,  # Allows blue/green script to modify this
      task_definition # Allows blue/green script to modify this
    ]
  }
}

# Data sources
data "aws_elb_service_account" "current" {}
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}