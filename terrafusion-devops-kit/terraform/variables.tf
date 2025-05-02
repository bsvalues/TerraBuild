/**
 * TerraFusion Infrastructure as Code
 * Terraform Variables
 */

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "kubernetes_version" {
  description = "Kubernetes version to use for EKS cluster"
  type        = string
  default     = "1.27"
}

variable "min_app_nodes" {
  description = "Minimum number of application nodes"
  type        = number
  default     = 2
}

variable "max_app_nodes" {
  description = "Maximum number of application nodes"
  type        = number
  default     = 10
}

variable "desired_app_nodes" {
  description = "Desired number of application nodes"
  type        = number
  default     = 3
}

variable "min_ai_nodes" {
  description = "Minimum number of AI nodes"
  type        = number
  default     = 1
}

variable "max_ai_nodes" {
  description = "Maximum number of AI nodes"
  type        = number
  default     = 5
}

variable "desired_ai_nodes" {
  description = "Desired number of AI nodes"
  type        = number
  default     = 1
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.large"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS instance (GB)"
  type        = number
  default     = 100
}

variable "db_backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
}

variable "route53_zone_arns" {
  description = "ARNs of Route53 hosted zones for DNS management"
  type        = list(string)
  default     = []
}

variable "vault_address" {
  description = "HashiCorp Vault server address"
  type        = string
  default     = "https://vault.terrafusion.internal:8200"
}

variable "admin_email" {
  description = "Email address for administrative notifications"
  type        = string
  default     = "admin@example.com"
}

variable "domain_name" {
  description = "Base domain name for the application"
  type        = string
  default     = "terrafusion.example.com"
}

variable "enable_ai_scaling" {
  description = "Enable auto-scaling for AI agent nodes based on queue depth"
  type        = bool
  default     = true
}

variable "agent_log_retention_days" {
  description = "Number of days to retain agent logs"
  type        = number
  default     = 90
}

variable "enable_agent_telemetry" {
  description = "Enable detailed telemetry for AI agents"
  type        = bool
  default     = true
}

variable "agent_versions" {
  description = "Versions of each agent to deploy"
  type        = map(string)
  default     = {
    "factor-tuner"     = "1.0.0",
    "benchmark-guard"  = "1.0.0",
    "curve-trainer"    = "1.0.0",
    "scenario-agent"   = "1.0.0",
    "boe-arguer"       = "1.0.0"
  }
}

variable "enable_chaos_testing" {
  description = "Enable chaos testing in the environment"
  type        = bool
  default     = false
}