environment          = "prod"
aws_region          = "us-west-2"
vpc_cidr            = "10.2.0.0/16"
public_subnets_cidr = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnets_cidr = ["10.2.4.0/24", "10.2.5.0/24", "10.2.6.0/24"]
availability_zones   = ["us-west-2a", "us-west-2b", "us-west-2c"]

# Database parameters
db_name           = "bcbs"
db_username       = "bcbs"
db_instance_class = "db.t3.medium"
db_allocated_storage = 50
db_storage_type = "gp3"
db_backup_retention_period = 30
db_engine_version = "15"

# Redis parameters
redis_node_type = "cache.t3.small"
redis_engine_version = "7.0"

# Application parameters
app_count     = 3
app_cpu       = 1024
app_memory    = 2048
container_port = 5000

# Deployment parameters
active_environment = "blue"
deployment_id      = "initial-prod"
image_tag          = "prod"

# Domain parameters
domain_name     = "bcbs.example.com"
certificate_arn = "arn:aws:acm:us-west-2:123456789012:certificate/example"