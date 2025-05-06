# BCBS CI/CD Implementation Guide

This guide provides an overview of the continuous integration and continuous deployment (CI/CD) implementation for the Benton County Building Cost System (BCBS) project.

## Overview

The CI/CD infrastructure provides:

1. A consistent development environment using Docker
2. Automated testing and validation through GitHub Actions
3. Streamlined deployment to staging and production environments
4. Infrastructure as code using Terraform

## Key Components

### Docker Development Environment

The Docker development environment ensures that all developers work with the same setup, eliminating "it works on my machine" issues.

- **Configuration**: `docker-compose.yml` and `Dockerfile`
- **Guide**: [Docker Development Guide](docker_development_guide.md)
- **Helper Script**: `scripts/docker-dev.sh`

### GitHub Actions Workflows

GitHub Actions automate testing and deployment when code is pushed to the repository.

- **CI Pipeline**: `.github/workflows/ci.yml`
- **Deploy Pipeline**: `.github/workflows/deploy.yml`
- **Guide**: [CI/CD Pipeline Guide](ci_cd_guide.md)

### Terraform Infrastructure

Infrastructure is defined as code using Terraform, allowing for consistent, versioned infrastructure changes.

- **Configuration**: `terrafusion/*.tf`
- **Environment Settings**: `terrafusion/environments/*.tfvars`
- **Helper Script**: `scripts/terraform-cmd.sh`

### Deployment Scripts

Helper scripts simplify common deployment operations.

- **Deployment**: `scripts/deploy.sh`
- **Guide**: [CI/CD Pipeline Guide](ci_cd_guide.md)

## Getting Started

### For Developers

1. Set up the Docker development environment:
   ```bash
   ./scripts/docker-dev.sh start
   ```

2. Make your code changes and test locally.

3. Push your changes to a feature branch and create a pull request.

4. GitHub Actions will run tests automatically. Fix any issues that are found.

5. After the PR is merged to `main`, the deployment pipeline will deploy changes to staging.

### For DevOps

1. Configure GitHub Actions secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

2. Set up Terraform backend and state management:
   ```bash
   ./scripts/terraform-cmd.sh init
   ```

3. Plan and apply infrastructure changes:
   ```bash
   ./scripts/terraform-cmd.sh staging plan
   ./scripts/terraform-cmd.sh staging apply
   ```

## Workflow Diagram

```
Local Development -> Pull Request -> Automated Tests -> Merge to Main -> Deploy to Staging -> Manual Approval -> Deploy to Production
```

## File Index

### Docker Configuration
- `docker-compose.yml` - Multi-container Docker configuration
- `Dockerfile` - Docker image definition for the application
- `.env.dev` - Development environment variables

### GitHub Actions Workflows
- `.github/workflows/ci.yml` - CI pipeline for testing and validation
- `.github/workflows/deploy.yml` - Deployment pipeline

### Terraform Configuration
- `terrafusion/main.tf` - Main Terraform configuration
- `terrafusion/variables.tf` - Variable definitions
- `terrafusion/environments/*.tfvars` - Environment-specific variables

### Helper Scripts
- `scripts/docker-dev.sh` - Docker development helper
- `scripts/deploy.sh` - Deployment helper
- `scripts/terraform-cmd.sh` - Terraform operations helper

### Documentation
- `docs/docker_development_guide.md` - Docker development guide
- `docs/ci_cd_guide.md` - CI/CD pipeline guide
- `docs/CI_CD_README.md` - This file

## Best Practices

1. **Use feature branches** for all changes
2. **Write tests** for new features and bug fixes
3. **Run tests locally** before pushing
4. **Review CI pipeline results** before merging
5. **Monitor deployments** to catch issues early
6. **Version infrastructure changes** with Terraform

## Troubleshooting

See the specific guides for troubleshooting each component:
- [Docker Development Guide](docker_development_guide.md#troubleshooting)
- [CI/CD Pipeline Guide](ci_cd_guide.md#troubleshooting)

## Further Reading

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Terraform Documentation](https://www.terraform.io/docs)