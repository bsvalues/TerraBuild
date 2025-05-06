# CI/CD Infrastructure Index

## Overview

This document serves as an index for all CI/CD infrastructure components implemented for the Benton County Building System (BCBS) project.

## Documentation

| Document | Description |
|----------|-------------|
| [CI/CD README](./ci_cd_README.md) | Overview of the CI/CD infrastructure |
| [CI/CD Implementation Guide](./cicd_implementation_guide.md) | Detailed implementation guide for CI/CD pipeline |
| [Docker Development Guide](./docker_development_guide.md) | Instructions for using the Docker development environment |

## Configuration Files

| File | Description |
|------|-------------|
| [docker-compose.yml](../docker-compose.yml) | Docker Compose configuration for development environment |
| [Dockerfile](../Dockerfile) | Docker container definition for the application |
| [.dockerignore](../.dockerignore) | Files to exclude from Docker builds |
| [.env.dev](../.env.dev) | Development environment variables template |
| [.github/workflows/ci.yml](../.github/workflows/ci.yml) | GitHub Actions CI/CD workflow definition |

## Terraform Infrastructure

| File | Description |
|------|-------------|
| [main.tf](../terrafusion/main.tf) | Main Terraform configuration |
| [variables.tf](../terrafusion/variables.tf) | Terraform variable definitions |
| [environments/dev.tfvars](../terrafusion/environments/dev.tfvars) | Development environment variables |
| [environments/staging.tfvars](../terrafusion/environments/staging.tfvars) | Staging environment variables |
| [environments/prod.tfvars](../terrafusion/environments/prod.tfvars) | Production environment variables |
| [README.md](../terrafusion/README.md) | Terraform usage documentation |

## Helper Scripts

| Script | Description |
|--------|-------------|
| [docker-dev.sh](../scripts/docker-dev.sh) | Docker development environment helper |
| [terraform-cmd.sh](../scripts/terraform-cmd.sh) | Terraform command helper |
| [deploy.sh](../scripts/deploy.sh) | Deployment orchestration script |

## Getting Started

To get started with the CI/CD infrastructure, follow these steps:

1. **Set up development environment**:
   ```bash
   cp .env.dev .env.local  # Customize as needed
   ./scripts/docker-dev.sh up
   ```

2. **Review GitHub Actions workflow**:
   The CI/CD pipeline will automatically run on push to the main branch or when creating a pull request.

3. **Deploy to an environment**:
   ```bash
   ./scripts/deploy.sh dev  # or staging/prod
   ```

## Next Steps

After setting up the CI/CD infrastructure, consider:

1. Configuring notification integrations (email, Slack)
2. Setting up monitoring and alerting
3. Implementing feature flag management
4. Adding code quality gates (SonarQube, etc.)
5. Implementing automatic versioning