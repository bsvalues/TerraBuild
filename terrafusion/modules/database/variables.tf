variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "app_security_group_id" {
  description = "ID of the application security group"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "db_allocated_storage" {
  description = "Allocated storage size in GB"
  type        = number
  default     = 20
}

variable "db_storage_type" {
  description = "RDS storage type"
  type        = string
  default     = "gp2"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
}

variable "db_username" {
  description = "Username for the PostgreSQL database"
  type        = string
}

variable "db_password" {
  description = "Password for the PostgreSQL database"
  type        = string
  sensitive   = true
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Backup window time (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Maintenance window time (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_snapshot_window" {
  description = "ElastiCache snapshot window time (UTC)"
  type        = string
  default     = "02:00-03:00"
}

variable "redis_maintenance_window" {
  description = "ElastiCache maintenance window time (UTC)"
  type        = string
  default     = "sat:03:00-sat:04:00"
}

variable "sns_topic_arn" {
  description = "ARN of the SNS topic for alerting"
  type        = string
  default     = ""
}