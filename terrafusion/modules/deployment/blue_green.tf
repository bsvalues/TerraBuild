# Blue-Green Deployment Module for BCBS Application

locals {
  is_blue_green_enabled = var.enable_blue_green
  
  # Load balancer name must be unique and not exceed 32 characters
  lb_name_prefix = substr("${var.project_name}-${var.environment}", 0, 22)
  blue_tg_name   = "${var.project_name}-${var.environment}-blue-tg"
  green_tg_name  = "${var.project_name}-${var.environment}-green-tg"
  
  # Initial active environment is blue by default
  initial_active_env = "blue"
  
  # Active/inactive target group mapping
  active_tg    = local.initial_active_env == "blue" ? aws_lb_target_group.blue[0] : aws_lb_target_group.green[0]
  inactive_tg  = local.initial_active_env == "blue" ? aws_lb_target_group.green[0] : aws_lb_target_group.blue[0]
  
  # Service names
  blue_service_name  = "${var.project_name}-${var.environment}-blue"
  green_service_name = "${var.project_name}-${var.environment}-green"
}

# Blue Target Group
resource "aws_lb_target_group" "blue" {
  count = local.is_blue_green_enabled ? 1 : 0
  
  name        = local.blue_tg_name
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = var.health_check_path
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200-299"
  }
  
  tags = {
    Name        = local.blue_tg_name
    Environment = var.environment
    Color       = "blue"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# Green Target Group
resource "aws_lb_target_group" "green" {
  count = local.is_blue_green_enabled ? 1 : 0
  
  name        = local.green_tg_name
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = var.health_check_path
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200-299"
  }
  
  tags = {
    Name        = local.green_tg_name
    Environment = var.environment
    Color       = "green"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# ECS Services for Blue-Green Deployment
resource "aws_ecs_service" "blue" {
  count = local.is_blue_green_enabled ? 1 : 0
  
  name            = local.blue_service_name
  cluster         = aws_ecs_cluster.app_cluster.id
  task_definition = aws_ecs_task_definition.app_task.arn
  launch_type     = "FARGATE"
  
  desired_count = local.initial_active_env == "blue" ? var.min_capacity : 0
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.blue[0].arn
    container_name   = "${var.project_name}-container"
    container_port   = 80
  }
  
  health_check_grace_period_seconds = 60
  
  deployment_controller {
    type = "ECS"
  }
  
  tags = {
    Name        = local.blue_service_name
    Environment = var.environment
    Color       = "blue"
  }
  
  lifecycle {
    ignore_changes = [desired_count]
  }
  
  depends_on = [
    aws_lb_target_group.blue,
    aws_lb_listener.app_listener
  ]
}

resource "aws_ecs_service" "green" {
  count = local.is_blue_green_enabled ? 1 : 0
  
  name            = local.green_service_name
  cluster         = aws_ecs_cluster.app_cluster.id
  task_definition = aws_ecs_task_definition.app_task.arn
  launch_type     = "FARGATE"
  
  desired_count = local.initial_active_env == "green" ? var.min_capacity : 0
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.green[0].arn
    container_name   = "${var.project_name}-container"
    container_port   = 80
  }
  
  health_check_grace_period_seconds = 60
  
  deployment_controller {
    type = "ECS"
  }
  
  tags = {
    Name        = local.green_service_name
    Environment = var.environment
    Color       = "green"
  }
  
  lifecycle {
    ignore_changes = [desired_count]
  }
  
  depends_on = [
    aws_lb_target_group.green,
    aws_lb_listener.app_listener
  ]
}

# Automatic rollback Lambda function for Blue-Green deployment
resource "aws_lambda_function" "rollback_function" {
  count = local.is_blue_green_enabled ? 1 : 0
  
  function_name    = "${var.project_name}-${var.environment}-rollback"
  description      = "Automatic rollback function for Blue-Green deployment"
  filename         = var.rollback_function_path
  source_code_hash = filebase64sha256(var.rollback_function_path)
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  timeout          = 30
  memory_size      = 128
  
  role = aws_iam_role.lambda_role[0].arn
  
  environment {
    variables = {
      ALB_LISTENER_ARN = aws_lb_listener.app_listener.arn
      BLUE_TG_ARN      = aws_lb_target_group.blue[0].arn
      GREEN_TG_ARN     = aws_lb_target_group.green[0].arn
      ENVIRONMENT      = var.environment
      PROJECT          = var.project_name
    }
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-rollback"
    Environment = var.environment
    Component   = "BlueGreenDeployment"
  }
}

# CloudWatch Alarms for triggering automatic rollback
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  count = local.is_blue_green_enabled ? 1 : 0
  
  alarm_name          = "${var.project_name}-${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors for high error rates in the application"
  
  dimensions = {
    LoadBalancer = aws_lb.app_lb.arn_suffix
    TargetGroup  = local.active_tg.arn_suffix
  }
  
  alarm_actions = [
    aws_sns_topic.deployment_alerts[0].arn
  ]
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  count = local.is_blue_green_enabled ? 1 : 0
  
  alarm_name          = "${var.project_name}-${var.environment}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 2
  alarm_description   = "This alarm monitors for high latency in the application"
  
  dimensions = {
    LoadBalancer = aws_lb.app_lb.arn_suffix
    TargetGroup  = local.active_tg.arn_suffix
  }
  
  alarm_actions = [
    aws_sns_topic.deployment_alerts[0].arn
  ]
}

# SNS Topic for deployment alerts
resource "aws_sns_topic" "deployment_alerts" {
  count = local.is_blue_green_enabled ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-deployment-alerts"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-deployment-alerts"
    Environment = var.environment
    Component   = "Monitoring"
  }
}

# Subscribe Lambda function to SNS topic
resource "aws_sns_topic_subscription" "rollback_lambda_subscription" {
  count = local.is_blue_green_enabled ? 1 : 0
  
  topic_arn = aws_sns_topic.deployment_alerts[0].arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.rollback_function[0].arn
}

# Lambda permission to allow SNS to trigger the function
resource "aws_lambda_permission" "sns_trigger" {
  count = local.is_blue_green_enabled ? 1 : 0
  
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rollback_function[0].function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.deployment_alerts[0].arn
}

# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  count = local.is_blue_green_enabled || var.enable_canary ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-role"
    Environment = var.environment
  }
}

# IAM Policy for Lambda functions
resource "aws_iam_policy" "lambda_policy" {
  count = local.is_blue_green_enabled || var.enable_canary ? 1 : 0
  
  name        = "${var.project_name}-${var.environment}-lambda-policy"
  description = "Policy for Blue-Green deployment Lambda functions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:ModifyRule"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "ecs:DescribeServices",
          "ecs:UpdateService"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "sns:Publish"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-policy"
    Environment = var.environment
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  count = local.is_blue_green_enabled || var.enable_canary ? 1 : 0
  
  role       = aws_iam_role.lambda_role[0].name
  policy_arn = aws_iam_policy.lambda_policy[0].arn
}