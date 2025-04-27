# IaC and CI/CD Integration Guide

This document explains how the Infrastructure as Code (IaC) implementation is integrated with the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Benton County Building Cost System (BCBS).

## Table of Contents

1. [Overview](#overview)
2. [CI/CD Workflow](#cicd-workflow)
3. [Manual vs. Automated Deployments](#manual-vs-automated-deployments)
4. [Environment Management](#environment-management)
5. [Secrets Management](#secrets-management)
6. [Terraform State Management](#terraform-state-management)
7. [Deployment Strategies](#deployment-strategies)
8. [Monitoring and Rollback](#monitoring-and-rollback)
9. [Common Usage Scenarios](#common-usage-scenarios)
10. [Troubleshooting](#troubleshooting)

## Overview

The BCBS application's infrastructure is managed using Terraform, with infrastructure changes automatically planned, validated, and optionally applied through a GitHub Actions-based CI/CD pipeline. This approach ensures:

1. Infrastructure changes follow the same review process as code changes
2. All infrastructure deployments are consistent and repeatable
3. Infrastructure drift is automatically detected and corrected
4. Deployments can be easily rolled back if issues are detected

## CI/CD Workflow

The Terraform CI/CD workflow consists of the following stages:

### Stage 1: Terraform Lint and Validation
- Runs on every PR that affects Terraform code
- Performs `terraform fmt -check` to ensure code is properly formatted
- Validates Terraform configuration with `terraform validate`
- Runs additional static analysis with TFLint

### Stage 2: Terraform Plan
- Creates a speculative execution plan
- Outputs the plan as a comment on the PR
- Uploads the plan as an artifact

### Stage 3: Terraform Apply (for approved changes)
- Only runs when manually triggered via workflow_dispatch
- Applies the changes to the specified environment
- Uploads logs as artifacts
- Updates environment status

### Stage 4: Post-Deployment Validation
- Verifies deployed resources are functioning correctly
- Runs automated tests against the infrastructure
- Monitors for any errors or issues

## Manual vs. Automated Deployments

The CI/CD pipeline supports both manual and automated deployments:

### Automated Deployments
- Triggered on merge to main branch (for development environment only)
- Automatically creates and applies Terraform plans
- Used primarily for non-production environments

### Manual Deployments
- Triggered via GitHub Actions workflow dispatch
- Requires manual approval from authorized personnel
- Provides more control over environment and version
- Required for production deployments

## Environment Management

The infrastructure is deployed to three distinct environments:

### Development (dev)
- Used for active development and testing
- Automatically updated when changes are merged to main
- Configured with minimal resources for cost efficiency

### Staging (staging)
- Mirrors production but with scaled-down resources
- Used for pre-release testing and validation
- Requires manual approval for deployments

### Production (prod)
- Hosts the live application
- Requires manual approval with additional safeguards
- Configured for high availability and performance

## Secrets Management

Sensitive information like database passwords and API keys are managed securely:

1. **GitHub Secrets**: Store AWS credentials and other sensitive information
2. **AWS Secrets Manager**: Stores application secrets
3. **Parameter Store**: Stores non-sensitive configuration
4. **Environment Variables**: Injected securely into ECS tasks

### Adding a New Secret

To add a new secret:

1. Add the secret to AWS Secrets Manager using the AWS Console or CLI
2. Reference the secret in Terraform using the `aws_secretsmanager_secret` data source
3. Update the ECS task definition to inject the secret as an environment variable

## Terraform State Management

Terraform state is stored securely and managed to enable collaboration:

1. **Remote State**: State files are stored in an S3 bucket
2. **State Locking**: DynamoDB is used to prevent concurrent modifications
3. **Workspaces**: Separate state for each environment

### State Management Practices

1. Never manually modify the state
2. Use `terraform import` to bring existing resources under management
3. Use `terraform state mv` for resource renaming
4. Always run `terraform plan` before applying changes

## Deployment Strategies

The infrastructure supports two primary deployment strategies:

### Blue-Green Deployment

The Blue-Green deployment strategy maintains two identical environments (blue and green), with only one active at a time:

1. Infrastructure for both environments is always provisioned
2. New versions are deployed to the inactive environment
3. Traffic is switched once the new version is validated
4. Rollback is achieved by switching traffic back

To trigger a Blue-Green deployment:

```bash
# Manual execution
cd terrafusion
./terraform-setup.sh staging apply v1.2.3

# Via GitHub Actions
# Use the workflow_dispatch trigger with:
# - environment: staging
# - action: apply
# - version: v1.2.3
```

### Canary Deployment

The Canary deployment strategy gradually shifts traffic to the new version:

1. Deploy the new version alongside the current version
2. Initially route a small percentage of traffic to the new version
3. Gradually increase traffic if monitoring shows no issues
4. Automatically roll back if issues are detected

To trigger a Canary deployment:

```bash
# Include [canary] in your commit message
git commit -m "[canary] Deploy feature XYZ"
git push

# Or specify in CI/CD pipeline parameters
```

## Monitoring and Rollback

The deployment process includes comprehensive monitoring:

1. **Health Checks**: Verify the application is responding correctly
2. **Metrics**: Monitor error rates, latency, and resource utilization
3. **Logs**: Capture application and infrastructure logs
4. **Alarms**: Trigger automated alerts and rollbacks

### Automated Rollbacks

Rollbacks can be triggered automatically based on the following conditions:

1. High error rates (HTTP 5xx errors)
2. Excessive latency
3. Failed health checks
4. Resource constraints

The rollback process is immediate and automatic, ensuring minimal impact to users.

## Common Usage Scenarios

### Scenario 1: Deploy a New Version to Staging

```bash
# Via GitHub Actions
# 1. Go to the Actions tab
# 2. Select "Terraform CI/CD Pipeline"
# 3. Click "Run workflow"
# 4. Enter:
#    - environment: staging
#    - action: apply
#    - version: v1.2.3
# 5. Click "Run workflow"
```

### Scenario 2: Deploy Infrastructure Changes

1. Make changes to Terraform code
2. Create a Pull Request
3. Review the Terraform plan in the PR comments
4. Merge the PR to apply changes to dev
5. Trigger manual deployment for staging and production

### Scenario 3: Roll Back a Deployment

```bash
# Via GitHub Actions
# 1. Go to the Actions tab
# 2. Select "Terraform CI/CD Pipeline"
# 3. Click "Run workflow"
# 4. Enter:
#    - environment: prod
#    - action: apply
#    - version: v1.1.0 (previous known-good version)
# 5. Click "Run workflow"
```

## Troubleshooting

### Common Errors and Solutions

1. **State Lock Errors**:
   ```bash
   terraform force-unlock LOCK_ID
   ```

2. **AWS Authentication Errors**:
   - Verify AWS credentials are correctly set in GitHub Secrets
   - Ensure IAM permissions are correct

3. **Resource Creation Failures**:
   - Check AWS service quotas
   - Review error messages in the Terraform logs

4. **Pipeline Failures**:
   - Check GitHub Actions logs for detailed error information
   - Verify workflow syntax and secrets configuration

### Getting Help

For additional assistance:

1. Check the error logs in GitHub Actions
2. Review CloudWatch logs for the affected resources
3. Contact the DevOps team for support

## Conclusion

The integrated IaC and CI/CD pipeline provides a robust, automated approach to infrastructure management for the BCBS application. By following these guidelines, you can ensure reliable and consistent infrastructure deployments across all environments.