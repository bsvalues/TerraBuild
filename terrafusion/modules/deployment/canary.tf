# Canary Deployment Module for BCBS Application

locals {
  is_canary_enabled = var.enable_canary
  
  # Canary target group and service naming
  canary_tg_name   = "${var.project_name}-${var.environment}-canary-tg"
  canary_service_name = "${var.project_name}-${var.environment}-canary"
}

# Canary Target Group
resource "aws_lb_target_group" "canary" {
  count = local.is_canary_enabled ? 1 : 0
  
  name        = local.canary_tg_name
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
    Name        = local.canary_tg_name
    Environment = var.environment
    Type        = "canary"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# ECS Service for Canary
resource "aws_ecs_service" "canary" {
  count = local.is_canary_enabled ? 1 : 0
  
  name            = local.canary_service_name
  cluster         = aws_ecs_cluster.app_cluster.id
  task_definition = aws_ecs_task_definition.app_task.arn
  launch_type     = "FARGATE"
  
  # Start with 0 instances, the canary function will scale it up when needed
  desired_count = 0
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.canary[0].arn
    container_name   = "${var.project_name}-container"
    container_port   = 80
  }
  
  health_check_grace_period_seconds = 60
  
  deployment_controller {
    type = "ECS"
  }
  
  tags = {
    Name        = local.canary_service_name
    Environment = var.environment
    Type        = "canary"
  }
  
  lifecycle {
    ignore_changes = [desired_count]
  }
  
  depends_on = [
    aws_lb_target_group.canary,
    aws_lb_listener_rule.canary_rule
  ]
}

# Listener Rule for weighted routing (canary deployment)
resource "aws_lb_listener_rule" "canary_rule" {
  count = local.is_canary_enabled ? 1 : 0
  
  listener_arn = aws_lb_listener.app_listener.arn
  
  action {
    type = "forward"
    forward {
      target_groups = [
        {
          arn    = local.is_blue_green_enabled ? local.active_tg.arn : aws_lb_target_group.default[0].arn
          weight = 100 - var.canary_traffic_percentage
        },
        {
          arn    = aws_lb_target_group.canary[0].arn
          weight = var.canary_traffic_percentage
        }
      ]
      
      stickiness {
        enabled  = true
        duration = 300
      }
    }
  }
  
  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

# Lambda function for canary deployment management
resource "aws_lambda_function" "canary_function" {
  count = local.is_canary_enabled ? 1 : 0
  
  function_name    = "${var.project_name}-${var.environment}-canary-manager"
  description      = "Canary deployment manager function"
  filename         = var.canary_function_path
  source_code_hash = filebase64sha256(var.canary_function_path)
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  timeout          = 60
  memory_size      = 256
  
  role = aws_iam_role.lambda_role[0].arn
  
  environment {
    variables = {
      ALB_LISTENER_ARN  = aws_lb_listener.app_listener.arn
      LISTENER_RULE_ARN = aws_lb_listener_rule.canary_rule[0].arn
      CURRENT_TG_ARN    = local.is_blue_green_enabled ? local.active_tg.arn : aws_lb_target_group.default[0].arn
      CANARY_TG_ARN     = aws_lb_target_group.canary[0].arn
      ECS_CLUSTER       = aws_ecs_cluster.app_cluster.id
      CANARY_SERVICE    = aws_ecs_service.canary[0].name
      ENVIRONMENT       = var.environment
      PROJECT           = var.project_name
      SNS_TOPIC_ARN     = aws_sns_topic.canary_alerts[0].arn
    }
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-canary-manager"
    Environment = var.environment
    Component   = "CanaryDeployment"
  }
}

# CloudWatch Events Rule to trigger canary assessment periodically
resource "aws_cloudwatch_event_rule" "canary_assessment" {
  count = local.is_canary_enabled ? 1 : 0
  
  name                = "${var.project_name}-${var.environment}-canary-assessment"
  description         = "Triggers periodic assessment of canary deployment"
  schedule_expression = "rate(5 minutes)"
}

# CloudWatch Events Target to invoke Lambda
resource "aws_cloudwatch_event_target" "canary_lambda_target" {
  count = local.is_canary_enabled ? 1 : 0
  
  rule      = aws_cloudwatch_event_rule.canary_assessment[0].name
  target_id = "InvokeCanaryLambda"
  arn       = aws_lambda_function.canary_function[0].arn
  
  input = jsonencode({
    action = "status"
  })
}

# Lambda permission for CloudWatch Events
resource "aws_lambda_permission" "cloudwatch_events_permission" {
  count = local.is_canary_enabled ? 1 : 0
  
  statement_id  = "AllowExecutionFromCloudWatchEvents"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.canary_function[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.canary_assessment[0].arn
}

# Canary deployment specific alarms
resource "aws_cloudwatch_metric_alarm" "canary_error_rate" {
  count = local.is_canary_enabled ? 1 : 0
  
  alarm_name          = "${var.project_name}-${var.environment}-canary-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm monitors error rates in canary deployment"
  
  dimensions = {
    LoadBalancer = aws_lb.app_lb.arn_suffix
    TargetGroup  = aws_lb_target_group.canary[0].arn_suffix
  }
  
  alarm_actions = [
    aws_sns_topic.canary_alerts[0].arn
  ]
}

# SNS Topic for canary deployment alerts
resource "aws_sns_topic" "canary_alerts" {
  count = local.is_canary_enabled ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-canary-alerts"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-canary-alerts"
    Environment = var.environment
    Component   = "Monitoring"
  }
}

# Subscribe Lambda function to SNS topic for automatic rollback
resource "aws_sns_topic_subscription" "canary_lambda_subscription" {
  count = local.is_canary_enabled ? 1 : 0
  
  topic_arn = aws_sns_topic.canary_alerts[0].arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.canary_function[0].arn
}

# Lambda permission for SNS invocation
resource "aws_lambda_permission" "canary_sns_trigger" {
  count = local.is_canary_enabled ? 1 : 0
  
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.canary_function[0].function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.canary_alerts[0].arn
}