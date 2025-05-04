/**
 * TerraFusion Agent Runner Script
 * 
 * This script is responsible for running agents based on the agent manifest.
 * It handles agent lifecycle, scheduling, and communication.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import cron from 'node-cron';
import { EventEmitter } from 'events';
import { logger } from '../lib/logger';
import { AgentCoordinator } from '../lib/coordinator';
import { AgentFramework } from '../lib/framework';

// Agent manifest path
const MANIFEST_PATH = process.env.AGENT_MANIFEST_PATH || path.join(__dirname, 'agent-manifest.yaml');

// Agent runtime state
interface AgentState {
  name: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  health: number;
  lastUpdated: Date;
  metrics: Record<string, any>;
}

// Agent registry to track running agents
const agentRegistry = new Map<string, AgentState>();

// Event bus for agent communication
const eventBus = new EventEmitter();

/**
 * Load the agent manifest from file
 * @returns Parsed agent manifest
 */
function loadManifest() {
  try {
    logger.info(`Loading agent manifest from ${MANIFEST_PATH}`);
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return yaml.load(manifestContent);
  } catch (error) {
    logger.error(`Failed to load agent manifest: ${error}`);
    process.exit(1);
  }
}

/**
 * Start an agent
 * @param agent Agent configuration
 */
function startAgent(agent: any) {
  logger.info(`Starting agent: ${agent.name}`);
  
  // Initialize agent state
  agentRegistry.set(agent.name, {
    name: agent.name,
    status: 'starting',
    health: 100,
    lastUpdated: new Date(),
    metrics: {},
  });
  
  // Simulate agent startup process
  setTimeout(() => {
    logger.info(`Agent ${agent.name} started successfully`);
    
    // Update agent state
    agentRegistry.set(agent.name, {
      name: agent.name,
      status: 'running',
      health: 100,
      lastUpdated: new Date(),
      metrics: {
        cpu: '10%',
        memory: `${Math.floor(Math.random() * 500)}Mi`,
        requests: 0,
      },
    });
    
    // Emit agent started event
    eventBus.emit('agent:started', { agent: agent.name });
  }, 2000);
}

/**
 * Stop an agent
 * @param agentName Agent name
 */
function stopAgent(agentName: string) {
  logger.info(`Stopping agent: ${agentName}`);
  
  const agentState = agentRegistry.get(agentName);
  
  if (!agentState) {
    logger.warn(`Agent ${agentName} not found in registry`);
    return;
  }
  
  // Update agent state
  agentRegistry.set(agentName, {
    ...agentState,
    status: 'stopping',
    lastUpdated: new Date(),
  });
  
  // Simulate agent shutdown process
  setTimeout(() => {
    logger.info(`Agent ${agentName} stopped successfully`);
    
    // Update agent state
    agentRegistry.set(agentName, {
      ...agentState,
      status: 'stopped',
      lastUpdated: new Date(),
    });
    
    // Emit agent stopped event
    eventBus.emit('agent:stopped', { agent: agentName });
  }, 1500);
}

/**
 * Get agent status
 * @param agentName Agent name (optional)
 * @returns Agent status
 */
function getAgentStatus(agentName?: string) {
  if (agentName) {
    return agentRegistry.get(agentName);
  }
  
  return Array.from(agentRegistry.entries()).map(([name, state]) => ({
    name,
    ...state,
  }));
}

/**
 * Update agent health based on metrics
 */
function updateAgentHealth() {
  for (const [agentName, state] of agentRegistry.entries()) {
    if (state.status !== 'running') {
      continue;
    }
    
    // Simulate some random health metrics
    const cpuUsage = parseInt(state.metrics.cpu, 10) || 0;
    const memoryUsage = parseInt(state.metrics.memory, 10) || 0;
    
    // Calculate health score based on resource usage
    let health = 100;
    
    if (cpuUsage > 80) {
      health -= 20;
    } else if (cpuUsage > 60) {
      health -= 10;
    } else if (cpuUsage > 40) {
      health -= 5;
    }
    
    if (memoryUsage > 800) {
      health -= 20;
    } else if (memoryUsage > 600) {
      health -= 10;
    } else if (memoryUsage > 400) {
      health -= 5;
    }
    
    // Apply some random fluctuation
    health += Math.floor(Math.random() * 10) - 5;
    health = Math.max(0, Math.min(100, health));
    
    // Update agent state
    agentRegistry.set(agentName, {
      ...state,
      health,
      lastUpdated: new Date(),
    });
    
    // Emit health update event
    eventBus.emit('agent:health', { agent: agentName, health });
  }
}

/**
 * Start the agent runner
 */
async function startAgentRunner() {
  logger.info('Starting TerraFusion Agent Runner');
  
  // Load agent manifest
  const manifest = loadManifest();
  
  // Start agents
  for (const agent of manifest.agents) {
    startAgent(agent);
  }
  
  // Schedule health updates
  setInterval(updateAgentHealth, 10000);
  
  // Schedule agent metrics collection
  cron.schedule('*/1 * * * *', () => {
    logger.info('Collecting agent metrics');
    
    for (const [agentName, state] of agentRegistry.entries()) {
      if (state.status !== 'running') {
        continue;
      }
      
      // Simulate updating metrics
      agentRegistry.set(agentName, {
        ...state,
        metrics: {
          cpu: `${Math.floor(Math.random() * 80)}%`,
          memory: `${Math.floor(Math.random() * 800)}Mi`,
          requests: (state.metrics.requests || 0) + Math.floor(Math.random() * 100),
        },
        lastUpdated: new Date(),
      });
    }
    
    // Log agent status
    logger.info('Agent Status:');
    for (const [agentName, state] of agentRegistry.entries()) {
      logger.info(`- ${agentName}: ${state.status} (health: ${state.health}%)`);
    }
  });
  
  // Set up event listeners
  eventBus.on('agent:started', (data) => {
    logger.info(`Event: Agent ${data.agent} started`);
  });
  
  eventBus.on('agent:stopped', (data) => {
    logger.info(`Event: Agent ${data.agent} stopped`);
  });
  
  eventBus.on('agent:health', (data) => {
    if (data.health < 50) {
      logger.warn(`Event: Agent ${data.agent} health degraded to ${data.health}%`);
    }
  });
  
  logger.info('TerraFusion Agent Runner started successfully');
}

// Start the agent runner if executed directly
if (require.main === module) {
  startAgentRunner().catch((error) => {
    logger.error(`Agent runner failed: ${error}`);
    process.exit(1);
  });
}