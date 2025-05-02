# TerraFusion DevOps Kit

This DevOps Kit provides a comprehensive set of tools and infrastructure configurations to operationalize the TerraFusion AI-Agents system for Benton County's infrastructure optimization platform.

## 🚀 Getting Started

The DevOps Kit is organized in the `terrafusion-devops-kit` directory and contains everything needed to deploy, monitor, and manage the TerraFusion platform and its AI Agents.

### Prerequisites

- AWS account with appropriate permissions
- Kubernetes cluster (EKS) or ability to create one
- Terraform >= 1.0.0
- kubectl
- Helm >= 3.0
- Docker
- jq
- AWS CLI
- Basic understanding of Kubernetes, Terraform, and CI/CD concepts

### DevOps Kit Structure

```
terrafusion-devops-kit/
├── README.md                   # DevOps Kit overview
├── terraform/                  # Infrastructure as Code definitions
│   ├── main.tf                 # Main Terraform configuration
│   ├── variables.tf            # Input variables
│   └── outputs.tf              # Output values
├── helm/                       # Helm charts for Kubernetes
│   ├── terrafusion-backend/
│   ├── terrafusion-frontend/
│   └── swarm-agents/
├── docker/                     # Dockerfile templates
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── agent-base.Dockerfile
├── github-actions/             # CI/CD workflow definitions
│   ├── backend.yml             # Backend build & deploy workflow
│   ├── frontend.yml            # Frontend build & deploy workflow
│   └── swarm.yml               # AI Agent build & deploy workflow
├── k8s-manifests/              # Kubernetes manifest templates
│   ├── ingress.yaml
│   ├── agents-deployment.yaml
│   └── services.yaml
├── secrets/                    # Vault templates & configs
│   └── vault-templates.hcl
├── observability/              # Monitoring & logging configs
│   ├── loki.yaml
│   ├── prom-config.yaml
│   └── grafana-dashboards/
│       └── swarm-agent-activity.json
└── scripts/                    # Utility scripts
    ├── deploy-all.sh           # Full deployment script
    ├── update-agents.sh        # Agent-specific update script
    └── rotate-secrets.sh       # Secret rotation script
```

## 🔧 Common Tasks

### Deploying the Complete Stack

To deploy the entire TerraFusion platform, including infrastructure, services, and AI agents:

```bash
cd terrafusion-devops-kit
./scripts/deploy-all.sh --environment dev
```

This will:
1. Set up the AWS infrastructure using Terraform
2. Deploy Kubernetes resources using Helm
3. Deploy the backend and frontend applications
4. Deploy all AI agents

For production deployments:

```bash
./scripts/deploy-all.sh --environment prod --version v1.2.3
```

### Managing AI Agents

To update, restart, check status, or view logs for specific AI agents:

```bash
# Update specific agents
./scripts/update-agents.sh --agent factor-tuner --agent benchmark-guard --version v1.1.0

# Restart an agent
./scripts/update-agents.sh --agent curve-trainer --action restart

# Check agent status
./scripts/update-agents.sh --agent boe-arguer --action status

# View agent logs
./scripts/update-agents.sh --agent scenario-agent --action logs

# Force retrain an agent
./scripts/update-agents.sh --agent factor-tuner --action retrain
```

### Rotating Secrets

For security, regularly rotate secrets and API keys:

```bash
# Rotate OpenAI API key
./scripts/rotate-secrets.sh --type ai-key --name openai --value "sk-yourapikeyhere"

# Generate a new agent API key
./scripts/rotate-secrets.sh --type agent-key --name factor-tuner

# Rotate database password
./scripts/rotate-secrets.sh --type db-password --name terrafusion
```

## 🔄 CI/CD Pipelines

The DevOps Kit includes GitHub Actions workflows for continuous integration and deployment:

### Backend Pipeline (`github-actions/backend.yml`)

- Triggers on changes to server code
- Runs tests, security scans, and builds Docker image
- Deploys to the appropriate environment

### Frontend Pipeline (`github-actions/frontend.yml`)

- Triggers on changes to client code
- Builds, tests, and deploys the frontend application

### AI Agent Pipeline (`github-actions/swarm.yml`)

- Builds and deploys AI agent containers
- Supports selective agent updates
- Includes testing and validation for agents

## 📊 Monitoring & Observability

The DevOps Kit includes comprehensive monitoring with:

- Prometheus for metrics collection
- Loki for centralized logging
- Grafana dashboards for visualization
- Custom agent telemetry dashboards

Access the monitoring dashboard at:
`https://grafana.terrafusion-{environment}.example.com`

## 🔒 Security & Compliance

Security is built into the DevOps Kit:

- Vault for secrets management and rotation
- Network policies to restrict agent communication
- RBAC for Kubernetes resources
- Regular security scanning in CI pipeline
- Container hardening best practices

## 🌐 Infrastructure Management

The infrastructure is defined as code using Terraform:

- EKS cluster with node groups for applications and AI workloads
- RDS PostgreSQL for application data
- ECR repositories for container images
- VPC networking and security groups
- IAM roles and service accounts

## 📚 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Vault Documentation](https://www.vaultproject.io/docs)
- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)