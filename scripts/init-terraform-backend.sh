#!/bin/bash
# init-terraform-backend.sh
# Script to initialize Terraform backend infrastructure (S3 bucket and DynamoDB table)

set -e

# Default values
ENV="dev"
VERBOSE=0
AWS_REGION="us-west-2"
FORCE=0

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env=*)
      ENV="${1#*=}"
      shift
      ;;
    --region=*)
      AWS_REGION="${1#*=}"
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    --verbose)
      VERBOSE=1
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --env=ENVIRONMENT      Environment to use (dev, staging, prod) (default: dev)"
      echo "  --region=AWS_REGION    AWS region to create resources in (default: us-west-2)"
      echo "  --force                Skip confirmation prompt"
      echo "  --verbose              Enable verbose output"
      echo "  --help                 Show this help message"
      echo ""
      echo "This script creates the S3 bucket and DynamoDB table required for Terraform remote state."
      echo "It needs to be run once per environment before using Terraform."
      echo ""
      echo "Examples:"
      echo "  $0 --env=dev"
      echo "  $0 --env=staging --region=us-east-1"
      echo "  $0 --env=prod --force"
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

# Check AWS profile and set if exists
AWS_PROFILE="terrabuild-${ENV}"
if aws configure list --profile "$AWS_PROFILE" &>/dev/null; then
  echo "Using AWS profile: $AWS_PROFILE"
  export AWS_PROFILE="$AWS_PROFILE"
else
  echo "Warning: AWS profile '$AWS_PROFILE' not found. Using default AWS credentials."
  # Unset the profile to use default credentials
  unset AWS_PROFILE
fi

# Resource names
S3_BUCKET="terrabuild-terraform-state-${ENV}"
DYNAMODB_TABLE="terrabuild-terraform-locks-${ENV}"

# Check if bucket already exists
BUCKET_EXISTS=$(aws s3api head-bucket --bucket "$S3_BUCKET" 2>&1 || true)
if [ -z "$BUCKET_EXISTS" ]; then
  echo "S3 bucket '$S3_BUCKET' already exists."
  BUCKET_REGION=$(aws s3api get-bucket-location --bucket "$S3_BUCKET" --query "LocationConstraint" --output text)
  if [ "$BUCKET_REGION" == "null" ]; then
    BUCKET_REGION="us-east-1"  # AWS returns null for us-east-1
  fi
  
  if [ "$BUCKET_REGION" != "$AWS_REGION" ]; then
    echo "Warning: Existing bucket is in region '$BUCKET_REGION' but you specified '$AWS_REGION'."
    echo "Backend configuration should use region '$BUCKET_REGION' for this bucket."
  fi
else
  echo "S3 bucket '$S3_BUCKET' does not exist or you don't have access to it."
fi

# Check if DynamoDB table exists
TABLE_EXISTS=$(aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" 2>&1 | grep -c "TableName" || true)
if [ "$TABLE_EXISTS" -gt 0 ]; then
  echo "DynamoDB table '$DYNAMODB_TABLE' already exists."
  TABLE_REGION=$(aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --query "Table.TableArn" --output text | cut -d":" -f4)
  
  if [ "$TABLE_REGION" != "$AWS_REGION" ]; then
    echo "Warning: Existing table is in region '$TABLE_REGION' but you specified '$AWS_REGION'."
    echo "Backend configuration should use region '$TABLE_REGION' for this table."
  fi
else
  echo "DynamoDB table '$DYNAMODB_TABLE' does not exist or you don't have access to it."
fi

# Ask for confirmation
if [ "$FORCE" -ne 1 ]; then
  if [ -z "$BUCKET_EXISTS" ] && [ "$TABLE_EXISTS" -gt 0 ]; then
    echo "S3 bucket already exists but needs to be configured for versioning. DynamoDB table exists."
    read -p "Do you want to continue and configure the bucket? (yes/no): " confirm
  elif [ -z "$BUCKET_EXISTS" ] && [ "$TABLE_EXISTS" -eq 0 ]; then
    echo "S3 bucket exists but needs to be configured. DynamoDB table will be created."
    read -p "Do you want to continue? (yes/no): " confirm
  elif [ ! -z "$BUCKET_EXISTS" ] && [ "$TABLE_EXISTS" -gt 0 ]; then
    echo "Both S3 bucket and DynamoDB table already exist."
    read -p "Do you want to continue and create them anyway? This may overwrite existing resources. (yes/no): " confirm
  else
    echo "Creating Terraform backend resources in region '$AWS_REGION':"
    echo "- S3 bucket: $S3_BUCKET"
    echo "- DynamoDB table: $DYNAMODB_TABLE"
    read -p "Do you want to continue? (yes/no): " confirm
  fi
  
  if [ "$confirm" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
  fi
fi

echo "=== Creating Terraform Backend Resources ($ENV environment) ==="

# Create S3 bucket if it doesn't exist
if [ ! -z "$BUCKET_EXISTS" ]; then
  echo "Creating S3 bucket '$S3_BUCKET'..."
  
  # Different command syntax for us-east-1
  if [ "$AWS_REGION" == "us-east-1" ]; then
    aws s3api create-bucket \
      --bucket "$S3_BUCKET" \
      --region "$AWS_REGION"
  else
    aws s3api create-bucket \
      --bucket "$S3_BUCKET" \
      --region "$AWS_REGION" \
      --create-bucket-configuration LocationConstraint="$AWS_REGION"
  fi
  
  echo "S3 bucket created successfully."
fi

# Enable versioning on the S3 bucket
echo "Enabling versioning on S3 bucket..."
aws s3api put-bucket-versioning \
  --bucket "$S3_BUCKET" \
  --versioning-configuration Status=Enabled

# Enable server-side encryption for the S3 bucket
echo "Enabling default encryption on S3 bucket..."
aws s3api put-bucket-encryption \
  --bucket "$S3_BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

# Block public access to the bucket
echo "Blocking public access to S3 bucket..."
aws s3api put-public-access-block \
  --bucket "$S3_BUCKET" \
  --public-access-block-configuration '{
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
  }'

# Create DynamoDB table if it doesn't exist
if [ "$TABLE_EXISTS" -eq 0 ]; then
  echo "Creating DynamoDB table '$DYNAMODB_TABLE'..."
  aws dynamodb create-table \
    --table-name "$DYNAMODB_TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$AWS_REGION"
  
  # Wait for the table to be created
  echo "Waiting for DynamoDB table to be created..."
  aws dynamodb wait table-exists \
    --table-name "$DYNAMODB_TABLE" \
    --region "$AWS_REGION"
  
  echo "DynamoDB table created successfully."
fi

echo "=== Terraform Backend Resources Created Successfully ==="
echo ""
echo "You can now use the following backend configuration in your Terraform code:"
echo ""
echo "terraform {"
echo "  backend \"s3\" {"
echo "    bucket         = \"$S3_BUCKET\""
echo "    key            = \"terrabuild/$ENV/terraform.tfstate\""
echo "    region         = \"$AWS_REGION\""
echo "    encrypt        = true"
echo "    dynamodb_table = \"$DYNAMODB_TABLE\""
echo "  }"
echo "}"
echo ""
echo "Or, use the backend.tfvars file with terraform init:"
echo "terraform init -backend-config=\"environments/$ENV/backend.tfvars\""