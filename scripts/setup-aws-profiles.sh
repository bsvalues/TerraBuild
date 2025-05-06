#!/bin/bash
# setup-aws-profiles.sh
# Script to set up AWS CLI profiles for TerraFusion environments

set -e

# Default values
ENVIRONMENTS=("dev" "staging" "prod")
CURRENT_ENV=""
USE_INTERACTIVE=1

# Function to display script usage
display_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --env=ENVIRONMENT      Environment to set up (dev, staging, prod, or all)"
  echo "  --non-interactive      Use non-interactive mode (use with caution)"
  echo "  --help                 Show this help message"
  echo ""
  echo "This script helps to set up AWS CLI profiles for TerraFusion environments."
  echo "Profiles will be named 'terrabuild-dev', 'terrabuild-staging', and 'terrabuild-prod'."
  echo ""
  echo "Examples:"
  echo "  $0                     # Interactive setup for all environments"
  echo "  $0 --env=staging       # Set up only the staging environment profile"
  echo "  $0 --non-interactive   # Non-interactive mode, requires pre-exported variables"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env=*)
      CURRENT_ENV="${1#*=}"
      shift
      ;;
    --non-interactive)
      USE_INTERACTIVE=0
      shift
      ;;
    --help)
      display_help
      exit 0
      ;;
    *)
      echo "Error: Unknown option $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Validate environment if provided
if [ -n "$CURRENT_ENV" ] && [ "$CURRENT_ENV" != "all" ]; then
  if [[ ! "$CURRENT_ENV" =~ ^(dev|staging|prod)$ ]]; then
    echo "Error: Invalid environment. Must be one of: dev, staging, prod, all"
    exit 1
  fi
  
  # Only setup the specified environment
  ENVIRONMENTS=("$CURRENT_ENV")
fi

# Function to check if AWS CLI is installed
check_aws_cli() {
  if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Please install it first."
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
  fi
  
  aws --version
}

# Function to set up AWS profile interactively
setup_profile_interactive() {
  local env=$1
  local profile_name="terrabuild-$env"
  
  echo "=== Setting up AWS profile for $env environment ($profile_name) ==="
  
  echo "Please enter AWS credentials for the $env environment:"
  
  # Prompt for AWS access key ID
  read -p "AWS Access Key ID: " aws_access_key_id
  
  # Prompt for AWS secret access key (hidden input)
  read -s -p "AWS Secret Access Key: " aws_secret_access_key
  echo ""
  
  # Prompt for default region
  read -p "Default AWS Region [us-west-2]: " aws_region
  aws_region=${aws_region:-us-west-2}
  
  # Prompt for output format
  read -p "Default Output Format [json]: " output_format
  output_format=${output_format:-json}
  
  # Create/update the profile
  aws configure set aws_access_key_id "$aws_access_key_id" --profile "$profile_name"
  aws configure set aws_secret_access_key "$aws_secret_access_key" --profile "$profile_name"
  aws configure set region "$aws_region" --profile "$profile_name"
  aws configure set output "$output_format" --profile "$profile_name"
  
  echo "Profile '$profile_name' has been configured successfully."
  echo ""
}

# Function to set up AWS profile non-interactively
setup_profile_non_interactive() {
  local env=$1
  local profile_name="terrabuild-$env"
  local env_upper=$(echo "$env" | tr '[:lower:]' '[:upper:]')
  
  # Check for environment variables
  local key_var="AWS_ACCESS_KEY_ID_${env_upper}"
  local secret_var="AWS_SECRET_ACCESS_KEY_${env_upper}"
  local region_var="AWS_REGION_${env_upper}"
  local output_var="AWS_OUTPUT_FORMAT_${env_upper}"
  
  if [ -z "${!key_var}" ] || [ -z "${!secret_var}" ]; then
    echo "Error: Missing required environment variables for $env environment."
    echo "Please export the following variables:"
    echo "  export $key_var=your_access_key"
    echo "  export $secret_var=your_secret_key"
    echo "  export $region_var=your_region (optional, defaults to us-west-2)"
    echo "  export $output_var=your_output_format (optional, defaults to json)"
    exit 1
  fi
  
  # Set default values if not provided
  local aws_region=${!region_var:-us-west-2}
  local output_format=${!output_var:-json}
  
  # Create/update the profile
  aws configure set aws_access_key_id "${!key_var}" --profile "$profile_name"
  aws configure set aws_secret_access_key "${!secret_var}" --profile "$profile_name"
  aws configure set region "$aws_region" --profile "$profile_name"
  aws configure set output "$output_format" --profile "$profile_name"
  
  echo "Profile '$profile_name' has been configured successfully."
  echo ""
}

# Main script execution
echo "TerraFusion AWS Profile Setup"
echo "-----------------------------"

# Check for AWS CLI
check_aws_cli

# Process each environment
for env in "${ENVIRONMENTS[@]}"; do
  if [ "$USE_INTERACTIVE" -eq 1 ]; then
    setup_profile_interactive "$env"
  else
    setup_profile_non_interactive "$env"
  fi
done

echo "AWS profiles have been set up successfully."
echo ""
echo "You can use these profiles with AWS CLI commands using the --profile option:"
echo "  aws s3 ls --profile terrabuild-dev"
echo ""
echo "Or by setting the AWS_PROFILE environment variable:"
echo "  export AWS_PROFILE=terrabuild-staging"
echo ""
echo "For Terraform operations, use the terraform-cmd.sh script which automatically"
echo "selects the appropriate profile based on the environment."