# TerraFusion DevOps Guide

This guide provides an overview of the DevOps implementation for the TerraFusion project. It covers infrastructure provisioning, CI/CD pipelines, database management, and deployment procedures.

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Pipeline](#deployment-pipeline)
4. [Database Management](#database-management)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [Disaster Recovery](#disaster-recovery)
7. [Local Development](#local-development)

## Infrastructure Overview

TerraFusion infrastructure is provisioned and managed using Infrastructure as Code (IaC) with Terraform. The infrastructure includes:

- VPC with public and private subnets
- RDS PostgreSQL database
- ElastiCache Redis
- ECS (Elastic Container Service) for application hosting
- CloudWatch for monitoring and logging
- S3 for data storage
- Route53 for DNS management

All resources are tagged appropriately for cost tracking and management.

## Environment Configuration

The project supports three environments:

1. **Development (dev)** - For ongoing development and testing
2. **Staging (staging)** - For pre-production validation
3. **Production (prod)** - For live application

Each environment has its own configuration located in `terraform/environments/<env>/`. The environment configurations include:

- `terraform.tfvars` - Environment-specific variables
- `backend.tfvars` - Terraform backend configuration for state storage

### Setting Up AWS Profiles

For local development and manual operations, configure AWS profiles for each environment:

```bash
aws configure --profile terrabuild-dev
aws configure --profile terrabuild-staging
aws configure --profile terrabuild-prod
```

## Deployment Pipeline

The CI/CD pipeline is implemented using GitHub Actions. The workflow consists of the following stages:

### Continuous Integration

The CI pipeline is defined in `.github/workflows/ci.yml` and runs on every pull request and push to the main and development branches. It includes:

1. **Linting and Code Quality Checks** - ESLint and formatting
2. **Unit and Integration Tests** - With a test database
3. **Build** - Compiles the application
4. **Security Scan** - Checks for vulnerabilities
5. **Docker Image Build** - Creates and pushes a container image

### Continuous Deployment

The CD pipeline is defined in `.github/workflows/deploy.yml` and is triggered manually with environment selection. It includes:

1. **Database Backup** - Creates a backup before deployment
2. **Infrastructure Deployment** - Applies Terraform changes
3. **Application Deployment** - Deploys the application to ECS
4. **Post-Deployment Verification** - Checks that the application is working

## Database Management

Database operations are managed through scripts in the `scripts/` directory:

### Database Migrations

```bash
# View migration status
./scripts/db-migration.sh --env=dev --action=status

# Apply migrations
./scripts/db-migration.sh --env=staging --action=up

# Create a new migration
./scripts/db-migration.sh --env=dev --action=create --name=add_user_roles
```

### Database Backup and Restore

```bash
# Create a backup
./scripts/backup_and_restore.sh --env=prod --action=backup

# List available backups
./scripts/backup_and_restore.sh --env=staging --action=list

# Restore from a backup
./scripts/backup_and_restore.sh --env=dev --action=restore --file=terrabuild_dev_20250430_123045.sql.gz
```

## Monitoring and Logging

The application and infrastructure are monitored using AWS CloudWatch. Key metrics include:

- CPU and memory utilization
- Database performance
- API response times
- Error rates

Logs are centralized in CloudWatch Logs with a retention period based on the environment:
- Dev: 30 days
- Staging: 60 days
- Production: 90 days

## Disaster Recovery

Disaster recovery procedures include:

1. **Regular Backups** - Automated database backups
2. **Multi-AZ Deployment** - For production environment
3. **Restore Procedures** - Documented in this guide
4. **Failover Testing** - Conducted quarterly

## Local Development

For local development:

1. **Terraform Execution**

   Use the helper script for running Terraform commands:

   ```bash
   # Plan changes for dev environment
   ./scripts/terraform-cmd.sh --env=dev --command=plan

   # Apply changes to staging
   ./scripts/terraform-cmd.sh --env=staging --command=apply --auto-approve

   # Show outputs for production
   ./scripts/terraform-cmd.sh --env=prod --command=output
   ```

2. **Database Operations**

   Local database setup:

   ```bash
   # Start database
   npm run db:dev

   # Apply migrations
   npm run db:push
   ```

3. **Running the Application**

   ```bash
   # Start development server
   npm run dev
   ```

---

For questions or support, please contact the DevOps team at devops@terrabuild.example.com