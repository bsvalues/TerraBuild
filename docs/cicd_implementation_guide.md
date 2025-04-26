# CI/CD Implementation Guide for BCBS Project

This guide outlines the implementation of a Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Benton County Building System (BCBS) application.

## Table of Contents

1. [Overview](#overview)
2. [Components](#components)
3. [Docker Development Environment](#docker-development-environment)
4. [GitHub Actions CI Pipeline](#github-actions-ci-pipeline)
5. [Terraform Infrastructure Management](#terraform-infrastructure-management)
6. [Deployment Strategy](#deployment-strategy)
7. [Monitoring and Rollback](#monitoring-and-rollback)

## Overview

The CI/CD pipeline automates testing, building, and deployment of the BCBS application, enabling consistent and reliable delivery of new features and bug fixes.

### Objectives

- Provide a consistent development environment
- Automate testing and validation
- Enable reliable and repeatable deployments
- Support multiple environments (dev, staging, production)
- Ensure infrastructure consistency through code

## Components

The CI/CD pipeline consists of these key components:

1. **Docker Development Environment**
   - Local development environment consistency
   - Simplified onboarding for new developers
   - Mirroring of production dependencies

2. **GitHub Actions CI Pipeline**
   - Automated testing
   - Code quality checks
   - Build verification
   - Artifact generation

3. **Terraform Infrastructure Management**
   - Infrastructure as Code (IaC)
   - Environment consistency
   - Resource management
   - Security configuration

4. **Deployment Automation**
   - Environment-specific deployments
   - Rollback capabilities
   - Release management

## Docker Development Environment

### Configuration

The Docker development environment is configured using `docker-compose.yml`:

```yaml
version: "3.8"
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    command: npm run dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "5000:5000"
    env_file:
      - .env.dev
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: bcbs
      POSTGRES_USER: bcbs
      POSTGRES_PASSWORD: bcbs
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

### Usage

1. **Starting the environment**:
   ```bash
   docker-compose up
   ```

2. **Rebuilding after changes**:
   ```bash
   docker-compose build
   docker-compose up
   ```

3. **Running database migrations**:
   ```bash
   docker-compose exec web npm run db:push
   ```

## GitHub Actions CI Pipeline

### Workflow Configuration

The GitHub Actions workflow is defined in `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: bcbs
          POSTGRES_PASSWORD: bcbs
          POSTGRES_DB: bcbs_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Check TypeScript
        run: npm run check
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://bcbs:bcbs@localhost:5432/bcbs_test
          REDIS_URL: redis://localhost:6379/0
          NODE_ENV: test
  
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build application
        run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/
```

### CI Pipeline Steps

1. **Test**:
   - Run unit tests
   - Type checking
   - Code quality validation

2. **Build**:
   - Create production artifacts
   - Package application
   - Upload artifacts for deployment

3. **Deploy** (when ready):
   - Deploy to appropriate environment
   - Run database migrations
   - Verify deployment

## Terraform Infrastructure Management

### Resource Management

Terraform modules are organized in the `terrafusion` directory:

- `main.tf` - Main infrastructure configuration
- `variables.tf` - Variable definitions
- `outputs.tf` - Output values
- Environment-specific vars in `environments/*.tfvars`

### Key Components

1. **Network Infrastructure**:
   - VPC and subnets
   - Security groups
   - Routing tables

2. **Database Resources**:
   - PostgreSQL RDS instance
   - Backup configuration
   - Security settings

3. **Cache Infrastructure**:
   - Redis ElastiCache cluster
   - Subnet groups
   - Security configuration

### Deployment Integration

The Terraform configuration integrates with the CI/CD pipeline:

1. Plan in CI:
   ```bash
   terraform plan -var-file=environments/dev.tfvars -out=tfplan
   ```

2. Apply on approval:
   ```bash
   terraform apply tfplan
   ```

## Deployment Strategy

### Environment Progression

The deployment strategy follows a progressive approach:

1. **Development**:
   - Automatic deployment on merge to development branch
   - Used for feature testing and integration

2. **Staging**:
   - Manual approval required
   - Production-like environment for final testing
   - Complete integration testing

3. **Production**:
   - Manual approval required
   - Scheduled deployment windows
   - Canary or blue-green deployment

### Deployment Configuration

Environment-specific configurations are managed through:

- Environment variables
- Configuration files
- Feature flags

## Monitoring and Rollback

### Health Checks

Automated health checks verify deployment success:

- API endpoint tests
- Database connectivity
- Cache functionality
- Resource utilization

### Rollback Strategy

If issues are detected:

1. Automatic rollback for critical failures
2. Manual rollback option for non-critical issues
3. Database rollback through migrations

### Monitoring Integration

The CI/CD pipeline integrates with monitoring tools:

- Alerts on deployment failures
- Performance metrics after deployment
- Error rate tracking

## Conclusion

This CI/CD implementation provides a robust framework for developing, testing, and deploying the BCBS application. By following these guidelines, the team can ensure consistent quality, reliable deployments, and efficient collaboration.

## Additional Resources

- [Docker Development Guide](./docker_development_guide.md)
- [Terraform AWS Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)