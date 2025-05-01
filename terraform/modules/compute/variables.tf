variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "app_version" {
  description = "Application version/tag to deploy"
  type        = string
  default     = "latest"
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "app_security_group_id" {
  description = "Security group ID for application"
  type        = string
}

variable "db_secret_arn" {
  description = "ARN of the secret containing database credentials"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for HTTPS"
  type        = string
}

variable "task_cpu" {
  description = "CPU units for the ECS task (1024 = 1 vCPU)"
  type        = string
  default     = "1024"
}

variable "task_memory" {
  description = "Memory for the ECS task in MB"
  type        = string
  default     = "2048"
}

variable "service_desired_count" {
  description = "Desired count of tasks in the ECS service"
  type        = number
  default     = 2
}

variable "enable_container_insights" {
  description = "Whether to enable Container Insights for the ECS cluster"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}