#!/bin/bash
# TerraFusion All-in-One Deployment Script
# Deploys the entire TerraFusion platform to the specified environment

set -e

# Default values
ENVIRONMENT="dev"
TARGET_COMPONENTS="all"
SKIP_CONFIRMATION=false
SKIP_TESTS=false
FORCE_AGENT_RETRAIN=false
VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

# Display help information
function show_help {
  echo "TerraFusion All-in-One Deployment Script"
  echo
  echo "Usage: $0 [options]"
  echo
  echo "Options:"
  echo "  -h, --help                   Show this help message"
  echo "  -e, --environment ENV        Target environment (dev, staging, prod) [default: dev]"
  echo "  -c, --components COMPONENTS  Components to deploy (all, backend, frontend, agents) [default: all]"
  echo "  -v, --version VERSION        Version to deploy [default: git commit hash]"
  echo "  -s, --skip-tests             Skip test execution"
  echo "  -y, --yes                    Skip all confirmations"
  echo "  -r, --retrain-agents         Force retraining of AI agents"
  echo
  echo "Examples:"
  echo "  $0 --environment prod                  # Deploy everything to production"
  echo "  $0 --environment dev --components backend,frontend # Deploy only backend and frontend to dev"
  echo "  $0 -e staging -c agents -r            # Deploy and retrain agents in staging"
  echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -c|--components)
      TARGET_COMPONENTS="$2"
      shift 2
      ;;
    -v|--version)
      VERSION="$2"
      shift 2
      ;;
    -s|--skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    -y|--yes)
      SKIP_CONFIRMATION=true
      shift
      ;;
    -r|--retrain-agents)
      FORCE_AGENT_RETRAIN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
  echo "Error: Invalid environment. Must be one of: dev, staging, prod"
  exit 1
fi

# Validate components
IFS=',' read -ra COMPONENTS <<< "$TARGET_COMPONENTS"
VALID_COMPONENTS=("all" "backend" "frontend" "agents" "db" "infra")
for component in "${COMPONENTS[@]}"; do
  if [[ ! " ${VALID_COMPONENTS[*]} " =~ " ${component} " ]]; then
    echo "Error: Invalid component: $component. Valid options: ${VALID_COMPONENTS[*]}"
    exit 1
  fi
done

# Determine the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." &>/dev/null && pwd)"

# Confirm deployment
if [ "$SKIP_CONFIRMATION" = false ]; then
  echo "=========================================================="
  echo "TerraFusion Deployment"
  echo "=========================================================="
  echo "Environment: $ENVIRONMENT"
  echo "Components: $TARGET_COMPONENTS"
  echo "Version: $VERSION"
  echo "Skip tests: $SKIP_TESTS"
  echo "Force agent retraining: $FORCE_AGENT_RETRAIN"
  echo "=========================================================="
  
  read -p "Do you want to proceed with this deployment? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
  fi
fi

echo "Starting deployment to $ENVIRONMENT environment..."

# Set AWS region based on environment
case "$ENVIRONMENT" in
  "dev"|"staging")
    AWS_REGION="us-west-2"
    ;;
  "prod")
    AWS_REGION="us-west-2"
    ;;
esac

# Ensure AWS is configured correctly
echo "Validating AWS credentials..."
aws sts get-caller-identity >/dev/null || {
  echo "Error: AWS credentials not configured or insufficient permissions."
  exit 1
}

# Check if kubectl is configured for the target cluster
echo "Validating kubectl configuration..."
if ! kubectl config use-context "terrafusion-$ENVIRONMENT" 2>/dev/null; then
  echo "Configuring kubectl for terrafusion-$ENVIRONMENT..."
  aws eks update-kubeconfig --name "terrafusion-$ENVIRONMENT" --region "$AWS_REGION"
fi

# Run tests if not skipped
if [ "$SKIP_TESTS" = false ]; then
  echo "Running tests..."
  cd "$PROJECT_ROOT" && npm test || {
    echo "Tests failed. Aborting deployment."
    exit 1
  }
fi

# Function to deploy infrastructure
deploy_infrastructure() {
  echo "Deploying infrastructure..."
  cd "$PROJECT_ROOT/terrafusion-devops-kit/terraform"
  
  terraform init -backend-config="environments/$ENVIRONMENT.tfbackend"
  
  # Select or create workspace
  if ! terraform workspace select "$ENVIRONMENT" 2>/dev/null; then
    terraform workspace new "$ENVIRONMENT"
  fi
  
  # Plan and apply
  terraform plan -var-file="environments/$ENVIRONMENT.tfvars" -out=tfplan
  terraform apply tfplan
  
  echo "Infrastructure deployment completed."
}

# Function to deploy backend
deploy_backend() {
  echo "Deploying backend services..."
  
  # Trigger GitHub Actions workflow
  gh workflow run backend.yml -f environment="$ENVIRONMENT"
  
  echo "Backend deployment triggered."
}

# Function to deploy frontend
deploy_frontend() {
  echo "Deploying frontend application..."
  
  # Trigger GitHub Actions workflow
  gh workflow run frontend.yml -f environment="$ENVIRONMENT"
  
  echo "Frontend deployment triggered."
}

# Function to deploy agents
deploy_agents() {
  echo "Deploying AI agents..."
  
  local retrain_param=""
  if [ "$FORCE_AGENT_RETRAIN" = true ]; then
    retrain_param="-f forceRetrain=true"
  fi
  
  # Trigger GitHub Actions workflow
  gh workflow run swarm.yml -f environment="$ENVIRONMENT" $retrain_param
  
  echo "Agent deployment triggered."
}

# Function to deploy database
deploy_database() {
  echo "Deploying database..."
  
  # Apply database-specific resources
  cd "$PROJECT_ROOT/terrafusion-devops-kit/terraform"
  terraform apply -var-file="environments/$ENVIRONMENT.tfvars" -target=module.db
  
  echo "Database deployment completed."
}

# Deploy components based on selection
if [[ "$TARGET_COMPONENTS" == "all" ]]; then
  deploy_infrastructure
  deploy_database
  deploy_backend
  deploy_frontend
  deploy_agents
else
  for component in "${COMPONENTS[@]}"; do
    case "$component" in
      "infra")
        deploy_infrastructure
        ;;
      "db")
        deploy_database
        ;;
      "backend")
        deploy_backend
        ;;
      "frontend")
        deploy_frontend
        ;;
      "agents")
        deploy_agents
        ;;
    esac
  done
fi

echo "Verifying deployments..."

# Function to check deployment status
check_deployment() {
  local deployment=$1
  local namespace=$2
  
  kubectl rollout status deployment/"$deployment" -n "$namespace" --timeout=60s
}

# Check component deployments
if [[ "$TARGET_COMPONENTS" == "all" || "$TARGET_COMPONENTS" == *"backend"* ]]; then
  check_deployment "terrafusion-backend" "default"
fi

if [[ "$TARGET_COMPONENTS" == "all" || "$TARGET_COMPONENTS" == *"frontend"* ]]; then
  check_deployment "terrafusion-frontend" "default"
fi

if [[ "$TARGET_COMPONENTS" == "all" || "$TARGET_COMPONENTS" == *"agents"* ]]; then
  # Check agent deployments
  for agent in "factor-tuner" "benchmark-guard" "curve-trainer" "scenario-agent" "boe-arguer"; do
    check_deployment "$agent" "terrafusion-agents"
  done
fi

echo "Deployment completed successfully!"
echo "Service endpoints:"

# Get service endpoints
if [[ "$TARGET_COMPONENTS" == "all" || "$TARGET_COMPONENTS" == *"backend"* ]]; then
  BACKEND_URL=$(kubectl get service terrafusion-backend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
  echo "Backend API: http://$BACKEND_URL"
fi

if [[ "$TARGET_COMPONENTS" == "all" || "$TARGET_COMPONENTS" == *"frontend"* ]]; then
  FRONTEND_URL=$(kubectl get service terrafusion-frontend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
  echo "Frontend: http://$FRONTEND_URL"
fi