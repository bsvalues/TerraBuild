# CI/CD Pipeline Guide

This guide explains the continuous integration and continuous deployment (CI/CD) pipeline set up for the Benton County Building Cost System (BCBS) project.

## Overview

Our CI/CD pipeline automates testing, building, and deploying the application to ensure code quality and consistent deployments. The pipeline is implemented using GitHub Actions and is configured in the `.github/workflows` directory.

## Pipeline Components

The CI/CD pipeline consists of two main workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Triggered on pull requests to any branch and on pushes to `main`
   - Runs linting, unit tests, and integration tests
   - Builds Docker images and runs smoke tests
   - Uploads build artifacts for deployment

2. **Deploy Pipeline** (`.github/workflows/deploy.yml`)
   - Triggered when the CI pipeline completes successfully on the `main` branch
   - Builds and tags Docker images
   - Pushes images to container registry
   - Applies Terraform configuration to update infrastructure
   - Runs post-deployment smoke tests

## Workflow Diagram

```
Pull Request / Push to Main → CI Pipeline → (If main branch) → Deploy Pipeline → Production
```

## CI Pipeline Details

The CI pipeline includes the following steps:

1. **Checkout code**: Pulls the latest code from the repository
2. **Set up Node.js**: Installs Node.js and sets up the environment
3. **Install dependencies**: Installs npm packages
4. **Lint**: Runs the linter to ensure code style consistency
5. **Unit tests**: Runs unit tests with Jest
6. **Build Docker images**: Builds Docker images using docker-compose
7. **Integration tests**: Starts the Docker containers and runs integration tests
8. **Tear down**: Stops and removes Docker containers
9. **Build application**: Builds the application for production (on `main` branch only)
10. **Upload artifacts**: Uploads build artifacts for deployment (on `main` branch only)

## Deploy Pipeline Details

The deployment pipeline includes the following steps:

1. **Checkout code**: Pulls the latest code from the repository
2. **Configure cloud credentials**: Sets up AWS credentials for deployment
3. **Build and tag Docker images**: Builds and tags Docker images with the commit SHA
4. **Push to registry**: Pushes Docker images to Amazon ECR
5. **Apply Terraform**: Updates infrastructure using Terraform
6. **Run smoke tests**: Verifies the deployment works correctly
7. **Notifications**: Sends notifications about deployment status

## Environment Configuration

The deployment pipeline uses different environment configurations:

- **Dev**: For development and testing
- **Staging**: For pre-production validation
- **Prod**: For production deployment

Environment-specific variables are stored in Terraform variable files:
- `terrafusion/environments/dev.tfvars`
- `terrafusion/environments/staging.tfvars`
- `terrafusion/environments/prod.tfvars`

## GitHub Secrets

The following GitHub secrets are required for the CI/CD pipeline:

- `AWS_ACCESS_KEY_ID`: AWS access key for ECR and deployment
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for ECR and deployment
- `AWS_REGION`: AWS region for deployment
- `TF_API_TOKEN`: Terraform Cloud API token (if using Terraform Cloud)

## Manual Deployment

In addition to the automated pipeline, you can manually deploy using the deploy script:

```bash
./scripts/deploy.sh [environment] [tag]
```

Where:
- `environment` is one of: `dev`, `staging`, or `prod`
- `tag` is an optional Docker image tag (defaults to `latest`)

## Rollback Procedure

If a deployment fails or causes issues, you can roll back to a previous version:

1. Identify the previous successful deployment tag
2. Run the deploy script with the previous tag:

```bash
./scripts/deploy.sh [environment] [previous-tag]
```

## Best Practices

1. **Always create pull requests** for changes instead of pushing directly to `main`
2. **Ensure tests pass locally** before pushing to GitHub
3. **Keep the CI pipeline fast** to get quick feedback
4. **Monitor deployments** to catch issues early
5. **Use meaningful commit messages** following the Conventional Commits format

## Troubleshooting

### CI Pipeline Failures

If the CI pipeline fails:

1. Check the GitHub Actions logs for error details
2. Run the tests locally to reproduce the issue
3. Fix the issues and push the changes
4. Monitor the new CI run

### Deployment Failures

If deployment fails:

1. Check the GitHub Actions logs for error details
2. Check the AWS CloudWatch logs for any application errors
3. Verify Terraform state is not corrupted
4. Roll back to a previous version if necessary
5. Fix issues and redeploy