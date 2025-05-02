# TerraFusion Infrastructure Outputs
# Outputs from the Terraform configuration

# EKS cluster outputs
output "eks_cluster_id" {
  description = "The name of the EKS cluster"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "eks_node_security_group_id" {
  description = "Security group ID attached to the EKS nodes"
  value       = module.eks.node_security_group_id
}

output "eks_oidc_provider_arn" {
  description = "The ARN of the OIDC Provider for EKS"
  value       = module.eks.oidc_provider_arn
}

# RDS database outputs
output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = module.db.db_instance_address
}

output "db_instance_port" {
  description = "The port of the RDS instance"
  value       = module.db.db_instance_port
}

output "db_instance_name" {
  description = "The database name"
  value       = module.db.db_instance_name
}

output "db_instance_username" {
  description = "The master username for the database"
  value       = module.db.db_instance_username
  sensitive   = true
}

# VPC outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "List of IDs of database subnets"
  value       = module.vpc.database_subnets
}

output "nat_public_ips" {
  description = "List of public Elastic IPs created for AWS NAT Gateway"
  value       = module.vpc.nat_public_ips
}

# IAM roles for Kubernetes service accounts
output "backend_irsa_role_arn" {
  description = "ARN of IAM role for backend service account"
  value       = module.backend_irsa.iam_role_arn
}

output "agents_irsa_role_arn" {
  description = "ARN of IAM role for agent service accounts"
  value       = module.agents_irsa.iam_role_arn
}

# ECR repositories
output "backend_ecr_repository_url" {
  description = "URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "agent_base_ecr_repository_url" {
  description = "URL of the agent base ECR repository"
  value       = aws_ecr_repository.agent_base.repository_url
}

output "agent_ecr_repository_urls" {
  description = "Map of agent names to their ECR repository URLs"
  value       = { for k, v in aws_ecr_repository.agents : k => v.repository_url }
}

# S3 buckets
output "logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.id
}

output "data_bucket_name" {
  description = "Name of the S3 bucket for data"
  value       = aws_s3_bucket.data.id
}

# CloudWatch log groups
output "eks_log_group_name" {
  description = "Name of the CloudWatch log group for EKS"
  value       = aws_cloudwatch_log_group.eks_cluster.name
}

output "application_log_group_name" {
  description = "Name of the CloudWatch log group for the application"
  value       = aws_cloudwatch_log_group.application.name
}

output "agent_log_group_names" {
  description = "Map of agent names to their CloudWatch log group names"
  value       = { for k, v in aws_cloudwatch_log_group.agents : k => v.name }
}

# kubectl configuration command
output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_id} --region ${var.aws_region}"
}

# Database connection string (for reference only, password is in Secrets Manager)
output "database_url_template" {
  description = "Template of PostgreSQL connection string (without password)"
  value       = "postgresql://${module.db.db_instance_username}:PASSWORD@${module.db.db_instance_address}:${module.db.db_instance_port}/${module.db.db_instance_name}"
  sensitive   = true
}