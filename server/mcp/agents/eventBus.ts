/**
 * Agent Event Bus for Model Content Protocol
 * 
 * This file implements an event bus for communication between agents.
 * It follows the publisher-subscriber pattern for decoupled communication.
 */

import { AgentEvent, AgentEventType } from './baseAgent';
import { v4 as uuidv4 } from 'uuid';

// Type for event handler callbacks
type EventHandler = (event: AgentEvent) => Promise<void>;

// Interface for subscription information
interface Subscription {
  id: string;
  agentId: string;
  eventType: AgentEventType | '*';  // '*' for all events
  handler: EventHandler;
}

/**
 * Agent Event Bus
 * Manages inter-agent communication through an event-based system
 */
export class AgentEventBus {
  private static instance: AgentEventBus;
  private subscriptions: Subscription[] = [];
  private eventHistory: AgentEvent[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    console.log('Agent Event Bus initialized');
  }
  
  /**
   * Get the singleton instance of the event bus
   */
  public static getInstance(): AgentEventBus {
    if (!AgentEventBus.instance) {
      AgentEventBus.instance = new AgentEventBus();
    }
    return AgentEventBus.instance;
  }
  
  /**
   * Subscribe to events on the bus
   * 
   * @param agentId ID of the agent subscribing
   * @param eventType Type of event to subscribe to, or '*' for all events
   * @param handler Function to call when event occurs
   * @returns Subscription ID for later unsubscribing
   */
  public subscribe(agentId: string, eventType: AgentEventType | '*', handler: EventHandler): string {
    const subscriptionId = uuidv4();
    this.subscriptions.push({
      id: subscriptionId,
      agentId,
      eventType,
      handler
    });
    
    console.log(`Agent ${agentId} subscribed to ${eventType} events (ID: ${subscriptionId})`);
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from events
   * 
   * @param subscriptionId ID returned from subscribe
   * @returns True if successfully unsubscribed
   */
  public unsubscribe(subscriptionId: string): boolean {
    const index = this.subscriptions.findIndex(sub => sub.id === subscriptionId);
    if (index === -1) {
      return false;
    }
    
    const subscription = this.subscriptions[index];
    this.subscriptions.splice(index, 1);
    console.log(`Agent ${subscription.agentId} unsubscribed from ${subscription.eventType} events (ID: ${subscriptionId})`);
    return true;
  }
  
  /**
   * Unsubscribe all handlers for an agent
   * 
   * @param agentId ID of the agent
   */
  public unsubscribeAll(agentId: string): void {
    const initialCount = this.subscriptions.length;
    this.subscriptions = this.subscriptions.filter(sub => sub.agentId !== agentId);
    const removedCount = initialCount - this.subscriptions.length;
    console.log(`Removed ${removedCount} subscriptions for agent ${agentId}`);
  }
  
  /**
   * Publish an event to the bus
   * 
   * @param event Event to publish
   */
  public async publish(event: AgentEvent): Promise<void> {
    // Add to history (with limit)
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.MAX_HISTORY_SIZE) {
      this.eventHistory.shift();
    }
    
    console.log(`Event published: ${event.type} from ${event.sourceAgentId}${event.targetAgentId ? ` to ${event.targetAgentId}` : ''}`);
    
    // Find matching subscribers
    const handlers: Array<Promise<void>> = [];
    
    for (const subscription of this.subscriptions) {
      // Skip if this is from the same agent that's subscribing (to avoid loops)
      if (subscription.agentId === event.sourceAgentId) {
        continue;
      }
      
      // Check if targeted to specific agent or matching event type
      const isWildcardSubscription = subscription.eventType === '*';
      const isMatchingEventType = subscription.eventType === event.type;
      const isTargetedToAgent = event.targetAgentId === subscription.agentId || !event.targetAgentId;
      
      if (isTargetedToAgent && (isWildcardSubscription || isMatchingEventType)) {
        handlers.push(subscription.handler(event));
      }
    }
    
    // Execute all handlers in parallel
    await Promise.all(handlers);
  }
  
  /**
   * Get recent events from the history
   * 
   * @param limit Maximum number of events to return
   * @param agentId Optional agent ID to filter by
   * @param eventType Optional event type to filter by
   * @returns Array of events matching criteria
   */
  public getRecentEvents(limit?: number, agentId?: string, eventType?: AgentEventType): AgentEvent[] {
    let filteredEvents = this.eventHistory;
    
    // Apply filters if provided
    if (agentId) {
      filteredEvents = filteredEvents.filter(
        e => e.sourceAgentId === agentId || e.targetAgentId === agentId
      );
    }
    
    if (eventType) {
      filteredEvents = filteredEvents.filter(e => e.type === eventType);
    }
    
    // Apply limit and reverse to get most recent first
    return filteredEvents
      .slice(-1 * (limit || filteredEvents.length))
      .reverse();
  }
  
  /**
   * Clear all event history
   */
  public clearHistory(): void {
    const clearedCount = this.eventHistory.length;
    this.eventHistory = [];
    console.log(`Cleared ${clearedCount} events from history`);
  }
}

// Export singleton instance
export const agentEventBus = AgentEventBus.getInstance();