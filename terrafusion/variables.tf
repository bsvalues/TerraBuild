variable "aws_region" {
  description = "AWS region to deploy resources"
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  default     = "dev"
}

variable "project" {
  description = "Project name"
  default     = "bcbs"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
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

variable "db_name" {
  description = "Name of the PostgreSQL database"
  default     = "bcbs"
}

variable "db_username" {
  description = "Username for the PostgreSQL database"
  default     = "bcbs"
}

variable "db_password" {
  description = "Password for the PostgreSQL database"
  sensitive   = true
}

# Blue-Green deployment variables
variable "active_environment" {
  description = "Currently active environment (blue or green)"
  default     = "blue"
  validation {
    condition     = contains(["blue", "green"], var.active_environment)
    error_message = "The active_environment value must be either 'blue' or 'green'."
  }
}

variable "target_environment" {
  description = "Target environment for the current deployment (blue or green)"
  default     = "green"
  validation {
    condition     = contains(["blue", "green"], var.target_environment)
    error_message = "The target_environment value must be either 'blue' or 'green'."
  }
}

variable "deployment_id" {
  description = "Unique identifier for the current deployment"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag for the current deployment"
  type        = string
}

variable "app_count" {
  description = "Number of app instances to run"
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

variable "ecr_repository_url" {
  description = "URL of the ECR repository"
  type        = string
  default     = ""
}