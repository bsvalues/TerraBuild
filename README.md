# TerraBuild - Benton County Infrastructure Cost Management Platform

TerraBuild is a sophisticated SaaS platform for infrastructure cost management and deployment optimization in Benton County, Washington. The platform leverages advanced data analytics and machine learning to streamline infrastructure lifecycle management.

## 📋 Table of Contents

- [Features](#features)
- [Technical Stack](#technical-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
- [DevOps Setup](#devops-setup)
  - [Infrastructure](#infrastructure)
  - [CI/CD Pipeline](#cicd-pipeline)
  - [Deployment](#deployment)
  - [Monitoring](#monitoring)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Features

- Advanced cost calculation algorithms
- Property assessment and valuation
- Multi-agent Cognitive Processing (MCP) framework
- Geospatial analysis tools
- Comprehensive reporting and analytics

## 💻 Technical Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Infrastructure**: AWS (ECS, RDS, VPC, CloudWatch)
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **IaC**: Terraform

## 🏁 Getting Started

### Prerequisites

- Node.js (v20+)
- PostgreSQL
- AWS CLI (for deployment)
- Terraform (for infrastructure management)
- Docker and Docker Compose (for containerized development)

### Installation

1. Clone the repository

```bash
git clone https://github.com/benton-county/terrabuild.git
cd terrabuild
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database

```bash
npm run db:push
```

### Development

1. Start the development server

```bash
npm run dev
```

2. Or use Docker Compose for a containerized development environment

```bash
docker-compose up
```

## 🛠️ DevOps Setup

### Infrastructure

The infrastructure is defined using Terraform and organized into modules:

- **Network**: VPC, subnets, security groups
- **Database**: RDS PostgreSQL instance
- **ECS**: Container service for application deployment
- **Monitoring**: CloudWatch dashboards and alerts

```bash
# Initialize and apply Terraform configuration
cd terraform/environments/dev
terraform init
terraform apply
```

### CI/CD Pipeline

The CI/CD pipeline is implemented using GitHub Actions and defined in `.github/workflows/ci.yml`. It includes the following stages:

1. **Build and Test**: Builds the application and runs tests
2. **Security Scan**: Performs security scans on the code and dependencies
3. **Infrastructure Validation**: Validates the Terraform configuration
4. **Deployment**: Deploys the application to AWS based on the branch (dev/prod)

### Deployment

Deployment is handled by the `scripts/deploy.sh` script which:

1. Applies Terraform infrastructure changes
2. Builds and pushes a Docker image to ECR
3. Updates the ECS service with the new image

```bash
# Deploy to the development environment
./scripts/deploy.sh --env dev

# Deploy to the production environment
./scripts/deploy.sh --env prod
```

### Monitoring

Monitoring is set up using AWS CloudWatch with dashboards and alerts for:

- CPU and memory utilization
- Database metrics
- HTTP error rates
- Application-specific metrics

## 👥 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.