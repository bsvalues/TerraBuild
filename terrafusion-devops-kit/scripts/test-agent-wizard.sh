#!/bin/bash

# TerraFusion Agent Wizard Test Script
# This script tests the Agent Configuration Wizard by running a demo

set -e

# Color codes for output
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}TerraFusion Agent Configuration Wizard Test${NC}"
echo "This script will run a demonstration of the Agent Configuration Wizard."
echo ""

# Determine script directory (for relative paths)
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
WIZARD_DIR="$SCRIPT_DIR/../tools/agent-wizard"

# Check if wizard directory exists
if [[ ! -d "$WIZARD_DIR" ]]; then
    echo -e "${RED}Agent wizard directory not found: $WIZARD_DIR${NC}"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is required but not found. Please install Node.js first.${NC}"
    exit 1
fi

# Navigate to the wizard directory
cd "$WIZARD_DIR"

# Check if the demo script exists
if [[ ! -f "demo.js" ]]; then
    echo -e "${RED}Demo script not found: $WIZARD_DIR/demo.js${NC}"
    exit 1
fi

# Check if dependencies are installed
if [[ ! -d "node_modules" ]]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Run the demo
echo -e "${GREEN}Running Agent Configuration Wizard demo...${NC}"
echo ""
node demo.js

# Completion message
echo ""
echo -e "${GREEN}Demo completed successfully!${NC}"
echo ""
echo "To try the interactive wizard, run:"
echo -e "  ${YELLOW}cd $WIZARD_DIR && node index.js wizard${NC}"
echo ""
echo "Or install the wizard globally with:"
echo -e "  ${YELLOW}$SCRIPT_DIR/install-agent-wizard.sh${NC}"
echo ""
echo "Once installed, you can run:"
echo -e "  ${YELLOW}agentctl wizard${NC}"