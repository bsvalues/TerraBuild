# Staging environment configuration
environment      = "staging"
project          = "terrabuild"
aws_region       = "us-west-2"

# VPC Configuration
vpc_cidr            = "10.1.0.0/16"
public_subnets_cidr = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnets_cidr = ["10.1.10.0/24", "10.1.20.0/24"]
availability_zones  = ["us-west-2a", "us-west-2b"]

# Database Configuration
db_name           = "terrabuild"
db_username       = "terrabuild_app"
db_instance_class = "db.t3.small"
db_storage_gb     = 50

# Redis Configuration
redis_node_type   = "cache.t3.small"
redis_num_nodes   = 2

# Application Configuration
app_name        = "terrabuild"
app_domain      = "staging.terrabuild.example.com"
app_environment = "staging"
app_port        = 5000

# ECS Configuration
ecs_task_cpu    = 512
ecs_task_memory = 1024
ecs_min_capacity = 2
ecs_max_capacity = 4

# Auto Scaling Configuration
cpu_threshold     = 70
scaling_cooldown  = 240  # seconds

# Monitoring Configuration
enable_detailed_monitoring = true
logs_retention_days        = 60

# Tags
common_tags = {
  Project     = "TerraFusion"
  Environment = "Staging"
  ManagedBy   = "Terraform"
  Owner       = "DevOps"
}