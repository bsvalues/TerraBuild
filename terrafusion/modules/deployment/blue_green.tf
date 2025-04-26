###########################################################
# BCBS Blue-Green Deployment Module
# This module creates the infrastructure for Blue-Green deployments
###########################################################

# Blue service
resource "aws_ecs_service" "blue" {
  name            = "${var.project}-service-blue-${var.environment}"
  cluster         = var.ecs_cluster_id
  task_definition = var.task_definition_arn
  desired_count   = var.active_environment == "blue" ? var.app_count : 0
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [var.app_security_group_id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "${var.project}-container"
    container_port   = var.container_port
  }

  # Allow external changes without Terraform plan difference
  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-service-blue-${var.environment}"
      Environment = var.environment
      Project     = var.project
      Color       = "blue"
    }
  )
}

# Green service
resource "aws_ecs_service" "green" {
  name            = "${var.project}-service-green-${var.environment}"
  cluster         = var.ecs_cluster_id
  task_definition = var.task_definition_arn
  desired_count   = var.active_environment == "green" ? var.app_count : 0
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [var.app_security_group_id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "${var.project}-container"
    container_port   = var.container_port
  }

  # Allow external changes without Terraform plan difference
  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-service-green-${var.environment}"
      Environment = var.environment
      Project     = var.project
      Color       = "green"
    }
  )
}

# Blue target group
resource "aws_lb_target_group" "blue" {
  name        = "${var.project}-tg-blue-${var.environment}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = var.health_check_path
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-tg-blue-${var.environment}"
      Environment = var.environment
      Project     = var.project
      Color       = "blue"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Green target group
resource "aws_lb_target_group" "green" {
  name        = "${var.project}-tg-green-${var.environment}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = var.health_check_path
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-tg-green-${var.environment}"
      Environment = var.environment
      Project     = var.project
      Color       = "green"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# HTTPS listener - this will be used for production traffic
resource "aws_lb_listener" "https" {
  load_balancer_arn = var.alb_arn
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

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-https-listener-${var.environment}"
      Environment = var.environment
      Project     = var.project
    }
  )
}

# Test Listener - will be used during deployment to test the new environment before switching
resource "aws_lb_listener" "test" {
  load_balancer_arn = var.alb_arn
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

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-test-listener-${var.environment}"
      Environment = var.environment
      Project     = var.project
    }
  )
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
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.active_environment == "blue" ? aws_lb_target_group.blue.arn_suffix : aws_lb_target_group.green.arn_suffix
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-high-error-rate-${var.environment}"
      Environment = var.environment
      Project     = var.project
    }
  )
}

# Additional metric alarm for high response latency
resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "${var.project}-high-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1.0" # 1 second
  alarm_description   = "This metric monitors response latency"
  
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.active_environment == "blue" ? aws_lb_target_group.blue.arn_suffix : aws_lb_target_group.green.arn_suffix
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]

  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-high-latency-${var.environment}"
      Environment = var.environment
      Project     = var.project
    }
  )
}

# Lambda function for automated rollback
resource "aws_lambda_function" "auto_rollback" {
  count = var.environment == "prod" ? 1 : 0
  
  function_name    = "${var.project}-auto-rollback-${var.environment}"
  filename         = var.rollback_lambda_zip
  source_code_hash = filebase64sha256(var.rollback_lambda_zip)
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_role[0].arn
  timeout          = 30
  
  environment {
    variables = {
      ALB_LISTENER_ARN = aws_lb_listener.https.arn
      BLUE_TG_ARN      = aws_lb_target_group.blue.arn
      GREEN_TG_ARN     = aws_lb_target_group.green.arn
      ENVIRONMENT      = var.environment
      PROJECT          = var.project
    }
  }
  
  tags = merge(
    var.common_tags,
    {
      Name        = "${var.project}-auto-rollback-${var.environment}"
      Environment = var.environment
      Project     = var.project
    }
  )
}

# IAM role for Lambda rollback function
resource "aws_iam_role" "lambda_role" {
  count = var.environment == "prod" ? 1 : 0
  
  name = "${var.project}-lambda-rollback-role-${var.environment}"
  
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
      Name        = "${var.project}-lambda-rollback-role-${var.environment}"
      Environment = var.environment
      Project     = var.project
    }
  )
}

# IAM policy for Lambda rollback function
resource "aws_iam_role_policy" "lambda_policy" {
  count = var.environment == "prod" ? 1 : 0
  
  name = "${var.project}-lambda-rollback-policy-${var.environment}"
  role = aws_iam_role.lambda_role[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeTargetGroups",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# SNS subscription for Lambda to receive CloudWatch alarm notifications
resource "aws_sns_topic_subscription" "lambda_subscription" {
  count = var.environment == "prod" ? 1 : 0
  
  topic_arn = var.sns_topic_arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.auto_rollback[0].arn
}

# Permission for SNS to invoke Lambda
resource "aws_lambda_permission" "with_sns" {
  count = var.environment == "prod" ? 1 : 0
  
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_rollback[0].function_name
  principal     = "sns.amazonaws.com"
  source_arn    = var.sns_topic_arn
}