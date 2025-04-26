environment = "staging"
aws_region  = "us-west-2"

# Network Configuration
vpc_cidr             = "10.1.0.0/16"
public_subnets_cidr  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnets_cidr = ["10.1.3.0/24", "10.1.4.0/24"]
availability_zones   = ["us-west-2a", "us-west-2b"]

# Database Configuration
db_name     = "bcbs_staging"
db_username = "bcbs_staging"
# db_password is provided through environment variables or secure parameters
# export TF_VAR_db_password="your_secure_password"