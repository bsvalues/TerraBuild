#!/bin/bash

# TerraFusion Agent Status Check Script
# This script checks the status of all AI agents in the TerraFusion platform

set -e

# Default values
ENVIRONMENT="dev"
API_URL=""
K8S_NAMESPACE=""

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
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Set environment-specific variables
if [ "$ENVIRONMENT" = "prod" ]; then
  API_URL="https://api.terrafusion.io"
  K8S_NAMESPACE="terrafusion-prod"
elif [ "$ENVIRONMENT" = "staging" ]; then
  API_URL="https://api.staging.terrafusion.io"
  K8S_NAMESPACE="terrafusion-staging"
else
  API_URL="https://api.dev.terrafusion.io"
  K8S_NAMESPACE="terrafusion-dev"
  # For local development, check localhost too
  if nc -z localhost 5000 2>/dev/null; then
    API_URL="http://localhost:5000"
  fi
fi

echo -e "${BLUE}TerraFusion Agent Status Check${NC}"
echo "Checking environment: $ENVIRONMENT"
echo ""

# Check if we can use API
function check_api_agent_status() {
  echo "Checking agent status via API..."
  
  API_RESPONSE=$(curl -s "$API_URL/api/agent/status" 2>/dev/null)
  
  if [[ $API_RESPONSE == *"error"* ]] || [ -z "$API_RESPONSE" ]; then
    echo -e "${YELLOW}⚠ Could not get agent status from API${NC}"
    return 1
  fi
  
  # Parse API response
  echo "$API_RESPONSE" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    print("\n{:<30} {:<15} {:<10} {:<15}".format("AGENT", "STATUS", "UPTIME", "LAST ACTIVITY"))
    print("-" * 75)
    
    for agent in data.get("agents", []):
        name = agent.get("name", "Unknown")
        status = agent.get("status", "unknown")
        uptime = agent.get("uptime", "N/A")
        last_activity = agent.get("lastActivity", "N/A")
        
        status_color = "\033[0;32m" if status == "active" else "\033[0;31m" if status == "error" else "\033[0;33m"
        print("{:<30} {}{}{}  {:<10} {:<15}".format(name, status_color, status, "\033[0m", uptime, last_activity))
except Exception as e:
    print("Error parsing API response:", e)
    sys.exit(1)
  '
  
  return 0
}

# Check Kubernetes for agent status
function check_k8s_agent_status() {
  echo "Checking agent status via Kubernetes..."
  
  # Check if kubectl is available
  if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}kubectl not found, skipping Kubernetes checks${NC}"
    return 1
  fi
  
  # Check if we can access the cluster
  if ! kubectl get ns $K8S_NAMESPACE &> /dev/null; then
    echo -e "${YELLOW}Cannot access Kubernetes namespace $K8S_NAMESPACE, skipping checks${NC}"
    return 1
  fi
  
  # Get agent pods
  AGENT_PODS=$(kubectl get pods -n $K8S_NAMESPACE -l app.kubernetes.io/component=agent -o json)
  
  if [ -z "$AGENT_PODS" ]; then
    echo -e "${YELLOW}No agent pods found${NC}"
    return 1
  fi
  
  # Parse pod information
  echo "$AGENT_PODS" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    pods = data.get("items", [])
    
    if not pods:
        print("No agent pods found")
        sys.exit(0)
    
    print("\n{:<30} {:<15} {:<10} {:<15}".format("AGENT", "STATUS", "RESTARTS", "AGE"))
    print("-" * 75)
    
    for pod in pods:
        name = pod["metadata"]["name"]
        agent_name = pod["metadata"]["labels"].get("app.kubernetes.io/name", "unknown")
        status_phase = pod["status"]["phase"]
        
        # Get container status
        container_status = "Unknown"
        restarts = 0
        if pod["status"].get("containerStatuses"):
            container = pod["status"]["containerStatuses"][0]
            restarts = container.get("restartCount", 0)
            ready = container.get("ready", False)
            if ready:
                container_status = "Running"
            elif container.get("state", {}).get("waiting"):
                reason = container["state"]["waiting"].get("reason", "Waiting")
                container_status = reason
            elif container.get("state", {}).get("terminated"):
                reason = container["state"]["terminated"].get("reason", "Terminated")
                container_status = reason
        
        # Calculate age
        import datetime
        start_time = pod["status"].get("startTime", "")
        age = "Unknown"
        if start_time:
            start_time = datetime.datetime.strptime(start_time, "%Y-%m-%dT%H:%M:%SZ")
            now = datetime.datetime.utcnow()
            diff = now - start_time
            days = diff.days
            hours, remainder = divmod(diff.seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            
            if days > 0:
                age = f"{days}d{hours}h"
            elif hours > 0:
                age = f"{hours}h{minutes}m"
            else:
                age = f"{minutes}m"
        
        status_color = "\033[0;32m" if status_phase == "Running" and container_status == "Running" else "\033[0;31m" if status_phase == "Failed" else "\033[0;33m"
        restart_color = "\033[0;31m" if restarts > 5 else "\033[0;33m" if restarts > 0 else "\033[0m"
        
        print("{:<30} {}{:<15}{} {}{:<10}{} {:<15}".format(
            agent_name, 
            status_color, container_status, "\033[0m",
            restart_color, restarts, "\033[0m",
            age
        ))
except Exception as e:
    print("Error parsing Kubernetes response:", e)
    sys.exit(1)
  '
  
  return 0
}

# Check agent logs for activity
function check_agent_logs() {
  echo -e "\nRecent agent activity:"
  echo "--------------------"
  
  if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}kubectl not found, skipping log checks${NC}"
    return 1
  fi
  
  # Get agent names
  AGENT_NAMES=$(kubectl get pods -n $K8S_NAMESPACE -l app.kubernetes.io/component=agent -o jsonpath='{.items[*].metadata.labels.app\.kubernetes\.io/name}' | tr ' ' '\n' | sort | uniq)
  
  if [ -z "$AGENT_NAMES" ]; then
    echo -e "${YELLOW}No agents found${NC}"
    return 1
  fi
  
  for agent in $AGENT_NAMES; do
    echo -e "${BLUE}$agent:${NC}"
    kubectl logs -n $K8S_NAMESPACE -l "app.kubernetes.io/name=$agent" --tail=3 --prefix=false | sed 's/^/  /'
    echo ""
  done
  
  return 0
}

# Check file system for agent manifests
function check_agent_manifests() {
  echo "Checking agent manifests..."
  
  if [ -d "swarm" ] && [ -f "swarm/agent-manifest.yaml" ]; then
    echo -e "${GREEN}Found agent manifest in swarm/agent-manifest.yaml${NC}"
    echo "Configured agents:"
    
    grep "name:" swarm/agent-manifest.yaml | sed 's/^[ \t]*name: /  - /'
  else
    echo -e "${YELLOW}No agent manifest found${NC}"
  fi
}

# Try to get status via API first
if ! check_api_agent_status; then
  # Fall back to Kubernetes check if API fails
  check_k8s_agent_status
fi

# Show logs for active agents
check_agent_logs

# Check agent manifests
check_agent_manifests

echo ""
echo -e "${BLUE}Agent Status Check Complete${NC}"
echo "======================="
echo ""
echo "For detailed agent logs, use: kubectl logs -l app.kubernetes.io/component=agent -n $K8S_NAMESPACE --tail=50"