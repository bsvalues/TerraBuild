#!/bin/bash
# TerraFusion AI Agent Update Script
# Updates and manages AI agents in the Kubernetes cluster

set -euo pipefail

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
AGENTS=()
VERSION="latest"
FORCE_RETRAIN=false
ACTION="update"
SKIP_CONFIRMATION=false

# Function to display usage information
function show_usage() {
  echo -e "${BLUE}TerraFusion AI Agent Management Script${NC}"
  echo -e "Manage AI Agents in the TerraFusion platform"
  echo ""
  echo -e "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment ENV     Target environment: dev, staging, prod (default: dev)"
  echo "  -a, --agent AGENT         Specific agent to manage (can be used multiple times)"
  echo "                            Available: factor-tuner, benchmark-guard, curve-trainer,"
  echo "                                      scenario-agent, boe-arguer, all"
  echo "  -v, --version VERSION     Version to deploy (default: latest)"
  echo "  -f, --force-retrain       Force agent retraining after update"
  echo "  --action ACTION           Action to perform: update, restart, status, logs, retrain"
  echo "  -y, --yes                 Skip confirmation prompt"
  echo "  -h, --help                Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --agent factor-tuner --agent benchmark-guard --action restart"
  echo "  $0 --agent all --force-retrain"
  echo "  $0 --agent curve-trainer --action logs"
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
    -a|--agent)
      if [[ "$2" == "all" ]]; then
        AGENTS=("factor-tuner" "benchmark-guard" "curve-trainer" "scenario-agent" "boe-arguer")
      else
        AGENTS+=("$2")
      fi
      shift
      shift
      ;;
    -v|--version)
      VERSION="$2"
      shift
      shift
      ;;
    -f|--force-retrain)
      FORCE_RETRAIN=true
      shift
      ;;
    --action)
      ACTION="$2"
      shift
      shift
      ;;
    -y|--yes)
      SKIP_CONFIRMATION=true
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

# Validate action
if [[ ! "$ACTION" =~ ^(update|restart|status|logs|retrain)$ ]]; then
  echo -e "${RED}Error: Action must be one of: update, restart, status, logs, retrain${NC}"
  exit 1
fi

# If no agents specified, use all
if [ ${#AGENTS[@]} -eq 0 ]; then
  AGENTS=("factor-tuner" "benchmark-guard" "curve-trainer" "scenario-agent" "boe-arguer")
fi

# Display plan
echo -e "${BLUE}=== TerraFusion AI Agent Management Plan ===${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Action: ${GREEN}$ACTION${NC}"
echo -e "Agents: ${GREEN}${AGENTS[*]}${NC}"
if [ "$ACTION" = "update" ]; then
  echo -e "Version: ${GREEN}$VERSION${NC}"
  echo -e "Force Retrain: ${GREEN}$FORCE_RETRAIN${NC}"
fi

# Ask for confirmation unless skipped
if [ "$SKIP_CONFIRMATION" = false ]; then
  echo ""
  read -p "Continue with agent management? (y/n): " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Operation aborted by user${NC}"
    exit 0
  fi
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

# Configure kubectl for the right cluster
echo -e "${YELLOW}Configuring kubectl for EKS cluster...${NC}"
aws eks update-kubeconfig --name terrafusion-${ENVIRONMENT} --region ${AWS_REGION}

# Process each agent
for agent in "${AGENTS[@]}"; do
  echo -e "\n${BLUE}=== Managing Agent: ${agent} ===${NC}"
  
  case $ACTION in
    update)
      AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
      ECR_REPOSITORY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/terrafusion-${agent}
      
      echo -e "${YELLOW}Updating ${agent} to version ${VERSION}...${NC}"
      
      # Check if deployment exists
      if kubectl get deployment ${agent} -n terrafusion-agents &>/dev/null; then
        kubectl set image deployment/${agent} ${agent}=${ECR_REPOSITORY}:${VERSION} -n terrafusion-agents
        echo -e "${YELLOW}Waiting for rollout to complete...${NC}"
        kubectl rollout status deployment/${agent} -n terrafusion-agents --timeout=300s
      else
        echo -e "${YELLOW}Deployment for ${agent} not found, creating from template...${NC}"
        export AGENT_VERSION=${VERSION}
        export AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
        export AWS_REGION=${AWS_REGION}
        envsubst < ../k8s-manifests/agents/${agent}.yaml | kubectl apply -f -
      fi
      
      # Trigger retraining if requested
      if [ "$FORCE_RETRAIN" = true ]; then
        echo -e "${YELLOW}Triggering retraining for ${agent}...${NC}"
        API_GATEWAY=$(kubectl get service -n api-gateway kong-kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
        curl -X POST "http://${API_GATEWAY}/api/agents/${agent}/retrain" \
          -H "Content-Type: application/json" \
          -d '{"force": true}'
      fi
      
      echo -e "${GREEN}✓ ${agent} update complete${NC}"
      ;;
      
    restart)
      echo -e "${YELLOW}Restarting ${agent}...${NC}"
      kubectl rollout restart deployment/${agent} -n terrafusion-agents
      echo -e "${YELLOW}Waiting for restart to complete...${NC}"
      kubectl rollout status deployment/${agent} -n terrafusion-agents --timeout=300s
      echo -e "${GREEN}✓ ${agent} restart complete${NC}"
      ;;
      
    status)
      echo -e "${YELLOW}Checking ${agent} status...${NC}"
      kubectl get deployment ${agent} -n terrafusion-agents -o wide
      kubectl get pods -n terrafusion-agents -l app.kubernetes.io/name=${agent} -o wide
      kubectl describe deployment ${agent} -n terrafusion-agents | grep -A5 "Conditions:"
      
      # Check agent health endpoint
      echo -e "\n${YELLOW}Checking agent health endpoint...${NC}"
      API_GATEWAY=$(kubectl get service -n api-gateway kong-kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
      curl -s "http://${API_GATEWAY}/api/agents/${agent}/health" | jq .
      ;;
      
    logs)
      echo -e "${YELLOW}Fetching logs for ${agent}...${NC}"
      POD=$(kubectl get pods -n terrafusion-agents -l app.kubernetes.io/name=${agent} -o jsonpath='{.items[0].metadata.name}')
      if [ -n "$POD" ]; then
        kubectl logs -n terrafusion-agents $POD --tail=100
        echo -e "\n${YELLOW}To follow logs in real-time:${NC}"
        echo -e "kubectl logs -n terrafusion-agents $POD -f"
      else
        echo -e "${RED}No pods found for agent ${agent}${NC}"
      fi
      ;;
      
    retrain)
      echo -e "${YELLOW}Triggering retraining for ${agent}...${NC}"
      API_GATEWAY=$(kubectl get service -n api-gateway kong-kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
      curl -X POST "http://${API_GATEWAY}/api/agents/${agent}/retrain" \
        -H "Content-Type: application/json" \
        -d '{"force": true}'
      echo -e "\n${GREEN}✓ Retraining triggered for ${agent}${NC}"
      ;;
  esac
done

echo -e "\n${BLUE}=== Summary ===${NC}"
echo -e "Action '${GREEN}${ACTION}${NC}' completed for agents: ${GREEN}${AGENTS[*]}${NC}"

# Show monitoring links
echo -e "\n${BLUE}=== Monitoring ===${NC}"
if kubectl get ingress -n monitoring grafana-ingress &>/dev/null; then
  MONITORING_URL=$(kubectl get ingress -n monitoring grafana-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
  echo -e "Monitoring Dashboard: ${GREEN}https://${MONITORING_URL}${NC}"
  echo -e "Agent Dashboard: ${GREEN}https://${MONITORING_URL}/d/terrafusion-agents/terrafusion-ai-swarm-agents${NC}"
fi

echo -e "\n${GREEN}✓ Operation completed successfully!${NC}"