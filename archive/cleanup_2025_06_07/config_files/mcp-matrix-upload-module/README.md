# MCP Matrix Upload Module

A fully-functional, interactive matrix file upload and analysis module for the Benton County Building Cost Assessment System.

## Overview

The MCP Matrix Upload Module provides a complete solution for uploading, validating, and analyzing cost matrix Excel files. It integrates with the Matrix Content Protocol (MCP) framework to provide intelligent processing using specialized agents.

## Features

- Drag-and-drop file upload interface
- Real-time validation and error reporting
- Excel file parsing with intelligent structure detection
- Cost insight generation and anomaly detection
- Building type and region identification
- Detailed visual feedback through the UI

## Quick Start

### 1. Installation

#### Option A: Using the Archive

Extract the module archive to your project:

```bash
tar -xzf mcp-matrix-upload-module.tar.gz -C temp_dir/
cp -r temp_dir/components/* your-project/src/components/
cp -r temp_dir/hooks/* your-project/src/hooks/
cp -r temp_dir/config/* your-project/server/mcp/
rm -rf temp_dir
```

#### Option B: Manual Copy

If you have the unarchived module, copy the files directly:

```bash
cp -r mcp-matrix-upload-module/components/* your-project/src/components/
cp -r mcp-matrix-upload-module/hooks/* your-project/src/hooks/
cp -r mcp-matrix-upload-module/config/* your-project/server/mcp/
```

### 2. Add Page Component

Create a new page component to use the Matrix Upload interface:

```tsx
// src/pages/MatrixUploadPage.tsx
import React from 'react';
import MatrixUploadInterface from '@/components/MatrixUploadInterface';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileSpreadsheet } from 'lucide-react';

export default function MatrixUploadPage() {
  return (
    <div className="container max-w-7xl mx-auto p-4 space-y-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center">
            <FileSpreadsheet className="mr-2 h-6 w-6 text-primary" />
            <CardTitle>Matrix Upload & Validation</CardTitle>
          </div>
          <CardDescription>
            Upload, validate, and analyze Benton County cost matrix files with AI assistance
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This interface provides a seamless process for uploading cost matrix files and validating their content.
            The system uses intelligent agents to check for issues, standardize the data format, and provide
            useful insights about cost trends and anomalies.
          </p>
        </CardContent>
      </Card>
      
      <MatrixUploadInterface />
    </div>
  );
}
```

### 3. Add Route

Add a route for the Matrix Upload page in your router configuration:

```tsx
// In your routing configuration (e.g., App.tsx)
import MatrixUploadPage from '@/pages/MatrixUploadPage';

// Add this to your routes
<Route path="/matrix-upload" component={MatrixUploadPage} />
```

## Components

### `MatrixUploadInterface`

The main component that handles file upload, agent communication, and result display. It includes:

- File upload zone with drag-and-drop support
- Status panel showing validation results
- Matrix preview table showing parsed data
- Cost insight panel displaying analysis results

### `useMCPAgents` Hook

A custom React hook for interacting with MCP agents. It provides:

- Agent status tracking
- Agent invocation
- Result handling
- Error management

## Agent Pipeline

The module uses three specialized agents:

1. **InquisitorAgent**: Validates matrix structure and content
2. **InterpreterAgent**: Parses Excel data into structured format
3. **VisualizerAgent**: Analyzes costs for insights and anomalies

The agent pipeline is defined in `ReplitAgentPipeline.yaml` and orchestrated by the MCP DevOps Kit.

## Configuration

The module is configured via the `agents.json` file, which defines the available agents and their endpoints.

## Documentation

For detailed information on the UX, see the [Matrix UX Specification](./docs/Matrix_UX_Spec.md).

## Customization

To customize the appearance, modify the components directly. The module uses Tailwind CSS for styling and is designed to be responsive.

## License

MIT