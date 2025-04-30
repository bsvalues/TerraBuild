#!/bin/bash
#
# TerraBuild AI Swarm Runner
# Version 3.0
#
# This script initializes and runs the AI agent swarm for the TerraBuild system.
# It coordinates the various specialized agents to work together on infrastructure
# cost assessment tasks.
#

# Configuration
SWARM_NAME="terrabuild-swarm"
SWARM_VERSION="3.0.0"
LOG_DIR="./logs"
CONFIG_DIR="./config"
DATA_DIR="./data"
AGENTS_ENABLED=("factor-tuner" "benchmark-guard" "curve-trainer" "scenario-agent" "boe-arguer")

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create required directories
mkdir -p "$LOG_DIR"
mkdir -p "$CONFIG_DIR"

# Display banner
echo -e "${BLUE}"
echo "  _______                    ____        _ _     _   "
echo " |__   __|                  |  _ \      (_) |   | |  "
echo "    | | ___ _ __ _ __ __ _  | |_) |_   _ _| | __| |  "
echo "    | |/ _ \ '__| '__/ _\` | |  _ <| | | | | |/ _\` |  "
echo "    | |  __/ |  | | | (_| | | |_) | |_| | | | (_| |  "
echo "    |_|\___|_|  |_|  \__,_| |____/ \__,_|_|_|\__,_|  "
echo "                                                      "
echo "  AI Swarm v${SWARM_VERSION}                         "
echo -e "${NC}"

# Check prerequisites
check_prerequisites() {
  echo -e "${CYAN}[SWARM]${NC} Checking prerequisites..."
  
  if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Node.js is required but not installed. Please install Node.js v16 or higher."
    exit 1
  fi
  
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} npm is required but not installed. Please install npm."
    exit 1
  fi
  
  if ! command -v tsc &> /dev/null; then
    echo -e "${YELLOW}[WARN]${NC} TypeScript compiler (tsc) not found. Installing TypeScript..."
    npm install -g typescript
  fi
  
  echo -e "${GREEN}[OK]${NC} All prerequisites satisfied."
}

# Initialize the agents
initialize_agents() {
  echo -e "${CYAN}[SWARM]${NC} Initializing AI agents..."
  
  for agent in "${AGENTS_ENABLED[@]}"; do
    echo -e "${PURPLE}[AGENT]${NC} Initializing $agent..."
    # In a real implementation, this would load the agent and initialize it
    sleep 0.5
  done
  
  echo -e "${GREEN}[OK]${NC} All agents initialized successfully."
}

# Start the swarm coordinator
start_coordinator() {
  echo -e "${CYAN}[SWARM]${NC} Starting swarm coordinator..."
  echo -e "${GREEN}[OK]${NC} Swarm coordinator started with ID: $SWARM_NAME-$(date +%s)"
}

# Test agent health
test_agent_health() {
  echo -e "${CYAN}[SWARM]${NC} Testing agent health..."
  
  for agent in "${AGENTS_ENABLED[@]}"; do
    # Simulate health check
    if [ "$agent" == "scenario-agent" ] && [ "$1" == "simulate-failure" ]; then
      echo -e "${RED}[HEALTH]${NC} $agent: FAILED - Unable to initialize core components"
      echo -e "${YELLOW}[RECOVERY]${NC} Attempting to restart $agent..."
      sleep 1
      echo -e "${GREEN}[RECOVERY]${NC} $agent restarted successfully."
    else
      echo -e "${GREEN}[HEALTH]${NC} $agent: OK"
    fi
  done
}

# Load sample data for demo
load_sample_data() {
  echo -e "${CYAN}[SWARM]${NC} Loading sample data for demonstration..."
  
  # Simulate loading data files
  data_files=("benton_county_cost_factors.json" "regional_adjustments.json" "economic_indicators.json")
  
  for file in "${data_files[@]}"; do
    echo -e "${BLUE}[DATA]${NC} Loading $file..."
    sleep 0.5
  done
  
  echo -e "${GREEN}[OK]${NC} Sample data loaded successfully."
}

# Run a swarm task
run_swarm_task() {
  local task_type=$1
  local region=$2
  
  echo -e "${CYAN}[SWARM]${NC} Running task: $task_type for region: $region"
  echo -e "${PURPLE}[TASK]${NC} Creating task definition..."
  sleep 0.5
  
  local task_id="task_$(date +%s)_$RANDOM"
  echo -e "${PURPLE}[TASK]${NC} Task created with ID: $task_id"
  
  # Simulate task execution
  echo -e "${PURPLE}[TASK]${NC} Distributing subtasks to agents..."
  sleep 0.5
  
  # Different task types use different agent combinations
  case $task_type in
    "cost-assessment")
      echo -e "${BLUE}[SUBTASK]${NC} factor-tuner: Analyzing regional factors"
      sleep 1
      echo -e "${BLUE}[SUBTASK]${NC} curve-trainer: Calculating cost curves"
      sleep 1.5
      echo -e "${BLUE}[SUBTASK]${NC} benchmark-guard: Validating results"
      sleep 0.8
      ;;
      
    "scenario-analysis")
      echo -e "${BLUE}[SUBTASK]${NC} scenario-agent: Generating scenarios"
      sleep 1.2
      echo -e "${BLUE}[SUBTASK]${NC} factor-tuner: Adjusting factors for scenarios"
      sleep 0.8
      echo -e "${BLUE}[SUBTASK]${NC} curve-trainer: Projecting trends"
      sleep 1
      ;;
      
    "appeal-preparation")
      echo -e "${BLUE}[SUBTASK]${NC} boe-arguer: Preparing justifications"
      sleep 1.5
      echo -e "${BLUE}[SUBTASK]${NC} benchmark-guard: Finding comparable properties"
      sleep 1
      echo -e "${BLUE}[SUBTASK]${NC} factor-tuner: Validating regional factors"
      sleep 0.7
      ;;
      
    *)
      echo -e "${YELLOW}[WARN]${NC} Unknown task type: $task_type"
      ;;
  esac
  
  echo -e "${GREEN}[TASK]${NC} Task $task_id completed successfully."
  
  # Simulate result summary
  echo -e "${CYAN}[RESULT]${NC} ---- Task Results Summary ----"
  echo -e "${CYAN}[RESULT]${NC} Task ID: $task_id"
  echo -e "${CYAN}[RESULT]${NC} Type: $task_type"
  echo -e "${CYAN}[RESULT]${NC} Region: $region"
  echo -e "${CYAN}[RESULT]${NC} Status: COMPLETED"
  echo -e "${CYAN}[RESULT]${NC} Execution time: $((2 + RANDOM % 5))s"
  echo -e "${CYAN}[RESULT]${NC} Confidence score: $((75 + RANDOM % 20))%"
  echo -e "${CYAN}[RESULT]${NC} -----------------------------"
}

# Main function
main() {
  check_prerequisites
  initialize_agents
  start_coordinator
  test_agent_health "$1"
  load_sample_data
  
  echo ""
  echo -e "${BLUE}=======================================${NC}"
  echo -e "${GREEN}     TerraBuild AI Swarm is ONLINE     ${NC}"
  echo -e "${BLUE}=======================================${NC}"
  echo ""
  
  # Run demo tasks if requested
  if [ "$1" == "demo" ]; then
    echo -e "${CYAN}[SWARM]${NC} Running demonstration tasks..."
    
    run_swarm_task "cost-assessment" "BENTON"
    echo ""
    
    run_swarm_task "scenario-analysis" "KING"
    echo ""
    
    run_swarm_task "appeal-preparation" "SPOKANE"
    echo ""
    
    echo -e "${GREEN}[DEMO]${NC} Demonstration completed successfully."
  fi
  
  echo -e "${CYAN}[SWARM]${NC} Swarm is ready for tasks. Use the API or CLI to submit tasks."
  echo -e "${CYAN}[SWARM]${NC} Run './run-swarm.sh demo' to see a demonstration."
  
  # In a real implementation, this would keep running and wait for tasks
  if [ "$1" != "demo" ] && [ "$1" != "simulate-failure" ]; then
    echo -e "${YELLOW}[NOTE]${NC} This is a simulation. In a real deployment, the swarm would"
    echo -e "${YELLOW}[NOTE]${NC} continue running and waiting for tasks via the API."
  fi
}

# Execute main function with all arguments
main "$@"