# Infrastructure as Code (IaC) with Terraform

This document provides a comprehensive guide to the Infrastructure as Code (IaC) implementation for the Benton County Building Cost System (BCBS) application.

## Table of Contents

1. [Overview](#overview)
2. [Repository Structure](#repository-structure)
3. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Authentication](#authentication)
   - [Initialization](#initialization)
4. [Environments](#environments)
   - [Development](#development)
   - [Staging](#staging)
   - [Production](#production)
5. [Core Infrastructure Components](#core-infrastructure-components)
6. [Deployment Strategies](#deployment-strategies)
7. [CI/CD Integration](#cicd-integration)
8. [Secrets Management](#secrets-management)
9. [State Management](#state-management)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

## Overview

The BCBS application's infrastructure is fully defined and managed using Infrastructure as Code (IaC) through Terraform. This approach ensures:

1. **Consistency**: Infrastructure is deployed consistently across all environments
2. **Repeatability**: The entire infrastructure can be recreated with a single command
3. **Version Control**: All infrastructure changes are tracked in Git
4. **Automation**: Infrastructure changes can be fully automated
5. **Documentation**: The infrastructure is self-documenting through code

## Repository Structure

The Terraform code is organized in a modular structure under the `terrafusion` directory:

```
terrafusion/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
├── modules/
│   ├── networking/
│   ├── database/
│   ├── compute/
│   ├── load_balancer/
│   ├── monitoring/
│   ├── security/
│   └── deployment/
├── main.tf
├── variables.tf
├── outputs.tf
└── ...
```

This structure separates:
- Environment-specific configurations (`environments/`)
- Reusable infrastructure components (`modules/`)
- Core infrastructure setup (`main.tf` and related files)

## Getting Started

### Prerequisites

To work with the Terraform codebase, you need:

1. Terraform CLI (v1.0.0+)
2. AWS CLI configured with appropriate access
3. Access to the S3 bucket for state storage
4. Git access to the repository

### Authentication

Terraform uses AWS credentials for authentication. You can provide these through:

1. AWS environment variables:
   ```bash
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   export AWS_DEFAULT_REGION="us-west-2"
   ```

2. Shared credentials file (~/.aws/credentials):
   ```
   [default]
   aws_access_key_id = your-access-key
   aws_secret_access_key = your-secret-key
   ```

3. AWS CLI profile:
   ```bash
   export AWS_PROFILE=bcbs-admin
   ```

### Initialization

To initialize the Terraform working directory:

```bash
cd terrafusion
terraform init -backend-config=environments/dev/backend.tfvars
```

Replace `dev` with the appropriate environment.

## Environments

### Development

The development environment is used for active development and testing. It is configured with:

- Minimal resources for cost efficiency
- Lower redundancy requirements
- More permissive security settings
- Automatic database snapshots for quick restoration

To deploy:

```bash
terraform workspace select dev
terraform apply -var-file=environments/dev/terraform.tfvars
```

### Staging

The staging environment closely mirrors production and is used for:

- Pre-production testing
- Performance testing
- User acceptance testing
- Deployment verification

To deploy:

```bash
terraform workspace select staging
terraform apply -var-file=environments/staging/terraform.tfvars
```

### Production

The production environment hosts the live application and is configured with:

- High availability across multiple Availability Zones
- Automatic scaling
- Strict security controls
- Regular database backups
- Enhanced monitoring

To deploy:

```bash
terraform workspace select prod
terraform apply -var-file=environments/prod/terraform.tfvars
```

## Core Infrastructure Components

### Networking (modules/networking)

Handles all networking components including:
- VPC configuration
- Public and private subnets
- Internet and NAT gateways
- Route tables and security groups

### Database (modules/database)

Manages the PostgreSQL database including:
- RDS instance configuration
- Read replicas (if used)
- Backup and snapshot policies
- Parameter groups and subnet groups

### Compute (modules/compute)

Handles the application compute resources:
- ECS cluster and services
- Task definitions
- Auto-scaling configurations
- IAM roles and policies

### Load Balancer (modules/load_balancer)

Manages application traffic:
- Application Load Balancer configuration
- Target groups
- Listeners and rules
- SSL/TLS certificate management
- Health checks

### Monitoring (modules/monitoring)

Handles all monitoring and logging components:
- CloudWatch metrics and alarms
- CloudWatch Log groups
- Dashboard configurations
- SNS topics for alerts

### Security (modules/security)

Manages security components:
- IAM roles and policies
- Security groups
- KMS keys for encryption
- AWS WAF configurations (if used)

### Deployment (modules/deployment)

Contains deployment-specific infrastructure:
- Blue-Green deployment configuration
- Canary deployment setup
- Rollback mechanisms
- Deployment metrics collection

## Deployment Strategies

The infrastructure supports two primary deployment strategies:

### Blue-Green Deployment

Blue-Green deployments use two identical environments with only one active at a time. This provides a simple and reliable way to deploy new versions:

1. Infrastructure is always provisioned for both "blue" and "green" environments
2. Only one environment is active at any given time
3. Deployment updates the inactive environment
4. Traffic is switched to the newly updated environment
5. In case of issues, traffic can be immediately switched back

The module `modules/deployment/blue_green.tf` manages this configuration.

### Canary Deployment

Canary deployments gradually shift traffic to a new version, reducing risk:

1. A small percentage of traffic is directed to the new version
2. Traffic percentage increases gradually as confidence grows
3. If issues are detected, traffic is immediately shifted back

The module `modules/deployment/canary.tf` manages this configuration.

## CI/CD Integration

The Terraform infrastructure is integrated with the CI/CD pipeline:

1. **Automated Planning**: Infrastructure changes are automatically planned on pull requests
2. **Pre-deployment Validation**: Terraform validates infrastructure before deployment
3. **Automated Apply**: Infrastructure changes are applied as part of the deployment pipeline
4. **Drift Detection**: Regular checks ensure the actual infrastructure matches the code
5. **Automated Rollback**: In case of issues, the infrastructure can be automatically rolled back

### Integration Points

The main integration points are:

1. GitHub Actions workflows that run Terraform commands
2. Terraform Cloud (if used) for remote operations
3. Custom scripts that manage deployment transitions

## Secrets Management

Sensitive information is managed securely using:

1. **AWS Secrets Manager**: Stores application secrets
2. **Terraform Variables**: Marked as sensitive to prevent display in logs
3. **GitHub Secrets**: Secure storage for CI/CD credentials
4. **IAM Roles**: Least-privilege access for services

### Accessing Secrets

Secrets are provided to the application through:

1. Environment variables injected into ECS tasks
2. IAM roles allowing access to specific secrets
3. Runtime access via the AWS SDK

## State Management

Terraform state is stored remotely to enable collaboration:

1. **S3 Backend**: State files are stored in a dedicated S3 bucket
2. **DynamoDB Table**: Used for state locking to prevent concurrent modifications
3. **Workspaces**: Separate state for each environment

### State Configuration

The backend configuration is in `main.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "bcbs-terraform-state"
    key            = "state/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "bcbs-terraform-locks"
    encrypt        = true
  }
}
```

## Monitoring and Logging

The infrastructure includes comprehensive monitoring:

1. **CloudWatch Alarms**: Monitor key metrics and trigger alerts
2. **CloudWatch Logs**: Capture application and infrastructure logs
3. **CloudWatch Dashboards**: Visualize application performance
4. **SNS Topics**: Send notifications for critical events

### Key Metrics

Critical metrics monitored include:

1. Service health and availability
2. Error rates and latency
3. Resource utilization
4. Database performance
5. Cache hit rates

## Best Practices

When working with the Terraform codebase:

1. **Version Control**: All changes should be committed to Git
2. **Pull Requests**: Infrastructure changes should be reviewed
3. **Testing**: Test changes in development before applying to production
4. **Documentation**: Update this document when making significant changes
5. **Tagging**: All resources should have appropriate tags
6. **Modularity**: Keep modules focused and reusable
7. **State Management**: Never manually modify the state

## Troubleshooting

### Common Issues

1. **State Lock Issues**:
   ```bash
   terraform force-unlock LOCK_ID
   ```

2. **Initialization Failures**:
   ```bash
   rm -rf .terraform
   terraform init -reconfigure
   ```

3. **Resource Creation Failures**:
   - Check AWS service limits
   - Verify IAM permissions
   - Check for resource naming conflicts

4. **State Discrepancies**:
   ```bash
   terraform refresh
   ```

### Getting Help

For additional support:

1. Check the AWS documentation
2. Review Terraform documentation
3. Contact the DevOps team

## Conclusion

This Infrastructure as Code implementation ensures consistent, reliable, and automated infrastructure management for the BCBS application. By following the practices outlined in this document, you can effectively work with and maintain the infrastructure code.