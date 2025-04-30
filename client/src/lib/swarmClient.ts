/**
 * TerraBuild AI Swarm - Client API
 * 
 * This file provides client-side functions for interacting with the TerraBuild AI Swarm API.
 */

import { apiRequest } from './queryClient';

/**
 * Get the status of the AI Swarm
 */
export async function getSwarmStatus() {
  return apiRequest('/api/swarm/status');
}

/**
 * Run a task with a specific agent
 */
export async function runAgentTask(agentId: string, taskType: string, taskData: Record<string, any>) {
  return apiRequest('/api/swarm/agent-task', {
    method: 'POST',
    data: {
      agentId,
      taskType,
      taskData
    }
  });
}

/**
 * Run a composite task involving multiple agents
 */
export async function runSwarmTask(
  description: string,
  agentTasks: Record<string, {
    type: string;
    data: Record<string, any>;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  }>
) {
  return apiRequest('/api/swarm/swarm-task', {
    method: 'POST',
    data: {
      description,
      agentTasks
    }
  });
}

/**
 * Run a predefined demo workflow
 */
export async function runDemoWorkflow(demoType: 'cost-assessment' | 'scenario-analysis' | 'sensitivity-analysis') {
  return apiRequest('/api/swarm/demo', {
    method: 'POST',
    data: {
      demoType
    }
  });
}

/**
 * Shutdown the AI Swarm
 */
export async function shutdownSwarm() {
  return apiRequest('/api/swarm/shutdown', {
    method: 'POST'
  });
}