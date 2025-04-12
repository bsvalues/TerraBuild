/**
 * Agent Coordinator for Model Content Protocol
 * 
 * This file implements the central coordinator that oversees agent interactions,
 * delegates tasks, and facilitates collaborative assistance between agents.
 * It serves as the "Replit AI Agent" role described in the collaborative system.
 */

import { agentRegistry } from '../agents';
import { AgentEventType, AgentEvent } from '../agents/baseAgent';
import { experienceReplayBuffer } from './replayBuffer';
import { trainingCoordinator } from './trainingCoordinator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Task Type enum
 */
export enum TaskType {
  DATA_VALIDATION = 'DATA_VALIDATION',
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK',
  COST_ANALYSIS = 'COST_ANALYSIS',
  PROPERTY_STANDARDIZATION = 'PROPERTY_STANDARDIZATION',
  GENERATE_REPORT = 'GENERATE_REPORT',
  ASSIST_AGENT = 'ASSIST_AGENT'
}

/**
 * Task Status enum
 */
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DELEGATED = 'DELEGATED'
}

/**
 * Task interface
 */
export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  delegatedBy?: string;
  originalAgent?: string;
  parameters: Record<string, any>;
  result?: any;
  errorMessage?: string;
  correlationId?: string;
}

/**
 * Performance Metrics interface
 */
export interface PerformanceMetrics {
  taskSuccessRate: number;
  avgCompletionTime: number;
  taskCount: number;
  delegationCount: number;
  assistanceRequestCount: number;
  lastUpdateTime: Date;
}

/**
 * Agent Health Status
 */
export interface AgentHealthStatus {
  agentId: string;
  isActive: boolean;
  lastHeartbeat: Date;
  taskCount: number;
  errorCount: number;
  averageResponseTime: number;
  memoryUsage: number;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'OFFLINE';
}

/**
 * Agent Coordinator
 * Serves as the central coordinator for all agents
 */
export class AgentCoordinator {
  private static instance: AgentCoordinator;
  private tasks: Map<string, Task> = new Map();
  private agentHealth: Map<string, AgentHealthStatus> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    taskSuccessRate: 1.0,
    avgCompletionTime: 0,
    taskCount: 0,
    delegationCount: 0,
    assistanceRequestCount: 0,
    lastUpdateTime: new Date()
  };
  private pollInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 5000; // 5 seconds
  private readonly MAX_TASKS_HISTORY = 100;
  private messages: Array<{
    id: string;
    from: string;
    to: string;
    type: string;
    timestamp: Date;
    content?: any;
  }> = [];
  private messageTypeCounts: Record<string, number> = {};
  private initialized: boolean = false;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    console.log('Agent Coordinator initialized');
  }
  
  /**
   * Get the singleton instance of the agent coordinator
   */
  public static getInstance(): AgentCoordinator {
    if (!AgentCoordinator.instance) {
      AgentCoordinator.instance = new AgentCoordinator();
    }
    return AgentCoordinator.instance;
  }
  
  /**
   * Initialize the agent coordinator
   */
  public async initialize(): Promise<void> {
    console.log('Initializing Agent Coordinator...');
    
    // Initialize all agents
    await agentRegistry.initializeAllAgents();
    
    // Start agent health monitoring
    this.startMonitoring();
    
    // Start automated training (once per hour)
    trainingCoordinator.startAutomatedTraining();
    
    // Mark as initialized
    this.initialized = true;
    
    console.log('Agent Coordinator initialized successfully');
  }
  
  /**
   * Check if the agent coordinator is initialized
   * @returns True if initialized, false otherwise
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Update the agent registry with current health status
   * This method is called by the orchestrator after initializing all agents
   */
  public updateAgentRegistry(): void {
    console.log('Updating agent registry with current health status');
    
    // Get all registered agents from the registry
    const agentIds = agentRegistry.getAllAgentIds();
    
    // Update health status for each agent
    for (const agentId of agentIds) {
      if (!this.agentHealth.has(agentId)) {
        // Initialize health status for new agents
        this.agentHealth.set(agentId, {
          agentId,
          isActive: true,
          lastHeartbeat: new Date(),
          taskCount: 0,
          errorCount: 0,
          averageResponseTime: 0,
          memoryUsage: 0,
          status: 'HEALTHY'
        });
        console.log(`Initialized health monitoring for agent ${agentId}`);
      }
    }
  }
  
  /**
   * Shutdown the agent coordinator
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down Agent Coordinator...');
    
    // Stop monitoring
    this.stopMonitoring();
    
    // Stop automated training
    trainingCoordinator.stopAutomatedTraining();
    
    // Shutdown all agents
    await agentRegistry.shutdownAllAgents();
    
    console.log('Agent Coordinator shutdown complete');
  }
  
  /**
   * Start agent health monitoring
   */
  private startMonitoring(): void {
    if (this.pollInterval) {
      console.log('Monitoring already active');
      return;
    }
    
    console.log(`Starting agent monitoring with poll interval ${this.POLL_INTERVAL_MS}ms`);
    
    this.pollInterval = setInterval(() => {
      this.checkAgentHealth();
      this.processTaskQueue();
    }, this.POLL_INTERVAL_MS);
  }
  
  /**
   * Stop agent health monitoring
   */
  private stopMonitoring(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('Agent monitoring stopped');
    }
  }
  
  /**
   * Check the health of all agents
   */
  private checkAgentHealth(): void {
    // Get all agent IDs
    const agentIds = ['data-quality-agent', 'compliance-agent', 'cost-analysis-agent'];
    
    for (const agentId of agentIds) {
      const agent = agentRegistry.getAgent(agentId);
      if (!agent) {
        console.warn(`Agent ${agentId} not found in registry`);
        continue;
      }
      
      try {
        const agentState = agent.getState();
        const lastUpdatedTime = agentState.lastUpdated || new Date(0);
        const now = new Date();
        const timeSinceUpdate = now.getTime() - lastUpdatedTime.getTime();
        
        // Get current health status or create new one
        const health = this.agentHealth.get(agentId) || {
          agentId,
          isActive: true,
          lastHeartbeat: new Date(),
          taskCount: 0,
          errorCount: 0,
          averageResponseTime: 0,
          memoryUsage: 0,
          status: 'HEALTHY'
        };
        
        // Update health status
        health.lastHeartbeat = now;
        health.memoryUsage = (agentState.memory?.length || 0);
        
        // Determine status based on metrics
        if (timeSinceUpdate > 60000) { // 1 minute
          health.status = 'DEGRADED';
        } else if (health.errorCount > 5) {
          health.status = 'UNHEALTHY';
        } else {
          health.status = 'HEALTHY';
        }
        
        // Store updated health
        this.agentHealth.set(agentId, health);
        
        // If agent is unhealthy, take action
        if (health.status === 'UNHEALTHY') {
          console.warn(`Agent ${agentId} is unhealthy, requesting assistance`);
          this.requestAgentAssistance(agentId);
        }
      } catch (error) {
        console.error(`Error checking health for agent ${agentId}:`, error);
        
        // Mark as unhealthy
        this.agentHealth.set(agentId, {
          agentId,
          isActive: false,
          lastHeartbeat: new Date(),
          taskCount: 0,
          errorCount: 0,
          averageResponseTime: 0,
          memoryUsage: 0,
          status: 'OFFLINE'
        });
      }
    }
  }
  
  /**
   * Process the task queue
   */
  private processTaskQueue(): void {
    // Process pending tasks
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === TaskStatus.PENDING) {
        this.assignTask(task);
      }
    }
    
    // Check for tasks that have been in progress too long
    const now = new Date();
    const TASK_TIMEOUT_MS = 30000; // 30 seconds
    
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === TaskStatus.IN_PROGRESS) {
        const taskDuration = now.getTime() - task.updatedAt.getTime();
        if (taskDuration > TASK_TIMEOUT_MS) {
          console.warn(`Task ${taskId} has timed out, delegating to another agent`);
          this.delegateTask(task);
        }
      }
    }
  }
  
  /**
   * Create a new task
   * 
   * @param type Task type
   * @param parameters Task parameters
   * @param priority Task priority
   * @param assignTo Specific agent to assign to (optional)
   * @returns The created task
   */
  public createTask(
    type: TaskType,
    parameters: Record<string, any>,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
    assignTo?: string
  ): Task {
    const taskId = uuidv4();
    const now = new Date();
    
    const task: Task = {
      id: taskId,
      type,
      status: TaskStatus.PENDING,
      priority,
      createdAt: now,
      updatedAt: now,
      parameters,
      correlationId: uuidv4()
    };
    
    // If specific agent assignment requested
    if (assignTo) {
      task.assignedTo = assignTo;
    }
    
    // Store task
    this.tasks.set(taskId, task);
    
    // Update metrics
    this.performanceMetrics.taskCount++;
    this.performanceMetrics.lastUpdateTime = now;
    
    console.log(`Created task ${taskId} of type ${type} with priority ${priority}`);
    
    // If high priority, process immediately
    if (priority === 'HIGH' || priority === 'CRITICAL') {
      this.assignTask(task);
    }
    
    return task;
  }
  
  /**
   * Assign a task to the most appropriate agent
   * 
   * @param task The task to assign
   * @returns True if assignment was successful
   */
  private assignTask(task: Task): boolean {
    // If already assigned, skip
    if (task.status !== TaskStatus.PENDING) {
      return false;
    }
    
    // If specific assignment requested, use that
    if (task.assignedTo) {
      return this.assignTaskToAgent(task, task.assignedTo);
    }
    
    // Otherwise, find the appropriate agent based on task type
    let targetAgentId: string;
    
    switch (task.type) {
      case TaskType.DATA_VALIDATION:
      case TaskType.PROPERTY_STANDARDIZATION:
        targetAgentId = 'data-quality-agent';
        break;
        
      case TaskType.COMPLIANCE_CHECK:
      case TaskType.GENERATE_REPORT:
        targetAgentId = 'compliance-agent';
        break;
        
      case TaskType.COST_ANALYSIS:
        targetAgentId = 'cost-analysis-agent';
        break;
        
      case TaskType.ASSIST_AGENT:
        // For assistance, pick the healthiest agent other than the one needing help
        const agentToAssist = task.parameters.agentId;
        targetAgentId = this.findHealthiestAgent([agentToAssist]);
        break;
        
      default:
        console.warn(`Unknown task type: ${task.type}`);
        return false;
    }
    
    return this.assignTaskToAgent(task, targetAgentId);
  }
  
  /**
   * Assign a task to a specific agent
   * 
   * @param task The task to assign
   * @param agentId The agent ID to assign to
   * @returns True if assignment was successful
   */
  private assignTaskToAgent(task: Task, agentId: string): boolean {
    const agent = agentRegistry.getAgent(agentId);
    if (!agent) {
      console.warn(`Agent ${agentId} not found, cannot assign task ${task.id}`);
      return false;
    }
    
    // Check agent health
    const health = this.agentHealth.get(agentId);
    if (health?.status === 'OFFLINE' || health?.status === 'UNHEALTHY') {
      console.warn(`Agent ${agentId} is ${health.status}, delegating task ${task.id}`);
      return this.delegateTask(task);
    }
    
    // Update task
    task.assignedTo = agentId;
    task.status = TaskStatus.IN_PROGRESS;
    task.updatedAt = new Date();
    this.tasks.set(task.id, task);
    
    // Update agent health
    if (health) {
      health.taskCount++;
      this.agentHealth.set(agentId, health);
    }
    
    // Send task to agent
    try {
      this.sendTaskToAgent(task, agent);
      return true;
    } catch (error) {
      console.error(`Error sending task ${task.id} to agent ${agentId}:`, error);
      
      // Mark task as failed
      task.status = TaskStatus.FAILED;
      task.errorMessage = error instanceof Error ? error.message : String(error);
      task.updatedAt = new Date();
      this.tasks.set(task.id, task);
      
      // Update agent health
      if (health) {
        health.errorCount++;
        this.agentHealth.set(agentId, health);
      }
      
      return false;
    }
  }
  
  /**
   * Send a task to an agent
   * 
   * @param task The task to send
   * @param agent The agent to send to
   */
  private sendTaskToAgent(task: Task, agent: any): void {
    // Create event based on task type
    let eventType: AgentEventType;
    let payload: any;
    
    switch (task.type) {
      case TaskType.DATA_VALIDATION:
        eventType = AgentEventType.DATA_AVAILABLE;
        payload = {
          entityType: task.parameters.entityType,
          data: task.parameters.data,
          validationContext: task.parameters.context || {},
          taskId: task.id
        };
        break;
        
      case TaskType.COMPLIANCE_CHECK:
        eventType = AgentEventType.DATA_AVAILABLE;
        payload = {
          entityType: task.parameters.entityType,
          data: task.parameters.data,
          complianceContext: task.parameters.context || {},
          taskId: task.id
        };
        break;
        
      case TaskType.COST_ANALYSIS:
        eventType = AgentEventType.DATA_AVAILABLE;
        payload = {
          buildingDetails: task.parameters.buildingDetails,
          analysisContext: task.parameters.context || {},
          taskId: task.id
        };
        break;
        
      case TaskType.PROPERTY_STANDARDIZATION:
        eventType = AgentEventType.TASK_ASSIGNED;
        payload = {
          taskType: 'standardize_data',
          entityType: task.parameters.entityType,
          data: task.parameters.data,
          fieldsToStandardize: task.parameters.fieldsToStandardize,
          taskId: task.id
        };
        break;
        
      case TaskType.GENERATE_REPORT:
        eventType = AgentEventType.TASK_ASSIGNED;
        payload = {
          taskType: 'generate_report',
          reportType: task.parameters.reportType,
          entityIds: task.parameters.entityIds,
          reportFormat: task.parameters.reportFormat,
          taskId: task.id
        };
        break;
        
      case TaskType.ASSIST_AGENT:
        eventType = AgentEventType.REQUEST_ASSISTANCE;
        payload = {
          requestType: 'assist_agent',
          agentId: task.parameters.agentId,
          issueType: task.parameters.issueType,
          assistanceContext: task.parameters.context || {},
          taskId: task.id
        };
        break;
        
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
    
    // Send event to agent
    const event: AgentEvent = {
      type: eventType,
      sourceAgentId: 'agent-coordinator',
      targetAgentId: task.assignedTo,
      timestamp: new Date(),
      correlationId: task.correlationId,
      payload
    };
    
    agent.receiveEvent(event);
    console.log(`Sent task ${task.id} to agent ${task.assignedTo}`);
  }
  
  /**
   * Delegate a task to another agent when the primary agent can't handle it
   * 
   * @param task The task to delegate
   * @returns True if delegation was successful
   */
  private delegateTask(task: Task): boolean {
    // Record the original agent if this is the first delegation
    if (!task.originalAgent && task.assignedTo) {
      task.originalAgent = task.assignedTo;
    }
    
    // If the task was delegated by the original agent, find another
    const excludeAgents = [task.assignedTo, task.delegatedBy].filter(Boolean) as string[];
    const newAgentId = this.findHealthiestAgent(excludeAgents);
    
    if (!newAgentId) {
      console.warn(`No suitable agent found to delegate task ${task.id}`);
      
      // Mark task as failed
      task.status = TaskStatus.FAILED;
      task.errorMessage = 'No suitable agent available for delegation';
      task.updatedAt = new Date();
      this.tasks.set(task.id, task);
      
      return false;
    }
    
    // Update task
    task.delegatedBy = task.assignedTo;
    task.assignedTo = newAgentId;
    task.status = TaskStatus.DELEGATED;
    task.updatedAt = new Date();
    this.tasks.set(task.id, task);
    
    // Update metrics
    this.performanceMetrics.delegationCount++;
    this.performanceMetrics.lastUpdateTime = new Date();
    
    console.log(`Delegated task ${task.id} from ${task.delegatedBy} to ${newAgentId}`);
    
    // Re-assign the task
    return this.assignTask(task);
  }
  
  /**
   * Find the healthiest agent excluding certain agents
   * 
   * @param excludeAgentIds Array of agent IDs to exclude
   * @returns The healthiest agent ID, or undefined if none available
   */
  private findHealthiestAgent(excludeAgentIds: string[] = []): string | undefined {
    const candidates: Array<{agentId: string, health: AgentHealthStatus}> = [];
    
    // Collect all healthy agents
    for (const [agentId, health] of this.agentHealth.entries()) {
      if (excludeAgentIds.includes(agentId)) {
        continue;
      }
      
      if (health.status === 'HEALTHY' || health.status === 'DEGRADED') {
        candidates.push({ agentId, health });
      }
    }
    
    if (candidates.length === 0) {
      return undefined;
    }
    
    // Sort by status (HEALTHY first) and then by task count (lowest first)
    candidates.sort((a, b) => {
      if (a.health.status === 'HEALTHY' && b.health.status !== 'HEALTHY') {
        return -1;
      }
      if (a.health.status !== 'HEALTHY' && b.health.status === 'HEALTHY') {
        return 1;
      }
      return a.health.taskCount - b.health.taskCount;
    });
    
    return candidates[0].agentId;
  }
  
  /**
   * Handle task completion
   * 
   * @param taskId The task ID
   * @param result The task result
   * @param reward The reward value for learning
   * @returns True if handled successfully
   */
  public handleTaskCompletion(taskId: string, result: any, reward: number = 1.0): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`Task ${taskId} not found for completion`);
      return false;
    }
    
    // Update task
    const now = new Date();
    const completionTime = now.getTime() - task.updatedAt.getTime();
    
    task.status = TaskStatus.COMPLETED;
    task.result = result;
    task.updatedAt = now;
    this.tasks.set(taskId, task);
    
    // Update metrics
    this.updatePerformanceMetrics(completionTime, true);
    
    // Update agent health
    const agentId = task.assignedTo;
    if (agentId) {
      const health = this.agentHealth.get(agentId);
      if (health) {
        // Update response time with exponential moving average
        const alpha = 0.2; // Smoothing factor
        health.averageResponseTime = 
          alpha * completionTime + (1 - alpha) * health.averageResponseTime;
        
        this.agentHealth.set(agentId, health);
      }
    }
    
    // Add to experience buffer for learning
    this.recordTaskExperience(task, result, reward);
    
    console.log(`Task ${taskId} completed by agent ${agentId}`);
    
    // Prune old tasks if we have too many
    this.pruneTaskHistory();
    
    return true;
  }
  
  /**
   * Handle task failure
   * 
   * @param taskId The task ID
   * @param error The error message
   * @returns True if handled successfully
   */
  public handleTaskFailure(taskId: string, error: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`Task ${taskId} not found for failure reporting`);
      return false;
    }
    
    // Update task
    const now = new Date();
    const completionTime = now.getTime() - task.updatedAt.getTime();
    
    task.status = TaskStatus.FAILED;
    task.errorMessage = error;
    task.updatedAt = now;
    this.tasks.set(taskId, task);
    
    // Update metrics
    this.updatePerformanceMetrics(completionTime, false);
    
    // Update agent health
    const agentId = task.assignedTo;
    if (agentId) {
      const health = this.agentHealth.get(agentId);
      if (health) {
        health.errorCount++;
        this.agentHealth.set(agentId, health);
      }
    }
    
    // Add to experience buffer with negative reward
    this.recordTaskExperience(task, { error }, -0.5);
    
    console.log(`Task ${taskId} failed by agent ${agentId}: ${error}`);
    
    // Try to delegate the task if it's important
    if (task.priority === 'HIGH' || task.priority === 'CRITICAL') {
      return this.delegateTask(task);
    }
    
    return true;
  }
  
  /**
   * Record task experience in the replay buffer
   * 
   * @param task The task
   * @param result The result
   * @param reward The reward value
   */
  private recordTaskExperience(task: Task, result: any, reward: number): void {
    experienceReplayBuffer.addExperience({
      agentId: task.assignedTo || 'unknown',
      state: {
        taskType: task.type,
        parameters: task.parameters,
        priority: task.priority
      },
      action: `process_${task.type.toLowerCase()}`,
      result,
      nextState: {
        taskStatus: task.status,
        completionTime: task.updatedAt.getTime() - task.createdAt.getTime()
      },
      reward,
      metadata: {
        taskId: task.id,
        correlationId: task.correlationId,
        delegatedBy: task.delegatedBy,
        originalAgent: task.originalAgent,
        priority: task.priority === 'CRITICAL' ? 1.0 : 
                 task.priority === 'HIGH' ? 0.8 :
                 task.priority === 'MEDIUM' ? 0.5 : 0.3
      }
    });
  }
  
  /**
   * Update performance metrics
   * 
   * @param completionTime Time to complete in milliseconds
   * @param success Whether the task was successful
   */
  private updatePerformanceMetrics(completionTime: number, success: boolean): void {
    const metrics = this.performanceMetrics;
    
    // Update moving average of completion time
    const alpha = 0.2; // Smoothing factor
    metrics.avgCompletionTime = 
      alpha * completionTime + (1 - alpha) * metrics.avgCompletionTime;
    
    // Update success rate
    const successValue = success ? 1 : 0;
    metrics.taskSuccessRate = 
      alpha * successValue + (1 - alpha) * metrics.taskSuccessRate;
    
    metrics.lastUpdateTime = new Date();
  }
  
  /**
   * Request assistance for an agent
   * 
   * @param agentId The agent ID needing assistance
   * @param issueType Optional issue type
   * @param context Optional context information
   * @returns The task ID
   */
  public requestAgentAssistance(
    agentId: string,
    issueType: string = 'performance_degradation',
    context: Record<string, any> = {}
  ): string {
    console.log(`Requesting assistance for agent ${agentId} (${issueType})`);
    
    // Update metrics
    this.performanceMetrics.assistanceRequestCount++;
    this.performanceMetrics.lastUpdateTime = new Date();
    
    // Create assistance task
    const task = this.createTask(
      TaskType.ASSIST_AGENT,
      {
        agentId,
        issueType,
        context
      },
      'HIGH' // Assistance requests are high priority
    );
    
    return task.id;
  }
  
  /**
   * Prune task history to limit memory usage
   */
  private pruneTaskHistory(): void {
    if (this.tasks.size <= this.MAX_TASKS_HISTORY) {
      return;
    }
    
    // Convert to array for sorting
    const tasksArray = Array.from(this.tasks.entries());
    
    // Sort by updated time (oldest first)
    tasksArray.sort((a, b) => a[1].updatedAt.getTime() - b[1].updatedAt.getTime());
    
    // Keep only most recent tasks
    const tasksToRemove = tasksArray.slice(0, tasksArray.length - this.MAX_TASKS_HISTORY);
    for (const [taskId] of tasksToRemove) {
      this.tasks.delete(taskId);
    }
    
    console.log(`Pruned ${tasksToRemove.length} old tasks from history`);
  }
  
  /**
   * Get agent health status
   * 
   * @param agentId Optional agent ID to get status for
   * @returns Health status for all agents or specific agent
   */
  public getAgentHealth(agentId?: string): AgentHealthStatus | Record<string, AgentHealthStatus> {
    if (agentId) {
      return this.agentHealth.get(agentId) || {
        agentId,
        isActive: false,
        lastHeartbeat: new Date(0),
        taskCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        memoryUsage: 0,
        status: 'OFFLINE'
      };
    }
    
    // Return all health statuses
    const result: Record<string, AgentHealthStatus> = {};
    for (const [id, health] of this.agentHealth.entries()) {
      result[id] = health;
    }
    return result;
  }
  
  /**
   * Get task by ID
   * 
   * @param taskId The task ID
   * @returns The task or undefined if not found
   */
  public getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }
  
  /**
   * Get all tasks matching criteria
   * 
   * @param filter Optional filter function
   * @returns Array of matching tasks
   */
  public getTasks(filter?: (task: Task) => boolean): Task[] {
    const allTasks = Array.from(this.tasks.values());
    
    if (!filter) {
      return allTasks;
    }
    
    return allTasks.filter(filter);
  }
  
  /**
   * Get performance metrics
   * 
   * @returns Current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  /**
   * Get the total count of messages exchanged
   * 
   * @returns The number of messages exchanged
   */
  public getMessageCount(): number {
    return this.messages.length;
  }
  
  /**
   * Get message distribution by type
   * 
   * @returns Record mapping message types to counts
   */
  public getMessageTypeDistribution(): Record<string, number> {
    return { ...this.messageTypeCounts };
  }
  
  /**
   * Get the latest messages
   * 
   * @param limit Maximum number of messages to return
   * @returns Array of the latest messages
   */
  public getLatestMessages(limit: number = 10): Array<{
    id: string;
    from: string;
    to: string;
    type: string;
    timestamp: string;
  }> {
    return this.messages
      .slice(-limit)
      .map(msg => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        type: msg.type,
        timestamp: msg.timestamp.toISOString()
      }));
  }
}

// Export singleton instance
export const agentCoordinator = AgentCoordinator.getInstance();