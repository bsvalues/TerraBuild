#!/bin/bash

# TerraFusion Agent Demonstration Script
# This script runs a demonstration of the TerraFusion AI agent swarm capabilities

set -e

# Default values
ENVIRONMENT="dev"
TIMEOUT=30 # seconds to wait for agent response
DEMO_TYPE="standard" # standard, advanced, or performance

# Parse command line arguments
while getopts ":e:t:d:" opt; do
  case $opt in
    e) ENVIRONMENT="$OPTARG"
    ;;
    t) TIMEOUT="$OPTARG"
    ;;
    d) DEMO_TYPE="$OPTARG"
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
CYAN='\033[1;36m'
MAGENTA='\033[1;35m'
GRAY='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Set environment-specific variables
if [ "$ENVIRONMENT" = "prod" ]; then
  API_URL="https://api.terrafusion.io"
elif [ "$ENVIRONMENT" = "staging" ]; then
  API_URL="https://api.staging.terrafusion.io"
else
  API_URL="https://api.dev.terrafusion.io"
  # For local development, check localhost too
  if nc -z localhost 5000 2>/dev/null; then
    API_URL="http://localhost:5000"
  fi
fi

# ASCII Art Logo Function
print_logo() {
  echo -e "${CYAN}"
  echo "  _______                   _____           _                "
  echo " |__   __|                 |  __ \         (_)               "
  echo "    | | ___ _ __ _ __ __ _ | |__) |   _ ___ _  ___  _ __    "
  echo "    | |/ _ \ '__| '__/ _\` ||  ___/ | | / __| |/ _ \| '_ \   "
  echo "    | |  __/ |  | | | (_| || |   | |_| \__ \ | (_) | | | |  "
  echo "    |_|\___|_|  |_|  \__,_||_|    \__,_|___/_|\___/|_| |_|  "
  echo "                                                            "
  echo "    ${YELLOW}A I   A G E N T   D E M O${CYAN}"
  echo "                                                      "
  echo -e "${NC}"
}

# Function to send a request to an agent
send_agent_request() {
  local agent=$1
  local payload=$2
  
  echo -e "${BLUE}Sending request to ${BOLD}$agent${NC}${BLUE} agent...${NC}"
  echo -e "${GRAY}Payload: $payload${NC}"
  
  # Send request to agent
  response=$(curl -s -X POST "$API_URL/api/agent/$agent" \
    -H "Content-Type: application/json" \
    -d "$payload")
    
  # Check for errors
  if [[ $response == *"error"* ]]; then
    echo -e "${RED}Error: $(echo $response | grep -o '"message":"[^"]*' | cut -d'"' -f4)${NC}"
    return 1
  fi
  
  # Extract task ID
  task_id=$(echo $response | grep -o '"taskId":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$task_id" ]; then
    echo -e "${RED}Error: No task ID returned${NC}"
    return 1
  fi
  
  echo -e "${GREEN}Task initiated: ${GRAY}$task_id${NC}"
  
  # Poll for task completion
  echo -e "Waiting for agent response (timeout: ${TIMEOUT}s)..."
  
  elapsed=0
  while [ $elapsed -lt $TIMEOUT ]; do
    # Check task status
    status_response=$(curl -s "$API_URL/api/agent/task/$task_id")
    
    # Check if task is complete
    if [[ $status_response == *'"status":"completed"'* ]]; then
      result=$(echo $status_response | grep -o '"result":{[^}]*}' | sed 's/"result"://')
      echo -e "${GREEN}✓ Task completed successfully!${NC}"
      echo -e "${MAGENTA}Result:${NC}"
      echo $result | python3 -m json.tool
      return 0
    elif [[ $status_response == *'"status":"failed"'* ]]; then
      error=$(echo $status_response | grep -o '"error":"[^"]*' | cut -d'"' -f4)
      echo -e "${RED}✗ Task failed: $error${NC}"
      return 1
    fi
    
    # Update progress bar
    printf "."
    sleep 1
    elapsed=$((elapsed + 1))
  done
  
  echo -e "\n${RED}Timed out waiting for agent response${NC}"
  return 1
}

# Function to print section header
print_section() {
  echo -e "\n${YELLOW}======== $1 ========${NC}"
}

# Check agent availability
check_agents() {
  echo -e "Checking agent availability..."
  
  status_response=$(curl -s "$API_URL/api/agent/status")
  
  if [[ $status_response == *"error"* ]] || [ -z "$status_response" ]; then
    echo -e "${RED}Error: Could not connect to agent system${NC}"
    return 1
  fi
  
  # Parse and print agent status
  echo -e "${GREEN}Connected to agent system${NC}"
  echo -e "Available agents:"
  
  echo "$status_response" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    for agent in data.get("agents", []):
        name = agent.get("name", "Unknown")
        status = agent.get("status", "unknown")
        status_marker = "✓" if status == "active" else "✗" if status == "error" else "?"
        status_color = "\033[0;32m" if status == "active" else "\033[0;31m" if status == "error" else "\033[0;33m"
        print(f"  {status_color}{status_marker}\033[0m {name}")
except Exception as e:
    print(f"Error parsing response: {e}")
    sys.exit(1)
  '
}

# Run the standard demonstration
run_standard_demo() {
  print_section "Data Quality Analysis"
  send_agent_request "data-quality-agent" '{
    "action": "analyze",
    "data": {
      "source": "sample_properties",
      "options": {
        "checkNulls": true,
        "checkOutliers": true,
        "checkDuplicates": true
      }
    }
  }'
  
  print_section "Cost Analysis"
  send_agent_request "cost-analysis-agent" '{
    "action": "estimate",
    "data": {
      "buildingType": "residential",
      "quality": "average",
      "squareFeet": 2400,
      "yearBuilt": 2010,
      "region": "eastern"
    }
  }'
  
  print_section "Geospatial Analysis"
  send_agent_request "geospatial-analysis-agent" '{
    "action": "analyze",
    "data": {
      "coordinates": [46.2804, -119.2752],
      "radius": 5,
      "options": {
        "includeZoning": true,
        "includeFloodRisk": true
      }
    }
  }'
}

# Run the advanced demonstration
run_advanced_demo() {
  run_standard_demo
  
  print_section "Document Processing"
  send_agent_request "document-processing-agent" '{
    "action": "extract",
    "data": {
      "documentType": "propertyAssessment",
      "source": "sample_assessment_2023.pdf"
    }
  }'
  
  print_section "Agent Orchestration"
  send_agent_request "orchestrator" '{
    "action": "process",
    "data": {
      "workflow": "property-assessment",
      "propertyId": "BC-10042",
      "options": {
        "includeHistory": true,
        "generateReport": true
      }
    }
  }'
}

# Run the performance benchmark
run_performance_benchmark() {
  print_section "Agent Performance Benchmark"
  
  echo -e "Running benchmark tests on all agents..."
  agents=("data-quality-agent" "cost-analysis-agent" "geospatial-analysis-agent" "document-processing-agent")
  
  echo -e "${BLUE}Agent\t\t\t\tLatency\tSuccess${NC}"
  echo -e "----------------------------------------"
  
  for agent in "${agents[@]}"; do
    # Measure response time
    start_time=$(date +%s.%N)
    
    if send_agent_request "$agent" '{"action": "ping", "data": {"benchmark": true}}' > /dev/null; then
      end_time=$(date +%s.%N)
      latency=$(echo "$end_time - $start_time" | bc)
      latency_rounded=$(printf "%.2f" $latency)
      echo -e "${agent}\t\t${CYAN}${latency_rounded}s${NC}\t${GREEN}✓${NC}"
    else
      echo -e "${agent}\t\t${RED}failed${NC}\t${RED}✗${NC}"
    fi
  done
}

# Main demonstration script
main() {
  print_logo
  echo -e "${BLUE}TerraFusion AI Agent Swarm Demonstration${NC}"
  echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
  echo -e "API URL: ${GRAY}$API_URL${NC}"
  echo ""
  
  # Check agent availability
  if ! check_agents; then
    echo -e "${RED}Aborting demonstration due to agent system issues${NC}"
    exit 1
  fi
  
  # Run the selected demo type
  case "$DEMO_TYPE" in
    "standard")
      echo -e "\n${CYAN}Running standard demonstration...${NC}"
      run_standard_demo
      ;;
    "advanced")
      echo -e "\n${CYAN}Running advanced demonstration...${NC}"
      run_advanced_demo
      ;;
    "performance")
      echo -e "\n${CYAN}Running performance benchmark...${NC}"
      run_performance_benchmark
      ;;
    *)
      echo -e "${RED}Invalid demo type: $DEMO_TYPE${NC}"
      echo "Available types: standard, advanced, performance"
      exit 1
      ;;
  esac
  
  print_section "Demonstration Complete"
  echo -e "${GREEN}TerraFusion AI Agent Swarm demonstration completed successfully!${NC}"
  echo -e "For more information, visit the monitoring dashboard at:"
  echo -e "${BLUE}https://grafana.${ENVIRONMENT}.terrafusion.io/d/agent-activity/agent-swarm-activity${NC}"
}

# Run the demo
main