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

variable "active_environment" {
  description = "Currently active environment (blue or green)"
  type        = string
  default     = "blue"
  
  validation {
    condition     = contains(["blue", "green"], var.active_environment)
    error_message = "The active_environment value must be either 'blue' or 'green'."
  }
}

variable "task_definition_arn" {
  description = "ARN of the task definition to deploy"
  type        = string
}

variable "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  type        = string
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "container_port" {
  description = "Port the container exposes"
  type        = number
  default     = 5000
}

variable "alb_arn" {
  description = "ARN of the Application Load Balancer"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the Application Load Balancer"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for the ALB"
  type        = string
}

variable "app_count" {
  description = "Number of instances of the application to run"
  type        = number
  default     = 2
}

variable "health_check_path" {
  description = "Path for health checks"
  type        = string
  default     = "/api/health"
}

variable "sns_topic_arn" {
  description = "ARN of the SNS topic for alerting"
  type        = string
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