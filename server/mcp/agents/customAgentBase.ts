/**
 * Custom Agent Base Class
 * 
 * This class provides a foundation for custom agents in the MCP framework,
 * handling the common setup and functionality.
 */

export interface CustomAgentConfig {
  agentId: string;
  agentName: string;
  description: string;
  version?: string;
  capabilities?: string[];
}

export class CustomAgentBase {
  protected agentId: string;
  protected agentName: string;
  protected description: string;
  protected version: string;
  protected capabilities: string[];
  protected eventHandlers: Map<string, Function> = new Map();

  constructor(config: CustomAgentConfig) {
    this.agentId = config.agentId;
    this.agentName = config.agentName;
    this.description = config.description;
    this.version = config.version || '1.0.0';
    this.capabilities = config.capabilities || [];
    
    this.initialize();
  }

  /**
   * Initialize the agent
   * Override in subclasses if needed
   */
  protected initialize(): void {
    console.log(`Agent ${this.agentName} (${this.agentId}) initializing...`);
  }

  /**
   * Get the agent's ID
   */
  public getId(): string {
    return this.agentId;
  }

  /**
   * Get the agent's name
   */
  public getName(): string {
    return this.agentName;
  }

  /**
   * Get the agent's description
   */
  public getDescription(): string {
    return this.description;
  }

  /**
   * Get the agent's version
   */
  public getVersion(): string {
    return this.version;
  }

  /**
   * Get the agent's capabilities
   */
  public getCapabilities(): string[] {
    return [...this.capabilities];
  }

  /**
   * Check if the agent has a specific capability
   */
  public hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }
  
  /**
   * Register an event handler for a specific event type
   * 
   * @param eventType Type of event to handle
   * @param handler Function to handle the event
   */
  protected registerEventHandler(eventType: string, handler: Function): void {
    this.eventHandlers.set(eventType, handler);
    console.log(`Agent ${this.agentId} registered handler for ${eventType}`);
  }
  
  /**
   * Handle an incoming event
   * 
   * @param event The event to handle
   * @param context Context for event handling
   */
  public async handleEvent(event: any, context: any = {}): Promise<void> {
    const handler = this.eventHandlers.get(event.type);
    
    if (handler) {
      try {
        await handler(event, context);
      } catch (error) {
        console.error(`Error in ${this.agentId} handling ${event.type}:`, error);
      }
    }
  }
  
  /**
   * Emit an event
   * 
   * @param type Type of event to emit
   * @param data Data for the event
   */
  protected async emitEvent(type: string, data: any): Promise<void> {
    console.log(`Agent ${this.agentId} emitted ${type} event`);
    // In a real implementation, this would publish to an event bus
  }
  
  /**
   * Record an item in agent memory
   * 
   * @param item Item to record
   */
  protected recordMemory(item: any): void {
    console.log(`Agent ${this.agentId} recorded memory item`);
    // In a real implementation, this would store to a persistent memory system
  }
}