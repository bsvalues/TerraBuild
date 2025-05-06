# Production Environment Configuration

environment           = "prod"
aws_region            = "us-west-2"
vpc_cidr              = "10.0.0.0/16"
db_instance_type      = "db.r5.large"
db_allocated_storage  = 100
kubernetes_version    = "1.27"
enable_monitoring     = true
enable_logging        = true
base_domain           = "terrafusion.example.com"
force_agent_retrain   = false
ai_provider           = "openai"

tags = {
  Environment = "prod"
  Project     = "TerraFusion"
  ManagedBy   = "Terraform"
  Owner       = "DevOps"
  CostCenter  = "TF-PROD-001"
}