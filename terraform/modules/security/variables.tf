variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API Key for TerraFusion AI capabilities"
  type        = string
  sensitive   = true
}