output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.networking.vpc_id
}

output "public_subnets" {
  description = "The IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnets" {
  description = "The IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = module.deployment.ecs_cluster_name
}

output "task_definition_family" {
  description = "The family of the task definition"
  value       = module.deployment.task_definition_family
}

output "blue_service_name" {
  description = "The name of the blue service"
  value       = module.deployment.blue_service_name
}

output "green_service_name" {
  description = "The name of the green service"
  value       = module.deployment.green_service_name
}

output "active_environment" {
  description = "Which environment (blue/green) is currently active"
  value       = module.deployment.active_environment
}

output "app_url" {
  description = "The URL for the application"
  value       = module.deployment.alb_dns_name
}

output "db_endpoint" {
  description = "The endpoint of the database"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "deployment_strategy" {
  description = "The deployment strategy being used"
  value       = var.enable_canary ? "canary" : (var.enable_blue_green ? "blue-green" : "rolling")
}

output "deployed_version" {
  description = "The currently deployed application version"
  value       = var.app_version
}

output "deployment_timestamp" {
  description = "Timestamp of the last deployment"
  value       = timestamp()
}

output "canary_status" {
  description = "Status of canary deployment (if enabled)"
  value       = var.enable_canary ? module.deployment.canary_status : "disabled"
}

output "rollback_function_arn" {
  description = "ARN of the rollback function"
  value       = var.enable_blue_green ? module.deployment.rollback_function_arn : null
}

output "environment_name" {
  description = "Name of the current environment"
  value       = var.environment
}