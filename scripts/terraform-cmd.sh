#!/bin/bash
# BCBS Terraform Helper Script
# This script simplifies Terraform operations for different environments

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENV=${1:-dev}
CMD=${2:-plan}
ARGS=${@:3}

# Help function
function show_help {
  echo -e "${BLUE}BCBS Terraform Helper${NC}"
  echo -e "Usage: ./scripts/terraform-cmd.sh [environment] [command] [additional args]"
  echo
  echo -e "Environments:"
  echo -e "  ${YELLOW}dev${NC}     - Development environment"
  echo -e "  ${YELLOW}staging${NC} - Staging environment"
  echo -e "  ${YELLOW}prod${NC}    - Production environment"
  echo
  echo -e "Commands:"
  echo -e "  ${YELLOW}plan${NC}    - Generate and show Terraform execution plan"
  echo -e "  ${YELLOW}apply${NC}   - Apply Terraform execution plan"
  echo -e "  ${YELLOW}destroy${NC} - Destroy Terraform-managed infrastructure"
  echo -e "  ${YELLOW}output${NC}  - Show Terraform outputs"
  echo -e "  ${YELLOW}validate${NC}- Validate Terraform configuration files"
  echo -e "  ${YELLOW}init${NC}    - Initialize Terraform working directory"
  echo -e "  ${YELLOW}help${NC}    - Show this help message"
  echo
  echo -e "Example:"
  echo -e "  ./scripts/terraform-cmd.sh staging apply -auto-approve"
}

# Validate environment
if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo -e "${RED}Error: Invalid environment '${ENV}'. Use 'dev', 'staging', or 'prod'${NC}"
  show_help
  exit 1
fi

# Validate command
if [[ ! "$CMD" =~ ^(plan|apply|destroy|output|validate|init|help)$ ]]; then
  echo -e "${RED}Error: Invalid command '${CMD}'${NC}"
  show_help
  exit 1
fi

# Show help if requested
if [[ "$CMD" == "help" ]]; then
  show_help
  exit 0
fi

# Navigate to Terraform directory
cd terrafusion

# Initialize Terraform if not already initialized
if [[ ! -d ".terraform" ]] || [[ "$CMD" == "init" ]]; then
  echo -e "${GREEN}Initializing Terraform...${NC}"
  terraform init
fi

# Select workspace
echo -e "${GREEN}Selecting workspace for ${YELLOW}${ENV}${GREEN} environment...${NC}"
terraform workspace select ${ENV} 2>/dev/null || terraform workspace new ${ENV}

# Execute the requested command
if [[ "$CMD" == "plan" ]]; then
  echo -e "${GREEN}Planning changes for ${YELLOW}${ENV}${GREEN} environment...${NC}"
  terraform plan -var-file=environments/${ENV}.tfvars ${ARGS}
elif [[ "$CMD" == "apply" ]]; then
  echo -e "${GREEN}Applying changes to ${YELLOW}${ENV}${GREEN} environment...${NC}"
  terraform apply -var-file=environments/${ENV}.tfvars ${ARGS}
elif [[ "$CMD" == "destroy" ]]; then
  echo -e "${RED}WARNING: Destroying infrastructure in ${YELLOW}${ENV}${RED} environment!${NC}"
  read -p "Are you sure you want to continue? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    terraform destroy -var-file=environments/${ENV}.tfvars ${ARGS}
  else
    echo -e "${RED}Operation cancelled${NC}"
    exit 0
  fi
elif [[ "$CMD" == "output" ]]; then
  echo -e "${GREEN}Showing outputs for ${YELLOW}${ENV}${GREEN} environment...${NC}"
  terraform output ${ARGS}
elif [[ "$CMD" == "validate" ]]; then
  echo -e "${GREEN}Validating Terraform configuration...${NC}"
  terraform validate
elif [[ "$CMD" == "init" ]]; then
  echo -e "${GREEN}Terraform initialized successfully.${NC}"
fi

echo -e "${GREEN}Terraform operation completed successfully!${NC}"