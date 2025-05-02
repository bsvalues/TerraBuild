#!/bin/bash
# TerraFusion AI Agent Update Script
# Updates one or more AI agents in the specified environment

set -e

# Default values
ENVIRONMENT="dev"
AGENT_LIST="all"
FORCE_RETRAIN=false
SKIP_TESTS=false
SKIP_CONFIRMATION=false
ONLY_RETRAIN=false
VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

# Display help information
function show_help {
  echo "TerraFusion AI Agent Update Script"
  echo
  echo "Usage: $0 [options]"
  echo
  echo "Options:"
  echo "  -h, --help                Show this help message"
  echo "  -e, --environment ENV     Target environment (dev, staging, prod) [default: dev]"
  echo "  -a, --agents AGENTS       Agents to update (comma-separated, all for all agents) [default: all]"
  echo "  -v, --version VERSION     Version to deploy [default: git commit hash]"
  echo "  -r, --retrain             Force retraining of agents"
  echo "  -s, --skip-tests          Skip test execution"
  echo "  -y, --yes                 Skip all confirmations"
  echo "  -t, --only-retrain        Only retrain agents without updating their code"
  echo
  echo "Examples:"
  echo "  $0 --environment prod                   # Update all agents in production"
  echo "  $0 --environment dev --agents factor-tuner,benchmark-guard # Update only specific agents in dev"
  echo "  $0 -e staging -a curve-trainer -r       # Update and retrain the curve-trainer agent in staging"
  echo "  $0 -e dev -t -a all                    # Only retrain all agents in dev without deploying new code"
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
    -a|--agents)
      AGENT_LIST="$2"
      shift 2
      ;;
    -v|--version)
      VERSION="$2"
      shift 2
      ;;
    -r|--retrain)
      FORCE_RETRAIN=true
      shift
      ;;
    -s|--skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    -y|--yes)
      SKIP_CONFIRMATION=true
      shift
      ;;
    -t|--only-retrain)
      ONLY_RETRAIN=true
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

# Get the list of all available agents
AVAILABLE_AGENTS=("factor-tuner" "benchmark-guard" "curve-trainer" "scenario-agent" "boe-arguer")
AVAILABLE_AGENTS_STR=$(printf ", %s" "${AVAILABLE_AGENTS[@]}")
AVAILABLE_AGENTS_STR=${AVAILABLE_AGENTS_STR:2}

# Validate agents
if [[ "$AGENT_LIST" != "all" ]]; then
  IFS=',' read -ra AGENTS <<< "$AGENT_LIST"
  for agent in "${AGENTS[@]}"; do
    if [[ ! " ${AVAILABLE_AGENTS[*]} " =~ " ${agent} " ]]; then
      echo "Error: Invalid agent: $agent. Valid options: ${AVAILABLE_AGENTS_STR}"
      exit 1
    fi
  done
else
  # If "all" is specified, use all available agents
  AGENTS=("${AVAILABLE_AGENTS[@]}")
fi

# Set AWS region based on environment
case "$ENVIRONMENT" in
  "dev"|"staging")
    AWS_REGION="us-west-2"
    ;;
  "prod")
    AWS_REGION="us-west-2"
    ;;
esac

# Determine the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." &>/dev/null && pwd)"

# Confirm update
if [ "$SKIP_CONFIRMATION" = false ]; then
  echo "=========================================================="
  echo "TerraFusion AI Agent Update"
  echo "=========================================================="
  echo "Environment: $ENVIRONMENT"
  echo "Agents: ${AGENT_LIST}"
  echo "Version: $VERSION"
  echo "Force retrain: $FORCE_RETRAIN"
  echo "Only retrain (no code update): $ONLY_RETRAIN"
  echo "Skip tests: $SKIP_TESTS"
  echo "=========================================================="
  
  read -p "Do you want to proceed with this update? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Update cancelled."
    exit 0
  fi
fi

echo "Starting AI agent update to $ENVIRONMENT environment..."

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
if [ "$SKIP_TESTS" = false ] && [ "$ONLY_RETRAIN" = false ]; then
  echo "Running agent tests..."
  cd "$PROJECT_ROOT"
  
  for agent in "${AGENTS[@]}"; do
    echo "Testing $agent..."
    npm run test:agent -- --agent="$agent" || {
      echo "Tests failed for $agent. Aborting update."
      exit 1
    }
  done
fi

# If we're only retraining, skip the deployment part
if [ "$ONLY_RETRAIN" = false ]; then
  # Trigger the GitHub Actions workflow for agent update
  echo "Triggering agent deployment workflow..."
  
  AGENT_PARAM=""
  if [[ "$AGENT_LIST" != "all" ]]; then
    AGENT_PARAM="-f agentFilter=${AGENT_LIST}"
  fi
  
  RETRAIN_PARAM=""
  if [ "$FORCE_RETRAIN" = true ]; then
    RETRAIN_PARAM="-f forceRetrain=true"
  fi
  
  gh workflow run swarm.yml -f environment="$ENVIRONMENT" $AGENT_PARAM $RETRAIN_PARAM
  
  echo "Agent deployment workflow triggered."
  
  # Wait for deployments to start
  echo "Waiting for deployment to begin (30s)..."
  sleep 30
  
  # Check deployment status for each agent
  for agent in "${AGENTS[@]}"; do
    echo "Checking deployment status for $agent..."
    kubectl rollout status deployment/"$agent" -n terrafusion-agents --timeout=300s || {
      echo "Deployment failed for $agent."
      exit 1
    }
  done
else
  # If only retraining, trigger the retraining API for each agent
  echo "Triggering agent retraining (without code update)..."
  
  # Get the API gateway URL
  API_GATEWAY=$(kubectl get service -n api-gateway kong-kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
  
  if [ -z "$API_GATEWAY" ]; then
    echo "Error: Cannot find API gateway service. Make sure the API gateway is deployed."
    exit 1
  fi
  
  # Get API token from secret
  API_TOKEN=$(kubectl get secret terrafusion-api-credentials -n terrafusion-agents -o jsonpath='{.data.api_token}' 2>/dev/null | base64 --decode)
  
  if [ -z "$API_TOKEN" ]; then
    echo "Error: Cannot retrieve API token. Make sure terrafusion-api-credentials secret exists."
    exit 1
  fi
  
  # Trigger retraining for each agent
  for agent in "${AGENTS[@]}"; do
    echo "Triggering retraining for $agent..."
    curl -X POST "http://${API_GATEWAY}/api/agents/${agent}/retrain" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${API_TOKEN}" \
      -d '{"force": true}'
    
    echo
  done
fi

echo "Agent update process completed!"

# Get pod status for each agent
echo "Current agent pod status:"
kubectl get pods -n terrafusion-agents -l role=agent -o wide

# View agent logs if requested
if [ "$SKIP_CONFIRMATION" = false ]; then
  read -p "Do you want to view the logs for any of the updated agents? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    PS3="Select an agent to view logs (or 0 to exit): "
    select agent in "${AGENTS[@]}" "Exit"; do
      if [ "$agent" = "Exit" ] || [ -z "$agent" ]; then
        break
      fi
      
      POD=$(kubectl get pods -n terrafusion-agents -l app="$agent" -o jsonpath='{.items[0].metadata.name}')
      if [ -n "$POD" ]; then
        kubectl logs -f "$POD" -n terrafusion-agents
      else
        echo "No pod found for $agent"
      fi
      break
    done
  fi
fi