variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for DB subnet group"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs for the DB instance"
  type        = list(string)
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  type        = string
}

variable "db_instance_class" {
  description = "Instance class for the DB instance"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for DB instance in GB"
  type        = number
  default     = 20
}

variable "db_max_storage" {
  description = "Maximum storage limit for autoscaling in GB"
  type        = number
  default     = 100
}

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "14.6"
}

variable "multi_az" {
  description = "Whether to enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection"
  type        = bool
  default     = false
}

variable "apply_immediately" {
  description = "Whether to apply changes immediately or during maintenance window"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "terrafusion"
}

variable "db_username" {
  description = "Username for the master DB user"
  type        = string
  default     = "tfadmin"
}

variable "db_password" {
  description = "Password for the master DB user. If not provided, a random password will be generated."
  type        = string
  default     = ""
  sensitive   = true
}

variable "enable_performance_insights" {
  description = "Whether to enable Performance Insights"
  type        = bool
  default     = false
}