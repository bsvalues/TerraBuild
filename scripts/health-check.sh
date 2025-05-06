#!/bin/bash

# TerraFusion System Health Check
# This script runs a comprehensive health check of the TerraFusion platform

set -e

# Default values
ENVIRONMENT="dev"

# Parse command line arguments
while getopts ":e:" opt; do
  case $opt in
    e) ENVIRONMENT="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    ;;
  esac
done

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set environment-specific variables
if [ "$ENVIRONMENT" = "prod" ]; then
  API_URL="https://api.terrafusion.io"
  FRONTEND_URL="https://terrafusion.io"
  GRAFANA_URL="https://grafana.terrafusion.io"
  K8S_NAMESPACE="terrafusion-prod"
elif [ "$ENVIRONMENT" = "staging" ]; then
  API_URL="https://api.staging.terrafusion.io"
  FRONTEND_URL="https://staging.terrafusion.io"
  GRAFANA_URL="https://grafana.staging.terrafusion.io"
  K8S_NAMESPACE="terrafusion-staging"
else
  API_URL="https://api.dev.terrafusion.io"
  FRONTEND_URL="https://dev.terrafusion.io"
  GRAFANA_URL="https://grafana.dev.terrafusion.io"
  K8S_NAMESPACE="terrafusion-dev"
  # For local development, check localhost too
  if nc -z localhost 5000 2>/dev/null; then
    API_URL="http://localhost:5000"
  fi
  if nc -z localhost 3000 2>/dev/null; then
    GRAFANA_URL="http://localhost:3000"
  fi
fi

echo -e "${BLUE}TerraFusion System Health Check${NC}"
echo "Checking environment: $ENVIRONMENT"
echo ""

# Function to check URL health
check_url() {
  local url=$1
  local name=$2
  echo -n "Checking $name... "
  
  local status_code=$(curl -s -o /dev/null -w "%{http_code}" $url)
  
  if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
    echo -e "${GREEN}OK${NC} ($status_code)"
    return 0
  else
    echo -e "${RED}FAIL${NC} ($status_code)"
    return 1
  fi
}

# Function to check Kubernetes resources
check_k8s_resources() {
  echo "Checking Kubernetes resources..."
  
  # Check if kubectl is available
  if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}  kubectl not found, skipping Kubernetes checks${NC}"
    return
  fi
  
  # Check if we can access the cluster
  if ! kubectl get ns $K8S_NAMESPACE &> /dev/null; then
    echo -e "${YELLOW}  Cannot access Kubernetes namespace $K8S_NAMESPACE, skipping checks${NC}"
    return
  fi
  
  # Check pods
  echo -n "  Checking pods... "
  local unhealthy_pods=$(kubectl get pods -n $K8S_NAMESPACE -o json | jq -r '.items[] | select(.status.phase != "Running" and .status.phase != "Succeeded") | .metadata.name')
  
  if [ -z "$unhealthy_pods" ]; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAIL${NC}"
    echo "    Unhealthy pods:"
    echo "$unhealthy_pods" | while read pod; do
      echo "    - $pod"
    done
  fi
  
  # Check services
  echo -n "  Checking services... "
  local services=$(kubectl get services -n $K8S_NAMESPACE -o json | jq -r '.items[].metadata.name')
  
  if [ -n "$services" ]; then
    echo -e "${GREEN}OK${NC}"
    echo "    Available services:"
    echo "$services" | while read svc; do
      echo "    - $svc"
    done
  else
    echo -e "${YELLOW}No services found${NC}"
  fi
  
  # Check agent deployments
  echo -n "  Checking agent deployments... "
  local agent_deployments=$(kubectl get deployments -n $K8S_NAMESPACE -l app.kubernetes.io/component=agent -o json | jq -r '.items[].metadata.name')
  
  if [ -n "$agent_deployments" ]; then
    echo -e "${GREEN}OK${NC}"
    echo "    Active agent deployments:"
    echo "$agent_deployments" | while read deploy; do
      local replicas=$(kubectl get deployment $deploy -n $K8S_NAMESPACE -o jsonpath='{.status.readyReplicas}')
      echo "    - $deploy ($replicas replicas running)"
    done
  else
    echo -e "${YELLOW}No agent deployments found${NC}"
  fi
}

# Function to check database
check_database() {
  echo "Checking database..."
  
  # Check if a database health check endpoint is available
  if curl -s "$API_URL/api/health/db" | grep -q "healthy"; then
    echo -e "${GREEN}  Database is healthy${NC}"
  else
    echo -e "${YELLOW}  Database health status unknown${NC}"
    echo "  Trying to connect directly..."
    
    # Try npm script if available
    if [ -f "package.json" ] && grep -q "db:status" package.json; then
      if npm run db:status 2>/dev/null; then
        echo -e "${GREEN}  Database connection is working${NC}"
      else
        echo -e "${RED}  Database connection failed${NC}"
      fi
    else
      echo -e "${YELLOW}  No direct database check method available${NC}"
    fi
  fi
}

# Function to check agent health
check_agent_health() {
  echo "Checking agent health..."
  
  # Check if agentctl is available
  if command -v agentctl &> /dev/null; then
    # Use agentctl to check agent status
    echo "  Using agentctl to check agent status:"
    if agentctl status --environment $ENVIRONMENT | grep -q "active"; then
      echo -e "${GREEN}  Agents are running normally${NC}"
    else
      echo -e "${YELLOW}  Some agents may be inactive${NC}"
    fi
  else
    # Fall back to agent-status.sh script
    if [ -f "scripts/agent-status.sh" ]; then
      echo "  Using agent-status.sh script:"
      
      local agent_status=$(scripts/agent-status.sh -e $ENVIRONMENT)
      if echo "$agent_status" | grep -q "active"; then
        echo -e "${GREEN}  Agents are running normally${NC}"
      else
        echo -e "${YELLOW}  Some agents may be inactive${NC}"
      fi
    else
      echo -e "${YELLOW}  No agent status check method available${NC}"
    fi
  fi
  
  # Check agent metrics via API if available
  if curl -s "$API_URL/api/agent/metrics" &>/dev/null; then
    echo "  Agent metrics available via API"
  fi
}

# Run checks
echo -e "${BLUE}Running System Health Checks${NC}"
echo "==============================="
echo ""

echo -e "${BLUE}1. API Service${NC}"
check_url "$API_URL/api/health" "API health endpoint"
check_url "$API_URL/api/version" "API version endpoint"
echo ""

echo -e "${BLUE}2. Frontend Service${NC}"
check_url "$FRONTEND_URL" "Frontend service"
echo ""

echo -e "${BLUE}3. Monitoring${NC}"
check_url "$GRAFANA_URL" "Grafana dashboard"
echo ""

echo -e "${BLUE}4. Kubernetes Resources${NC}"
check_k8s_resources
echo ""

echo -e "${BLUE}5. Database${NC}"
check_database
echo ""

echo -e "${BLUE}6. Agent Health${NC}"
check_agent_health
echo ""

echo -e "${BLUE}System Check Complete${NC}"
echo "======================="
echo ""
echo "For detailed diagnostics, please run individual component checks"
echo "or check the monitoring dashboards at $GRAFANA_URL"