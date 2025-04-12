/**
 * MCP Agent Orchestrator
 * 
 * This module coordinates all the AI agents in the system, enabling them to work together
 * on complex tasks and actively assist in the development and maintenance of the application.
 */

import { agentCoordinator } from './experience/agentCoordinator';
import { developmentAgent } from './agents/developmentAgent';
import { designAgent } from './agents/designAgent';
import { dataAnalysisAgent } from './agents/dataAnalysisAgent';
import { agentEventBus } from './agents/eventBus';
import { generateUniqueId } from '../utils/idGenerator';

interface OrchestrationTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agentAssignments: {
    agentId: string;
    role: string;
    status: 'assigned' | 'working' | 'completed' | 'failed';
    startTime?: string;
    endTime?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

interface AgentCapabilityMap {
  [agentId: string]: string[];
}

/**
 * MCP Orchestrator
 * Coordinates the activities of all AI agents to accomplish complex tasks
 */
class MCPOrchestrator {
  private static instance: MCPOrchestrator;
  private tasks: Map<string, OrchestrationTask> = new Map();
  private agentCapabilities: AgentCapabilityMap = {};
  private activeAgents: Set<string> = new Set();
  private isInitialized: boolean = false;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): MCPOrchestrator {
    if (!MCPOrchestrator.instance) {
      MCPOrchestrator.instance = new MCPOrchestrator();
    }
    return MCPOrchestrator.instance;
  }
  
  /**
   * Initialize the orchestrator
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      console.log('Initializing MCP Orchestrator...');
      
      // Initialize all agents
      await this.initializeAllAgents();
      
      // Subscribe to agent events
      this.setupEventSubscriptions();
      
      // Map agent capabilities
      this.mapAgentCapabilities();
      
      this.isInitialized = true;
      console.log('MCP Orchestrator initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MCP Orchestrator:', error);
      return false;
    }
  }
  
  /**
   * Initialize all available agents
   */
  private async initializeAllAgents(): Promise<void> {
    // Initialize the agent coordinator first
    if (!agentCoordinator.isInitialized()) {
      await agentCoordinator.initialize();
    }
    
    // Initialize the development agent
    if (!developmentAgent.isInitialized) {
      await developmentAgent.initialize();
      this.activeAgents.add(developmentAgent.agentId);
    }
    
    // Initialize the design agent
    if (!designAgent.isInitialized) {
      await designAgent.initialize();
      this.activeAgents.add(designAgent.agentId);
    }
    
    // Initialize the data analysis agent
    if (!dataAnalysisAgent.isInitialized) {
      await dataAnalysisAgent.initialize();
      this.activeAgents.add(dataAnalysisAgent.agentId);
    }
    
    // Notify the coordinator about all agents
    agentCoordinator.updateAgentRegistry();
  }
  
  /**
   * Set up event subscriptions for the orchestrator
   */
  private setupEventSubscriptions(): void {
    // Subscribe to task-related events
    agentEventBus.subscribe('task:request', 'orchestrator', this.handleTaskRequest.bind(this));
    
    // Subscribe to agent status change events
    agentEventBus.subscribe('agent:status', 'orchestrator', this.handleAgentStatusChange.bind(this));
    
    // Subscribe to task completion events
    agentEventBus.subscribe('task:completed', 'orchestrator', this.handleTaskCompletion.bind(this));
    
    // Subscribe to task failure events
    agentEventBus.subscribe('task:failed', 'orchestrator', this.handleTaskFailure.bind(this));
  }
  
  /**
   * Map agent capabilities for better task assignment
   */
  private mapAgentCapabilities(): void {
    // Development agent capabilities
    this.agentCapabilities[developmentAgent.agentId] = developmentAgent.capabilities;
    
    // Design agent capabilities
    this.agentCapabilities[designAgent.agentId] = designAgent.capabilities;
    
    // Data analysis agent capabilities
    this.agentCapabilities[dataAnalysisAgent.agentId] = dataAnalysisAgent.capabilities;
  }
  
  /**
   * Handle task requests
   */
  private async handleTaskRequest(event: any): Promise<void> {
    const { task } = event.data;
    const taskId = task.id || generateUniqueId();
    
    console.log(`Handling task request: ${task.name} (${taskId})`);
    
    // Create a new orchestration task
    const orchestrationTask: OrchestrationTask = {
      id: taskId,
      name: task.name,
      description: task.description,
      status: 'pending',
      agentAssignments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store the task
    this.tasks.set(taskId, orchestrationTask);
    
    // Analyze the task and assign appropriate agents
    await this.analyzeAndAssignTask(taskId, task);
    
    // Update task status to in_progress
    this.updateTaskStatus(taskId, 'in_progress');
    
    // Notify about task initiation
    await agentEventBus.publish({
      type: 'task:initiated',
      source: 'orchestrator',
      timestamp: new Date().toISOString(),
      data: {
        taskId,
        task: this.tasks.get(taskId)
      }
    });
  }
  
  /**
   * Analyze a task and assign appropriate agents
   */
  private async analyzeAndAssignTask(taskId: string, task: any): Promise<void> {
    const orchestrationTask = this.tasks.get(taskId);
    if (!orchestrationTask) return;
    
    // Define required capabilities based on task type
    const requiredCapabilities: string[] = [];
    
    // Different task types require different capabilities
    switch (task.type) {
      case 'code_generation':
        requiredCapabilities.push('code-generation');
        
        if (task.target === 'ui') {
          requiredCapabilities.push('component-styling');
        }
        
        if (task.database) {
          requiredCapabilities.push('schema-optimization');
          requiredCapabilities.push('query-generation');
        }
        break;
        
      case 'ui_design':
        requiredCapabilities.push('component-styling');
        requiredCapabilities.push('theme-recommendations');
        requiredCapabilities.push('accessibility-improvements');
        requiredCapabilities.push('responsive-design');
        break;
        
      case 'data_analysis':
        requiredCapabilities.push('data-insights');
        requiredCapabilities.push('query-generation');
        requiredCapabilities.push('schema-optimization');
        break;
        
      case 'refactoring':
        requiredCapabilities.push('code-generation');
        requiredCapabilities.push('refactoring-suggestions');
        requiredCapabilities.push('testing-assistance');
        break;
        
      default:
        // Default to a collaborative approach with all agents
        requiredCapabilities.push('code-generation');
        requiredCapabilities.push('component-styling');
        requiredCapabilities.push('data-insights');
    }
    
    // Find agents with required capabilities
    const assignedAgents: string[] = [];
    
    requiredCapabilities.forEach(capability => {
      // Find agents that have this capability
      const agents = Object.entries(this.agentCapabilities)
        .filter(([agentId, capabilities]) => capabilities.includes(capability))
        .map(([agentId]) => agentId);
      
      // Assign new agents not already assigned
      agents.forEach(agentId => {
        if (!assignedAgents.includes(agentId)) {
          assignedAgents.push(agentId);
          
          // Add to task assignments
          orchestrationTask.agentAssignments.push({
            agentId,
            role: capability,
            status: 'assigned',
            startTime: new Date().toISOString()
          });
        }
      });
    });
    
    // Update the task with assignments
    orchestrationTask.updatedAt = new Date().toISOString();
    this.tasks.set(taskId, orchestrationTask);
    
    // Notify assigned agents
    for (const agentId of assignedAgents) {
      await agentEventBus.publish({
        type: 'agent:assign',
        source: 'orchestrator',
        timestamp: new Date().toISOString(),
        data: {
          agentId,
          taskId,
          task: {...task}
        }
      });
    }
  }
  
  /**
   * Update task status
   */
  private updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed' | 'failed'): void {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    task.status = status;
    task.updatedAt = new Date().toISOString();
    
    if (status === 'completed' || status === 'failed') {
      task.completedAt = new Date().toISOString();
    }
    
    this.tasks.set(taskId, task);
  }
  
  /**
   * Handle agent status change events
   */
  private async handleAgentStatusChange(event: any): Promise<void> {
    const { agentId, status, taskId } = event.data;
    
    if (!taskId) return;
    
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    // Update agent assignment status
    const assignment = task.agentAssignments.find(a => a.agentId === agentId);
    if (assignment) {
      assignment.status = status === 'working' ? 'working' : 
                         status === 'completed' ? 'completed' : 
                         status === 'failed' ? 'failed' : 'assigned';
      
      if (status === 'completed' || status === 'failed') {
        assignment.endTime = new Date().toISOString();
      }
      
      task.updatedAt = new Date().toISOString();
      this.tasks.set(taskId, task);
    }
    
    // Check if all agents have completed or failed
    this.checkTaskCompletion(taskId);
  }
  
  /**
   * Handle task completion events
   */
  private async handleTaskCompletion(event: any): Promise<void> {
    const { taskId, result } = event.data;
    
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    // Update task with result and mark as completed
    task.result = result;
    this.updateTaskStatus(taskId, 'completed');
    
    // Notify about task completion
    await agentEventBus.publish({
      type: 'orchestrator:task:completed',
      source: 'orchestrator',
      timestamp: new Date().toISOString(),
      data: {
        taskId,
        task: this.tasks.get(taskId)
      }
    });
  }
  
  /**
   * Handle task failure events
   */
  private async handleTaskFailure(event: any): Promise<void> {
    const { taskId, error } = event.data;
    
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    // Update task with error and mark as failed
    task.error = error;
    this.updateTaskStatus(taskId, 'failed');
    
    // Notify about task failure
    await agentEventBus.publish({
      type: 'orchestrator:task:failed',
      source: 'orchestrator',
      timestamp: new Date().toISOString(),
      data: {
        taskId,
        task: this.tasks.get(taskId)
      }
    });
  }
  
  /**
   * Check if a task has been completed by all assigned agents
   */
  private checkTaskCompletion(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    // Check if task is already completed or failed
    if (task.status === 'completed' || task.status === 'failed') {
      return;
    }
    
    // Check if all agents have completed or failed
    const allAgentsFinished = task.agentAssignments.every(
      assignment => assignment.status === 'completed' || assignment.status === 'failed'
    );
    
    if (allAgentsFinished) {
      // Check if any agent failed
      const anyAgentFailed = task.agentAssignments.some(
        assignment => assignment.status === 'failed'
      );
      
      if (anyAgentFailed) {
        this.updateTaskStatus(taskId, 'failed');
        task.error = 'One or more agents failed to complete their assignments';
        
        // Notify about task failure
        agentEventBus.publish({
          type: 'orchestrator:task:failed',
          source: 'orchestrator',
          timestamp: new Date().toISOString(),
          data: {
            taskId,
            task: this.tasks.get(taskId)
          }
        });
      } else {
        this.updateTaskStatus(taskId, 'completed');
        
        // Compile results from all agents
        const results = task.agentAssignments.map(assignment => ({
          agentId: assignment.agentId,
          role: assignment.role,
          // In a real implementation, we would store individual agent results
          result: 'Completed successfully'
        }));
        
        task.result = {
          summary: `Task completed by ${task.agentAssignments.length} agents`,
          agentResults: results
        };
        
        // Notify about task completion
        agentEventBus.publish({
          type: 'orchestrator:task:completed',
          source: 'orchestrator',
          timestamp: new Date().toISOString(),
          data: {
            taskId,
            task: this.tasks.get(taskId)
          }
        });
      }
    }
  }
  
  /**
   * Create a new task
   */
  public async createTask(taskDetails: {
    name: string;
    description: string;
    type: string;
    priority?: 'low' | 'medium' | 'high';
    deadline?: string;
    [key: string]: any;
  }): Promise<string> {
    const taskId = generateUniqueId();
    
    // Publish task request event
    await agentEventBus.publish({
      type: 'task:request',
      source: 'orchestrator',
      timestamp: new Date().toISOString(),
      data: {
        task: {
          id: taskId,
          ...taskDetails,
          priority: taskDetails.priority || 'medium',
          createdAt: new Date().toISOString()
        }
      }
    });
    
    return taskId;
  }
  
  /**
   * Get task by ID
   */
  public getTask(taskId: string): OrchestrationTask | undefined {
    return this.tasks.get(taskId);
  }
  
  /**
   * Get all tasks
   */
  public getAllTasks(): OrchestrationTask[] {
    return Array.from(this.tasks.values());
  }
  
  /**
   * Get active agents
   */
  public getActiveAgents(): string[] {
    return Array.from(this.activeAgents);
  }
  
  /**
   * Get agent capabilities
   */
  public getAgentCapabilities(): AgentCapabilityMap {
    return { ...this.agentCapabilities };
  }
  
  /**
   * Request code generation
   */
  public async requestCodeGeneration(details: {
    name: string;
    type: 'component' | 'function' | 'api' | 'test';
    description: string;
    requirements: string[];
    targetPath?: string;
  }): Promise<string> {
    return this.createTask({
      name: `Generate ${details.type}: ${details.name}`,
      description: details.description,
      type: 'code_generation',
      codeDetails: details
    });
  }
  
  /**
   * Request UI design
   */
  public async requestDesign(details: {
    name: string;
    type: 'component' | 'page' | 'theme' | 'icon' | 'layout';
    description: string;
    requirements: string[];
  }): Promise<string> {
    return this.createTask({
      name: `Design ${details.type}: ${details.name}`,
      description: details.description,
      type: 'ui_design',
      designDetails: details
    });
  }
  
  /**
   * Request data analysis
   */
  public async requestDataAnalysis(details: {
    dataSource: 'property' | 'costMatrix' | 'improvement' | 'assessment';
    analysisType: 'trends' | 'patterns' | 'outliers' | 'distribution' | 'summary';
    description: string;
    filters?: any;
  }): Promise<string> {
    return this.createTask({
      name: `Analyze ${details.dataSource} data: ${details.analysisType}`,
      description: details.description,
      type: 'data_analysis',
      analysisDetails: details
    });
  }
  
  /**
   * Request code refactoring
   */
  public async requestRefactoring(details: {
    filePath: string;
    description: string;
    reason: string;
  }): Promise<string> {
    return this.createTask({
      name: `Refactor code: ${details.filePath}`,
      description: details.description,
      type: 'refactoring',
      refactoringDetails: details
    });
  }
}

// Export singleton instance
export const mcpOrchestrator = MCPOrchestrator.getInstance();