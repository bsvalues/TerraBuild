output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.network.private_subnet_ids
}

output "database_endpoint" {
  description = "The connection endpoint for the PostgreSQL database"
  value       = module.database.database_endpoint
}

output "database_secret_arn" {
  description = "ARN of the AWS Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.database_credentials.arn
}

output "ecr_repository_url" {
  description = "URL of the ECR repository for the application"
  value       = module.ecs.ecr_repository_url
}

output "load_balancer_dns" {
  description = "DNS name of the application load balancer"
  value       = module.ecs.load_balancer_dns
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = module.ecs.ecs_cluster_id
}

output "monitoring_dashboard_url" {
  description = "URL to the CloudWatch monitoring dashboard"
  value       = module.monitoring.monitoring_dashboard_url
}

output "alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = module.monitoring.alerts_topic_arn
}

output "application_log_group" {
  description = "Name of the application log group"
  value       = module.monitoring.application_log_group
}