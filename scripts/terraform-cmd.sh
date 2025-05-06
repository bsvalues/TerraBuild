#!/bin/bash
# terraform-cmd.sh
# Helper script for running Terraform commands with the correct environment configuration

set -e

# Default values
ENV="dev"
COMMAND="plan"
AUTO_APPROVE=""
VERBOSE=0
SKIP_BACKEND_CONFIG=0

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env=*)
      ENV="${1#*=}"
      shift
      ;;
    --command=*)
      COMMAND="${1#*=}"
      shift
      ;;
    --auto-approve)
      AUTO_APPROVE="-auto-approve"
      shift
      ;;
    --verbose)
      VERBOSE=1
      shift
      ;;
    --skip-backend-config)
      SKIP_BACKEND_CONFIG=1
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --env=ENVIRONMENT      Environment to use (dev, staging, prod) (default: dev)"
      echo "  --command=COMMAND      Terraform command to run (default: plan)"
      echo "  --auto-approve         Auto approve (for apply or destroy)"
      echo "  --verbose              Enable verbose output"
      echo "  --skip-backend-config  Skip backend configuration"
      echo "  --help                 Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 --env=dev --command=plan"
      echo "  $0 --env=staging --command=apply --auto-approve"
      echo "  $0 --env=prod --command=destroy"
      exit 0
      ;;
    *)
      echo "Error: Unknown option $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Validate environment
if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "Error: Invalid environment. Must be one of: dev, staging, prod"
  exit 1
fi

# Set paths
ENV_DIR="terraform/environments/$ENV"
BACKEND_CONFIG="$ENV_DIR/backend.tfvars"
TFVARS_FILE="$ENV_DIR/terraform.tfvars"

# Validate command
case "$COMMAND" in
  plan|apply|destroy|validate|refresh|output|state|import|show|graph|init)
    # Valid command
    ;;
  *)
    echo "Error: Invalid command: $COMMAND"
    echo "Valid commands: plan, apply, destroy, validate, refresh, output, state, import, show, graph, init"
    exit 1
    ;;
esac

# Check if environment directory exists
if [ ! -d "$ENV_DIR" ]; then
  echo "Error: Environment directory not found: $ENV_DIR"
  exit 1
fi

# Check if tfvars file exists
if [ ! -f "$TFVARS_FILE" ]; then
  echo "Error: Terraform variables file not found: $TFVARS_FILE"
  exit 1
fi

# Check AWS profile
AWS_PROFILE="terrabuild-${ENV}"
if ! aws configure list --profile "$AWS_PROFILE" &>/dev/null; then
  echo "Warning: AWS profile '$AWS_PROFILE' not found. Using default AWS credentials."
  AWS_PROFILE=""
else
  export AWS_PROFILE="$AWS_PROFILE"
  echo "Using AWS profile: $AWS_PROFILE"
fi

# Initialize Terraform if needed
if [ "$COMMAND" != "init" ] && [ ! -d "terraform/.terraform" ]; then
  echo "Terraform not initialized. Running terraform init first..."
  
  if [ "$SKIP_BACKEND_CONFIG" -eq 1 ] || [ ! -f "$BACKEND_CONFIG" ]; then
    if [ "$VERBOSE" -eq 1 ]; then
      (cd terraform && terraform init)
    else
      (cd terraform && terraform init -no-color)
    fi
  else
    if [ "$VERBOSE" -eq 1 ]; then
      (cd terraform && terraform init -backend-config="$BACKEND_CONFIG")
    else
      (cd terraform && terraform init -no-color -backend-config="$BACKEND_CONFIG")
    fi
  fi
fi

# Execute Terraform command
echo "Executing: terraform $COMMAND for environment: $ENV"

if [ "$COMMAND" = "init" ]; then
  # Handle init specifically
  if [ "$SKIP_BACKEND_CONFIG" -eq 1 ] || [ ! -f "$BACKEND_CONFIG" ]; then
    if [ "$VERBOSE" -eq 1 ]; then
      (cd terraform && terraform init)
    else
      (cd terraform && terraform init -no-color)
    fi
  else
    if [ "$VERBOSE" -eq 1 ]; then
      (cd terraform && terraform init -backend-config="$BACKEND_CONFIG")
    else
      (cd terraform && terraform init -no-color -backend-config="$BACKEND_CONFIG")
    fi
  fi
elif [ "$COMMAND" = "plan" ]; then
  # Handle plan command
  if [ "$VERBOSE" -eq 1 ]; then
    (cd terraform && terraform plan -var-file="$TFVARS_FILE" -out="${ENV}_plan.tfplan")
  else
    (cd terraform && terraform plan -no-color -var-file="$TFVARS_FILE" -out="${ENV}_plan.tfplan")
  fi
elif [ "$COMMAND" = "apply" ]; then
  # Handle apply command
  if [ -f "terraform/${ENV}_plan.tfplan" ]; then
    # Apply existing plan
    if [ "$VERBOSE" -eq 1 ]; then
      (cd terraform && terraform apply $AUTO_APPROVE "${ENV}_plan.tfplan")
    else
      (cd terraform && terraform apply -no-color $AUTO_APPROVE "${ENV}_plan.tfplan")
    fi
  else
    # Create and apply new plan
    if [ "$VERBOSE" -eq 1 ]; then
      (cd terraform && terraform apply $AUTO_APPROVE -var-file="$TFVARS_FILE")
    else
      (cd terraform && terraform apply -no-color $AUTO_APPROVE -var-file="$TFVARS_FILE")
    fi
  fi
elif [ "$COMMAND" = "destroy" ]; then
  # Handle destroy command with extra confirmation
  if [ -z "$AUTO_APPROVE" ]; then
    read -p "Are you sure you want to destroy the $ENV environment? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "Destroy cancelled."
      exit 0
    fi
  fi
  
  if [ "$VERBOSE" -eq 1 ]; then
    (cd terraform && terraform destroy $AUTO_APPROVE -var-file="$TFVARS_FILE")
  else
    (cd terraform && terraform destroy -no-color $AUTO_APPROVE -var-file="$TFVARS_FILE")
  fi
else
  # Handle all other commands
  if [ "$VERBOSE" -eq 1 ]; then
    (cd terraform && terraform $COMMAND -var-file="$TFVARS_FILE")
  else
    (cd terraform && terraform $COMMAND -no-color -var-file="$TFVARS_FILE")
  fi
fi

echo "Terraform $COMMAND completed for environment: $ENV"