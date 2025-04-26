#!/bin/bash

# Terraform Helper Script for BCBS Project
# This script provides shortcuts for common Terraform operations

set -e

# Default environment
ENV=${2:-dev}

# Display help information
function show_help {
  echo "BCBS Terraform Helper"
  echo ""
  echo "Usage: ./scripts/terraform-cmd.sh [command] [environment]"
  echo ""
  echo "Commands:"
  echo "  init           Initialize Terraform"
  echo "  plan           Create execution plan"
  echo "  apply          Apply changes"
  echo "  destroy        Destroy infrastructure"
  echo "  output         Show outputs"
  echo "  refresh        Refresh state"
  echo "  help           Show this help message"
  echo ""
  echo "Environments:"
  echo "  dev            Development (default)"
  echo "  staging        Staging"
  echo "  prod           Production"
  echo ""
}

# Validate environment
function validate_env {
  if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
    echo "❌ Invalid environment: $ENV"
    echo "Valid environments: dev, staging, prod"
    exit 1
  fi
}

# Initialize Terraform
function init_terraform {
  echo "🚀 Initializing Terraform for BCBS project..."
  cd terrafusion
  terraform init
  echo "✅ Terraform initialized"
}

# Create execution plan
function plan_terraform {
  validate_env
  echo "📋 Creating Terraform plan for $ENV environment..."
  cd terrafusion
  terraform plan -var-file=environments/${ENV}.tfvars -out=${ENV}.tfplan
  echo "✅ Plan created: ${ENV}.tfplan"
}

# Apply changes
function apply_terraform {
  validate_env
  echo "🏗️ Applying Terraform changes for $ENV environment..."
  cd terrafusion
  
  # Check if plan exists
  if [ -f "${ENV}.tfplan" ]; then
    terraform apply ${ENV}.tfplan
  else
    echo "⚠️ No plan file found. Creating plan first..."
    terraform plan -var-file=environments/${ENV}.tfvars -out=${ENV}.tfplan
    terraform apply ${ENV}.tfplan
  fi
  
  echo "✅ Infrastructure changes applied"
}

# Destroy infrastructure
function destroy_terraform {
  validate_env
  echo "⚠️ WARNING: This will destroy all resources in the $ENV environment!"
  echo "⚠️ To proceed, type 'yes' and press Enter."
  read confirmation
  
  if [ "$confirmation" = "yes" ]; then
    echo "🧨 Destroying infrastructure for $ENV environment..."
    cd terrafusion
    terraform destroy -var-file=environments/${ENV}.tfvars
    echo "✅ Infrastructure destroyed"
  else
    echo "🛑 Destruction cancelled"
  fi
}

# Show outputs
function output_terraform {
  validate_env
  echo "📊 Showing Terraform outputs for $ENV environment..."
  cd terrafusion
  terraform output
}

# Refresh state
function refresh_terraform {
  validate_env
  echo "🔄 Refreshing Terraform state for $ENV environment..."
  cd terrafusion
  terraform refresh -var-file=environments/${ENV}.tfvars
  echo "✅ State refreshed"
}

# Main script logic
case "$1" in
  init)
    init_terraform
    ;;
  plan)
    plan_terraform
    ;;
  apply)
    apply_terraform
    ;;
  destroy)
    destroy_terraform
    ;;
  output)
    output_terraform
    ;;
  refresh)
    refresh_terraform
    ;;
  help|*)
    show_help
    ;;
esac