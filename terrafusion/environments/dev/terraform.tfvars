environment          = "dev"
aws_region          = "us-west-2"
vpc_cidr            = "10.0.0.0/16"
public_subnets_cidr = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets_cidr = ["10.0.3.0/24", "10.0.4.0/24"]
availability_zones   = ["us-west-2a", "us-west-2b"]

# Database parameters
db_name           = "bcbs"
db_username       = "bcbs"
db_instance_class = "db.t3.micro"

# Application parameters
app_count     = 1  # Lower count for development environment
app_cpu       = 256
app_memory    = 512
container_port = 5000

# Deployment parameters
active_environment = "blue"
deployment_id      = "initial-dev"
image_tag          = "latest"