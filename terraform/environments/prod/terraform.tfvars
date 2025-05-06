# Production environment configuration
environment      = "prod"
project          = "terrabuild"
aws_region       = "us-west-2"

# VPC Configuration
vpc_cidr            = "10.2.0.0/16"
public_subnets_cidr = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnets_cidr = ["10.2.10.0/24", "10.2.20.0/24", "10.2.30.0/24"]
availability_zones  = ["us-west-2a", "us-west-2b", "us-west-2c"]

# Database Configuration
db_name           = "terrabuild"
db_username       = "terrabuild_app"
db_instance_class = "db.t3.medium"
db_storage_gb     = 100
db_multi_az       = true

# Redis Configuration
redis_node_type   = "cache.t3.medium"
redis_num_nodes   = 3

# Application Configuration
app_name        = "terrabuild"
app_domain      = "terrabuild.example.com"
app_environment = "production"
app_port        = 5000

# ECS Configuration
ecs_task_cpu    = 1024
ecs_task_memory = 2048
ecs_min_capacity = 3
ecs_max_capacity = 10

# Auto Scaling Configuration
cpu_threshold     = 65
scaling_cooldown  = 180  # seconds

# Monitoring Configuration
enable_detailed_monitoring = true
logs_retention_days        = 90
enable_alarm_notifications = true
alarm_email                = "alerts@terrabuild.example.com"

# Backup Configuration
enable_automated_backups = true
backup_retention_period  = 14  # days

# Tags
common_tags = {
  Project     = "TerraFusion"
  Environment = "Production"
  ManagedBy   = "Terraform"
  Owner       = "DevOps"
}