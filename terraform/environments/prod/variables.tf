variable "region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "app_version" {
  description = "Version/tag of the application to deploy"
  type        = string
}

variable "db_password" {
  description = "Password for the database administrator user"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API Key for TerraFusion AI capabilities"
  type        = string
  sensitive   = true
}

variable "alert_emails" {
  description = "List of email addresses to receive CloudWatch alerts"
  type        = list(string)
  default     = [
    "devops@benton-county.example.com", 
    "infrastructure@benton-county.example.com",
    "oncall@benton-county.example.com"
  ]
}