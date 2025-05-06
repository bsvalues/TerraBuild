/**
 * TerraBuild AI Agent Framework - Base Agent Class
 * 
 * This file defines the core Agent class that all specialized agents inherit from.
 * It provides the basic functionality for agent initialization, communication, and task handling.
 */

import EventEmitter from 'events';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
  parameters?: Record<string, any>;
}

export interface AgentTask {
  id: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  data: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export abstract class Agent extends EventEmitter {
  protected config: AgentConfig;
  protected tasks: Map<string, AgentTask> = new Map();
  protected active: boolean = false;
  protected swarm: any = null; // Will be set by SwarmCoordinator

  constructor(config: AgentConfig) {
    super();
    this.config = {
      ...config,
      capabilities: config.capabilities || [],
      parameters: config.parameters || {}
    };
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<boolean> {
    try {
      this.active = true;
      this.emit('agent:initialized', { agentId: this.config.id });
      return true;
    } catch (error) {
      console.error(`Error initializing agent ${this.config.name}:`, error);
      this.emit('agent:error', { 
        agentId: this.config.id, 
        error: `Initialization failed: ${error.message}`
      });
      return false;
    }
  }

  /**
   * Shutdown the agent
   */
  public async shutdown(): Promise<boolean> {
    try {
      this.active = false;
      this.emit('agent:shutdown', { agentId: this.config.id });
      return true;
    } catch (error) {
      console.error(`Error shutting down agent ${this.config.name}:`, error);
      return false;
    }
  }

  /**
   * Check if agent is active
   */
  public isActive(): boolean {
    return this.active;
  }

  /**
   * Get agent configuration
   */
  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Connect to the swarm
   */
  public connectToSwarm(swarm: any): void {
    this.swarm = swarm;
    this.emit('agent:connected', { 
      agentId: this.config.id,
      swarmId: swarm.getId()
    });
  }

  /**
   * Get agent status
   */
  public getStatus(): Record<string, any> {
    return {
      id: this.config.id,
      name: this.config.name,
      active: this.active,
      pendingTasks: Array.from(this.tasks.values())
        .filter(task => task.status === 'pending')
        .length,
      processingTasks: Array.from(this.tasks.values())
        .filter(task => task.status === 'processing')
        .length
    };
  }

  /**
   * Submit a task to the agent
   */
  public async submitTask(task: Omit<AgentTask, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTask: AgentTask = {
      id: taskId,
      ...task,
      createdAt: new Date(),
      status: 'pending'
    };
    
    this.tasks.set(taskId, newTask);
    this.emit('task:submitted', { taskId, agentId: this.config.id });
    
    // Process the task (non-blocking)
    this.processTask(taskId);
    
    return taskId;
  }

  /**
   * Get task by ID
   */
  public getTask(taskId: string): AgentTask | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Process a task (to be implemented by specific agents)
   */
  protected abstract processTask(taskId: string): Promise<void>;

  /**
   * Mark a task as completed
   */
  protected completeTask(taskId: string, result: any): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      this.tasks.set(taskId, task);
      this.emit('task:completed', { taskId, agentId: this.config.id, result });
    }
  }

  /**
   * Mark a task as failed
   */
  protected failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.completedAt = new Date();
      task.error = error;
      this.tasks.set(taskId, task);
      this.emit('task:failed', { taskId, agentId: this.config.id, error });
    }
  }
}