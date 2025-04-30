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

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "db_username" {
  description = "Username for the PostgreSQL database"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for the PostgreSQL database"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "terrabuild.bentoncounty.com"
}

variable "alert_email_addresses" {
  description = "List of email addresses to receive monitoring alerts"
  type        = list(string)
  default     = [
    "ops-team@terrabuild.bentoncounty.com",
    "admin@terrabuild.bentoncounty.com"
  ]
}

variable "enable_disaster_recovery" {
  description = "Whether to enable cross-region disaster recovery"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Whether to enable AWS WAF protection"
  type        = bool
  default     = true
}

variable "enable_shield" {
  description = "Whether to enable AWS Shield protection"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
}

variable "multi_az" {
  description = "Whether to enable multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

variable "container_memory" {
  description = "Memory allocation for container in MB"
  type        = number
  default     = 2048
}

variable "container_cpu" {
  description = "CPU allocation for container in units"
  type        = number
  default     = 1024
}

variable "min_capacity" {
  description = "Minimum number of containers to run"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of containers to scale to"
  type        = number
  default     = 10
}

variable "health_check_path" {
  description = "Path for health checks"
  type        = string
  default     = "/api/health"
}

variable "health_check_interval" {
  description = "Interval between health checks in seconds"
  type        = number
  default     = 30
}

variable "ssl_policy" {
  description = "SSL policy for HTTPS listeners"
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {
    ManagedBy  = "Terraform"
    Project    = "TerraBuild"
    Environment = "production"
  }
}