variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "app_cpu" {
  description = "CPU units for the application (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "app_memory" {
  description = "Memory for the application in MB"
  type        = number
  default     = 2048
}

variable "app_desired_count" {
  description = "Desired number of application containers"
  type        = number
  default     = 2
}

variable "database_secret_arn" {
  description = "ARN of the database secret in AWS Secrets Manager"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS"
  type        = string
}