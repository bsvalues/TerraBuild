# TerraFusion Infrastructure Variables
# Variables used in the Terraform configuration

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_type" {
  description = "Instance type for the RDS PostgreSQL database"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GiB for the RDS PostgreSQL database"
  type        = number
  default     = 20
}

variable "kubernetes_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.27"
}

variable "deployment_version" {
  description = "Version tag used for deployments"
  type        = string
  default     = "latest"
}

variable "deployment_timestamp" {
  description = "Timestamp of the deployment"
  type        = string
  default     = null
}

variable "enable_monitoring" {
  description = "Enable Prometheus, Grafana, and other monitoring tools"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable centralized logging with Loki"
  type        = bool
  default     = true
}

variable "base_domain" {
  description = "Base domain for route53 and certificate manager"
  type        = string
  default     = "terrafusion.example.com"
}

variable "force_agent_retrain" {
  description = "Force agent retraining after deployment"
  type        = bool
  default     = false
}

variable "ai_provider" {
  description = "Default AI provider for agents"
  type        = string
  default     = "openai"
  
  validation {
    condition     = contains(["openai", "anthropic", "replicate"], var.ai_provider)
    error_message = "AI provider must be one of: openai, anthropic, replicate."
  }
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}