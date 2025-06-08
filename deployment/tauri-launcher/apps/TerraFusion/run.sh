#!/bin/bash
# TerraFusion Main Application Startup Script
# This script launches the main TerraFusion application

echo "Starting TerraFusion Enterprise Application..."

# Set default port if not provided
if [ -z "$PORT" ]; then
    export PORT=5000
fi

# Navigate to the application directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
cd "$APP_DIR"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="18.0.0"
if ! node -e "process.exit(process.version.slice(1).localeCompare('$REQUIRED_VERSION', undefined, {numeric: true}) >= 0 ? 0 : 1)"; then
    echo "ERROR: Node.js version $NODE_VERSION is below required $REQUIRED_VERSION"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Set environment variables for production
export NODE_ENV=production
export TAURI_DEPLOYMENT=true

# Start the application
echo "Starting TerraFusion on port $PORT..."
npm run dev

# Check if application started successfully
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start TerraFusion application"
    exit 1
fi