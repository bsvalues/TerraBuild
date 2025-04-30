#!/bin/bash
# setup-aws-profiles.sh
# This script sets up AWS CLI profiles for different environments

set -e

echo "=== AWS CLI Profile Setup ==="
echo "This script will guide you through setting up AWS CLI profiles for different environments."
echo ""

setup_profile() {
    local profile=$1
    echo "Setting up profile: $profile"
    echo "Please provide the AWS credentials for the $profile environment:"
    
    aws configure --profile "terrabuild-$profile"
    
    echo "Profile terrabuild-$profile has been configured."
    echo ""
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Please install it first."
    exit 1
fi

# Main menu
PS3="Select an environment to configure (or 4 to exit): "
options=("Development" "Staging" "Production" "Exit")

select opt in "${options[@]}"
do
    case $opt in
        "Development")
            setup_profile "dev"
            ;;
        "Staging")
            setup_profile "staging"
            ;;
        "Production")
            setup_profile "prod"
            ;;
        "Exit")
            break
            ;;
        *) 
            echo "Invalid option"
            ;;
    esac
done

echo "AWS CLI profile setup complete."
echo ""
echo "To use a specific profile, use the --profile option with AWS CLI commands:"
echo "  aws s3 ls --profile terrabuild-dev"
echo ""
echo "Or set the AWS_PROFILE environment variable:"
echo "  export AWS_PROFILE=terrabuild-dev"