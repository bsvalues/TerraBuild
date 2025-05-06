# TerraFusion DevOps Kit

A comprehensive DevOps toolkit for deploying, managing, and monitoring the TerraFusion AI infrastructure optimization platform, with a focus on intelligent multi-agent systems.

## 📋 Overview

The TerraFusion DevOps Kit provides a complete set of tools and configurations for managing the TerraFusion platform throughout its lifecycle. It includes:

- Infrastructure as Code (Terraform)
- Continuous Integration/Continuous Deployment (GitHub Actions)
- Docker containerization for all components
- Kubernetes deployment manifests
- Monitoring and observability stack
- Agent management tools
- Security and compliance frameworks

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/benton-county/terrafusion-devops-kit

# Navigate to the repository directory
cd terrafusion-devops-kit

# Install the Agent Configuration Wizard
./scripts/install-agent-wizard.sh

# Deploy all components to development environment
make deploy-all
```

## 🛠️ Components

### Infrastructure as Code (Terraform)

The `terraform/` directory contains Terraform configurations for provisioning cloud infrastructure:

- Network resources (VPC, subnets, security groups)
- Compute resources (Kubernetes clusters, databases)
- Storage resources (object storage, file systems)
- Identity and access management

### CI/CD (GitHub Actions)

The `github-actions/` directory contains workflow definitions for:

- Building and testing backend components
- Building and testing frontend components
- Deploying AI agent swarm
- Security scanning
- Documentation generation

### Docker Containers

The `docker/` directory contains Dockerfiles for:

- Base images for different agent types
- Specialized agent containers
- Backend API services
- Frontend web application

### Kubernetes Manifests

The `k8s-manifests/` directory contains Kubernetes deployment configurations for:

- Agent swarm deployment
- Backend API services
- Frontend application
- Databases and caches
- Monitoring components

### AI Agent Swarm

The `swarm/` directory contains configurations for the AI agent swarm:

- Agent manifest schema and examples
- Agent runner implementation
- Inter-agent communication framework
- Agent lifecycle management

### Monitoring and Observability

The `monitoring/` directory contains configurations for:

- Prometheus for metrics collection
- Grafana for visualization
- Loki for log aggregation
- Jaeger for distributed tracing
- Alert manager for notifications

### Tools

The `tools/` directory contains utility tools for managing the platform:

- **Agent Configuration Wizard**: User-friendly tool for configuring and deploying AI agents
- Secrets rotation utilities
- Database migration tools
- Performance benchmarking utilities

## 📚 Usage

### Agent Configuration Wizard

The Agent Configuration Wizard provides a user-friendly interface for configuring and managing AI agents:

```bash
# Launch the interactive wizard
agentctl wizard

# Validate an agent manifest
agentctl validate

# List configured agents
agentctl list

# Check agent status
agentctl status

# Deploy agents
agentctl deploy
```

See the [Agent Configuration Wizard documentation](tools/agent-wizard/README.md) for more details.

### Deploying with Make

The Makefile provides a unified interface for DevOps operations:

```bash
# Initialize Terraform
make init

# Deploy backend
make deploy-backend

# Deploy frontend
make deploy-frontend

# Deploy agents
make deploy-agents

# Deploy all components
make deploy-all
```

Run `make help` to see all available commands.

## 🔐 Security

The DevOps Kit includes security best practices:

- Secrets management with HashiCorp Vault
- Network security policies
- RBAC configurations
- Vulnerability scanning
- Compliance checks

## 📊 Monitoring

The monitoring stack provides comprehensive visibility into the system:

- Real-time agent performance metrics
- Resource utilization
- API response times
- Error rates
- User activity

## 🧪 Testing

The DevOps Kit includes testing frameworks for:

- Unit testing of agent components
- Integration testing of agent interactions
- End-to-end testing of workflows
- Load testing of APIs
- Security scanning

## 📝 Documentation

Comprehensive documentation is available:

- [Installation Guide](docs/installation.md)
- [Deployment Guide](docs/deployment.md)
- [Agent Development Guide](docs/agent-development.md)
- [Monitoring Guide](docs/monitoring.md)
- [Security Guide](docs/security.md)

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.