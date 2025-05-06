variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "bcbs"
}

variable "environment" {
  description = "The environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-west-2"
}

variable "app_version" {
  description = "The version of the application to deploy"
  type        = string
  default     = "latest"
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "The instance type to use for EC2 instances"
  type        = string
  default     = "t3.small"
}

variable "min_capacity" {
  description = "The minimum capacity for auto scaling"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "The maximum capacity for auto scaling"
  type        = number
  default     = 2
}

variable "db_instance_class" {
  description = "The instance class to use for the database"
  type        = string
  default     = "db.t3.small"
}

variable "enable_blue_green" {
  description = "Enable blue-green deployment strategy"
  type        = bool
  default     = true
}

variable "enable_canary" {
  description = "Enable canary deployment strategy"
  type        = bool
  default     = false
}

variable "enable_disaster_recovery" {
  description = "Enable disaster recovery features"
  type        = bool
  default     = false
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = false
}

variable "canary_traffic_percentage" {
  description = "Initial percentage of traffic to direct to canary deployment"
  type        = number
  default     = 0
}

variable "ecr_repository_name" {
  description = "Name of the ECR repository for storing container images"
  type        = string
  default     = "bcbs-app"
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}