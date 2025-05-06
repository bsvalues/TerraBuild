#!/bin/bash

# TerraBuild Deployment Script
# This script handles the deployment of the TerraBuild application to AWS

set -e

# Default values
ENVIRONMENT="dev"
SKIP_INFRA=false
SKIP_BUILD=false
SKIP_DEPLOY=false
APP_NAME="terrabuild"
AWS_REGION="us-west-2"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --skip-infra)
      SKIP_INFRA=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-deploy)
      SKIP_DEPLOY=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --env <environment>  Deployment environment (dev or prod, default: dev)"
      echo "  --skip-infra         Skip infrastructure deployment"
      echo "  --skip-build         Skip Docker image build and push"
      echo "  --skip-deploy        Skip ECS service update"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
  echo "Error: Environment must be 'dev' or 'prod'"
  exit 1
fi

echo "=========================================="
echo "TerraBuild Deployment - $ENVIRONMENT Environment"
echo "=========================================="
echo "Deployment Configuration:"
echo "  - Environment: $ENVIRONMENT"
echo "  - Skip Infrastructure: $SKIP_INFRA"
echo "  - Skip Build: $SKIP_BUILD"
echo "  - Skip Deploy: $SKIP_DEPLOY"
echo "=========================================="

# 1. Infrastructure Deployment
if [[ "$SKIP_INFRA" == "false" ]]; then
  echo "Deploying infrastructure..."
  
  cd "terraform/environments/$ENVIRONMENT"
  
  echo "Initializing Terraform..."
  terraform init
  
  echo "Planning infrastructure changes..."
  terraform plan -out=tfplan
  
  echo "Applying infrastructure changes..."
  terraform apply -auto-approve tfplan
  
  # Get outputs from Terraform
  ECR_REPOSITORY=$(terraform output -raw ecr_repository_url)
  ECS_CLUSTER=$(terraform output -raw ecs_cluster_name)
  ECS_SERVICE=$(terraform output -raw ecs_service_name)
  
  cd -
else
  echo "Skipping infrastructure deployment..."
  
  # Get existing infrastructure values
  ECR_REPOSITORY=$(aws ecr describe-repositories --repository-names "$APP_NAME-$ENVIRONMENT" --query "repositories[0].repositoryUri" --output text)
  ECS_CLUSTER="$APP_NAME-$ENVIRONMENT-cluster"
  ECS_SERVICE="$APP_NAME-$ENVIRONMENT-service"
fi

# 2. Build and Push Docker Image
if [[ "$SKIP_BUILD" == "false" ]]; then
  echo "Building and pushing Docker image..."
  
  # Set image tag with commit SHA or timestamp
  if [ -n "$GITHUB_SHA" ]; then
    IMAGE_TAG=${GITHUB_SHA:0:8}
  else
    IMAGE_TAG=$(date +%Y%m%d%H%M%S)
  fi
  
  FULL_IMAGE_NAME="$ECR_REPOSITORY:$IMAGE_TAG"
  LATEST_IMAGE_NAME="$ECR_REPOSITORY:latest"
  
  echo "Image tag: $IMAGE_TAG"
  echo "Full image name: $FULL_IMAGE_NAME"
  
  # Login to ECR
  echo "Logging in to ECR..."
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY
  
  # Build the Docker image
  echo "Building Docker image..."
  docker build -t $FULL_IMAGE_NAME -t $LATEST_IMAGE_NAME .
  
  # Push the Docker image
  echo "Pushing Docker image to ECR..."
  docker push $FULL_IMAGE_NAME
  docker push $LATEST_IMAGE_NAME
  
  echo "Docker image built and pushed successfully: $FULL_IMAGE_NAME"
else
  echo "Skipping Docker image build and push..."
  
  # Get the latest image tag
  IMAGE_TAG=$(aws ecr describe-images --repository-name "$APP_NAME-$ENVIRONMENT" --query "imageDetails[?contains(@.imageTags, 'latest')].imageTags[0]" --output text)
  FULL_IMAGE_NAME="$ECR_REPOSITORY:$IMAGE_TAG"
fi

# 3. Update ECS Service
if [[ "$SKIP_DEPLOY" == "false" ]]; then
  echo "Updating ECS service..."
  
  # Get the current task definition
  TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition "$APP_NAME-$ENVIRONMENT" --query "taskDefinition" --output json)
  
  # Create a new task definition revision with the new image
  NEW_TASK_DEFINITION=$(echo $TASK_DEFINITION | jq --arg IMAGE "$FULL_IMAGE_NAME" '.containerDefinitions[0].image = $IMAGE')
  
  # Register the new task definition
  aws ecs register-task-definition \
    --family "$APP_NAME-$ENVIRONMENT" \
    --execution-role-arn "$(echo $TASK_DEFINITION | jq -r '.executionRoleArn')" \
    --task-role-arn "$(echo $TASK_DEFINITION | jq -r '.taskRoleArn')" \
    --network-mode "$(echo $TASK_DEFINITION | jq -r '.networkMode')" \
    --container-definitions "$(echo $NEW_TASK_DEFINITION | jq '.containerDefinitions')" \
    --volumes "$(echo $TASK_DEFINITION | jq '.volumes')" \
    --cpu "$(echo $TASK_DEFINITION | jq -r '.cpu')" \
    --memory "$(echo $TASK_DEFINITION | jq -r '.memory')"
  
  # Update the service to use the new task definition
  aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --task-definition "$APP_NAME-$ENVIRONMENT" \
    --force-new-deployment
  
  echo "Waiting for service to stabilize..."
  aws ecs wait services-stable \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE"
  
  echo "ECS service updated successfully"
else
  echo "Skipping ECS service update..."
fi

echo "=========================================="
echo "Deployment Complete!"
echo "Environment: $ENVIRONMENT"
echo "Image: $FULL_IMAGE_NAME"
echo "=========================================="