variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
}

variable "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  type        = string
}

variable "load_balancer_arn" {
  description = "ARN of the application load balancer"
  type        = string
}

variable "alert_email_addresses" {
  description = "List of email addresses to receive monitoring alerts"
  type        = list(string)
  default     = []
}