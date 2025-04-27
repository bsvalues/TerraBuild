variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "environment" {
  description = "The environment (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "The IDs of the public subnets"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "The IDs of the private subnets"
  type        = list(string)
}

variable "db_endpoint" {
  description = "The endpoint of the database"
  type        = string
}

variable "db_name" {
  description = "The name of the database"
  type        = string
}

variable "db_username" {
  description = "The username for the database"
  type        = string
}

variable "db_password" {
  description = "The password for the database"
  type        = string
  sensitive   = true
}

variable "db_security_group_id" {
  description = "The ID of the database security group"
  type        = string
}

variable "container_image" {
  description = "The container image to use for the application"
  type        = string
}

variable "min_capacity" {
  description = "The minimum number of tasks to run"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "The maximum number of tasks to run"
  type        = number
  default     = 10
}

variable "health_check_path" {
  description = "The path to use for health checks"
  type        = string
  default     = "/api/health"
}

variable "enable_blue_green" {
  description = "Whether to enable blue-green deployment"
  type        = bool
  default     = true
}

variable "enable_canary" {
  description = "Whether to enable canary deployment"
  type        = bool
  default     = false
}

variable "canary_traffic_percentage" {
  description = "The percentage of traffic to send to the canary deployment"
  type        = number
  default     = 0
}

variable "rollback_function_path" {
  description = "The path to the rollback function ZIP file"
  type        = string
  default     = "./functions/dist/rollback-function.zip"
}

variable "canary_function_path" {
  description = "The path to the canary function ZIP file"
  type        = string
  default     = "./functions/dist/canary-function.zip"
}

variable "log_retention_days" {
  description = "The number of days to retain logs"
  type        = number
  default     = 30
}

variable "alarm_evaluation_periods" {
  description = "The number of periods to evaluate for the alarm"
  type        = number
  default     = 3
}

variable "alarm_threshold" {
  description = "The threshold for the alarm"
  type        = number
  default     = 90
}