# TerraBuild Frontend

This directory contains the React frontend application for TerraBuild, a property valuation platform for county assessor's offices.

## Overview

The TerraBuild frontend provides a user interface for:

- Viewing and editing cost matrix data
- Receiving AI-powered agent insights
- Comparing valuation scenarios
- Generating PDF and JSON exports
- Visualizing valuation trends

## Getting Started

### Prerequisites

- Node.js 18+ (LTS version recommended)
- npm 8+

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your environment (see [Environment Configuration](../docs/development/environment_config.md) for details).

### Development

Start the development server:

```bash
npm run dev
```

This will start the application at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `build` directory.

## Directory Structure

```
src/
├── components/       # UI components
│   ├── AgentFeed.tsx
│   ├── BentonCountyHeader.tsx
│   ├── EditableMatrixView.tsx
│   ├── ExportJustification.tsx
│   ├── InsightSummaryCard.tsx
│   ├── ValuationDashboard.tsx
│   ├── ValuationTimelineChart.tsx
│   └── ValueScenarioCompare.tsx
├── hooks/           # Custom React hooks
├── pages/           # Page components
│   └── BentonValuationDashboard.tsx
├── services/        # API services
├── utils/           # Utility functions
├── App.tsx          # Main application component
└── config.ts        # Environment configuration
```

## Key Components

### ValuationDashboard

The main dashboard component that brings together all the valuation tools.

### EditableMatrixView

Interactive matrix editor for cost values with audit trail.

### AgentFeed

Displays real-time insights from AI agents analyzing the cost data.

### ExportJustification

Handles the generation of PDF and JSON exports for documentation.

## Configuration

See the [Environment Configuration](../docs/development/environment_config.md) document for details on configuring the frontend application.

## Deployment

The frontend can be deployed to Vercel, Netlify, or other static site hosting services. See the [Vercel Deployment Guide](../docs/deployment/vercel_deployment.md) for detailed instructions.

## Related Documentation

- [Main README](../README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Deployment Guides](../docs/deployment/)
- [Demo Scripts](../docs/demo/)