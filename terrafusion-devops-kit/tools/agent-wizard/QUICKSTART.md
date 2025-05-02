# Agent Configuration Wizard Quick Start Guide

This guide will help you get started with the TerraFusion Agent Configuration Wizard. Follow these steps to quickly set up and use the wizard.

## 📋 Prerequisites

- Node.js 18 or higher
- Access to TerraFusion deployment environment (for actual deployments)

## 🚀 Installation

### Option 1: Quick Installation

Run the installation script:

```bash
# From the repository root
./scripts/install-agent-wizard.sh
```

This will install the wizard and make the `agentctl` command available.

### Option 2: Manual Installation

```bash
# Navigate to the agent wizard directory
cd terrafusion-devops-kit/tools/agent-wizard

# Install dependencies
npm install

# Create a symlink to make the command available
npm link
```

## 🏃‍♂️ Run the Demo

To quickly see the wizard in action without interacting with it:

```bash
cd terrafusion-devops-kit/tools/agent-wizard
node demo.js
```

This will demonstrate the main features of the wizard.

## 🛠️ Basic Usage

### Launch the Interactive Wizard

The primary way to use the tool is through the interactive wizard:

```bash
agentctl wizard
```

This will guide you through:
- Creating a new agent manifest or editing an existing one
- Adding/editing/removing agents
- Configuring agent settings
- Setting coordination and observability parameters

### Validate a Manifest

To validate an existing agent manifest:

```bash
agentctl validate
```

By default, this will validate the manifest at `../swarm/agent-manifest.yaml`. You can specify a different file:

```bash
agentctl validate --file /path/to/your/manifest.yaml
```

### List Configured Agents

To see all agents configured in the manifest:

```bash
agentctl list
```

For more detailed information:

```bash
agentctl list --details
```

### Check Agent Status

To check the status of deployed agents:

```bash
agentctl status
```

To check a specific agent:

```bash
agentctl status --agent factor-tuner
```

### Deploy Agents

To deploy a specific agent:

```bash
agentctl deploy --agent factor-tuner
```

To deploy all agents:

```bash
agentctl deploy
```

## 🌍 Working with Environments

By default, the wizard operates on the `dev` environment. To specify a different environment:

```bash
agentctl --environment prod wizard
```

This environment setting applies to all commands:

```bash
agentctl --environment staging status
agentctl --environment prod deploy
```

## 📁 File Locations

- Default manifest location: `../swarm/agent-manifest.yaml`
- Configuration: `~/.config/terrafusion-agent-wizard/config.json`
- Logs: `~/.config/terrafusion-agent-wizard/logs/`

## 🚩 Common Issues

- **Cannot find module errors**: Run `npm install` in the agent-wizard directory
- **Command not found**: Ensure the installation script completed successfully
- **Permission denied**: Run `chmod +x` on the script files
- **Deployment failures**: Check network connectivity and credentials

## 🔜 Next Steps

After getting familiar with the wizard:

1. Review the [full documentation](README.md)
2. Explore the [agent manifest schema](../swarm/README.md)
3. Learn about the [monitoring dashboard](../monitoring/grafana/README.md)
4. Check out the [agent development guide](../docs/agent-development.md)