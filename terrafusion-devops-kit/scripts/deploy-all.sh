#!/bin/bash
# TerraFusion Complete Deployment Script
# Deploys the entire TerraFusion infrastructure, including backend, frontend, and AI agents

set -euo pipefail

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
VERSION="latest"
FORCE_AGENTS=false
SKIP_TERRAFORM=false
SKIP_HELM=false
SKIP_AGENTS=false
SKIP_FRONTEND=false
SKIP_BACKEND=false

# Function to display usage information
function show_usage() {
  echo -e "${BLUE}TerraFusion Deployment Script${NC}"
  echo -e "Deploy the complete TerraFusion infrastructure stack"
  echo ""
  echo -e "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment ENV     Target environment: dev, staging, prod (default: dev)"
  echo "  -v, --version VERSION     Version to deploy (default: latest)"
  echo "  -f, --force-agents        Force agent retraining"
  echo "  --skip-terraform          Skip Terraform infrastructure deployment"
  echo "  --skip-helm               Skip Helm chart deployment"
  echo "  --skip-agents             Skip agent deployment"
  echo "  --skip-frontend           Skip frontend deployment"
  echo "  --skip-backend            Skip backend deployment"
  echo "  -h, --help                Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --environment prod --version v1.2.3"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -v|--version)
      VERSION="$2"
      shift
      shift
      ;;
    -f|--force-agents)
      FORCE_AGENTS=true
      shift
      ;;
    --skip-terraform)
      SKIP_TERRAFORM=true
      shift
      ;;
    --skip-helm)
      SKIP_HELM=true
      shift
      ;;
    --skip-agents)
      SKIP_AGENTS=true
      shift
      ;;
    --skip-frontend)
      SKIP_FRONTEND=true
      shift
      ;;
    --skip-backend)
      SKIP_BACKEND=true
      shift
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option $key${NC}"
      show_usage
      exit 1
      ;;
  esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  echo -e "${RED}Error: Environment must be one of: dev, staging, prod${NC}"
  exit 1
fi

# Display deployment plan
echo -e "${BLUE}=== TerraFusion Deployment Plan ===${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Version: ${GREEN}$VERSION${NC}"
echo -e "Force Agent Retraining: ${GREEN}$FORCE_AGENTS${NC}"
echo ""
echo -e "Components to deploy:"
[ "$SKIP_TERRAFORM" = false ] && echo -e "- ${GREEN}Infrastructure (Terraform)${NC}" || echo -e "- ${YELLOW}Infrastructure (SKIPPED)${NC}"
[ "$SKIP_HELM" = false ] && echo -e "- ${GREEN}Core Services (Helm)${NC}" || echo -e "- ${YELLOW}Core Services (SKIPPED)${NC}"
[ "$SKIP_BACKEND" = false ] && echo -e "- ${GREEN}Backend${NC}" || echo -e "- ${YELLOW}Backend (SKIPPED)${NC}"
[ "$SKIP_FRONTEND" = false ] && echo -e "- ${GREEN}Frontend${NC}" || echo -e "- ${YELLOW}Frontend (SKIPPED)${NC}"
[ "$SKIP_AGENTS" = false ] && echo -e "- ${GREEN}AI Agents${NC}" || echo -e "- ${YELLOW}AI Agents (SKIPPED)${NC}"

echo ""
read -p "Continue with deployment? (y/n): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Deployment aborted by user${NC}"
  exit 0
fi

# Set AWS region based on environment
case $ENVIRONMENT in
  dev)
    AWS_REGION=${AWS_REGION:-us-west-2}
    ;;
  staging)
    AWS_REGION=${AWS_REGION:-us-west-2}
    ;;
  prod)
    AWS_REGION=${AWS_REGION:-us-west-2}
    ;;
esac

# Check for required credentials and tools
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check AWS credentials
if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  echo -e "${YELLOW}Warning: AWS credentials not found in environment variables.${NC}"
  echo -e "${YELLOW}Attempting to use AWS CLI configuration or instance profile...${NC}"
fi

# Check required tools
for cmd in aws kubectl terraform helm jq; do
  if ! command -v $cmd &> /dev/null; then
    echo -e "${RED}Error: Required command '$cmd' not found${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✓ Prerequisites check passed${NC}"

# Deploy Infrastructure using Terraform
if [ "$SKIP_TERRAFORM" = false ]; then
  echo -e "${BLUE}=== Deploying Infrastructure with Terraform ===${NC}"
  
  cd ../terraform
  
  # Initialize Terraform with environment-specific backend config
  echo -e "${YELLOW}Initializing Terraform...${NC}"
  terraform init -backend-config=environments/${ENVIRONMENT}.tfbackend
  
  # Select or create workspace
  echo -e "${YELLOW}Selecting workspace for ${ENVIRONMENT}...${NC}"
  terraform workspace select ${ENVIRONMENT} || terraform workspace new ${ENVIRONMENT}
  
  # Create a variables file for this deployment
  cat > deployment.auto.tfvars <<EOF
deployment_version = "${VERSION}"
deployment_timestamp = "$(date +%s)"
force_agent_retrain = ${FORCE_AGENTS}
EOF
  
  # Plan and apply changes
  echo -e "${YELLOW}Planning Terraform changes...${NC}"
  terraform plan -var-file=environments/${ENVIRONMENT}.tfvars -out=tfplan
  
  echo -e "${YELLOW}Applying Terraform changes...${NC}"
  terraform apply -auto-approve tfplan
  
  # Get EKS cluster info
  echo -e "${YELLOW}Configuring kubectl for EKS cluster...${NC}"
  aws eks update-kubeconfig --name terrafusion-${ENVIRONMENT} --region ${AWS_REGION}
  
  echo -e "${GREEN}✓ Infrastructure deployment complete${NC}"
else
  echo -e "${YELLOW}Skipping Terraform infrastructure deployment${NC}"
  
  # Still need kubectl configuration
  echo -e "${YELLOW}Configuring kubectl for EKS cluster...${NC}"
  aws eks update-kubeconfig --name terrafusion-${ENVIRONMENT} --region ${AWS_REGION}
fi

# Deploy core services with Helm
if [ "$SKIP_HELM" = false ]; then
  echo -e "${BLUE}=== Deploying Core Services with Helm ===${NC}"
  
  cd ../helm
  
  # Deploy monitoring stack
  echo -e "${YELLOW}Deploying monitoring stack...${NC}"
  helm upgrade --install prometheus-stack prometheus-community/kube-prometheus-stack \
    --namespace monitoring --create-namespace \
    --values ./monitoring-values.yaml
  
  # Deploy logging stack
  echo -e "${YELLOW}Deploying logging stack...${NC}"
  helm upgrade --install loki grafana/loki-stack \
    --namespace monitoring \
    --values ./loki-values.yaml
  
  # Deploy Vault for secrets management
  echo -e "${YELLOW}Deploying Vault...${NC}"
  helm upgrade --install vault hashicorp/vault \
    --namespace vault --create-namespace \
    --values ./vault-values.yaml
  
  # Deploy API Gateway
  echo -e "${YELLOW}Deploying API Gateway...${NC}"
  helm upgrade --install kong kong/kong \
    --namespace api-gateway --create-namespace \
    --values ./kong-values.yaml
  
  echo -e "${GREEN}✓ Core services deployment complete${NC}"
else
  echo -e "${YELLOW}Skipping Helm charts deployment${NC}"
fi

# Deploy Backend
if [ "$SKIP_BACKEND" = false ]; then
  echo -e "${BLUE}=== Deploying Backend ===${NC}"
  
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  ECR_REPOSITORY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/terrafusion-backend
  
  # Update backend kubernetes deployment
  echo -e "${YELLOW}Updating backend deployment...${NC}"
  kubectl set image deployment/terrafusion-backend backend=${ECR_REPOSITORY}:${VERSION} -n default
  
  # Wait for rollout to complete
  echo -e "${YELLOW}Waiting for backend rollout to complete...${NC}"
  kubectl rollout status deployment/terrafusion-backend -n default --timeout=300s
  
  echo -e "${GREEN}✓ Backend deployment complete${NC}"
else
  echo -e "${YELLOW}Skipping backend deployment${NC}"
fi

# Deploy Frontend
if [ "$SKIP_FRONTEND" = false ]; then
  echo -e "${BLUE}=== Deploying Frontend ===${NC}"
  
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  ECR_REPOSITORY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/terrafusion-frontend
  
  # Update frontend kubernetes deployment
  echo -e "${YELLOW}Updating frontend deployment...${NC}"
  kubectl set image deployment/terrafusion-frontend frontend=${ECR_REPOSITORY}:${VERSION} -n default
  
  # Wait for rollout to complete
  echo -e "${YELLOW}Waiting for frontend rollout to complete...${NC}"
  kubectl rollout status deployment/terrafusion-frontend -n default --timeout=300s
  
  echo -e "${GREEN}✓ Frontend deployment complete${NC}"
else
  echo -e "${YELLOW}Skipping frontend deployment${NC}"
fi

# Deploy AI Agents
if [ "$SKIP_AGENTS" = false ]; then
  echo -e "${BLUE}=== Deploying AI Agents ===${NC}"
  
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  
  # Get list of agents to deploy
  AGENTS=("factor-tuner" "benchmark-guard" "curve-trainer" "scenario-agent" "boe-arguer")
  
  for agent in "${AGENTS[@]}"; do
    ECR_REPOSITORY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/terrafusion-${agent}
    
    echo -e "${YELLOW}Deploying ${agent} agent...${NC}"
    
    # Update agent deployment if it exists
    if kubectl get deployment ${agent} -n terrafusion-agents &>/dev/null; then
      kubectl set image deployment/${agent} ${agent}=${ECR_REPOSITORY}:${VERSION} -n terrafusion-agents
      kubectl rollout status deployment/${agent} -n terrafusion-agents --timeout=300s
    else
      # Otherwise deploy new agent from template
      echo -e "${YELLOW}Deployment for ${agent} not found, creating from template...${NC}"
      envsubst < ../k8s-manifests/agents/${agent}.yaml | kubectl apply -f -
    fi
    
    echo -e "${GREEN}✓ ${agent} agent deployment complete${NC}"
  done
  
  # If force retraining is enabled, trigger agent retraining
  if [ "$FORCE_AGENTS" = true ]; then
    echo -e "${YELLOW}Triggering agent retraining...${NC}"
    # Get API Gateway URL
    API_GATEWAY=$(kubectl get service -n api-gateway kong-kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    # Trigger retraining for each agent
    for agent in "${AGENTS[@]}"; do
      echo -e "${YELLOW}Retraining ${agent}...${NC}"
      curl -X POST "http://${API_GATEWAY}/api/agents/${agent}/retrain" \
        -H "Content-Type: application/json" \
        -d '{"force": true}'
    done
  fi
  
  echo -e "${GREEN}✓ AI Agents deployment complete${NC}"
else
  echo -e "${YELLOW}Skipping AI agents deployment${NC}"
fi

# Print deployment summary
echo -e "\n${BLUE}=== Deployment Summary ===${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Version: ${GREEN}$VERSION${NC}"

# Get application URLs
if kubectl get ingress terrafusion-ingress -n default &>/dev/null; then
  APP_URL=$(kubectl get ingress terrafusion-ingress -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
  echo -e "Application URL: ${GREEN}https://${APP_URL}${NC}"
fi

# Get monitoring URLs
if kubectl get ingress -n monitoring grafana-ingress &>/dev/null; then
  MONITORING_URL=$(kubectl get ingress -n monitoring grafana-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
  echo -e "Monitoring Dashboard: ${GREEN}https://${MONITORING_URL}${NC}"
fi

echo -e "\n${GREEN}✓ TerraFusion deployment completed successfully!${NC}"