###########################################################
# BCBS Canary Deployment Module
# This module creates the infrastructure for Canary deployments
###########################################################

# Canary target group for gradual traffic shifting
resource "aws_lb_target_group" "canary" {
  name        = "${var.project}-tg-canary-${var.environment}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = var.health_check_path
    interval            = 15  # Shorter interval for canary deployments
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200"
  }

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-tg-canary-${var.environment}"
      Environment = var.environment
      Project     = var.project
      Type        = "Canary"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Canary service for testing new versions
resource "aws_ecs_service" "canary" {
  name            = "${var.project}-service-canary-${var.environment}"
  cluster         = var.ecs_cluster_id
  task_definition = var.task_definition_arn
  # Initially set to 0, will be controlled by deployment scripts
  desired_count   = 0
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [var.app_security_group_id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.canary.arn
    container_name   = "${var.project}-container"
    container_port   = var.container_port
  }

  # Allow external changes without Terraform plan difference
  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-service-canary-${var.environment}"
      Environment = var.environment
      Project     = var.project
      Type        = "Canary"
    }
  )
}

# HTTPS listener rule for weighted traffic distribution during canary deployments
resource "aws_lb_listener_rule" "canary" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.canary.arn
    
    # Default to 0% traffic to canary, adjusted during deployment
    forward {
      target_group {
        arn    = var.active_environment == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
        weight = 100
      }
      
      target_group {
        arn    = aws_lb_target_group.canary.arn
        weight = 0
      }
      
      stickiness {
        enabled  = true
        duration = 300  # 5 minutes
      }
    }
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }

  # This allows our canary deployment script to modify the weights
  lifecycle {
    ignore_changes = [action]
  }

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-canary-rule-${var.environment}"
      Environment = var.environment
      Project     = var.project
    }
  )
}

# CloudWatch Dashboard for canary deployment monitoring
resource "aws_cloudwatch_dashboard" "canary" {
  dashboard_name = "${var.project}-canary-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "TargetGroup", aws_lb_target_group.canary.arn_suffix, "LoadBalancer", var.alb_arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "TargetGroup", var.active_environment == "blue" ? aws_lb_target_group.blue.arn_suffix : aws_lb_target_group.green.arn_suffix, "LoadBalancer", var.alb_arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "HTTP 5XX Errors (Canary vs Current)"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "TargetGroup", aws_lb_target_group.canary.arn_suffix, "LoadBalancer", var.alb_arn_suffix],
            ["AWS/ApplicationELB", "TargetResponseTime", "TargetGroup", var.active_environment == "blue" ? aws_lb_target_group.blue.arn_suffix : aws_lb_target_group.green.arn_suffix, "LoadBalancer", var.alb_arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Response Time (Canary vs Current)"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "TargetGroup", aws_lb_target_group.canary.arn_suffix, "LoadBalancer", var.alb_arn_suffix],
            ["AWS/ApplicationELB", "RequestCount", "TargetGroup", var.active_environment == "blue" ? aws_lb_target_group.blue.arn_suffix : aws_lb_target_group.green.arn_suffix, "LoadBalancer", var.alb_arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Request Count (Canary vs Current)"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.canary.name, "ClusterName", var.ecs_cluster_name],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", aws_ecs_service.canary.name, "ClusterName", var.ecs_cluster_name]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Canary Service Resource Utilization"
          period  = 60
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-canary-dashboard-${var.environment}"
      Environment = var.environment
      Project     = var.project
    }
  )
}

# CloudWatch Alarm specifically for canary deployment monitoring
resource "aws_cloudwatch_metric_alarm" "canary_errors" {
  alarm_name          = "${var.project}-canary-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1" # Faster evaluation for canary
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5" # Lower threshold for canary
  alarm_description   = "This metric monitors canary deployment error rate"
  
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = aws_lb_target_group.canary.arn_suffix
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-canary-error-rate-${var.environment}"
      Environment = var.environment
      Project     = var.project
      Type        = "Canary"
    }
  )
}

# CloudWatch Alarm for canary response time
resource "aws_cloudwatch_metric_alarm" "canary_latency" {
  alarm_name          = "${var.project}-canary-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0.8" # Lower threshold for canary
  alarm_description   = "This metric monitors canary deployment response time"
  
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = aws_lb_target_group.canary.arn_suffix
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-canary-latency-${var.environment}"
      Environment = var.environment
      Project     = var.project
      Type        = "Canary"
    }
  )
}

# Lambda function for controlling canary deployment traffic percentages
resource "aws_lambda_function" "canary_control" {
  function_name    = "${var.project}-canary-control-${var.environment}"
  filename         = var.canary_lambda_zip
  source_code_hash = filebase64sha256(var.canary_lambda_zip)
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.canary_lambda_role.arn
  timeout          = 30
  
  environment {
    variables = {
      ALB_LISTENER_ARN     = aws_lb_listener.https.arn
      LISTENER_RULE_ARN    = aws_lb_listener_rule.canary.arn
      CURRENT_TG_ARN       = var.active_environment == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
      CANARY_TG_ARN        = aws_lb_target_group.canary.arn
      ECS_CLUSTER          = var.ecs_cluster_name
      CANARY_SERVICE       = aws_ecs_service.canary.name
      ENVIRONMENT          = var.environment
      PROJECT              = var.project
      SNS_TOPIC_ARN        = var.sns_topic_arn
    }
  }
  
  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-canary-control-${var.environment}"
      Environment = var.environment
      Project     = var.project
    }
  )
}

# IAM role for canary Lambda function
resource "aws_iam_role" "canary_lambda_role" {
  name = "${var.project}-canary-lambda-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-canary-lambda-role-${var.environment}"
      Environment = var.environment
      Project     = var.project
    }
  )
}

# IAM policy for canary Lambda function
resource "aws_iam_role_policy" "canary_lambda_policy" {
  name = "${var.project}-canary-lambda-policy-${var.environment}"
  role = aws_iam_role.canary_lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:ModifyRule",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTargetGroups",
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:DescribeAlarms",
          "sns:Publish",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}