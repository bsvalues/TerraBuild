###########################################################
# BCBS Infrastructure as Code - Variables
# This file defines all variables used in the infrastructure
###########################################################

# Core variables
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "bcbs"
}

# Networking variables
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets_cidr" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets_cidr" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

# Database variables
variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "bcbs"
}

variable "db_username" {
  description = "Username for the PostgreSQL database"
  type        = string
  default     = "bcbs"
}

variable "db_password" {
  description = "Password for the PostgreSQL database"
  type        = string
  sensitive   = true
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

# Redis variables
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

# Application variables
variable "app_count" {
  description = "Number of instances of the application to run"
  type        = number
  default     = 2
}

variable "app_cpu" {
  description = "CPU units for the app (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "app_memory" {
  description = "Memory for the app in MB"
  type        = number
  default     = 1024
}

variable "container_port" {
  description = "Port the container exposes"
  type        = number
  default     = 5000
}

variable "health_check_path" {
  description = "Path for health checks"
  type        = string
  default     = "/api/health"
}

# Deployment variables
variable "active_environment" {
  description = "Currently active environment (blue or green)"
  type        = string
  default     = "blue"
  
  validation {
    condition     = contains(["blue", "green"], var.active_environment)
    error_message = "The active_environment value must be either 'blue' or 'green'."
  }
}

variable "deployment_id" {
  description = "Unique identifier for the current deployment"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag for the current deployment"
  type        = string
  default     = "latest"
}

variable "ecr_repository_url" {
  description = "URL of the ECR repository"
  type        = string
  default     = ""
}

variable "rollback_lambda_zip" {
  description = "Path to the Lambda deployment package ZIP for rollback"
  type        = string
  default     = "functions/rollback-function.zip"
}

variable "canary_lambda_zip" {
  description = "Path to the Lambda deployment package ZIP for canary deployment"
  type        = string
  default     = "functions/canary-function.zip"
}

# Domain and Certificate variables
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "bcbs.example.com"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for the ALB"
  type        = string
  default     = ""
}