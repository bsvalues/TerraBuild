# TerraFusion Agent Configuration Wizard

A user-friendly command-line tool for configuring, deploying, and managing AI agents in the TerraFusion platform.

## 🌟 Features

- **Interactive Configuration**: Configure agents through an intuitive CLI wizard
- **Agent Management**: Add, edit, and remove agents from the manifest
- **Validation**: Validate agent manifests against schema requirements
- **Deployment**: Deploy agents to different environments
- **Status Checking**: Monitor the status of deployed agents
- **Environment Support**: Configure agents differently for dev, staging, and prod environments

## 📋 Requirements

- Node.js 18 or higher
- Access to TerraFusion deployment environment

## 🚀 Installation

### Option 1: Install from NPM

```bash
npm install -g terrafusion-agent-wizard
```

### Option 2: Download pre-built binary

Download the appropriate binary for your platform from the [releases page](https://github.com/benton-county/terrafusion-devops-kit/releases).

### Option 3: Build from source

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/benton-county/terrafusion-devops-kit

# Navigate to the agent wizard directory
cd terrafusion-devops-kit/tools/agent-wizard

# Install dependencies
npm install

# Build the tool
npm run build
```

## 🛠️ Usage

The agent wizard provides several commands for managing agents:

### Interactive Wizard

The easiest way to configure agents is through the interactive wizard:

```bash
agentctl wizard
```

This will guide you through the process of configuring agents.

### Validate Manifest

To validate an existing agent manifest:

```bash
agentctl validate
```

### List Configured Agents

To list all agents configured in the manifest:

```bash
agentctl list
```

For detailed information about each agent:

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

By default, agents are deployed to the `dev` environment. To specify a different environment:

```bash
agentctl deploy --environment prod
```

## 🔄 Agent Lifecycle

1. **Configure**: Create or modify agent configuration in the manifest
2. **Validate**: Ensure the manifest is valid
3. **Deploy**: Deploy the agent to the target environment
4. **Monitor**: Check agent status and performance
5. **Update**: Modify configuration and redeploy as needed

## 🤖 Available Agent Types

The TerraFusion platform supports several specialized agent types:

- **factor-tuner**: Optimizes adjustment factors for cost calculations
- **benchmark-guard**: Monitors and validates benchmark data accuracy
- **curve-trainer**: Trains and updates cost prediction curves
- **scenario-agent**: Creates what-if scenarios for cost impact analysis
- **boe-arguer**: Generates arguments and evidence for BOE hearings

## ⚙️ Agent Modes

Agents can operate in different modes:

- **autonomous**: Runs on a schedule (requires `schedule` parameter)
- **suggestive**: Triggered by events (requires `trigger_on` parameter)
- **watchdog**: Monitors system health (requires `alert_threshold` parameter)
- **collaborative**: Works with other agents

## 📊 Agent Manifest Structure

The agent manifest is a YAML file that defines all aspects of agent behavior:

```yaml
version: "1.0.0"
environment: dev

default_settings:
  memory: persistent
  feedback_loop: true
  log_level: info
  metrics_enabled: true
  sensitivity: medium

agents:
  - name: factor-tuner
    version: 1.0.0
    description: Optimizes adjustment factors for cost calculations
    mode: autonomous
    schedule: "0 */6 * * *"
    # Additional settings...

coordination:
  conflict_resolution: priority_based
  agent_priorities:
    - benchmark-guard
    - factor-tuner
    # Other priorities...
  # Additional coordination settings...

observability:
  # Observability settings...
```

See the [Agent Manifest Schema](https://docs.terrafusion.io/agent-manifest-schema) documentation for a complete reference.

## 🔍 Troubleshooting

### Common Issues

- **Agent deployment fails**: Ensure the agent configuration is valid and the deployment environment is accessible
- **Agent not responding**: Check network connectivity and agent logs
- **Validation errors**: Review the manifest structure against the schema requirements
- **Status command fails**: Verify that you have permission to access the agent orchestrator

### Getting Help

If you encounter issues not covered here, please:

1. Check the [TerraFusion Documentation](https://docs.terrafusion.io)
2. Contact the TerraFusion DevOps team at devops@benton-county.org
3. Open an issue on the [GitHub repository](https://github.com/benton-county/terrafusion-devops-kit/issues)

## 📝 License

This tool is part of the TerraFusion DevOps Kit, licensed under the MIT License.