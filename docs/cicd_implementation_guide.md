# TerraBuild CI/CD Implementation Guide

This document provides step-by-step instructions for implementing and maintaining the CI/CD pipeline for the TerraBuild application. This guide is designed for junior engineers who need to understand the deployment process and infrastructure setup.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [GitHub Actions CI/CD Pipeline](#github-actions-cicd-pipeline)
4. [Infrastructure Setup](#infrastructure-setup)
5. [Deployment Process](#deployment-process)
6. [Monitoring and Alerts](#monitoring-and-alerts)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Overview

The TerraBuild CI/CD pipeline automates the building, testing, and deployment of the application to AWS infrastructure. The pipeline is triggered by pushes to specific branches in the GitHub repository and uses Terraform for infrastructure provisioning.

## Prerequisites

Before implementing the CI/CD pipeline, ensure you have:

1. **AWS Account**: Access to an AWS account with appropriate permissions
2. **GitHub Repository**: The TerraBuild codebase in a GitHub repository
3. **AWS CLI**: Installed and configured on your local machine
4. **Terraform**: Version 1.0.0 or higher installed
5. **Docker**: Installed for building and testing container images

## GitHub Actions CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci.yml` and consists of the following stages:

### 1. Build and Test

This stage builds the application and runs tests to ensure code quality:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
```

### 2. Security Scan

This stage performs security scans on the code and dependencies:

```yaml
  security:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security scan
        run: |
          npm install -g snyk
          snyk test
```

### 3. Infrastructure Validation

This stage validates the Terraform configuration:

```yaml
  validate-infrastructure:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      - name: Terraform Init
        run: |
          cd terraform/environments/${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
          terraform init -backend=false
      - name: Terraform Validate
        run: |
          cd terraform/environments/${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
          terraform validate
```

### 4. Deploy

This stage deploys the application to AWS:

```yaml
  deploy:
    needs: [security, validate-infrastructure]
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'development' }}
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      - name: Deploy application
        run: |
          ENV=${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
          ./scripts/deploy.sh --env $ENV
```

## Infrastructure Setup

The infrastructure is managed using Terraform and is organized into modules:

### 1. Network Module

Sets up the VPC, subnets, security groups, and other networking components:

```
terraform/modules/network/
```

### 2. Database Module

Creates an RDS PostgreSQL instance:

```
terraform/modules/database/
```

### 3. ECS Module

Sets up the ECS cluster, services, and load balancer:

```
terraform/modules/ecs/
```

### 4. Monitoring Module

Configures CloudWatch dashboards, alarms, and log groups:

```
terraform/modules/monitoring/
```

### Environment-specific Configuration

Each environment (dev, prod) has its own configuration:

```
terraform/environments/dev/
terraform/environments/prod/
```

## Deployment Process

The deployment process is handled by the `scripts/deploy.sh` script, which:

1. Applies Terraform infrastructure changes
2. Builds and pushes a Docker image to ECR
3. Updates the ECS service to use the new image

To deploy manually:

```bash
# Deploy to dev environment
./scripts/deploy.sh --env dev

# Deploy to production environment
./scripts/deploy.sh --env prod

# Skip certain steps
./scripts/deploy.sh --env dev --skip-infra
```

## Monitoring and Alerts

Monitoring is set up using AWS CloudWatch:

### Dashboards

A comprehensive dashboard is created for each environment showing:
- ECS CPU and memory utilization
- RDS metrics
- Application load balancer metrics

### Alerts

Alerts are configured for:
- High CPU utilization (> 85%)
- High memory utilization (> 85%)
- Database storage running low
- HTTP 5XX errors

Alert notifications are sent to the email addresses configured in the `alert_email_addresses` variable.

## Troubleshooting

### Common Issues and Solutions

#### Deployment Failures

1. **Terraform Apply Fails**:
   - Check the error message in the CI/CD logs
   - Ensure AWS credentials are properly configured
   - Verify that the S3 bucket for Terraform state exists

2. **Docker Build Fails**:
   - Check for syntax errors in the Dockerfile
   - Ensure dependencies are properly specified
   - Verify that the ECR repository exists and is accessible

3. **ECS Service Fails to Start**:
   - Check the CloudWatch logs for the service
   - Verify that the container can access the database
   - Check if the health check endpoint is responding correctly

#### Infrastructure Issues

1. **Database Connection Issues**:
   - Verify security group rules allow access from the ECS service
   - Check the database credentials in AWS Secrets Manager
   - Ensure the database is in the 'available' state

2. **Load Balancer Issues**:
   - Check that the target group health checks are passing
   - Verify that the security groups allow traffic on ports 80/443
   - Ensure the ACM certificate is valid and properly configured

## Best Practices

1. **Infrastructure as Code**:
   - Always make changes through Terraform, not manually in the AWS console
   - Version control all infrastructure code
   - Use environment-specific variables to avoid duplicating code

2. **Deployment Safety**:
   - Use feature branches and pull requests for code changes
   - Ensure all tests pass before deploying
   - Start with the dev environment before deploying to production

3. **Monitoring and Logging**:
   - Regularly review CloudWatch logs and metrics
   - Set up appropriate alerts for critical issues
   - Implement structured logging in the application

4. **Security**:
   - Keep dependencies up to date
   - Regularly update the base Docker image
   - Follow the principle of least privilege for IAM roles and policies

5. **Documentation**:
   - Keep this guide updated as the pipeline changes
   - Document any environment-specific configurations
   - Maintain runbooks for common issues