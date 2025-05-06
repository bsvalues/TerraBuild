output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.app_cluster.name
}

output "ecs_cluster_id" {
  description = "The ID of the ECS cluster"
  value       = aws_ecs_cluster.app_cluster.id
}

output "task_definition_family" {
  description = "The family of the task definition"
  value       = aws_ecs_task_definition.app_task.family
}

output "task_definition_arn" {
  description = "The ARN of the task definition"
  value       = aws_ecs_task_definition.app_task.arn
}

output "alb_arn" {
  description = "The ARN of the ALB"
  value       = aws_lb.app_lb.arn
}

output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = aws_lb.app_lb.dns_name
}

output "blue_service_name" {
  description = "The name of the blue service"
  value       = local.is_blue_green_enabled ? aws_ecs_service.blue[0].name : null
}

output "green_service_name" {
  description = "The name of the green service"
  value       = local.is_blue_green_enabled ? aws_ecs_service.green[0].name : null
}

output "active_environment" {
  description = "Which environment (blue/green) is currently active"
  value       = local.is_blue_green_enabled ? local.initial_active_env : null
}

output "rollback_function_arn" {
  description = "The ARN of the rollback function"
  value       = local.is_blue_green_enabled ? aws_lambda_function.rollback_function[0].arn : null
}

output "canary_status" {
  description = "Status of canary deployment"
  value       = local.is_canary_enabled ? {
    enabled             = true
    service_name        = aws_ecs_service.canary[0].name
    traffic_percentage  = var.canary_traffic_percentage
    target_group_arn    = aws_lb_target_group.canary[0].arn
  } : null
}

output "canary_function_arn" {
  description = "The ARN of the canary function"
  value       = local.is_canary_enabled ? aws_lambda_function.canary_function[0].arn : null
}

output "cloudwatch_log_group" {
  description = "The name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "ecs_execution_role_arn" {
  description = "The ARN of the ECS execution role"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "The ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

output "ecs_sg_id" {
  description = "The ID of the ECS security group"
  value       = aws_security_group.ecs_sg.id
}

output "alb_sg_id" {
  description = "The ID of the ALB security group"
  value       = aws_security_group.alb_sg.id
}

output "default_service_name" {
  description = "The name of the default service (when not using blue-green)"
  value       = local.is_blue_green_enabled ? null : aws_ecs_service.default[0].name
}