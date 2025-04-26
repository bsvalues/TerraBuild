environment = "dev"
aws_region  = "us-west-2"

# Network Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnets_cidr  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets_cidr = ["10.0.3.0/24", "10.0.4.0/24"]
availability_zones   = ["us-west-2a", "us-west-2b"]

# Database Configuration
db_name     = "bcbs_dev"
db_username = "bcbs_dev"
# db_password is provided through environment variables or secure parameters
# export TF_VAR_db_password="your_secure_password"