/**
 * Custom Agent Base for Development, Design, and Data Analysis agents
 * 
 * This class provides a simplified base implementation for development-oriented agents
 * that differs from the standard application agents.
 */

import { agentEventBus } from './eventBus';
import { v4 as uuidv4 } from 'uuid';

// Define a simple custom event interface for our agents
export interface AgentEvent {
  type: string;
  source: string;
  timestamp: Date | string;
  data: any;
}

/**
 * Base class for custom agents
 */
export class CustomAgentBase {
  public agentId: string;
  public name: string;
  public isInitialized: boolean = false;
  public capabilities: string[] = [];
  
  /**
   * Create a new custom agent
   * 
   * @param name Human-readable name for this agent
   * @param id Unique identifier for this agent
   */
  constructor(name: string, id: string) {
    this.name = name;
    this.agentId = id;
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<boolean> {
    console.log(`Agent ${this.name} (${this.agentId}) initializing...`);
    this.isInitialized = true;
    return true;
  }
  
  /**
   * Shutdown the agent
   */
  public async shutdown(): Promise<boolean> {
    console.log(`Agent ${this.name} (${this.agentId}) shutting down...`);
    this.isInitialized = false;
    return true;
  }
  
  /**
   * Emit an event using the agent event bus
   * 
   * @param type Event type
   * @param data Event data
   */
  protected async emitEvent(type: string, data: any): Promise<void> {
    await agentEventBus.publish({
      type,
      source: this.agentId,
      timestamp: new Date(),
      data
    });
  }
  
  /**
   * Register with the agent registry and event bus
   * 
   * @param eventType Event type to subscribe to
   * @param handler Event handler function
   */
  protected registerEventHandler(eventType: string, handler: Function): void {
    agentEventBus.subscribe(
      eventType, 
      this.agentId,
      async (event: any) => await handler(event)
    );
    
    console.log(`Agent ${this.agentId} subscribed to ${eventType} events`);
  }
}