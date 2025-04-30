# Development environment configuration
environment      = "dev"
project          = "terrabuild"
aws_region       = "us-west-2"

# VPC Configuration
vpc_cidr            = "10.0.0.0/16"
public_subnets_cidr = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets_cidr = ["10.0.10.0/24", "10.0.20.0/24"]
availability_zones  = ["us-west-2a", "us-west-2b"]

# Database Configuration
db_name           = "terrabuild"
db_username       = "terrabuild_app"
db_instance_class = "db.t3.micro"
db_storage_gb     = 20

# Redis Configuration
redis_node_type   = "cache.t3.micro"
redis_num_nodes   = 1

# Application Configuration
app_name        = "terrabuild"
app_domain      = "dev.terrabuild.example.com"
app_environment = "development"
app_port        = 5000

# ECS Configuration
ecs_task_cpu    = 256
ecs_task_memory = 512
ecs_min_capacity = 1
ecs_max_capacity = 2

# Auto Scaling Configuration
cpu_threshold     = 75
scaling_cooldown  = 300  # seconds

# Monitoring Configuration
enable_detailed_monitoring = true
logs_retention_days        = 30

# Tags
common_tags = {
  Project     = "TerraFusion"
  Environment = "Development"
  ManagedBy   = "Terraform"
  Owner       = "DevOps"
}