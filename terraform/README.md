# TerraBuild Infrastructure as Code

This directory contains Terraform configurations to set up AWS infrastructure for the TerraBuild application. The infrastructure includes VPC networking, security groups, PostgreSQL RDS databases, and other supporting AWS resources.

## Architecture

The infrastructure is designed with a modular approach:

- **Network Module**: Sets up VPC, subnets, security groups, NAT gateway, and route tables
- **Database Module**: Creates a PostgreSQL RDS instance with appropriate parameter groups and security configuration
- **Environment-specific configurations**: Separate configurations for dev and prod environments

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform CLI (v1.0.0+) installed
- S3 buckets created for Terraform state storage:
  - `terrabuild-terraform-state-dev`
  - `terrabuild-terraform-state-prod`
- DynamoDB tables created for state locking:
  - `terrabuild-terraform-locks-dev`
  - `terrabuild-terraform-locks-prod`

## Getting Started

### First-time Setup

Before deploying the infrastructure, create the S3 buckets and DynamoDB tables for remote state storage:

```bash
# For dev environment
aws s3api create-bucket \
  --bucket terrabuild-terraform-state-dev \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

aws dynamodb create-table \
  --table-name terrabuild-terraform-locks-dev \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-west-2

# For prod environment
aws s3api create-bucket \
  --bucket terrabuild-terraform-state-prod \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

aws dynamodb create-table \
  --table-name terrabuild-terraform-locks-prod \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-west-2
```

### Deploying the Infrastructure

1. Create a `terraform.tfvars` file in each environment directory with required variables:

```
# environments/dev/terraform.tfvars
db_username = "db_user"
db_password = "secure_password"
```

2. Initialize and apply Terraform configuration:

```bash
# For dev environment
cd environments/dev
terraform init
terraform plan
terraform apply

# For prod environment
cd environments/prod
terraform init
terraform plan
terraform apply
```

## Environment Variables

After deploying the infrastructure, you'll need to configure the application with the appropriate environment variables:

- `DATABASE_URL`: PostgreSQL connection string (can be retrieved from Secrets Manager)
- `AWS_REGION`: The AWS region where infrastructure is deployed

You can retrieve the database connection details from AWS Secrets Manager:

```bash
aws secretsmanager get-secret-value \
  --secret-id dev/database/credentials \
  --region us-west-2 \
  --query SecretString \
  --output text
```

## Maintenance

### Modifying Infrastructure

To make changes to the infrastructure:

1. Update the relevant Terraform configuration files
2. Run `terraform plan` to review changes
3. Run `terraform apply` to apply changes

### Destroying Infrastructure

To tear down the infrastructure (use with caution!):

```bash
cd environments/dev  # or environments/prod
terraform destroy
```

## Security Considerations

- Database credentials are stored in AWS Secrets Manager
- Database instances are deployed in private subnets
- Security groups restrict access to resources
- All database connections use SSL/TLS

## Troubleshooting

If you encounter issues:

1. Check the Terraform state with `terraform state list`
2. Verify AWS credentials are correctly configured
3. Ensure S3 bucket and DynamoDB table exist for remote state
4. Review `terraform.tfstate` for any state inconsistencies