output "blue_target_group_arn" {
  description = "ARN of the blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of the green target group"
  value       = aws_lb_target_group.green.arn
}

output "canary_target_group_arn" {
  description = "ARN of the canary target group"
  value       = aws_lb_target_group.canary.arn
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener"
  value       = aws_lb_listener.https.arn
}

output "test_listener_arn" {
  description = "ARN of the test listener"
  value       = aws_lb_listener.test.arn
}

output "blue_service_name" {
  description = "Name of the blue service"
  value       = aws_ecs_service.blue.name
}

output "green_service_name" {
  description = "Name of the green service"
  value       = aws_ecs_service.green.name
}

output "canary_service_name" {
  description = "Name of the canary service"
  value       = aws_ecs_service.canary.name
}

output "canary_rule_arn" {
  description = "ARN of the canary listener rule"
  value       = aws_lb_listener_rule.canary.arn
}

output "active_environment" {
  description = "Currently active environment (blue or green)"
  value       = var.active_environment
}

output "canary_lambda_function_name" {
  description = "Name of the Lambda function for canary deployments"
  value       = aws_lambda_function.canary_control.function_name
}

output "auto_rollback_lambda_function_name" {
  description = "Name of the Lambda function for automatic rollbacks"
  value       = var.environment == "prod" ? aws_lambda_function.auto_rollback[0].function_name : null
}