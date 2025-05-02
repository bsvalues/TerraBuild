/**
 * TerraFusion Infrastructure as Code
 * Terraform Outputs
 */

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

# EKS Outputs
output "cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "cluster_iam_role_name" {
  description = "IAM role name associated with EKS cluster"
  value       = module.eks.cluster_iam_role_name
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN associated with EKS cluster"
  value       = module.eks.cluster_iam_role_arn
}

output "cluster_oidc_issuer_url" {
  description = "URL of the OIDC Provider from the EKS cluster"
  value       = module.eks.cluster_oidc_issuer_url
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data for the EKS cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "cluster_version" {
  description = "The Kubernetes version for the EKS cluster"
  value       = module.eks.cluster_version
}

# RDS Outputs
output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = module.postgres.db_instance_address
}

output "db_instance_port" {
  description = "The port of the RDS instance"
  value       = module.postgres.db_instance_port
}

output "db_instance_name" {
  description = "The database name"
  value       = module.postgres.db_instance_name
}

output "db_instance_username" {
  description = "The master username for the database"
  value       = module.postgres.db_instance_username
  sensitive   = true
}

output "db_instance_resource_id" {
  description = "The RDS resource ID"
  value       = module.postgres.db_instance_resource_id
}

# ECR Repository Outputs
output "ecr_repositories" {
  description = "Map of ECR repository URLs"
  value = {
    for name, repo in module.ecr : name => repo.repository_url
  }
}

# Monitoring Outputs
output "grafana_endpoint" {
  description = "URL of the Grafana dashboard"
  value       = "https://grafana.${var.domain_name}"
}

output "prometheus_endpoint" {
  description = "URL of the Prometheus dashboard (internal)"
  value       = "https://prometheus.${var.domain_name}"
}

# Load Balancer Outputs
output "api_gateway_endpoint" {
  description = "URL of the API Gateway"
  value       = "https://api.${var.domain_name}"
}

output "app_endpoint" {
  description = "URL of the main application"
  value       = "https://${var.domain_name}"
}

# Vault Outputs
output "vault_endpoint" {
  description = "URL of the Vault server"
  value       = var.vault_address
}

# Agent Infrastructure Outputs
output "agent_namespace" {
  description = "Kubernetes namespace for AI agents"
  value       = "terrafusion-agents"
}

# Terraform Backend Info
output "terraform_backend_config" {
  description = "Information about the Terraform backend configuration"
  value = {
    bucket = "terrafusion-${var.environment}-terraform-state"
    region = var.aws_region
    key    = "terraform.tfstate"
  }
}

# For DevOps Automation
output "ci_cd_role_arn" {
  description = "IAM role ARN for CI/CD pipelines"
  value       = aws_iam_role.ci_cd_role.arn
}

# IRSA Roles
output "irsa_roles" {
  description = "Map of IAM roles for service accounts"
  value = {
    "load_balancer_controller" = module.load_balancer_controller_irsa_role.iam_role_arn
    "cert_manager"             = module.cert_manager_irsa_role.iam_role_arn
    "external_dns"             = module.external_dns_irsa_role.iam_role_arn
    "prometheus"               = module.prometheus_irsa_role.iam_role_arn
    "loki"                     = module.loki_irsa_role.iam_role_arn
  }
}