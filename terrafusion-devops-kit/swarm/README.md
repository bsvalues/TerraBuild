# TerraFusion AI Agent Swarm Orchestration

This directory contains the components necessary for orchestrating and managing the AI agent swarm in the TerraFusion platform. The agent swarm is a collection of specialized AI agents that work together to provide comprehensive infrastructure optimization services.

## 📋 Components

### 1. Agent Manifest (`agent-manifest.yaml`)

The agent manifest is the central configuration file that defines all aspects of agent behavior, scheduling, and coordination. It follows a declarative approach, allowing you to specify:

- Which agents should run in the system
- When and how agents should be executed (scheduled or triggered)
- How agents should interact with each other
- Agent-specific settings and behaviors
- Observability configurations

Key features:
- **Declarative configuration**: Define desired state, not procedures
- **Runtime reconfiguration**: Changes to the manifest can be applied without redeploying agents
- **Validation**: The manifest is validated before being applied
- **Environment-aware**: Can use different settings for different environments

### 2. Agent Runner (`agent-runner.ts`)

The agent runner is responsible for:
- Loading and validating the agent manifest
- Scheduling agent executions based on cron patterns
- Coordinating agent activities and handling inter-agent communication
- Monitoring agent health and performance
- Providing tracing and metrics for observability

The runner uses:
- Node.js cron for precise scheduling
- MCP (Model Content Protocol) framework for agent coordination
- Prometheus metrics for observability
- Health checks to ensure agent reliability

### 3. Agent Base Classes

Each agent is built on a standardized base implementation that provides:
- Lifecycle management (initialization, execution, termination)
- Communication with other agents
- Metrics collection
- Error handling
- Manifest-based configuration

## 🚀 Getting Started

### Running the Agent Swarm

The agent swarm can be run in multiple ways:

#### 1. Using Docker (Recommended for Production)

```bash
docker run -v /path/to/agent-manifest.yaml:/app/config/agent-manifest.yaml \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  terrafusion/agent-runner:latest
```

#### 2. Using Kubernetes (Recommended for Production)

Apply the Kubernetes manifests found in `/k8s-manifests/agents-deployment.yaml`

```bash
kubectl apply -f k8s-manifests/agents-deployment.yaml
```

This will create all necessary deployments, services, and configuration for the agent swarm.

#### 3. Running Locally (Development)

```bash
cd swarm
npm install
ts-node agent-runner.ts
```

### Customizing the Agent Manifest

Edit the `agent-manifest.yaml` file to:
- Add or remove agents
- Change agent scheduling parameters
- Adjust agent behavior settings
- Configure inter-agent communication rules

### Monitoring

The agent swarm exports metrics that can be scraped by Prometheus. A comprehensive Grafana dashboard is available in `monitoring/grafana/provisioning/dashboards/swarm-agent-activity.json`.

Key metrics include:
- Agent execution counts
- Execution duration
- Error rates
- Agent health status
- Model accuracy
- Resource usage (CPU, memory)
- User feedback

## 📊 Dashboards

The included Grafana dashboard provides visibility into:
- Agent status (online/offline)
- Agent performance metrics
- Execution history
- Error rates and types
- Model accuracy
- User feedback

## 🔧 Troubleshooting

Common issues:

1. **Agent fails to start**
   - Check the agent logs
   - Verify the agent manifest is properly formatted
   - Ensure the agent has access to required resources

2. **Agent scheduling issues**
   - Verify cron expressions in the manifest
   - Check for timezone issues
   - Look for error logs during scheduling

3. **Poor agent performance**
   - Check system resources (CPU, memory)
   - Look for bottlenecks in external dependencies
   - Verify model accuracy metrics

## 🔐 Security Considerations

1. **Agent permissions**
   - Agents run with least privilege
   - Service accounts are scoped to minimum required permissions
   - All agent communications are authenticated

2. **Secret management**
   - Secrets are not stored in the manifest
   - Use Kubernetes secrets or HashiCorp Vault for credential management
   - API keys are rotated regularly

3. **Network security**
   - Agents communicate on internal network only
   - External API access is controlled through API Gateway
   - All connections use TLS

## 📚 Best Practices

1. **Manifest management**
   - Store manifests in version control
   - Use environment-specific overrides
   - Validate changes before deployment

2. **Scaling**
   - Configure resource limits appropriately
   - Use horizontal scaling for increased load
   - Monitor resource usage and adjust as needed

3. **Observability**
   - Set up alerts for agent failures
   - Monitor long-term trends in agent performance
   - Use distributed tracing for complex agent interactions