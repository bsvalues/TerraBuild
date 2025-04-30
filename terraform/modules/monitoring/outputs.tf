output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for monitoring alerts"
  value       = aws_sns_topic.alerts.arn
}

output "monitoring_alarms" {
  description = "List of CloudWatch alarm names"
  value = [
    aws_cloudwatch_metric_alarm.ecs_cpu_utilization_high.alarm_name,
    aws_cloudwatch_metric_alarm.ecs_memory_utilization_high.alarm_name,
    aws_cloudwatch_metric_alarm.rds_free_storage_space_low.alarm_name,
    aws_cloudwatch_metric_alarm.alb_5xx_errors_high.alarm_name,
    aws_cloudwatch_metric_alarm.error_logs_alarm.alarm_name
  ]
}