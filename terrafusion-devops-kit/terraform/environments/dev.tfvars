# Development Environment Configuration

environment           = "dev"
aws_region            = "us-west-2"
vpc_cidr              = "10.0.0.0/16"
db_instance_type      = "db.t3.medium"
db_allocated_storage  = 20
kubernetes_version    = "1.27"
enable_monitoring     = true
enable_logging        = true
base_domain           = "dev.terrafusion.example.com"
force_agent_retrain   = true
ai_provider           = "openai"

tags = {
  Environment = "dev"
  Project     = "TerraFusion"
  ManagedBy   = "Terraform"
  Owner       = "DevOps"
}