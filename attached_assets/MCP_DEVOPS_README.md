
# Benton County MCP (Municipal Control Program) DevOps Kit

This repository contains the foundational components of the MCP—an intelligent, agent-based orchestration system designed to automate, monitor, and improve data workflows in the Benton County Assessor's Office.

## Contents

- `agents.json`: Machine-readable agent registry
- `README.md`: Overview of architecture and deployment
- `PRD.md`: Full product requirements document
- `/server/mcp/`: Core orchestrator and agent logic
- `/client/`: Frontend UI for agent status, visualization, and control

## Quick Start

1. **Install dependencies**
```bash
npm install
```

2. **Run the MCP backend**
```bash
npm run start:mcp
```

3. **Access the dashboard**
Navigate to: `http://localhost:3000/dashboard`

4. **Trigger an agent manually**
Use the Agent Test Harness UI or call:
```bash
curl -X POST http://localhost:3000/mcp/agent/run -d '{"agent": "dataQualityAgent"}'
```

## Deployment

We recommend using Docker or a Node process manager (e.g. PM2) for deployment in production. A PostgreSQL instance is required for persistent storage and audit logging.

## Architecture

- **Orchestrator**: Handles execution and chaining of agents
- **Agents**: Self-contained services (data quality, cost estimation, geospatial analysis, etc.)
- **UI**: React + Tailwind dashboard for controlling and observing agents
- **EventBus**: Optional async coordination mechanism

## License

MIT © Benton County IT Department
