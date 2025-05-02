#!/bin/bash

# TerraFusion Agent Wizard Installation Script
# This script installs and configures the TerraFusion Agent Configuration Wizard (agentctl)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}TerraFusion Agent Configuration Wizard Installer${NC}"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required but not found${NC}"
    echo "Please install Node.js v16 or higher"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is required but not found${NC}"
    exit 1
fi

# Check if the agent wizard directory exists
if [ ! -d "terrafusion-devops-kit/tools/agent-wizard" ]; then
    echo -e "${RED}Error: Agent wizard directory not found${NC}"
    echo "Expected at: terrafusion-devops-kit/tools/agent-wizard"
    exit 1
fi

# Check if agentctl is already installed
if command -v agentctl &> /dev/null; then
    CURRENT_VERSION=$(agentctl --version | grep -oP "v\K[0-9]+\.[0-9]+\.[0-9]+")
    echo -e "${YELLOW}Agent Configuration Wizard is already installed (version $CURRENT_VERSION)${NC}"
    echo "Would you like to reinstall? (y/n)"
    read -r REINSTALL
    if [ "$REINSTALL" != "y" ]; then
        echo "Installation cancelled."
        exit 0
    fi
fi

echo -e "${GREEN}Installing Agent Configuration Wizard...${NC}"

# Build and install the agent wizard
(
    cd terrafusion-devops-kit/tools/agent-wizard || exit 1
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install
    
    # Build the package
    echo "Building agent wizard..."
    npm run build
    
    # Install globally
    echo "Installing agent wizard globally..."
    npm install -g .
)

# Verify installation
if command -v agentctl &> /dev/null; then
    VERSION=$(agentctl --version | grep -oP "v\K[0-9]+\.[0-9]+\.[0-9]+")
    echo -e "${GREEN}✅ Agent Configuration Wizard successfully installed (version $VERSION)${NC}"
    
    # Create default configuration
    if [ ! -f ~/.terrafusion/agent-config.json ]; then
        echo "Creating default configuration..."
        mkdir -p ~/.terrafusion
        cat > ~/.terrafusion/agent-config.json << EOF
{
    "environments": {
        "dev": {
            "apiUrl": "https://api.dev.terrafusion.io",
            "kubeContext": "terrafusion-dev"
        },
        "staging": {
            "apiUrl": "https://api.staging.terrafusion.io",
            "kubeContext": "terrafusion-staging"
        },
        "prod": {
            "apiUrl": "https://api.terrafusion.io",
            "kubeContext": "terrafusion-prod"
        }
    },
    "defaultEnvironment": "dev",
    "manifestPath": "swarm/agent-manifest.yaml",
    "telemetry": true,
    "checkForUpdates": true
}
EOF
        echo -e "${GREEN}Created default configuration at ~/.terrafusion/agent-config.json${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Usage Examples:${NC}"
    echo "  agentctl status              - Show status of all agents"
    echo "  agentctl wizard              - Start the interactive wizard"
    echo "  agentctl validate            - Validate agent manifests"
    echo "  agentctl deploy <agent>      - Deploy a specific agent"
    echo "  agentctl --help              - Show help information"
    echo ""
    echo -e "${GREEN}You can now use 'agentctl' to manage TerraFusion agents${NC}"
else
    echo -e "${RED}Installation failed. Please check the error messages above.${NC}"
    exit 1
fi