# CloudWatch Log Groups for application components
resource "aws_cloudwatch_log_group" "application" {
  name              = "/terrabuild/${var.environment}/application"
  retention_in_days = var.environment == "prod" ? 90 : 30
  
  tags = {
    Name        = "${var.environment}-terrabuild-application-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "database" {
  name              = "/terrabuild/${var.environment}/database"
  retention_in_days = var.environment == "prod" ? 90 : 30
  
  tags = {
    Name        = "${var.environment}-terrabuild-database-logs"
    Environment = var.environment
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-terrabuild-alerts"
  
  tags = {
    Name        = "${var.environment}-terrabuild-alerts"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email" {
  count     = length(var.alert_email_addresses)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-terrabuild-dashboard"
  
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
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.environment}-terrabuild-service", "ClusterName", var.ecs_cluster_id]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS CPU Utilization"
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
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "${var.environment}-terrabuild-service", "ClusterName", var.ecs_cluster_id]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Memory Utilization"
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
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${var.environment}-postgres"]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS CPU Utilization"
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
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", "${var.environment}-postgres"]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Free Storage Space"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", var.load_balancer_arn],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.load_balancer_arn]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "ALB Error Codes"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.load_balancer_arn]
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "ALB Request Count"
        }
      }
    ]
  })
}

# CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.environment}-terrabuild-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ClusterName = var.ecs_cluster_id
    ServiceName = "${var.environment}-terrabuild-service"
  }
  
  tags = {
    Name        = "${var.environment}-terrabuild-cpu-alarm"
    Environment = var.environment
  }
}

# Memory Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "memory_high" {
  alarm_name          = "${var.environment}-terrabuild-memory-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ClusterName = var.ecs_cluster_id
    ServiceName = "${var.environment}-terrabuild-service"
  }
  
  tags = {
    Name        = "${var.environment}-terrabuild-memory-alarm"
    Environment = var.environment
  }
}

# Database CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "db_cpu_high" {
  alarm_name          = "${var.environment}-terrabuild-db-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = "${var.environment}-postgres"
  }
  
  tags = {
    Name        = "${var.environment}-terrabuild-db-cpu-alarm"
    Environment = var.environment
  }
}

# Database Free Storage Space Alarm
resource "aws_cloudwatch_metric_alarm" "db_storage_low" {
  alarm_name          = "${var.environment}-terrabuild-db-free-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5000000000" # 5GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = "${var.environment}-postgres"
  }
  
  tags = {
    Name        = "${var.environment}-terrabuild-db-storage-alarm"
    Environment = var.environment
  }
}

# HTTP 5XX Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "http_5xx_errors" {
  alarm_name          = "${var.environment}-terrabuild-5xx-errors-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors HTTP 5XX errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    LoadBalancer = var.load_balancer_arn
  }
  
  tags = {
    Name        = "${var.environment}-terrabuild-5xx-alarm"
    Environment = var.environment
  }
}