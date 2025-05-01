/**
 * TerraFusion Monitoring Module
 * 
 * This module provides CloudWatch monitoring, alarms, and alerts for TerraFusion
 */

# Create SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-terrafusion-alerts"
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create SNS subscription for email alerts
resource "aws_sns_topic_subscription" "email_alerts" {
  count     = length(var.alert_emails)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_emails[count.index]
}

# Create CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-terrafusion-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.environment}-terrafusion-service", "ClusterName", "${var.environment}-terrafusion-cluster", { "stat" = "Average" }]
          ]
          region = var.region
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
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "${var.environment}-terrafusion-service", "ClusterName", "${var.environment}-terrafusion-cluster", { "stat" = "Average" }]
          ]
          region = var.region
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
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix, { "stat" = "Sum", "period" = 60 }]
          ]
          region = var.region
          title  = "ALB Request Count"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { "stat" = "Sum", "period" = 60 }],
            ["AWS/ApplicationELB", "HTTPCode_ELB_4XX_Count", "LoadBalancer", var.alb_arn_suffix, { "stat" = "Sum", "period" = 60 }]
          ]
          region = var.region
          title  = "ALB Error Count"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${var.environment}-terrafusion-db", { "stat" = "Average" }]
          ]
          region = var.region
          title  = "RDS CPU Utilization"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", "${var.environment}-terrafusion-db", { "stat" = "Average" }]
          ]
          region = var.region
          title  = "RDS Free Storage Space"
        }
      }
    ]
  })
}

# ECS Service CPU High Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.environment}-terrafusion-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ClusterName = "${var.environment}-terrafusion-cluster"
    ServiceName = "${var.environment}-terrafusion-service"
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# ECS Service Memory High Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.environment}-terrafusion-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ClusterName = "${var.environment}-terrafusion-cluster"
    ServiceName = "${var.environment}-terrafusion-service"
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# RDS CPU High Alarm
resource "aws_cloudwatch_metric_alarm" "db_cpu_high" {
  alarm_name          = "${var.environment}-terrafusion-db-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = "${var.environment}-terrafusion-db"
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# RDS Free Storage Space Low Alarm
resource "aws_cloudwatch_metric_alarm" "db_storage_low" {
  alarm_name          = "${var.environment}-terrafusion-db-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10240 # 10GB in MB
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = "${var.environment}-terrafusion-db"
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# ALB High 5XX Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx_error_rate" {
  alarm_name          = "${var.environment}-terrafusion-alb-5xx-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 5
  alarm_description   = "This alarm monitors for high 5XX error rates"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  
  metric_query {
    id          = "e1"
    expression  = "m2/m1*100"
    label       = "Error Rate"
    return_data = "true"
  }
  
  metric_query {
    id = "m1"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      
      dimensions = {
        LoadBalancer = var.alb_arn_suffix
      }
    }
  }
  
  metric_query {
    id = "m2"
    metric {
      metric_name = "HTTPCode_ELB_5XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      
      dimensions = {
        LoadBalancer = var.alb_arn_suffix
      }
    }
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}