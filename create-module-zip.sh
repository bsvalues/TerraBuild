#!/bin/bash
# MCP Matrix Upload Module Zip Creator
# This script packages the MCP Matrix Upload Module files into a zip archive for easy upload to Replit

# Set colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print colored header
echo -e "\n${GREEN}=========================================================${NC}"
echo -e "${GREEN}       MCP Matrix Upload Module - Zip Package Creator      ${NC}"
echo -e "${GREEN}=========================================================${NC}\n"

# Get destination path
read -p "Enter destination path for the zip file (default: ./mcp-matrix-upload-module.zip): " ZIP_PATH
ZIP_PATH=${ZIP_PATH:-./mcp-matrix-upload-module.zip}

# Create temporary directory for module files
echo -e "\n${YELLOW}Creating temporary directory for module files...${NC}"
TEMP_DIR=$(mktemp -d)
echo -e "${GREEN}✓ Temporary directory created at ${TEMP_DIR}${NC}\n"

# Create module structure
mkdir -p $TEMP_DIR/components
mkdir -p $TEMP_DIR/hooks
mkdir -p $TEMP_DIR/config
mkdir -p $TEMP_DIR/docs

# Copy essential files
echo -e "${YELLOW}Copying Matrix Upload Module files...${NC}"

# Check if files exist before copying
if [ -f "./client/src/components/MatrixUploadInterface.tsx" ]; then
    cp ./client/src/components/MatrixUploadInterface.tsx $TEMP_DIR/components/
else
    cp ./attached_assets/MatrixUploadInterface\ \(1\).tsx $TEMP_DIR/components/MatrixUploadInterface.tsx
fi

if [ -f "./client/src/hooks/use-mcp.ts" ]; then
    cp ./client/src/hooks/use-mcp.ts $TEMP_DIR/hooks/useMCPAgents.ts
else
    cp ./attached_assets/useMCPAgents.ts $TEMP_DIR/hooks/
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

# Create README.md
cat > $TEMP_DIR/README.md << 'EOL'
# MCP Matrix Upload Module

An intelligent, agent-driven matrix file upload and processing system for the Benton County Building Cost Assessment platform.

## Overview

The MCP Matrix Upload Module provides a complete interface for uploading, validating, and processing cost matrix files. It leverages the MCP agent system to provide intelligent processing, validation, and insights for uploaded building cost matrices.

## Integration

1. Copy the components to your project:
   - `components/MatrixUploadInterface.tsx` → Your components directory
   - `hooks/useMCPAgents.ts` → Your hooks directory
   - `config/agents.json` → Your server/MCP configuration

2. Add the Matrix Upload page to your routing:
   ```tsx
   import MatrixUploadPage from '@/pages/MatrixUploadPage';
   
   // In your routing configuration:
   <Route path="/matrix-upload" component={MatrixUploadPage} />
   ```

3. Create a MatrixUploadPage component:
   ```tsx
   import React from 'react';
   import { MatrixUploadInterface } from '@/components/MatrixUploadInterface';
   
   const MatrixUploadPage = () => {
     return (
       <div className="container mx-auto p-4">
         <h1 className="text-2xl font-bold mb-4">Matrix Upload</h1>
         <MatrixUploadInterface />
       </div>
     );
   };
   
   export default MatrixUploadPage;
   ```

## Features

- Drag-and-drop upload interface with real-time validation
- Agent-driven processing and analysis of matrix files
- Intelligent error detection and recovery
- Building type and region detection
- Cost anomaly detection
- Integration with MCP DevOps Kit for agent orchestration

## Documentation

See the `docs/Matrix_UX_Spec.md` file for detailed information on the module's architecture, components, and integration specifics.
EOL

echo -e "${GREEN}✓ Module files prepared.${NC}\n"

# Create zip file
echo -e "${YELLOW}Creating zip archive at ${ZIP_PATH}...${NC}"
(cd $TEMP_DIR && zip -r $ZIP_PATH *)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Zip archive created successfully at ${ZIP_PATH}${NC}\n"
else
    echo -e "${RED}× Failed to create zip archive.${NC}\n"
    exit 1
fi

# Clean up
echo -e "${YELLOW}Cleaning up temporary directory...${NC}"
rm -rf $TEMP_DIR
echo -e "${GREEN}✓ Cleanup complete.${NC}\n"

echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}  MCP Matrix Upload Module zip package created!          ${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo -e "\nZip file location: ${YELLOW}${ZIP_PATH}${NC}\n"
echo -e "You can now upload this file to Replit or extract it in your project.\n"
echo -e "To extract:\n"
echo -e "${YELLOW}unzip ${ZIP_PATH} -d ./mcp-matrix-upload-module${NC}\n"

echo -e "Happy coding! 🚀\n"