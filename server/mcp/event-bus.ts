/**
 * MCP Event Bus
 * 
 * This module provides a simple event bus for communication between MCP components.
 * It implements a publish-subscribe pattern for distributing events throughout the system.
 */

import { v4 as uuidv4 } from 'uuid';
import { MCPEvent } from './types';

// Define the event handler type
type EventHandler = (event: MCPEvent) => void | Promise<void>;

// EventBus class
class EventBus {
  private subscriptions: Map<string, Map<string, EventHandler>> = new Map();
  
  /**
   * Publish an event to all subscribers of a topic
   * @param topic The topic to publish to
   * @param payload The event payload
   * @returns The published event
   */
  publish(topic: string, payload?: any): MCPEvent {
    const event: MCPEvent = {
      id: uuidv4(),
      topic,
      timestamp: Date.now(),
      payload
    };
    
    console.log(`[EventBus] Publishing event to topic ${topic}`);
    
    const topicSubscribers = this.subscriptions.get(topic);
    if (topicSubscribers) {
      // Execute handlers asynchronously
      for (const [id, handler] of topicSubscribers.entries()) {
        try {
          Promise.resolve(handler(event)).catch(error => {
            console.error(`[EventBus] Error in event handler ${id} for topic ${topic}:`, error);
          });
        } catch (error) {
          console.error(`[EventBus] Error executing event handler ${id} for topic ${topic}:`, error);
        }
      }
    }
    
    return event;
  }
  
  /**
   * Subscribe to events on a topic
   * @param topic The topic to subscribe to
   * @param handler The event handler function
   * @returns Subscription ID that can be used to unsubscribe
   */
  subscribe(topic: string, handler: EventHandler): string {
    const subscriberId = uuidv4();
    
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Map());
    }
    
    this.subscriptions.get(topic)!.set(subscriberId, handler);
    console.log(`[EventBus] Handler subscribed to ${topic} events (ID: ${subscriberId})`);
    
    return subscriberId;
  }
  
  /**
   * Unsubscribe from events
   * @param subscriberId The subscription ID returned from subscribe()
   * @returns True if unsubscribed successfully, false otherwise
   */
  unsubscribe(subscriberId: string): boolean {
    for (const [topic, subscribers] of this.subscriptions.entries()) {
      if (subscribers.has(subscriberId)) {
        subscribers.delete(subscriberId);
        console.log(`[EventBus] Handler unsubscribed from ${topic} events (ID: ${subscriberId})`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get all subscribers for a topic
   * @param topic The topic to get subscribers for
   * @returns Map of subscriber IDs to handlers
   */
  getSubscribers(topic: string): Map<string, EventHandler> {
    return this.subscriptions.get(topic) || new Map();
  }
  
  /**
   * Clear all subscriptions for a topic
   * @param topic The topic to clear subscriptions for
   */
  clearTopic(topic: string): void {
    this.subscriptions.delete(topic);
    console.log(`[EventBus] Cleared all subscribers for topic ${topic}`);
  }
  
  /**
   * Clear all subscriptions
   */
  clearAll(): void {
    this.subscriptions.clear();
    console.log('[EventBus] Cleared all subscribers');
  }
}

// Create a singleton instance
export const eventBus = new EventBus();