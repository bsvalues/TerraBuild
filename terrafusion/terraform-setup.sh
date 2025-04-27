#!/bin/bash
# Terraform Setup Script for BCBS Infrastructure
# This script handles environment-specific Terraform operations

set -e

# Check input parameters
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <environment> <action> [version_tag]"
  echo "  environment: dev, staging, prod"
  echo "  action: plan, apply, destroy"
  echo "  version_tag: optional version tag for the deployment"
  exit 1
fi

# Parse input parameters
ENV=$1
ACTION=$2
VERSION=${3:-"latest"}

# Validate environment
if [[ "$ENV" != "dev" && "$ENV" != "staging" && "$ENV" != "prod" ]]; then
  echo "Invalid environment: $ENV"
  echo "Must be one of: dev, staging, prod"
  exit 1
fi

# Validate action
if [[ "$ACTION" != "plan" && "$ACTION" != "apply" && "$ACTION" != "destroy" ]]; then
  echo "Invalid action: $ACTION"
  echo "Must be one of: plan, apply, destroy"
  exit 1
fi

echo "=== Terraform Setup for BCBS - Environment: $ENV, Action: $ACTION, Version: $VERSION ==="

# Setup environment-specific configuration
echo "Setting up environment-specific configuration..."
cp new_main.tf main.tf
cp new_variables.tf variables.tf
cp new_outputs.tf outputs.tf

# Create terraform.tfvars file with environment-specific values
cat > terraform.tfvars <<EOF
environment             = "${ENV}"
app_version            = "${VERSION}"
project_name           = "bcbs"
region                 = "us-west-2"
enable_blue_green      = true
enable_canary          = true
vpc_cidr               = "10.0.0.0/16"
EOF

# Add environment-specific overrides
if [[ "$ENV" == "dev" ]]; then
  cat >> terraform.tfvars <<EOF
instance_type          = "t3.small"
min_capacity           = 1
max_capacity           = 2
db_instance_class      = "db.t3.small"
enable_disaster_recovery = false
EOF
elif [[ "$ENV" == "staging" ]]; then
  cat >> terraform.tfvars <<EOF
instance_type          = "t3.medium"
min_capacity           = 2
max_capacity           = 4
db_instance_class      = "db.t3.medium"
enable_disaster_recovery = true
EOF
elif [[ "$ENV" == "prod" ]]; then
  cat >> terraform.tfvars <<EOF
instance_type          = "t3.large"
min_capacity           = 2
max_capacity           = 6
db_instance_class      = "db.t3.large"
enable_disaster_recovery = true
multi_az               = true
EOF
fi

# Initialize Terraform with the right backend configuration
echo "Initializing Terraform with backend config for $ENV environment..."
terraform init -backend-config=environments/$ENV/backend.tfvars

# Select or create workspace
terraform workspace select $ENV || terraform workspace new $ENV

# Run the requested Terraform action
echo "Running Terraform $ACTION for $ENV environment..."

LOG_FILE="terraform.$ENV.log"
touch $LOG_FILE

if [[ "$ACTION" == "plan" ]]; then
  # Run plan and save to a file
  terraform plan -var-file=terraform.tfvars -out=terraform.$ENV.tfplan | tee $LOG_FILE
  echo "Plan saved to terraform.$ENV.tfplan"
elif [[ "$ACTION" == "apply" ]]; then
  # Check if we have a plan file, if not create one
  if [[ ! -f "terraform.$ENV.tfplan" ]]; then
    echo "No plan file found, creating one..."
    terraform plan -var-file=terraform.tfvars -out=terraform.$ENV.tfplan | tee -a $LOG_FILE
  fi
  
  # Apply the plan
  terraform apply -auto-approve terraform.$ENV.tfplan | tee -a $LOG_FILE
  
  # Output important values
  echo "Outputs for $ENV environment:" | tee -a $LOG_FILE
  terraform output | tee -a $LOG_FILE
elif [[ "$ACTION" == "destroy" ]]; then
  echo "WARNING: This will destroy all infrastructure in the $ENV environment!"
  echo "Are you sure? Type 'yes' to confirm:"
  read -r CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "Destroy cancelled"
    exit 1
  fi
  
  terraform destroy -var-file=terraform.tfvars -auto-approve | tee -a $LOG_FILE
fi

echo "=== Terraform $ACTION completed for $ENV environment ==="