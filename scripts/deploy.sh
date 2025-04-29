#!/bin/bash
# TerraBuild Deployment Script
# This script deploys the TerraBuild application to AWS

set -e

# Default values
ENV="dev"
SKIP_BUILD=false
SKIP_INFRA=false
SKIP_DEPLOY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENV="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-infra)
      SKIP_INFRA=true
      shift
      ;;
    --skip-deploy)
      SKIP_DEPLOY=true
      shift
      ;;
    --help)
      echo "Usage: ./deploy.sh [OPTIONS]"
      echo "Options:"
      echo "  --env ENV         Environment to deploy to (dev, staging, prod) [default: dev]"
      echo "  --skip-build      Skip building the Docker image"
      echo "  --skip-infra      Skip applying Terraform infrastructure changes"
      echo "  --skip-deploy     Skip deploying the application to ECS"
      echo "  --help            Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENV" != "dev" && "$ENV" != "staging" && "$ENV" != "prod" ]]; then
  echo "Error: Environment must be one of: dev, staging, prod"
  exit 1
fi

# Print deployment settings
echo "=== TerraBuild Deployment ==="
echo "Environment: $ENV"
echo "Skip Build: $SKIP_BUILD"
echo "Skip Infrastructure: $SKIP_INFRA"
echo "Skip Deploy: $SKIP_DEPLOY"
echo "==========================="

# Set AWS region
AWS_REGION="us-west-2"
export AWS_REGION

# Apply Terraform infrastructure if not skipped
if [ "$SKIP_INFRA" = false ]; then
  echo "Applying Terraform infrastructure for $ENV environment..."
  cd terraform/environments/$ENV
  
  # Initialize Terraform
  terraform init
  
  # Apply Terraform configuration
  terraform apply -auto-approve
  
  # Get outputs
  ECR_REPOSITORY_URL=$(terraform output -raw ecr_repository_url)
  ECS_CLUSTER_ID=$(terraform output -raw ecs_cluster_id)
  
  cd ../../..
  
  echo "Infrastructure updated successfully."
else
  # Get ECR repository URL and ECS cluster ID from Terraform outputs
  cd terraform/environments/$ENV
  ECR_REPOSITORY_URL=$(terraform output -raw ecr_repository_url)
  ECS_CLUSTER_ID=$(terraform output -raw ecs_cluster_id)
  cd ../../..
  
  echo "Skipping infrastructure application."
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)

# Build and push Docker image if not skipped
if [ "$SKIP_BUILD" = false ]; then
  echo "Building and pushing Docker image to ECR..."
  
  # Login to ECR
  aws ecr get-login-password | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
  
  # Build Docker image
  docker build -t terrabuild:latest .
  
  # Tag Docker image
  docker tag terrabuild:latest ${ECR_REPOSITORY_URL}:latest
  
  # Push Docker image to ECR
  docker push ${ECR_REPOSITORY_URL}:latest
  
  echo "Docker image built and pushed successfully."
else
  echo "Skipping Docker build and push."
fi

# Deploy application to ECS if not skipped
if [ "$SKIP_DEPLOY" = false ]; then
  echo "Deploying application to ECS..."
  
  # Get latest task definition
  TASK_FAMILY=$(aws ecs list-task-definitions --family-prefix ${ENV}-terrabuild-app --sort DESC --max-items 1 --query "taskDefinitionArns[0]" --output text | cut -d"/" -f2)
  
  # Force new deployment
  aws ecs update-service --cluster ${ECS_CLUSTER_ID} --service ${ENV}-terrabuild-service --force-new-deployment
  
  echo "Application deployed successfully."
else
  echo "Skipping application deployment."
fi

# Display application URL
if [ "$SKIP_INFRA" = false ] || [ "$SKIP_DEPLOY" = false ]; then
  # Get load balancer DNS name
  cd terraform/environments/$ENV
  LB_DNS=$(terraform output -raw load_balancer_dns)
  cd ../../..
  
  echo "==========================="
  echo "Application deployed to: https://${LB_DNS}"
  echo "==========================="
fi

echo "Deployment process completed."