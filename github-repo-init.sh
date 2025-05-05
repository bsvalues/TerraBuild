#!/bin/bash
# GitHub Repository Initialization Script for MCP Matrix Upload Module
# This script creates a new GitHub repository and populates it with the Matrix Upload Module files

# Set colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print colored header
echo -e "\n${GREEN}=========================================================${NC}"
echo -e "${GREEN}     MCP Matrix Upload Module - GitHub Repository Setup     ${NC}"
echo -e "${GREEN}=========================================================${NC}\n"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI (gh) is not installed.${NC}"
    echo -e "Please install it first: https://cli.github.com/\n"
    exit 1
fi

# Check if user is authenticated with GitHub
echo -e "${YELLOW}Checking GitHub authentication...${NC}"
if ! gh auth status &> /dev/null; then
    echo -e "${RED}You are not authenticated with GitHub.${NC}"
    echo -e "Please run ${YELLOW}gh auth login${NC} first.\n"
    exit 1
fi
echo -e "${GREEN}✓ GitHub authentication successful.${NC}\n"

# Ask for repository name
read -p "Enter repository name (default: mcp-matrix-upload-module): " REPO_NAME
REPO_NAME=${REPO_NAME:-mcp-matrix-upload-module}

# Ask for repository description
read -p "Enter repository description (default: MCP Matrix Upload Module for Benton County Assessment System): " REPO_DESC
REPO_DESC=${REPO_DESC:-MCP Matrix Upload Module for Benton County Assessment System}

# Ask for visibility
read -p "Repository visibility (public/private) [default: private]: " VISIBILITY
VISIBILITY=${VISIBILITY:-private}

# Create temporary directory for repository files
echo -e "\n${YELLOW}Creating temporary directory for repository files...${NC}"
TEMP_DIR=$(mktemp -d)
echo -e "${GREEN}✓ Temporary directory created at ${TEMP_DIR}${NC}\n"

# Create repository structure
echo -e "${YELLOW}Creating repository structure...${NC}"

# Create basic directories
mkdir -p $TEMP_DIR/src/components
mkdir -p $TEMP_DIR/src/hooks
mkdir -p $TEMP_DIR/src/types
mkdir -p $TEMP_DIR/src/services
mkdir -p $TEMP_DIR/docs
mkdir -p $TEMP_DIR/config

# Copy essential files from our project
echo -e "${YELLOW}Copying Matrix Upload Module files...${NC}"

# Check if files exist before copying
if [ -f "./client/src/components/MatrixUploadInterface.tsx" ]; then
    cp ./client/src/components/MatrixUploadInterface.tsx $TEMP_DIR/src/components/
else
    cp ./attached_assets/MatrixUploadInterface\ \(1\).tsx $TEMP_DIR/src/components/MatrixUploadInterface.tsx
fi

if [ -f "./client/src/hooks/use-mcp.ts" ]; then
    cp ./client/src/hooks/use-mcp.ts $TEMP_DIR/src/hooks/useMCPAgents.ts
else
    cp ./attached_assets/useMCPAgents.ts $TEMP_DIR/src/hooks/
fi

if [ -f "./server/mcp/agents.json" ]; then
    cp ./server/mcp/agents.json $TEMP_DIR/config/
else
    cp ./attached_assets/agents.json $TEMP_DIR/config/
fi

if [ -f "./attached_assets/Matrix_Upload_UX_Spec (1).md" ]; then
    cp "./attached_assets/Matrix_Upload_UX_Spec (1).md" $TEMP_DIR/docs/Matrix_UX_Spec.md
fi

if [ -f "./attached_assets/ReplitAgentPipeline (1).yaml" ]; then
    cp "./attached_assets/ReplitAgentPipeline (1).yaml" $TEMP_DIR/config/ReplitAgentPipeline.yaml
fi

echo -e "${GREEN}✓ Module files copied.${NC}\n"

# Create README.md
echo -e "${YELLOW}Creating README.md...${NC}"
cat > $TEMP_DIR/README.md << 'EOL'
# MCP Matrix Upload Module

An intelligent, agent-driven matrix file upload and processing system for the Benton County Building Cost Assessment platform.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

The MCP Matrix Upload Module provides a complete interface for uploading, validating, and processing cost matrix files. It leverages the MCP agent system to provide intelligent processing, validation, and insights for uploaded building cost matrices.

## Features

- Drag-and-drop upload interface with real-time validation
- Agent-driven processing and analysis of matrix files
- Intelligent error detection and recovery
- Building type and region detection
- Cost anomaly detection
- Integration with MCP DevOps Kit for agent orchestration

## Installation

```bash
npm install mcp-matrix-upload-module
```

## Quick Start

```jsx
import { MatrixUploadInterface } from 'mcp-matrix-upload-module';

function App() {
  return (
    <div className="app">
      <MatrixUploadInterface />
    </div>
  );
}
```

## Configuration

The module is designed to work with the MCP DevOps Kit and relies on the agent configuration defined in `config/agents.json`. To customize the agent behavior, modify this configuration file according to your needs.

## Documentation

See the [full documentation](./docs/Matrix_UX_Spec.md) for detailed information on the module's architecture, components, and integration guides.

## License

MIT
EOL

echo -e "${GREEN}✓ README.md created.${NC}\n"

# Create package.json
echo -e "${YELLOW}Creating package.json...${NC}"
cat > $TEMP_DIR/package.json << 'EOL'
{
  "name": "mcp-matrix-upload-module",
  "version": "1.0.0",
  "description": "MCP Matrix Upload Module for Benton County Assessment System",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepare": "npm run build"
  },
  "keywords": [
    "mcp",
    "matrix",
    "upload",
    "assessment",
    "benton",
    "county"
  ],
  "author": "Benton County Assessor's Office",
  "license": "MIT",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.5.0",
    "zod": "^3.22.2",
    "lucide-react": "^0.284.0",
    "@radix-ui/react-alert-dialog": "^1.0.4",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-toast": "^1.1.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.21",
    "@types/react-dom": "^18.2.7",
    "typescript": "^5.2.2",
    "tailwindcss": "^3.3.3",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.3"
  },
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0",
    "react-dom": "^17.0.0 || ^18.0.0"
  }
}
EOL

echo -e "${GREEN}✓ package.json created.${NC}\n"

# Create tsconfig.json
echo -e "${YELLOW}Creating tsconfig.json...${NC}"
cat > $TEMP_DIR/tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "jsx": "react-jsx",
    "declaration": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOL

echo -e "${GREEN}✓ tsconfig.json created.${NC}\n"

# Create src/index.ts exporting components
echo -e "${YELLOW}Creating src/index.ts...${NC}"
cat > $TEMP_DIR/src/index.ts << 'EOL'
// Main exports
export { default as MatrixUploadInterface } from './components/MatrixUploadInterface';
export { default as useMCPAgents } from './hooks/useMCPAgents';

// Export types
export * from './types';
EOL

echo -e "${GREEN}✓ src/index.ts created.${NC}\n"

# Create basic types
echo -e "${YELLOW}Creating type definitions...${NC}"
cat > $TEMP_DIR/src/types/index.ts << 'EOL'
// Agent types
export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  capabilities: string[];
  version: string;
  lastUpdated?: string;
}

// Matrix Summary types
export interface MatrixSummary {
  totalMatrices?: number;
  regions?: string[];
  buildingTypes?: string[];
  costRanges?: {
    min: number;
    max: number;
    avg: number;
  };
  quality?: {
    completeness: number;
    accuracy: number;
    consistency: number;
  };
}

// Import Status types
export interface ImportStatus {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
  error?: string;
  summary?: MatrixSummary;
}

// Matrix data types
export interface Matrix {
  id: string;
  name: string;
  buildingType: string;
  region: string;
  year: number;
  costRanges: {
    min: number;
    max: number;
    avg: number;
  };
  dataPoints: number;
}
EOL

echo -e "${GREEN}✓ Type definitions created.${NC}\n"

# Create .gitignore
echo -e "${YELLOW}Creating .gitignore...${NC}"
cat > $TEMP_DIR/.gitignore << 'EOL'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build
/dist

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
.env

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.idea
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
EOL

echo -e "${GREEN}✓ .gitignore created.${NC}\n"

# Create GitHub CI workflow
echo -e "${YELLOW}Creating GitHub Actions workflow...${NC}"
mkdir -p $TEMP_DIR/.github/workflows
cat > $TEMP_DIR/.github/workflows/ci.yml << 'EOL'
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build
    - run: npm test
EOL

echo -e "${GREEN}✓ GitHub Actions workflow created.${NC}\n"

# Initialize git repository
echo -e "${YELLOW}Initializing git repository...${NC}"
cd $TEMP_DIR
git init
git add .
git commit -m "Initial commit: MCP Matrix Upload Module"
echo -e "${GREEN}✓ Git repository initialized.${NC}\n"

# Create GitHub repository
echo -e "${YELLOW}Creating GitHub repository: ${REPO_NAME}...${NC}"
gh repo create $REPO_NAME --description="$REPO_DESC" --$VISIBILITY -y
git remote add origin https://github.com/$(gh api user | jq -r '.login')/$REPO_NAME.git
echo -e "${GREEN}✓ GitHub repository created.${NC}\n"

# Push code to GitHub
echo -e "${YELLOW}Pushing code to GitHub...${NC}"
git push -u origin main
echo -e "${GREEN}✓ Code pushed to GitHub.${NC}\n"

# Clean up
echo -e "${YELLOW}Cleaning up temporary directory...${NC}"
cd -
rm -rf $TEMP_DIR
echo -e "${GREEN}✓ Cleanup complete.${NC}\n"

echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}  MCP Matrix Upload Module repository setup complete!    ${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo -e "\nRepository URL: ${YELLOW}https://github.com/$(gh api user | jq -r '.login')/$REPO_NAME${NC}\n"
echo -e "You can now clone the repository and start using the module:\n"
echo -e "${YELLOW}git clone https://github.com/$(gh api user | jq -r '.login')/$REPO_NAME.git${NC}\n"
echo -e "To install dependencies and build the module:\n"
echo -e "${YELLOW}cd $REPO_NAME${NC}"
echo -e "${YELLOW}npm install${NC}"
echo -e "${YELLOW}npm run build${NC}\n"

echo -e "Happy coding! 🚀\n"