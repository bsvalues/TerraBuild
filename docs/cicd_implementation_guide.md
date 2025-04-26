# CI/CD Implementation Guide with Replit AI Agent

This guide provides a practical approach to implementing CI/CD and development environment setup for the BCBS project using the Replit AI Agent, based on the specific bootstrap guidance provided.

## Overview

The provided CI/CD bootstrap approach focuses on three core components:

1. **Docker-Compose Development Environment**: Creates a consistent, reproducible environment with Flask, PostgreSQL, and Redis
2. **GitHub Actions Workflow**: Implements automated testing, linting, and build processes for every PR
3. **Terraform Infrastructure Setup**: Manages deployment infrastructure for the frontend

## Integration with Existing AI Agent Strategy

This CI/CD implementation complements our existing AI Agent approach by:

1. **Providing Technical Foundation**: Establishes the development and deployment infrastructure needed for all other work
2. **Automating Quality Checks**: Ensures all AI-generated code meets quality standards through automated testing
3. **Standardizing Environments**: Creates consistent environments to prevent "works on my machine" issues
4. **Enabling Continuous Integration**: Allows for rapid iteration with AI-generated code while maintaining quality

## Implementation Steps

### Step 1: Prime the Replit AI Agent

Use this specialized prompt to instruct the Replit AI Agent on CI/CD implementation:

```
You are my DevOps & Developer-Experience Engineer.  
Your mission is Sprint 1 for BCBS:

1. Create a Docker-Compose dev container (Flask + Postgres + Redis).
2. Add a GitHub Actions workflow that on every PR:
   • Checks out code
   • Installs dependencies
   • Runs lint, unit tests, build
   • Uploads artifacts
3. On merges to main, deploy infra via Terraform in infra/frontend.

For each task:
- Open a feature branch (`sprint1/<task-name>`)
- Commit with Conventional Commits (`feat:`, `chore:`, `ci:`)
- Open a PR and report status back here (CI passing, any blockers).
Do not proceed to the next task until I approve the PR.
```

### Step 2: Implement Docker-Compose Environment

Create the docker-compose.yml file and .env.dev file:

#### docker-compose.yml
```yaml
version: '3.8'
services:
  web:
    build: .
    command: flask run --host=0.0.0.0
    volumes:
      - .:/app
    ports:
      - "5000:5000"
    env_file:
      - .env.dev
    depends_on:
      - db
  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: bcbs
      POSTGRES_USER: bcbs
      POSTGRES_PASSWORD: bcbs
  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

#### .env.dev
```
FLASK_APP=app.py
FLASK_ENV=development
DATABASE_URL=postgresql://bcbs:bcbs@db:5432/bcbs
REDIS_URL=redis://redis:6379/0
SECRET_KEY=dev-secret-key-change-in-production
```

After creating these files, commit them to a feature branch `sprint1/docker-setup` and create a PR.

### Step 3: Implement GitHub Actions Workflow

Create the GitHub Actions workflow file:

#### .github/workflows/ci.yml
```yaml
name: CI

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Lint
        run: flake8 .
      - name: Run unit tests
        run: pytest --maxfail=1 --disable-warnings -q
      - name: Build front-end
        working-directory: client
        run: npm ci && npm run build
      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: web-build
          path: client/dist
```

After creating this file, commit it to a feature branch `sprint1/github-ci` and create a PR.

### Step 4: Set Up Terraform Infrastructure

Create the Terraform configuration:

#### infra/frontend/main.tf
```hcl
provider "aws" {
  region = "us-west-2"
}

resource "aws_s3_bucket" "frontend" {
  bucket = "bcbs-frontend-${random_id.suffix.hex}"
  acl    = "public-read"
}

resource "random_id" "suffix" {
  byte_length = 4
}
```

After creating this file, commit it to a feature branch `sprint1/terraform-setup` and create a PR.

## Adapting for TypeScript/Node.js

Since our BCBS project uses TypeScript/Node.js rather than Flask, we'll need to adapt the Docker and CI setup. Here's how the Replit AI Agent can help with this adaptation:

### Step 1: Adapting Docker-Compose

Use this prompt to adapt the Docker-Compose setup:

```
Adapt the Flask-based Docker-Compose setup to work with our TypeScript/Node.js project:

1. Change the web service to use Node.js instead of Flask
2. Configure it to run our TypeScript application
3. Ensure it works with our PostgreSQL database via Supabase
4. Keep the existing database and Redis services

Please provide the updated docker-compose.yml and any additional files needed.
```

### Step 2: Adapting GitHub Actions

Use this prompt to adapt the GitHub Actions workflow:

```
Adapt the GitHub Actions workflow for our TypeScript/Node.js project:

1. Change Python setup to Node.js setup
2. Update dependency installation to use npm/yarn
3. Update the linting to use ESLint
4. Configure testing to use Jest
5. Keep the frontend build steps

Please provide the updated .github/workflows/ci.yml file.
```

### Step 3: Adapting Terraform

Use this prompt to adapt the Terraform configuration:

```
Enhance the Terraform configuration for our TypeScript/Node.js project:

1. Add configuration for a CDN (CloudFront)
2. Set up appropriate S3 bucket policies
3. Configure proper CORS settings
4. Add outputs for the deployed frontend URL

Please provide the updated infra/frontend/main.tf file.
```

## Integration with MCP Framework

Our BCBS project uses the Model Content Protocol (MCP) framework for AI capabilities. Here's how to ensure the CI/CD setup works well with MCP:

### Step 1: MCP Testing in CI

Add these specialized tests to verify MCP functionality:

```yaml
- name: MCP Integration Tests
  run: npm run test:mcp
  env:
    MCP_TEST_MODE: true
```

### Step 2: MCP Agent Deployment

Configure deployment for MCP agents:

```yaml
- name: Deploy MCP Agents
  if: github.ref == 'refs/heads/main'
  run: npm run deploy:mcp
  env:
    MCP_DEPLOY_TOKEN: ${{ secrets.MCP_DEPLOY_TOKEN }}
```

## Best Practices for CI/CD with AI Agent

1. **Incremental Implementation**: Implement one piece at a time and verify before moving on
2. **Thorough Testing**: Ensure all AI-generated code is thoroughly tested in CI
3. **Environment Consistency**: Keep development, CI, and production environments as similar as possible
4. **Security First**: Never commit sensitive data; use environment variables and secrets
5. **Documentation**: Keep documentation updated as CI/CD evolves

## Monitoring and Troubleshooting

1. **CI Results Dashboard**: Set up a dashboard to monitor CI runs
2. **Notification System**: Configure notifications for CI failures
3. **Debug Logs**: Enable detailed logs for troubleshooting
4. **Performance Monitoring**: Track build and test times to identify bottlenecks

## Next Steps After CI/CD Setup

Once the CI/CD infrastructure is in place, we can proceed with:

1. **Implementing Core Features**: Use the AI Agent to implement the Levy-Wizard and other core features
2. **Automated Testing**: Expand test coverage with AI-generated tests
3. **Performance Optimization**: Use the CI/CD pipeline to monitor and improve performance
4. **Continuous Deployment**: Set up automatic deployment to staging environments

## Conclusion

By implementing this CI/CD approach with the Replit AI Agent, we establish a solid foundation for the BCBS project that ensures quality, consistency, and reliability. This infrastructure will make all subsequent development with the AI Agent more efficient and effective.