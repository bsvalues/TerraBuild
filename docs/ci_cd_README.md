# CI/CD Infrastructure for BCBS

This document provides an overview of the CI/CD infrastructure implemented for the Benton County Building System (BCBS) application.

## Table of Contents

1. [Development Environment](#development-environment)
2. [CI/CD Pipeline](#ci-cd-pipeline)
3. [Infrastructure as Code](#infrastructure-as-code)
4. [Helper Scripts](#helper-scripts)
5. [Getting Started](#getting-started)

## Development Environment

The BCBS development environment is containerized using Docker and Docker Compose, providing a consistent and reproducible environment for all developers.

### Key Components

- **Web Application**: Node.js application with React frontend
- **PostgreSQL Database**: Persistent data storage
- **Redis**: Session management and caching

### Starting the Development Environment

To start the development environment:

```bash
# Using Docker Compose directly
docker-compose up

# Using the helper script
./scripts/docker-dev.sh up
```

### Additional Resources

- [Docker Development Guide](./docker_development_guide.md): Detailed instructions for using Docker

## CI/CD Pipeline

The CI/CD pipeline is implemented using GitHub Actions, providing automated testing, building, and deployment of the application.

### Pipeline Stages

1. **Test**: Runs tests, linting, and type checking
2. **Build**: Creates production build artifacts
3. **Deploy**: Deploys the application to the target environment (when enabled)

### Workflow Configuration

The GitHub Actions workflow is defined in `.github/workflows/ci.yml`.

### Additional Resources

- [CI/CD Implementation Guide](./cicd_implementation_guide.md): Detailed CI/CD implementation instructions

## Infrastructure as Code

Infrastructure is managed using Terraform, ensuring consistent and repeatable deployments across environments.

### Environments

- **Development** (`dev`): Used for feature development and testing
- **Staging** (`staging`): Pre-production environment for integration testing
- **Production** (`prod`): Live environment for end users

### Key Resources

- VPC and networking infrastructure
- PostgreSQL RDS database
- Redis ElastiCache
- Security groups and IAM roles

### Managing Infrastructure

To manage infrastructure:

```bash
# Using Terraform directly
cd terrafusion
terraform init
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars

# Using the helper script
./scripts/terraform-cmd.sh plan dev
./scripts/terraform-cmd.sh apply dev
```

### Additional Resources

- [Terraform Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs): AWS provider documentation

## Helper Scripts

Several helper scripts are provided to simplify common development and deployment tasks:

- `scripts/docker-dev.sh`: Docker development environment management
- `scripts/terraform-cmd.sh`: Terraform infrastructure management
- `scripts/deploy.sh`: Application deployment orchestration

### Using the Scripts

```bash
# Docker development environment
./scripts/docker-dev.sh [up|down|build|restart|logs|db|redis|migrate|test|clean]

# Terraform infrastructure
./scripts/terraform-cmd.sh [init|plan|apply|destroy|output|refresh] [environment]

# Deployment
./scripts/deploy.sh [environment] [--infra-only|--app-only]
```

## Getting Started

To get started with the BCBS CI/CD infrastructure:

1. **Set up the development environment**:
   ```bash
   git clone <repository-url>
   cd bcbs-application
   cp .env.dev .env.local  # Customize as needed
   ./scripts/docker-dev.sh up
   ```

2. **Make changes and run tests**:
   ```bash
   # Make your changes
   ./scripts/docker-dev.sh test
   ```

3. **Commit and push your changes**:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   git push
   ```

4. **Monitor CI/CD pipeline**:
   The GitHub Actions pipeline will automatically run tests on your changes.

5. **Deploy to an environment** (requires appropriate permissions):
   ```bash
   ./scripts/deploy.sh dev  # or staging/prod
   ```

## Additional Resources

- [Project Documentation](../README.md): Main project documentation
- [API Documentation](../API-ENDPOINTS.md): API endpoint documentation