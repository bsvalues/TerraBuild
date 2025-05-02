#!/bin/bash

# TerraFusion Agent Configuration Wizard Installation Script
# This script installs the agent wizard and makes it available in the system

set -e

# Color codes for output
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}TerraFusion Agent Configuration Wizard Installer${NC}"
echo "This script will install the Agent Configuration Wizard on your system."
echo ""

# Determine operating system
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    PLATFORM="win"
else
    echo -e "${RED}Unsupported operating system: $OSTYPE${NC}"
    exit 1
fi

# Determine architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "x86_64" || "$ARCH" == "amd64" ]]; then
    ARCH="x64"
elif [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
    ARCH="arm64"
else
    echo -e "${RED}Unsupported architecture: $ARCH${NC}"
    exit 1
fi

echo -e "Detected platform: ${GREEN}$PLATFORM-$ARCH${NC}"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is required but not found. Please install Node.js first.${NC}"
    exit 1
fi

# Set installation directory
if [[ "$PLATFORM" == "win" ]]; then
    INSTALL_DIR="$HOME/terrafusion/bin"
else
    INSTALL_DIR="/usr/local/bin"
    # If not running as root, use $HOME/.local/bin instead
    if [[ $EUID -ne 0 ]]; then
        INSTALL_DIR="$HOME/.local/bin"
        mkdir -p "$INSTALL_DIR"
        
        # Check if $INSTALL_DIR is in PATH
        if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
            echo -e "${YELLOW}Adding $INSTALL_DIR to your PATH${NC}"
            echo "export PATH=\"\$PATH:$INSTALL_DIR\"" >> "$HOME/.bashrc"
            export PATH="$PATH:$INSTALL_DIR"
        fi
    fi
fi

# Install with npm
echo -e "${YELLOW}Installing TerraFusion Agent Configuration Wizard...${NC}"

# Navigate to the agent-wizard directory
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
WIZARD_DIR="$SCRIPT_DIR/../tools/agent-wizard"

# Check if directory exists
if [[ ! -d "$WIZARD_DIR" ]]; then
    echo -e "${RED}Agent wizard directory not found: $WIZARD_DIR${NC}"
    exit 1
fi

cd "$WIZARD_DIR"

# Install dependencies
echo "Installing dependencies..."
npm install

# Create symlink or copy to installation directory
if [[ "$PLATFORM" == "win" ]]; then
    # Windows: Create batch file
    BATCH_FILE="$INSTALL_DIR/agentctl.bat"
    mkdir -p "$(dirname "$BATCH_FILE")"
    echo "@echo off" > "$BATCH_FILE"
    echo "node \"$WIZARD_DIR/index.js\" %*" >> "$BATCH_FILE"
    echo -e "${GREEN}Installed batch file to $BATCH_FILE${NC}"
else
    # Linux/macOS: Create symlink to index.js
    SYMLINK="$INSTALL_DIR/agentctl"
    rm -f "$SYMLINK"
    echo "#!/usr/bin/env node" > "$SYMLINK"
    cat "$WIZARD_DIR/index.js" >> "$SYMLINK"
    chmod +x "$SYMLINK"
    echo -e "${GREEN}Installed symlink to $SYMLINK${NC}"
fi

echo -e "${GREEN}TerraFusion Agent Configuration Wizard installed successfully!${NC}"
echo ""
echo "You can now use the wizard by running:"
echo -e "  ${YELLOW}agentctl${NC}"
echo ""
echo "For help, run:"
echo -e "  ${YELLOW}agentctl --help${NC}"
echo ""
echo "To start the interactive wizard, run:"
echo -e "  ${YELLOW}agentctl wizard${NC}"