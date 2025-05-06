# BCBS Infrastructure as Code (IaC)

This directory contains the Terraform code for provisioning and managing the infrastructure for the Benton County Building Cost System (BCBS) application.

## Directory Structure

```
terrafusion/
├── environments/           # Environment-specific configurations
│   ├── dev/
│   ├── staging/
│   └── prod/
├── modules/                # Reusable Terraform modules
│   ├── networking/         # VPC, subnets, security groups
│   ├── database/           # RDS and ElastiCache resources
│   ├── compute/            # ECS and related resources
│   ├── load_balancer/      # ALB and related resources
│   ├── monitoring/         # CloudWatch and related resources
│   ├── security/           # IAM and security-related resources
│   └── deployment/         # Blue-Green and Canary deployment resources
├── functions/              # Lambda functions for deployments
├── new_main.tf             # Main Terraform configuration
├── new_variables.tf        # Variable definitions
├── new_outputs.tf          # Output definitions
└── terraform-setup.sh      # Script for Terraform operations
```

## Prerequisites

- Terraform v1.0.0+
- AWS CLI configured with appropriate permissions
- S3 bucket for Terraform state (referenced in `backend.tfvars`)
- DynamoDB table for state locking

## Getting Started

### Initial Setup

1. Initialize Terraform with the appropriate backend:

```bash
cd terrafusion
terraform init -backend-config=environments/dev/backend.tfvars
```

2. Select the appropriate workspace:

```bash
terraform workspace select dev
# or
terraform workspace new dev
```

### Using the Terraform Setup Script

The `terraform-setup.sh` script simplifies Terraform operations:

```bash
# Format: ./terraform-setup.sh <environment> <action> [version]
# Examples:
./terraform-setup.sh dev plan
./terraform-setup.sh staging apply v1.0.0
./terraform-setup.sh prod destroy
```

### Manual Operations

If you prefer to run Terraform commands directly:

```bash
# Planning
terraform plan -var-file=environments/dev/terraform.tfvars -out=terraform.plan

# Applying
terraform apply terraform.plan

# Destroying
terraform destroy -var-file=environments/dev/terraform.tfvars
```

## Environment Management

The infrastructure supports three environments:

- **Development (dev)**: For active development and testing
- **Staging (staging)**: For pre-release testing
- **Production (prod)**: For the live application

Each environment has its own configuration in the `environments/` directory.

## Deployment Strategies

### Blue-Green Deployment

Blue-Green deployment maintains two identical environments with only one active:

- New versions are deployed to the inactive environment
- Traffic is switched once the new version is validated
- Rollback is immediate by switching traffic back

### Canary Deployment

Canary deployment gradually shifts traffic to the new version:

- Initially routes a small percentage of traffic to the new version
- Gradually increases traffic if monitoring shows no issues
- Automatically rolls back if issues are detected

## CI/CD Integration

The Terraform code is integrated with GitHub Actions for automated:

- Code formatting checks
- Validation
- Planning
- Applying (with approval for staging and production)

See `.github/workflows/terraform.yml` for the workflow definition.

## Security Considerations

- Sensitive values are never stored in the repository
- Secrets are managed through AWS Secrets Manager
- Infrastructure is deployed with the principle of least privilege
- Security groups use the principle of least access

## Additional Documentation

For more detailed information, see:

- [Infrastructure as Code Documentation](../docs/infrastructure_as_code.md)
- [IaC and CI/CD Integration Guide](../docs/iac_cicd_integration.md)
- [Blue-Green and Canary Deployment Strategies](../docs/blue_green_canary_deployments.md)

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request
4. Review the Terraform plan
5. Merge after approval