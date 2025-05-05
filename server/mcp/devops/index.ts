/**
 * MCP DevOps Kit
 * 
 * This module provides tools for managing, monitoring, and controlling
 * MCP agents in development and production environments.
 */

import fs from 'fs';
import path from 'path';
import { agentEventBus } from '../agents/eventBus';
import { agentCoordinator } from '../experience/agentCoordinator';

// Interfaces for agent registry and agent definitions
export interface MCPAgentDefinition {
  id: string;
  description: string;
  status: 'active' | 'inactive' | 'development';
  endpoint: string;
  requiresInput: boolean;
}

export interface MCPAgentRegistry {
  agents: MCPAgentDefinition[];
}

/**
 * DevOps Kit for MCP agents
 */
class MCPDevOpsKit {
  private agentRegistry: MCPAgentRegistry = { agents: [] };
  private isInitialized = false;
  private statusPollingInterval: NodeJS.Timeout | null = null;
  private readonly STATUS_POLL_INTERVAL = 30000; // 30 seconds
  
  /**
   * Initialize the DevOps Kit
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing MCP DevOps Kit...');
      
      // Load agent registry
      this.loadAgentRegistry();
      
      // Subscribe to agent events
      this.subscribeToAgentEvents();
      
      // Start status polling
      this.startStatusPolling();
      
      this.isInitialized = true;
      console.log('MCP DevOps Kit initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP DevOps Kit:', error);
      throw error;
    }
  }
  
  /**
   * Load agent registry from JSON file
   */
  private loadAgentRegistry(): void {
    try {
      // Handle ESM environment where __dirname is not defined
      // Try to find the agents.json file in several possible locations
      const possiblePaths = [
        './server/mcp/agents.json',
        '../agents.json',
        './agents.json',
        '../../agents.json'
      ];
      
      let registryData: string | null = null;
      let registryPath: string | null = null;
      
      // Try each path
      for (const tryPath of possiblePaths) {
        try {
          if (fs.existsSync(tryPath)) {
            registryPath = tryPath;
            registryData = fs.readFileSync(tryPath, 'utf-8');
            break;
          }
        } catch (e) {
          // Continue to the next path
        }
      }
      
      if (registryData && registryPath) {
        this.agentRegistry = JSON.parse(registryData);
        console.log(`Loaded ${this.agentRegistry.agents.length} agents from registry at ${registryPath}`);
      } else {
        console.warn('Agent registry file not found, using empty registry');
      }
    } catch (error) {
      console.error('Error loading agent registry:', error);
      // Initialize with empty registry on error
      this.agentRegistry = { agents: [] };
    }
  }
  
  /**
   * Subscribe to agent events
   */
  private subscribeToAgentEvents(): void {
    // Subscribe to agent initialization events
    agentEventBus.subscribe('agent:initialized', (event: any, topic: string, id: string) => {
      const { agentId, agentName } = event.payload || {};
      console.log(`DevOpsKit: Agent ${agentName} (${agentId}) initialized`);
      if (agentId) {
        this.updateAgentStatus(agentId, 'active');
      }
    });
    
    // Subscribe to agent shutdown events
    agentEventBus.subscribe('agent:shutdown', (event: any, topic: string, id: string) => {
      const { agentId, agentName } = event.payload || {};
      console.log(`DevOpsKit: Agent ${agentName} (${agentId}) shutdown`);
      if (agentId) {
        this.updateAgentStatus(agentId, 'inactive');
      }
    });
    
    // Subscribe to agent error events
    agentEventBus.subscribe('agent:error', (event: any, topic: string, id: string) => {
      const { agentId, error } = event.payload || {};
      console.error(`DevOpsKit: Agent ${agentId} reported error:`, error);
    });
  }
  
  /**
   * Update agent status in registry
   * 
   * @param agentId The agent ID
   * @param status The new status
   */
  private updateAgentStatus(agentId: string, status: 'active' | 'inactive' | 'development'): void {
    const agentIndex = this.agentRegistry.agents.findIndex(a => a.id === agentId);
    
    if (agentIndex >= 0) {
      this.agentRegistry.agents[agentIndex].status = status;
      console.log(`Updated agent ${agentId} status to ${status}`);
    }
  }
  
  /**
   * Start polling for agent status
   */
  private startStatusPolling(): void {
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval);
    }
    
    this.statusPollingInterval = setInterval(() => {
      this.checkAgentStatuses();
    }, this.STATUS_POLL_INTERVAL);
    
    console.log(`Started agent status polling (interval: ${this.STATUS_POLL_INTERVAL}ms)`);
  }
  
  /**
   * Stop status polling
   */
  public stopStatusPolling(): void {
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval);
      this.statusPollingInterval = null;
      console.log('Stopped agent status polling');
    }
  }
  
  /**
   * Check the status of all agents
   */
  private checkAgentStatuses(): void {
    try {
      // Get agent health data from coordinator
      const agentHealth = agentCoordinator.getAgentHealth() as Record<string, any>;
      
      // Update agent registry with current status
      for (const agent of this.agentRegistry.agents) {
        const health = agentHealth[agent.id];
        
        if (health) {
          // Update status based on health
          const newStatus = health.status === 'HEALTHY' || health.status === 'DEGRADED' 
            ? 'active' 
            : 'inactive';
            
          if (agent.status !== newStatus) {
            this.updateAgentStatus(agent.id, newStatus as any);
          }
        }
      }
    } catch (error) {
      console.error('Error checking agent statuses:', error);
    }
  }
  
  /**
   * Get all agent definitions
   */
  public getAgentDefinitions(): MCPAgentDefinition[] {
    return [...this.agentRegistry.agents];
  }
  
  /**
   * Get agent definition by ID
   * 
   * @param agentId The agent ID
   */
  public getAgentDefinition(agentId: string): MCPAgentDefinition | undefined {
    return this.agentRegistry.agents.find(a => a.id === agentId);
  }
  
  /**
   * Get status of all agents
   */
  public getAgentStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};
    
    for (const agent of this.agentRegistry.agents) {
      statuses[agent.id] = {
        id: agent.id,
        status: agent.status,
        health: agentCoordinator.getAgentHealth(agent.id)
      };
    }
    
    return statuses;
  }
  
  /**
   * Restart an agent
   * 
   * @param agentId The agent ID to restart
   */
  public async restartAgent(agentId: string): Promise<boolean> {
    try {
      // Find agent in registry
      const agent = this.agentRegistry.agents.find(a => a.id === agentId);
      if (!agent) {
        console.warn(`Agent ${agentId} not found in registry`);
        return false;
      }
      
      // Get agent from coordinator
      const agentInstance = (agentCoordinator as any).agentRegistry?.getAgent(agentId);
      if (!agentInstance) {
        console.warn(`Agent ${agentId} not found in coordinator`);
        return false;
      }
      
      // Shutdown agent
      if (typeof agentInstance.shutdown === 'function') {
        await agentInstance.shutdown();
      }
      
      // Initialize agent
      if (typeof agentInstance.initialize === 'function') {
        await agentInstance.initialize();
      }
      
      return true;
    } catch (error) {
      console.error(`Error restarting agent ${agentId}:`, error);
      return false;
    }
  }
  
  /**
   * Shutdown all agents
   */
  public async shutdownAllAgents(): Promise<boolean> {
    try {
      // Stop status polling
      this.stopStatusPolling();
      
      // Shutdown all agents via coordinator
      await agentCoordinator.shutdown();
      
      return true;
    } catch (error) {
      console.error('Error shutting down agents:', error);
      return false;
    }
  }
  
  /**
   * Check if the DevOps Kit is initialized
   */
  public isDevOpsKitInitialized(): boolean {
    return this.isInitialized;
  }
}

// Create and export the singleton instance
export const mcpDevOpsKit = new MCPDevOpsKit();