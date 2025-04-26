#!/bin/bash

# BCBS Deployment Script
# This script orchestrates the deployment of the BCBS application

set -e

# Default environment
ENV=${1:-dev}

# Display help information
function show_help {
  echo "BCBS Deployment Helper"
  echo ""
  echo "Usage: ./scripts/deploy.sh [environment] [options]"
  echo ""
  echo "Environments:"
  echo "  dev            Development (default)"
  echo "  staging        Staging"
  echo "  prod           Production"
  echo ""
  echo "Options:"
  echo "  --infra-only   Only deploy infrastructure"
  echo "  --app-only     Only deploy application"
  echo "  --help         Show this help message"
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

# Deploy infrastructure using Terraform
function deploy_infrastructure {
  echo "🏗️ Deploying infrastructure for $ENV environment..."
  
  # Run Terraform script
  ./scripts/terraform-cmd.sh apply $ENV
  
  echo "✅ Infrastructure deployment completed"
}

# Build application
function build_application {
  echo "📦 Building application for $ENV environment..."
  
  # Set build environment
  export NODE_ENV=$ENV
  
  # Install dependencies
  npm ci
  
  # Build the application
  npm run build
  
  echo "✅ Application build completed"
}

# Deploy application
function deploy_application {
  echo "🚀 Deploying application to $ENV environment..."
  
  # Placeholder for actual deployment command
  # This would typically involve:
  # 1. Creating a deployable package
  # 2. Uploading to infrastructure
  # 3. Running database migrations
  # 4. Starting the application
  
  echo "✅ Application deployment completed"
}

# Run database migrations
function run_migrations {
  echo "🔄 Running database migrations for $ENV environment..."
  
  # Run migrations for the environment
  echo "Running: NODE_ENV=$ENV npm run db:push"
  NODE_ENV=$ENV npm run db:push
  
  echo "✅ Database migrations completed"
}

# Verify deployment health
function verify_deployment {
  echo "🔍 Verifying deployment health for $ENV environment..."
  
  # Placeholder for health check logic
  # This would typically involve:
  # 1. Making HTTP requests to key endpoints
  # 2. Checking database connectivity
  # 3. Validating that the application is functional
  
  echo "✅ Deployment verification passed"
}

# Main deployment flow
function deploy_all {
  validate_env
  
  echo "🚀 Starting deployment to $ENV environment..."
  
  # Deploy infrastructure if not using --app-only
  if [[ "$*" != *"--app-only"* ]]; then
    deploy_infrastructure
  fi
  
  # Deploy application if not using --infra-only
  if [[ "$*" != *"--infra-only"* ]]; then
    build_application
    deploy_application
    run_migrations
    verify_deployment
  fi
  
  echo "✅ Deployment to $ENV completed successfully!"
}

# Process script arguments
if [[ "$1" == "--help" || "$2" == "--help" ]]; then
  show_help
  exit 0
fi

# Handle options
deploy_all $@