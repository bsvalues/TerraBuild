/**
 * Base Agent Class for Model Content Protocol
 * 
 * This file implements a base agent class that all specialized agents can extend.
 * It provides common functionality and enforces the MCP agent lifecycle.
 */

import { AgentDefinition, AgentState, FunctionResponse } from '../schemas/types';
import { functionRegistry } from '../functions/functionRegistry';
import { agentEventBus } from './eventBus';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent Events for communication between agents
 */
export enum AgentEventType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  DATA_AVAILABLE = 'DATA_AVAILABLE',
  INSIGHT_GENERATED = 'INSIGHT_GENERATED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  STATE_CHANGED = 'STATE_CHANGED',
  REQUEST_ASSISTANCE = 'REQUEST_ASSISTANCE',
  PROVIDE_FEEDBACK = 'PROVIDE_FEEDBACK'
}

/**
 * Agent Event interface for typed communication
 */
export interface AgentEvent {
  type: AgentEventType;
  sourceAgentId: string;
  targetAgentId?: string; // Optional - for broadcast events
  timestamp: Date;
  payload: any;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  correlationId?: string; // For tracking related events
}

/**
 * Agent Memory Item for internal record-keeping
 */
export interface AgentMemoryItem {
  type: string;
  timestamp: Date;
  input?: any;
  inputSummary?: string;
  output?: any;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Abstract Base Agent Class
 * Provides common functionality for all agents in the system
 */
export abstract class BaseAgent {
  protected definition: AgentDefinition;
  protected state: AgentState;
  protected eventListeners: Map<AgentEventType, Function[]> = new Map();
  
  /**
   * Create a new Base Agent
   * 
   * @param id Unique identifier for this agent
   * @param name Human-readable name for this agent
   * @param description Description of this agent's purpose
   * @param capabilities Array of function IDs this agent can perform
   * @param permissions Array of permission strings
   */
  constructor(
    id: string,
    name: string,
    description: string,
    capabilities: string[],
    permissions: string[] = []
  ) {
    // Define the agent
    this.definition = {
      id,
      name,
      description,
      capabilities,
      permissions
    };
    
    // Initialize agent state
    this.state = {
      agentId: this.definition.id,
      sessionId: uuidv4(),
      context: {},
      memory: [],
      lastUpdated: new Date()
    };
  }
  
  /**
   * Initialize this agent
   * Override in subclasses if needed, but call super.initialize() first
   */
  public async initialize(): Promise<void> {
    console.log(`Agent ${this.definition.name} (${this.definition.id}) initializing...`);
    
    // Subscribe to receive events through the event bus
    agentEventBus.subscribe(
      this.definition.id,
      '*', // Subscribe to all events initially
      async (event: AgentEvent) => await this.receiveEvent(event)
    );
    
    console.log(`Agent ${this.definition.name} (${this.definition.id}) initialized`);
  }
  
  /**
   * Shutdown this agent cleanly
   * Override in subclasses if needed, but call super.shutdown() at the end
   */
  public async shutdown(): Promise<void> {
    console.log(`Agent ${this.definition.name} (${this.definition.id}) shutting down...`);
    
    // Unsubscribe from all events
    agentEventBus.unsubscribeAll(this.definition.id);
    
    console.log(`Agent ${this.definition.name} (${this.definition.id}) shutdown complete`);
  }
  
  /**
   * Get the agent definition
   * 
   * @returns The agent definition
   */
  public getDefinition(): AgentDefinition {
    return this.definition;
  }
  
  /**
   * Get the current agent state
   * 
   * @returns The agent state
   */
  public getState(): AgentState {
    return this.state;
  }
  
  /**
   * Update the agent state with new context
   * 
   * @param context The new context to merge with existing state
   */
  protected updateState(context: Record<string, any>): void {
    this.state = {
      ...this.state,
      context: {
        ...this.state.context,
        ...context
      },
      lastUpdated: new Date()
    };
    
    // Emit state changed event
    this.emitEvent({
      type: AgentEventType.STATE_CHANGED,
      sourceAgentId: this.definition.id,
      timestamp: new Date(),
      payload: {
        agentId: this.definition.id,
        updatedFields: Object.keys(context)
      }
    });
  }
  
  /**
   * Record an item in the agent's memory
   * 
   * @param memoryItem The item to add to memory
   */
  protected recordMemory(memoryItem: AgentMemoryItem): void {
    // Limit memory size to prevent unbounded growth
    const MAX_MEMORY_SIZE = 100;
    
    if (this.state.memory && this.state.memory.length >= MAX_MEMORY_SIZE) {
      // Remove oldest memory item
      this.state.memory.shift();
    }
    
    this.state.memory = [
      ...(this.state.memory || []),
      memoryItem
    ];
  }
  
  /**
   * Invoke a function through the function registry
   * 
   * @param functionId ID of the function to invoke
   * @param parameters Parameters to pass to the function
   * @returns Promise that resolves to the function response
   */
  protected async invokeFunction(functionId: string, parameters: any): Promise<FunctionResponse> {
    // Check if agent has capability to call this function
    if (!this.definition.capabilities?.includes(functionId)) {
      return {
        success: false,
        error: `Agent ${this.definition.id} does not have capability to call function ${functionId}`
      };
    }
    
    try {
      return await functionRegistry.invokeFunction({
        functionId,
        parameters,
        contextId: this.state.sessionId,
        callerInfo: {
          agentId: this.state.agentId,
          sessionId: this.state.sessionId
        }
      });
    } catch (error) {
      console.error(`Error invoking function ${functionId}:`, error);
      
      // Emit error event
      this.emitEvent({
        type: AgentEventType.ERROR_OCCURRED,
        sourceAgentId: this.definition.id,
        timestamp: new Date(),
        payload: {
          functionId,
          error: error instanceof Error ? error.message : String(error)
        },
        priority: 'HIGH'
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Add an event listener for a specific event type
   * 
   * @param eventType Type of event to listen for
   * @param callback Function to call when event occurs
   */
  public addEventListener(eventType: AgentEventType, callback: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    this.eventListeners.set(eventType, [...listeners, callback]);
  }
  
  /**
   * Remove an event listener
   * 
   * @param eventType Type of event to remove listener for
   * @param callback Function to remove
   */
  public removeEventListener(eventType: AgentEventType, callback: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    this.eventListeners.set(
      eventType,
      listeners.filter(listener => listener !== callback)
    );
  }
  
  /**
   * Process an incoming event from another agent
   * 
   * @param event The event to process
   */
  public async receiveEvent(event: AgentEvent): Promise<void> {
    console.log(`Agent ${this.definition.id} received event ${event.type} from ${event.sourceAgentId}`);
    
    // Record event in memory
    this.recordMemory({
      type: 'event_received',
      timestamp: new Date(),
      input: event,
      tags: ['event', event.type]
    });
    
    // Call listeners for this event type
    const listeners = this.eventListeners.get(event.type) || [];
    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    }
  }
  
  /**
   * Emit an event to other agents
   * 
   * @param event The event to emit
   */
  protected async emitEvent(event: AgentEvent): Promise<void> {
    console.log(`Agent ${this.definition.id} emitting event ${event.type}`);
    
    // Record event in memory
    this.recordMemory({
      type: 'event_emitted',
      timestamp: new Date(),
      output: event,
      tags: ['event', event.type]
    });
    
    // Publish to the event bus
    await agentEventBus.publish(event);
  }
}