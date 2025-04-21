/**
 * Custom Agent Base Class
 * 
 * This class serves as the foundation for all custom agents in the MCP framework.
 * It provides common functionality like event handling, health reporting, and
 * state management.
 */
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for agent health status
 */
export interface AgentHealthStatus {
  agentId: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastChecked: Date;
  details?: Record<string, any>;
}

/**
 * Base class for custom agents with event handling capabilities
 */
export abstract class CustomAgentBase {
  private _id: string;
  private _name: string;
  private _isInitialized: boolean = false;
  private _eventHandlers: Map<string, Function> = new Map();
  private _emitter: EventEmitter;

  /**
   * Constructor
   * 
   * @param idOrConfig Either the agent ID as a string, or a configuration object
   * @param name Optional human-readable name (defaults to formatted id)
   */
  constructor(idOrConfig: string | { agentId: string; agentName?: string; description?: string }, name?: string) {
    // Handle both string ID and config object
    if (typeof idOrConfig === 'string') {
      this._id = idOrConfig;
      
      // If name is provided, use it. Otherwise, try to generate from id
      if (name) {
        this._name = name;
      } else {
        // Make sure id is a string before trying to split it
        try {
          if (this._id.includes('-')) {
            this._name = this._id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          } else {
            this._name = this._id;
          }
        } catch (e) {
          // Fallback in case of any error
          this._name = this._id;
        }
      }
    } else {
      // Handle config object
      this._id = idOrConfig.agentId;
      this._name = idOrConfig.agentName || this._id;
    }
    
    this._emitter = new EventEmitter();
    
    // Set higher max listeners to avoid warnings
    this._emitter.setMaxListeners(50);
  }

  /**
   * Get the agent's ID
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get the agent's name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Check if the agent is initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    // Base initialization - override in derived classes if needed
    console.log(`Agent ${this.name} (${this.id}) initializing...`);
    this._isInitialized = true;
    
    // Emit initialization event
    this.emitEvent('agent:initialized', { agentId: this.id });
  }

  /**
   * Get the agent's current health status
   */
  public getHealthStatus(): AgentHealthStatus {
    return {
      agentId: this.id,
      name: this.name,
      status: 'online',
      lastChecked: new Date(),
      details: {
        eventsHandled: this._eventHandlers.size,
        isInitialized: this._isInitialized
      }
    };
  }

  /**
   * Register an event handler
   * 
   * @param eventType Type of event to handle
   * @param handler Function to handle the event
   */
  public registerEventHandler<T, R>(eventType: string, handler: (data: T) => Promise<R>): void {
    this._eventHandlers.set(eventType, handler);
    console.log(`Agent ${this.id} registered handler for ${eventType}`);
  }

  /**
   * Handle an event
   * 
   * @param eventType Type of event to handle
   * @param data Event data
   * @returns Result of handling the event
   */
  public async handleEvent<T, R>(eventType: string, data: T): Promise<R | null> {
    if (!this._eventHandlers.has(eventType)) {
      console.warn(`Agent ${this.id} has no handler for event ${eventType}`);
      return null;
    }
    
    try {
      const handler = this._eventHandlers.get(eventType) as (data: T) => Promise<R>;
      return await handler(data);
    } catch (error) {
      console.error(`Error handling event ${eventType} in agent ${this.id}:`, error);
      throw error;
    }
  }

  /**
   * Emit an event
   * 
   * @param eventType Type of event to emit
   * @param data Event data
   */
  protected emitEvent<T>(eventType: string, data: T): void {
    this._emitter.emit(eventType, {
      id: uuidv4(),
      timestamp: new Date(),
      type: eventType,
      source: this.id,
      data
    });
    
    console.log(`Agent ${this.id} emitted ${eventType} event`);
  }

  /**
   * Listen for an event
   * 
   * @param eventType Type of event to listen for
   * @param listener Function to call when the event is emitted
   */
  public on<T>(eventType: string, listener: (data: T) => void): void {
    this._emitter.on(eventType, listener);
  }

  /**
   * Listen for an event once
   * 
   * @param eventType Type of event to listen for
   * @param listener Function to call when the event is emitted
   */
  public once<T>(eventType: string, listener: (data: T) => void): void {
    this._emitter.once(eventType, listener);
  }

  /**
   * Remove an event listener
   * 
   * @param eventType Type of event to stop listening for
   * @param listener Function to remove
   */
  public off<T>(eventType: string, listener: (data: T) => void): void {
    this._emitter.off(eventType, listener);
  }
}