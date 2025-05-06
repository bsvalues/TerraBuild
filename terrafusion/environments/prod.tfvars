environment = "prod"
aws_region  = "us-west-2"

# Network Configuration
vpc_cidr             = "10.2.0.0/16"
public_subnets_cidr  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnets_cidr = ["10.2.3.0/24", "10.2.4.0/24"]
availability_zones   = ["us-west-2a", "us-west-2b"]

# Database Configuration
db_name     = "bcbs_prod"
db_username = "bcbs_prod"
# db_password is provided through environment variables or secure parameters
# export TF_VAR_db_password="your_secure_password"