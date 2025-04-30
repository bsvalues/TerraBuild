variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "terrabuild"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
}

variable "alb_arn" {
  description = "ARN of the Application Load Balancer to associate with WAF"
  type        = string
}

variable "blocked_countries" {
  description = "List of country codes to block (ISO 3166-1 alpha-2 format)"
  type        = list(string)
  default     = []
}

variable "blocked_ip_addresses" {
  description = "List of IP addresses to block (CIDR notation)"
  type        = list(string)
  default     = []
}

variable "enable_shield_advanced" {
  description = "Whether to enable AWS Shield Advanced protection"
  type        = bool
  default     = false
}

variable "enable_security_hub" {
  description = "Whether to enable AWS Security Hub"
  type        = bool
  default     = false
}

variable "enable_guardduty" {
  description = "Whether to enable Amazon GuardDuty"
  type        = bool
  default     = true
}

variable "security_alert_emails" {
  description = "List of email addresses to receive security alerts"
  type        = list(string)
  default     = []
}