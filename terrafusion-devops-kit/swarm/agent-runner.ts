/**
 * TerraFusion AI Agent Runner
 * 
 * This module handles the dynamic scheduling, execution, and coordination of
 * AI agents based on the agent-manifest.yaml configuration.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import * as os from 'os';
import { logger } from '../server/lib/logger';
import { AgentCoordinator } from '../server/mcp/framework/coordinator';
import { MCPFramework } from '../server/mcp/framework';

// Define types for the agent manifest
interface AgentSettings {
  [key: string]: any;
}

interface AgentDefinition {
  name: string;
  version: string;
  description?: string;
  mode: 'autonomous' | 'suggestive' | 'watchdog' | 'collaborative';
  schedule?: string;
  trigger_on?: string;
  memory?: 'persistent' | 'ephemeral' | 'none';
  sensitivity?: 'low' | 'medium' | 'high';
  on_anomaly?: 'suggest_correction' | 'log_and_notify' | 'auto_correct';
  source?: string[];
  alert_threshold?: string;
  max_outputs?: number;
  feedback_loop?: boolean;
  escalation_policy?: string;
  settings?: AgentSettings;
}

interface CoordinationConfig {
  conflict_resolution: string;
  agent_priorities: string[];
  communication_allowed: boolean;
  shared_memory_enabled: boolean;
  orchestrator: string;
  max_concurrent_agents: number;
  health_check_interval: string;
  retry_policy: {
    max_retries: number;
    backoff_factor: number;
    initial_delay: string;
  };
}

interface ObservabilityConfig {
  metrics_endpoint: string;
  logging: {
    format: string;
    destination: string;
    additional_outputs?: Array<{
      type: string;
      url: string;
    }>;
  };
  tracing: {
    enabled: boolean;
    sampler_type: string;
    sampler_param: number;
    exporter: string;
  };
  alerting: {
    channels: Array<{
      name: string;
      webhook?: string;
      recipients?: string;
    }>;
  };
}

interface AgentManifest {
  version: string;
  environment: string;
  default_settings: {
    memory: string;
    feedback_loop: boolean;
    log_level: string;
    metrics_enabled: boolean;
    sensitivity: string;
  };
  agents: AgentDefinition[];
  coordination: CoordinationConfig;
  observability: ObservabilityConfig;
}

// Class to manage agent execution
export class AgentRunner extends EventEmitter {
  private manifest: AgentManifest;
  private manifestPath: string;
  private scheduledJobs: Map<string, cron.ScheduledTask>;
  private runningAgents: Map<string, any>;
  private coordinator: AgentCoordinator;
  private framework: MCPFramework;
  private agentModules: Map<string, any>;
  private healthCheckInterval: NodeJS.Timeout | null;

  constructor(manifestPath: string = process.env.AGENT_MANIFEST_PATH || '/app/config/agent-manifest.yaml') {
    super();
    this.manifestPath = manifestPath;
    this.scheduledJobs = new Map();
    this.runningAgents = new Map();
    this.agentModules = new Map();
    this.healthCheckInterval = null;
    
    // Load manifest
    this.manifest = this.loadManifest();
    
    // Initialize MCP framework and coordinator
    this.framework = new MCPFramework();
    this.coordinator = new AgentCoordinator(this.framework);
    
    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Load and validate the agent manifest
   */
  private loadManifest(): AgentManifest {
    try {
      const fileContents = fs.readFileSync(this.manifestPath, 'utf8');
      const manifest = yaml.load(fileContents) as AgentManifest;
      
      this.validateManifest(manifest);
      
      logger.info(`Agent manifest loaded successfully: ${manifest.version}, environment: ${manifest.environment}`);
      return manifest;
    } catch (error) {
      logger.error(`Failed to load agent manifest: ${error}`);
      throw new Error(`Failed to load agent manifest: ${error}`);
    }
  }

  /**
   * Validate the agent manifest structure
   */
  private validateManifest(manifest: AgentManifest): void {
    // Check required fields
    if (!manifest.version) {
      throw new Error('Manifest version is required');
    }
    
    if (!manifest.agents || !Array.isArray(manifest.agents)) {
      throw new Error('Agents array is required in manifest');
    }
    
    // Validate each agent
    manifest.agents.forEach(agent => {
      if (!agent.name) {
        throw new Error('Agent name is required');
      }
      
      if (!agent.version) {
        throw new Error(`Agent ${agent.name} is missing version`);
      }
      
      if (!agent.mode) {
        throw new Error(`Agent ${agent.name} is missing mode`);
      }
      
      // Check mode-specific requirements
      if (agent.mode === 'autonomous' && !agent.schedule) {
        throw new Error(`Autonomous agent ${agent.name} must have a schedule`);
      }
      
      if (agent.mode === 'suggestive' && !agent.trigger_on) {
        throw new Error(`Suggestive agent ${agent.name} must have a trigger_on field`);
      }
      
      if (agent.mode === 'watchdog' && !agent.alert_threshold) {
        throw new Error(`Watchdog agent ${agent.name} must have an alert_threshold`);
      }
    });
  }

  /**
   * Setup event handlers for agent coordination
   */
  private setupEventHandlers(): void {
    // Agent completion handler
    this.on('agent:completed', (agentName: string, result: any) => {
      logger.info(`Agent ${agentName} completed execution`, { result });
      this.runningAgents.delete(agentName);
    });
    
    // Agent error handler
    this.on('agent:error', (agentName: string, error: Error) => {
      logger.error(`Agent ${agentName} encountered an error: ${error.message}`);
      this.runningAgents.delete(agentName);
      
      // Implement retry logic based on coordination configuration
      const retryPolicy = this.manifest.coordination.retry_policy;
      if (retryPolicy && retryPolicy.max_retries > 0) {
        // TODO: Implement retry logic
      }
    });
    
    // Inter-agent communication
    if (this.manifest.coordination.communication_allowed) {
      this.on('agent:message', (fromAgent: string, toAgent: string, message: any) => {
        logger.debug(`Message from ${fromAgent} to ${toAgent}`, { message });
        
        // Deliver message to target agent if it's running
        const targetAgent = this.runningAgents.get(toAgent);
        if (targetAgent && typeof targetAgent.receiveMessage === 'function') {
          targetAgent.receiveMessage(fromAgent, message);
        } else {
          // Queue message for later delivery
          // TODO: Implement message queue
        }
      });
    }
  }

  /**
   * Initialize and schedule all agents from the manifest
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing agent runner...');
    
    try {
      await this.framework.initialize();
      await this.coordinator.initialize();
      
      // Load agent modules
      await this.loadAgentModules();
      
      // Schedule autonomous agents
      this.scheduleAgents();
      
      // Setup health checks
      this.setupHealthChecks();
      
      // Register event handlers with the MCP framework
      this.registerWithMCP();
      
      logger.info('Agent runner initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize agent runner: ${error}`);
      throw error;
    }
  }

  /**
   * Load all agent modules
   */
  private async loadAgentModules(): Promise<void> {
    for (const agent of this.manifest.agents) {
      try {
        // Convert agent name to module path (e.g., factor-tuner -> FactorTunerAgent)
        const moduleName = agent.name
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('') + 'Agent';
        
        // First try TypeScript/JavaScript agent
        try {
          const agentModule = await import(`../server/agents/${agent.name}`);
          this.agentModules.set(agent.name, agentModule);
          logger.info(`Loaded JavaScript agent module: ${agent.name}`);
        } catch (jsError) {
          // If not found, try Python agent
          try {
            // This is a placeholder for Python agent loading
            // In a real implementation, this would use something like
            // python-shell to invoke Python agents
            logger.info(`JavaScript agent module not found for ${agent.name}, assuming Python agent`);
            this.agentModules.set(agent.name, {
              createAgent: () => {
                // Placeholder for Python agent creation
                return {
                  execute: async () => {
                    // Execute Python agent via shell command or other means
                    logger.info(`Executing Python agent: ${agent.name}`);
                  }
                };
              }
            });
          } catch (pyError) {
            throw new Error(`Could not load agent module for ${agent.name}: ${jsError}, ${pyError}`);
          }
        }
      } catch (error) {
        logger.error(`Failed to load agent module for ${agent.name}: ${error}`);
        throw error;
      }
    }
  }

  /**
   * Schedule all autonomous agents
   */
  private scheduleAgents(): void {
    for (const agent of this.manifest.agents) {
      if (agent.mode === 'autonomous' && agent.schedule) {
        try {
          if (!cron.validate(agent.schedule)) {
            logger.error(`Invalid cron schedule for agent ${agent.name}: ${agent.schedule}`);
            continue;
          }
          
          const job = cron.schedule(agent.schedule, () => {
            this.executeAgent(agent.name, { scheduled: true });
          });
          
          this.scheduledJobs.set(agent.name, job);
          logger.info(`Scheduled agent ${agent.name} with cron: ${agent.schedule}`);
        } catch (error) {
          logger.error(`Failed to schedule agent ${agent.name}: ${error}`);
        }
      }
    }
  }

  /**
   * Setup periodic health checks for all agents
   */
  private setupHealthChecks(): void {
    const interval = this.manifest.coordination.health_check_interval || '60s';
    const intervalMs = this.parseTimeString(interval);
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
    
    logger.info(`Health checks configured with interval: ${interval}`);
  }

  /**
   * Perform health check on all agents
   */
  private performHealthCheck(): void {
    logger.debug('Performing agent health check');
    
    for (const [agentName, agent] of this.runningAgents.entries()) {
      // Check if agent is still responsive
      const lastHeartbeat = agent.lastHeartbeat || 0;
      const currentTime = Date.now();
      
      // If no heartbeat in the last 5 minutes, consider the agent unresponsive
      if (currentTime - lastHeartbeat > 5 * 60 * 1000) {
        logger.warn(`Agent ${agentName} appears to be unresponsive`);
        
        // Try to terminate the agent
        try {
          this.terminateAgent(agentName);
        } catch (error) {
          logger.error(`Failed to terminate unresponsive agent ${agentName}: ${error}`);
        }
      }
    }
    
    // Report system stats
    const systemStats = {
      memory: process.memoryUsage(),
      cpu: os.loadavg(),
      uptime: process.uptime(),
      agentCount: this.runningAgents.size
    };
    
    logger.debug('System stats', { systemStats });
  }

  /**
   * Register with the MCP framework
   */
  private registerWithMCP(): void {
    // Register to receive agent-related events
    this.framework.on('agent:request', (agentName: string, request: any) => {
      // Handle agent execution requests
      if (request.action === 'execute') {
        this.executeAgent(agentName, request.params);
      }
    });
    
    // Register to handle task completions
    this.framework.on('task:completed', (taskId: string, result: any) => {
      // Find the agent associated with this task
      for (const [agentName, agent] of this.runningAgents.entries()) {
        if (agent.taskId === taskId) {
          this.emit('agent:completed', agentName, result);
          break;
        }
      }
    });
    
    // Register to handle task failures
    this.framework.on('task:failed', (taskId: string, error: Error) => {
      // Find the agent associated with this task
      for (const [agentName, agent] of this.runningAgents.entries()) {
        if (agent.taskId === taskId) {
          this.emit('agent:error', agentName, error);
          break;
        }
      }
    });
  }

  /**
   * Execute a specific agent
   */
  public async executeAgent(agentName: string, params: any = {}): Promise<any> {
    logger.info(`Executing agent: ${agentName}`, { params });
    
    // Find agent definition
    const agentDef = this.manifest.agents.find(a => a.name === agentName);
    if (!agentDef) {
      const error = new Error(`Agent not found in manifest: ${agentName}`);
      logger.error(error.message);
      throw error;
    }
    
    // Check if agent is already running
    if (this.runningAgents.has(agentName)) {
      logger.warn(`Agent ${agentName} is already running, skipping execution`);
      return;
    }
    
    try {
      // Get agent module
      const agentModule = this.agentModules.get(agentName);
      if (!agentModule) {
        throw new Error(`Agent module not loaded: ${agentName}`);
      }
      
      // Create agent instance
      const agent = agentModule.createAgent({
        name: agentDef.name,
        version: agentDef.version,
        mode: agentDef.mode,
        settings: {
          ...this.manifest.default_settings,
          ...agentDef.settings
        },
        framework: this.framework,
        params
      });
      
      // Generate a task ID
      const taskId = uuidv4();
      agent.taskId = taskId;
      agent.lastHeartbeat = Date.now();
      
      // Register the running agent
      this.runningAgents.set(agentName, agent);
      
      // Start the agent execution
      const result = await agent.execute();
      
      // Handle agent completion
      this.emit('agent:completed', agentName, result);
      
      return result;
    } catch (error) {
      logger.error(`Error executing agent ${agentName}: ${error}`);
      this.emit('agent:error', agentName, error);
      throw error;
    }
  }

  /**
   * Trigger an agent based on an event
   */
  public triggerAgent(agentName: string, trigger: string, data: any = {}): void {
    logger.info(`Triggering agent ${agentName} on ${trigger}`, { data });
    
    // Find agent definition
    const agentDef = this.manifest.agents.find(a => a.name === agentName);
    if (!agentDef) {
      logger.error(`Agent not found in manifest: ${agentName}`);
      return;
    }
    
    // Check if agent responds to this trigger
    if (agentDef.trigger_on !== trigger) {
      logger.debug(`Agent ${agentName} does not respond to trigger: ${trigger}`);
      return;
    }
    
    // Execute the agent with trigger data
    this.executeAgent(agentName, { triggered: true, trigger, data });
  }

  /**
   * Terminate a running agent
   */
  public terminateAgent(agentName: string): void {
    logger.info(`Terminating agent: ${agentName}`);
    
    const agent = this.runningAgents.get(agentName);
    if (!agent) {
      logger.warn(`Agent ${agentName} is not running`);
      return;
    }
    
    // Call terminate method if available
    if (typeof agent.terminate === 'function') {
      agent.terminate();
    }
    
    // Remove from running agents
    this.runningAgents.delete(agentName);
    
    logger.info(`Agent ${agentName} terminated`);
  }

  /**
   * Reload the agent manifest
   */
  public reloadManifest(): void {
    logger.info('Reloading agent manifest');
    
    try {
      const newManifest = this.loadManifest();
      
      // Stop all scheduled jobs
      this.scheduledJobs.forEach(job => job.stop());
      this.scheduledJobs.clear();
      
      // Update the manifest
      this.manifest = newManifest;
      
      // Reschedule agents
      this.scheduleAgents();
      
      logger.info('Agent manifest reloaded successfully');
    } catch (error) {
      logger.error(`Failed to reload agent manifest: ${error}`);
      throw error;
    }
  }

  /**
   * Shutdown the agent runner
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down agent runner');
    
    // Stop health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Stop all scheduled jobs
    this.scheduledJobs.forEach(job => job.stop());
    this.scheduledJobs.clear();
    
    // Terminate all running agents
    for (const agentName of this.runningAgents.keys()) {
      this.terminateAgent(agentName);
    }
    
    // Shut down MCP framework
    await this.framework.shutdown();
    
    logger.info('Agent runner shut down successfully');
  }

  /**
   * Parse a time string like "30s", "5m", etc. into milliseconds
   */
  private parseTimeString(timeStr: string): number {
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 60000; // Default to 1 minute
    }
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60000;
    }
  }
}

// Export singleton instance
let instance: AgentRunner | null = null;

export function getAgentRunner(): AgentRunner {
  if (!instance) {
    instance = new AgentRunner();
  }
  return instance;
}

// Main execution when run directly
if (require.main === module) {
  const runner = getAgentRunner();
  
  runner.initialize()
    .then(() => {
      logger.info('Agent runner started successfully');
    })
    .catch(error => {
      logger.error(`Failed to start agent runner: ${error}`);
      process.exit(1);
    });
  
  // Handle process termination
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM signal');
    await runner.shutdown();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal');
    await runner.shutdown();
    process.exit(0);
  });
}