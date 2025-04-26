# Terraform Infrastructure for BCBS

This directory contains Terraform configurations for deploying the BCBS application infrastructure to AWS.

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) (version 1.0.0 or later)
2. AWS CLI configured with appropriate credentials
3. S3 bucket for Terraform state (optional but recommended for team environments)

## Infrastructure Components

The Terraform configuration creates the following resources:

- VPC with public and private subnets
- PostgreSQL RDS database
- ElastiCache Redis cluster
- Security groups for application, database, and Redis
- (Optional) ECS cluster for containerized application deployment

## Usage

### Initialize Terraform

```bash
terraform init
```

For team environments using S3 backend:

```bash
terraform init \
  -backend-config="bucket=YOUR_BUCKET_NAME" \
  -backend-config="key=state/terraform.tfstate" \
  -backend-config="region=YOUR_AWS_REGION"
```

### Plan the Deployment

```bash
terraform plan -var-file=environments/dev.tfvars -out=tfplan
```

### Apply the Configuration

```bash
terraform apply tfplan
```

### Destroy the Infrastructure

When you're done, you can destroy all resources:

```bash
terraform destroy -var-file=environments/dev.tfvars
```

## Environment-Specific Configuration

Create environment-specific variable files in the `environments/` directory:

- `dev.tfvars` - Development environment
- `staging.tfvars` - Staging environment
- `prod.tfvars` - Production environment

## Security Notes

- Database passwords should be managed through environment variables or AWS Secrets Manager
- Use AWS KMS for encryption of sensitive data
- Consider implementing additional security controls for production environments

## CI/CD Integration

This Terraform configuration can be integrated with your CI/CD pipeline:

1. Initialize and validate in the CI environment
2. Generate and review the plan
3. Apply the changes on approval (for production environments)

Example GitHub Actions workflow snippet:

```yaml
- name: Terraform Init
  run: terraform -chdir=terrafusion init

- name: Terraform Validate
  run: terraform -chdir=terrafusion validate

- name: Terraform Plan
  run: terraform -chdir=terrafusion plan -var-file=environments/dev.tfvars -out=tfplan
```