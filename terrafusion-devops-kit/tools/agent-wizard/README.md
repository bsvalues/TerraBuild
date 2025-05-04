# TerraFusion Agent Control CLI (agentctl)

A powerful command-line interface for managing and monitoring TerraFusion AI agent swarms.

## Overview

The TerraFusion Agent Control CLI (`agentctl`) provides a comprehensive set of tools for managing AI agent swarms within the TerraFusion platform. It enables DevOps engineers and platform administrators to deploy, monitor, and control AI agents across different environments.

## Features

- **Agent Configuration**: Interactive wizard for creating and configuring agent manifests
- **Validation**: Validate agent manifests against schema and best practices
- **Deployment**: Deploy agents to Kubernetes clusters
- **Monitoring**: Check agent status and health
- **Log Access**: View and follow agent logs
- **Execution**: Execute actions on specific agents
- **Training**: Trigger model training for agents
- **Benchmarking**: Run performance benchmarks
- **Configuration Management**: Import and export configuration

## Installation

### Using npm

```bash
npm install -g agentctl
```

### Building from Source

```bash
git clone https://github.com/terrafusion/agent-control.git
cd agent-control
npm install
npm run build
npm link
```

## Usage

### Basic Commands

```bash
# Display help
agentctl --help

# Check agent status
agentctl status

# View agent logs
agentctl logs --agent data-processor

# Validate agent manifest
agentctl validate --path ./agent-manifest.yaml

# Deploy agents
agentctl deploy

# Execute an action on an agent
agentctl execute data-processor process --data '{"input": "example"}'
```

### Interactive Agent Configuration

```bash
# Start the interactive agent configuration wizard
agentctl wizard
```

### Agent Training

```bash
# Train all agents
agentctl train

# Train a specific agent
agentctl train --agent model-inference

# Perform full retraining
agentctl train --full
```

### Performance Benchmarking

```bash
# Run benchmarks on all agents
agentctl benchmark

# Benchmark a specific agent with custom settings
agentctl benchmark --agent data-processor --concurrency 10 --iterations 1000
```

### Configuration Management

```bash
# Export configuration to a file
agentctl export --output config.yaml --format yaml

# Import configuration from a file
agentctl import config.yaml --merge
```

## Environment Configuration

`agentctl` supports multiple environments (dev, staging, prod) with different settings for each. The current environment can be specified with the `--environment` flag, or by setting it in the configuration.

```bash
# Set the target environment
agentctl --environment staging status

# Configure a new environment
agentctl config set-environment prod --api-url https://api.terrafusion.io
```

## Directory Structure

```
├── bin/                # Compiled binary
├── src/                # Source code
│   ├── commands/       # Command implementations
│   ├── lib/            # Utility libraries
│   └── index.ts        # Main entry point
├── dist/               # Compiled JavaScript
├── package.json        # npm package configuration
└── tsconfig.json       # TypeScript configuration
```

## Development

### Setting Up a Development Environment

1. Clone the repository
2. Install dependencies: `npm install`
3. Run in development mode: `npm run dev`

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

## Contributing

Contributions are welcome! Please see the contributing guidelines for more information.

## License

MIT

## Support

For support or feature requests, please open an issue on the GitHub repository or contact the TerraFusion team.