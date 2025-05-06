/**
 * TerraBuild AI Agent Framework - Swarm Coordinator
 * 
 * This file defines the SwarmCoordinator class that manages all agents in the system.
 * It handles agent registration, communication, and task distribution.
 */

import EventEmitter from 'events';
import { Agent, AgentConfig, AgentTask } from './Agent';

export interface SwarmConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  parameters?: Record<string, any>;
}

export interface SwarmTask {
  id: string;
  description: string;
  agentTasks: Record<string, string>; // Map of agent IDs to task IDs
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export class SwarmCoordinator extends EventEmitter {
  private config: SwarmConfig;
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, SwarmTask> = new Map();
  private active: boolean = false;

  constructor(config: SwarmConfig) {
    super();
    this.config = {
      ...config,
      parameters: config.parameters || {}
    };
  }

  /**
   * Initialize the swarm coordinator
   */
  public async initialize(): Promise<boolean> {
    try {
      this.active = true;
      
      // Initialize all registered agents
      const initPromises = Array.from(this.agents.values()).map(agent => {
        agent.connectToSwarm(this);
        return agent.initialize();
      });
      
      await Promise.all(initPromises);
      
      this.emit('swarm:initialized', { swarmId: this.config.id });
      return true;
    } catch (error) {
      console.error(`Error initializing swarm ${this.config.name}:`, error);
      this.emit('swarm:error', { 
        swarmId: this.config.id, 
        error: `Initialization failed: ${error.message}`
      });
      return false;
    }
  }

  /**
   * Shutdown the swarm coordinator
   */
  public async shutdown(): Promise<boolean> {
    try {
      // Shutdown all registered agents
      const shutdownPromises = Array.from(this.agents.values()).map(agent => 
        agent.shutdown()
      );
      
      await Promise.all(shutdownPromises);
      
      this.active = false;
      this.emit('swarm:shutdown', { swarmId: this.config.id });
      return true;
    } catch (error) {
      console.error(`Error shutting down swarm ${this.config.name}:`, error);
      return false;
    }
  }

  /**
   * Register an agent with the swarm
   */
  public registerAgent(agent: Agent): void {
    const config = agent.getConfig();
    this.agents.set(config.id, agent);
    
    // Setup event listeners for the agent
    agent.on('task:completed', (data) => {
      this.handleAgentTaskCompleted(config.id, data);
    });
    
    agent.on('task:failed', (data) => {
      this.handleAgentTaskFailed(config.id, data);
    });
    
    this.emit('agent:registered', { 
      agentId: config.id, 
      swarmId: this.config.id 
    });
  }

  /**
   * Unregister an agent from the swarm
   */
  public unregisterAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    
    agent.removeAllListeners();
    return this.agents.delete(agentId);
  }

  /**
   * Get agent by ID
   */
  public getAgent(agentId: string): Agent | null {
    return this.agents.get(agentId) || null;
  }

  /**
   * Get all registered agents
   */
  public getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get swarm ID
   */
  public getId(): string {
    return this.config.id;
  }

  /**
   * Get swarm status
   */
  public getStatus(): Record<string, any> {
    return {
      id: this.config.id,
      name: this.config.name,
      active: this.active,
      agentCount: this.agents.size,
      agents: Array.from(this.agents.values()).map(agent => agent.getStatus()),
      pendingTasks: Array.from(this.tasks.values())
        .filter(task => task.status === 'pending' || task.status === 'processing')
        .length
    };
  }

  /**
   * Create and distribute a composite task across multiple agents
   */
  public async createTask(
    description: string,
    agentTasks: Record<string, Omit<AgentTask, 'id' | 'createdAt' | 'status'>>
  ): Promise<string> {
    const taskId = `swarm_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Submit individual tasks to agents
    const agentTaskIds: Record<string, string> = {};
    
    for (const [agentId, taskData] of Object.entries(agentTasks)) {
      const agent = this.agents.get(agentId);
      if (agent) {
        const subtaskId = await agent.submitTask(taskData);
        agentTaskIds[agentId] = subtaskId;
      }
    }
    
    // Create the swarm task
    const swarmTask: SwarmTask = {
      id: taskId,
      description,
      agentTasks: agentTaskIds,
      status: 'processing',
      createdAt: new Date()
    };
    
    this.tasks.set(taskId, swarmTask);
    
    this.emit('task:created', { 
      taskId, 
      swarmId: this.config.id,
      agentTasks: agentTaskIds
    });
    
    return taskId;
  }

  /**
   * Get task by ID
   */
  public getTask(taskId: string): SwarmTask | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Handle agent task completion
   */
  private handleAgentTaskCompleted(agentId: string, data: any): void {
    // Find the swarm task that contains this agent task
    for (const [swarmTaskId, swarmTask] of this.tasks.entries()) {
      if (swarmTask.agentTasks[agentId] === data.taskId) {
        // Check if all agent tasks are completed
        const allCompleted = Object.entries(swarmTask.agentTasks)
          .every(([aid, tid]) => {
            const agent = this.agents.get(aid);
            if (!agent) return false;
            
            const task = agent.getTask(tid);
            return task && task.status === 'completed';
          });
        
        if (allCompleted) {
          // Collect results from all agent tasks
          const results: Record<string, any> = {};
          
          Object.entries(swarmTask.agentTasks).forEach(([aid, tid]) => {
            const agent = this.agents.get(aid);
            if (agent) {
              const task = agent.getTask(tid);
              if (task) {
                results[aid] = task.result;
              }
            }
          });
          
          // Update swarm task status
          swarmTask.status = 'completed';
          swarmTask.completedAt = new Date();
          swarmTask.result = results;
          
          this.tasks.set(swarmTaskId, swarmTask);
          
          this.emit('task:completed', {
            taskId: swarmTaskId,
            swarmId: this.config.id,
            result: results
          });
        }
        
        break;
      }
    }
  }

  /**
   * Handle agent task failure
   */
  private handleAgentTaskFailed(agentId: string, data: any): void {
    // Find the swarm task that contains this agent task
    for (const [swarmTaskId, swarmTask] of this.tasks.entries()) {
      if (swarmTask.agentTasks[agentId] === data.taskId) {
        // Update swarm task status
        swarmTask.status = 'failed';
        swarmTask.completedAt = new Date();
        swarmTask.error = `Agent ${agentId} failed task: ${data.error}`;
        
        this.tasks.set(swarmTaskId, swarmTask);
        
        this.emit('task:failed', {
          taskId: swarmTaskId,
          swarmId: this.config.id,
          error: swarmTask.error,
          agentId,
          agentTaskId: data.taskId
        });
        
        break;
      }
    }
  }
}