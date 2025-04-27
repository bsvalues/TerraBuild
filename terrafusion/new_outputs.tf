###########################################################
# BCBS Infrastructure as Code - Outputs
# This file defines all outputs from the infrastructure
###########################################################

# Core infrastructure outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

# Load balancer outputs
output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The canonical hosted zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

# Database outputs
output "db_endpoint" {
  description = "The connection endpoint for the PostgreSQL database"
  value       = module.database.db_endpoint
}

output "db_name" {
  description = "The name of the PostgreSQL database"
  value       = module.database.db_name
}

output "redis_endpoint" {
  description = "The connection endpoint for the Redis instance"
  value       = module.database.redis_endpoint
}

# Deployment outputs
output "active_environment" {
  description = "Currently active environment (blue or green)"
  value       = var.active_environment
}

output "blue_target_group_arn" {
  description = "ARN of the blue target group"
  value       = module.deployment.blue_target_group_arn
}

output "green_target_group_arn" {
  description = "ARN of the green target group"
  value       = module.deployment.green_target_group_arn
}

output "canary_target_group_arn" {
  description = "ARN of the canary target group"
  value       = module.deployment.canary_target_group_arn
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener"
  value       = module.deployment.https_listener_arn
}

output "test_listener_arn" {
  description = "ARN of the test listener"
  value       = module.deployment.test_listener_arn
}

# Application outputs
output "app_url" {
  description = "The URL of the application"
  value       = var.hosted_zone_id != "" ? var.domain_name : aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "blue_service_name" {
  description = "Name of the blue service"
  value       = module.deployment.blue_service_name
}

output "green_service_name" {
  description = "Name of the green service"
  value       = module.deployment.green_service_name
}

output "canary_service_name" {
  description = "Name of the canary service"
  value       = module.deployment.canary_service_name
}

output "task_definition_family" {
  description = "Family of the task definition"
  value       = aws_ecs_task_definition.app.family
}

# Other useful outputs
output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group for the application"
  value       = aws_cloudwatch_log_group.ecs_logs.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerting"
  value       = aws_sns_topic.alerts.arn
}