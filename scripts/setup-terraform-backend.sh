#!/bin/bash
# setup-terraform-backend.sh
# This script sets up the AWS S3 bucket and DynamoDB table for Terraform state management

set -e

# Default values
AWS_REGION="us-west-2"
ENV="dev"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --region=*)
      AWS_REGION="${1#*=}"
      shift
      ;;
    --env=*)
      ENV="${1#*=}"
      shift
      ;;
    --help)
      echo "Usage: $0 [--region=REGION] [--env=ENVIRONMENT]"
      echo "  --region=REGION       AWS region (default: us-west-2)"
      echo "  --env=ENVIRONMENT     Environment (dev, staging, prod) (default: dev)"
      exit 0
      ;;
    *)
      echo "Error: Unknown option $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Set bucket and table names
BUCKET_NAME="terrabuild-terraform-state-${ENV}"
TABLE_NAME="terrabuild-terraform-lock-${ENV}"

echo "=== Setting up Terraform backend for ${ENV} environment in ${AWS_REGION} ==="
echo "S3 Bucket: ${BUCKET_NAME}"
echo "DynamoDB Table: ${TABLE_NAME}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS credentials not configured or invalid. Please run 'aws configure'."
    exit 1
fi

# Create S3 bucket for Terraform state
echo "Creating S3 bucket for Terraform state..."
if aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
    echo "Bucket ${BUCKET_NAME} already exists, skipping creation."
else
    aws s3api create-bucket \
        --bucket "${BUCKET_NAME}" \
        --region "${AWS_REGION}" \
        --create-bucket-configuration LocationConstraint="${AWS_REGION}"
    
    echo "Enabling versioning on S3 bucket..."
    aws s3api put-bucket-versioning \
        --bucket "${BUCKET_NAME}" \
        --versioning-configuration Status=Enabled
    
    echo "Enabling encryption on S3 bucket..."
    aws s3api put-bucket-encryption \
        --bucket "${BUCKET_NAME}" \
        --server-side-encryption-configuration '{
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        }'
    
    echo "Adding bucket policy to block public access..."
    aws s3api put-public-access-block \
        --bucket "${BUCKET_NAME}" \
        --public-access-block-configuration '{
            "BlockPublicAcls": true,
            "IgnorePublicAcls": true,
            "BlockPublicPolicy": true,
            "RestrictPublicBuckets": true
        }'
fi

# Create DynamoDB table for state locking
echo "Creating DynamoDB table for state locking..."
if aws dynamodb describe-table --table-name "${TABLE_NAME}" &>/dev/null; then
    echo "DynamoDB table ${TABLE_NAME} already exists, skipping creation."
else
    aws dynamodb create-table \
        --table-name "${TABLE_NAME}" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST
    
    echo "Waiting for DynamoDB table to become active..."
    aws dynamodb wait table-exists --table-name "${TABLE_NAME}"
fi

# Create backend config file
BACKEND_CONFIG_DIR="terraform/environments/${ENV}"
BACKEND_CONFIG_FILE="${BACKEND_CONFIG_DIR}/backend.tfvars"

echo "Creating backend configuration file..."
mkdir -p "${BACKEND_CONFIG_DIR}"

cat > "${BACKEND_CONFIG_FILE}" << EOF
bucket         = "${BUCKET_NAME}"
key            = "terraform.tfstate"
region         = "${AWS_REGION}"
dynamodb_table = "${TABLE_NAME}"
encrypt        = true
EOF

echo "=== Terraform backend setup complete ==="
echo "Backend configuration written to: ${BACKEND_CONFIG_FILE}"
echo ""
echo "To initialize Terraform with this backend, run:"
echo "  cd terraform/environments/${ENV}"
echo "  terraform init -backend-config=backend.tfvars"