environment          = "staging"
aws_region          = "us-east-1"
vpc_cidr            = "10.1.0.0/16"
public_subnets_cidr = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnets_cidr = ["10.1.3.0/24", "10.1.4.0/24"]
availability_zones   = ["us-east-1a", "us-east-1b"]

# Database parameters
db_name           = "bcbs"
db_username       = "bcbs"
db_instance_class = "db.t3.small"
db_allocated_storage = 30
db_backup_retention_period = 7

# Application parameters
app_count     = 2
app_cpu       = 512
app_memory    = 1024
container_port = 5000

# Deployment parameters
active_environment = "blue"
deployment_id      = "initial-staging"
image_tag          = "stable"