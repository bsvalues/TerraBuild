output "monitoring_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "application_log_group" {
  description = "Name of the application log group"
  value       = aws_cloudwatch_log_group.application.name
}

output "database_log_group" {
  description = "Name of the database log group"
  value       = aws_cloudwatch_log_group.database.name
}