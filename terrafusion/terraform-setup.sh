#!/bin/bash
set -eo pipefail

# This script is used by the CI/CD pipeline to initialize and apply Terraform
# Usage: ./terraform-setup.sh <environment> <action> [version]
# Example: ./terraform-setup.sh staging plan
# Example: ./terraform-setup.sh prod apply v1.0.0

# Parse arguments
ENVIRONMENT=$1
ACTION=$2
VERSION=${3:-"latest"}

if [ -z "$ENVIRONMENT" ] || [ -z "$ACTION" ]; then
  echo "Usage: $0 <environment> <action> [version]"
  echo "Environment must be one of: dev, staging, prod"
  echo "Action must be one of: plan, apply, destroy"
  exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  echo "Invalid environment: $ENVIRONMENT. Must be one of: dev, staging, prod"
  exit 1
fi

# Validate action
if [[ ! "$ACTION" =~ ^(plan|apply|destroy)$ ]]; then
  echo "Invalid action: $ACTION. Must be one of: plan, apply, destroy"
  exit 1
fi

# Set variables
TFVARS_FILE="environments/$ENVIRONMENT/terraform.tfvars"
BACKEND_FILE="environments/$ENVIRONMENT/backend.tfvars"
STATE_FILE="terraform.$ENVIRONMENT.tfstate"
PLAN_FILE="terraform.$ENVIRONMENT.plan"
LOG_FILE="terraform.$ENVIRONMENT.log"

echo "=== Terraform Setup for BCBS $ENVIRONMENT Environment ==="
echo "Environment: $ENVIRONMENT"
echo "Action: $ACTION"
echo "Version: $VERSION"
echo "======================================================"

# Make sure script is being executed from the Terraform root directory
if [ ! -f "new_main.tf" ]; then
  echo "Error: This script must be executed from the Terraform root directory"
  exit 1
fi

# Create a temporary copy of main.tf with environment-specific settings
cp new_main.tf main.tf
cp new_variables.tf variables.tf
cp new_outputs.tf outputs.tf

# Initialize Terraform with the backend configuration
echo "Initializing Terraform with backend for $ENVIRONMENT environment..."
terraform init -backend-config="$BACKEND_FILE"

# Select workspace
echo "Selecting workspace: $ENVIRONMENT..."
terraform workspace select $ENVIRONMENT || terraform workspace new $ENVIRONMENT

# Generate deployment ID based on timestamp
DEPLOYMENT_ID="deploy-$(date +%Y%m%d%H%M%S)"

# Execute the requested action
case "$ACTION" in
  plan)
    echo "Planning Terraform changes for $ENVIRONMENT environment..."
    terraform plan \
      -var-file="$TFVARS_FILE" \
      -var="deployment_id=$DEPLOYMENT_ID" \
      -var="image_tag=$VERSION" \
      -out="$PLAN_FILE" | tee "$LOG_FILE"
    ;;
  apply)
    echo "Applying Terraform changes to $ENVIRONMENT environment..."
    
    # First create a plan with the variables
    terraform plan \
      -var-file="$TFVARS_FILE" \
      -var="deployment_id=$DEPLOYMENT_ID" \
      -var="image_tag=$VERSION" \
      -out="$PLAN_FILE"
    
    # Then apply the plan
    terraform apply "$PLAN_FILE" | tee "$LOG_FILE"
    
    # Output important information
    echo "=== Deployment Summary ==="
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Image Tag: $VERSION"
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    echo "Active Color: $(terraform output -raw active_environment)"
    echo "Application URL: $(terraform output -raw app_url)"
    echo "=========================="
    ;;
  destroy)
    echo "WARNING: About to destroy $ENVIRONMENT environment!"
    echo "Waiting 10 seconds before proceeding. Press Ctrl+C to abort."
    sleep 10
    
    terraform destroy \
      -var-file="$TFVARS_FILE" \
      -var="deployment_id=$DEPLOYMENT_ID" \
      -var="image_tag=$VERSION" \
      -auto-approve | tee "$LOG_FILE"
    ;;
  *)
    echo "Invalid action: $ACTION"
    exit 1
    ;;
esac

# Clean up temporary files
rm -f main.tf variables.tf outputs.tf

echo "Terraform $ACTION completed for $ENVIRONMENT environment"
exit 0