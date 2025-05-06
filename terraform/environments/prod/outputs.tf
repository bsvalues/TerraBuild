output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.network.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.network.public_subnet_ids
}

output "db_host" {
  description = "Database host endpoint"
  value       = module.database.db_host
}

output "db_port" {
  description = "Database port"
  value       = module.database.db_port
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = module.ecs.ecr_repository_url
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.ecs.alb_dns_name
}

output "app_url" {
  description = "Public URL of the application"
  value       = "https://${var.domain_name}"
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = module.monitoring.cloudwatch_dashboard_url
}

output "web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = module.security.web_acl_id
}

output "deployment_command" {
  description = "Command to deploy to this environment"
  value       = "npm run deploy:prod or ./scripts/deploy.sh --env prod"
}