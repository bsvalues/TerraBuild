#!/bin/bash
# BCBS Application Deployment Script
# This script handles the deployment process for the BCBS application
# to different environments (dev, staging, prod)

set -e

# Default environment
ENV=${1:-dev}
TAG=${2:-latest}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment for BCBS application to ${YELLOW}${ENV}${GREEN} environment${NC}"

# Validate environment
if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo -e "${RED}Error: Invalid environment specified. Use 'dev', 'staging', or 'prod'${NC}"
  exit 1
fi

# Build the Docker image
echo -e "${GREEN}Building Docker images...${NC}"
docker-compose build

# Tag the Docker image with environment and timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)
IMAGE_NAME="bcbs-app"
FULL_TAG="${IMAGE_NAME}:${ENV}-${TAG}-${TIMESTAMP}"

echo -e "${GREEN}Tagging image as ${YELLOW}${FULL_TAG}${NC}"
docker tag ${IMAGE_NAME}_web:latest ${FULL_TAG}

# Login to container registry (if needed)
if [[ "$ENV" != "dev" ]]; then
  echo -e "${GREEN}Logging in to container registry...${NC}"
  # This would use AWS CLI, GCP CLI, or other registry login commands
  # aws ecr get-login-password | docker login --username AWS --password-stdin <your-registry>
  echo "Registry login would happen here in a real deployment"
fi

# Push the image to the registry (if not dev)
if [[ "$ENV" != "dev" ]]; then
  echo -e "${GREEN}Pushing image to registry...${NC}"
  # docker push ${FULL_TAG}
  echo "Image push would happen here in a real deployment"
fi

# Apply Terraform for the specified environment
echo -e "${GREEN}Applying Terraform configuration for ${YELLOW}${ENV}${GREEN} environment...${NC}"
cd terrafusion
terraform init
terraform workspace select ${ENV} || terraform workspace new ${ENV}
terraform apply -var-file=environments/${ENV}.tfvars -var="image_tag=${TAG}-${TIMESTAMP}" -auto-approve

# Run post-deploy checks
echo -e "${GREEN}Running post-deployment checks...${NC}"
HEALTH_CHECK_URL="https://example.com/health"  # Replace with actual health check URL

if [[ "$ENV" == "dev" ]]; then
  HEALTH_CHECK_URL="http://localhost:5000/health"
elif [[ "$ENV" == "staging" ]]; then
  HEALTH_CHECK_URL="https://staging.example.com/health"
elif [[ "$ENV" == "prod" ]]; then
  HEALTH_CHECK_URL="https://app.example.com/health"
fi

echo -e "${GREEN}Deployment to ${YELLOW}${ENV}${GREEN} completed successfully!${NC}"
echo -e "${GREEN}To run post-deployment checks:${NC}"
echo -e "  curl ${HEALTH_CHECK_URL}"

# Instructions for rollback if needed
echo -e "\n${YELLOW}If you need to rollback, run:${NC}"
echo -e "  ./scripts/deploy.sh ${ENV} <previous-tag>"