/**
 * Geographic Event Emitter
 * 
 * This module provides an event system for geographic data changes,
 * allowing services to subscribe to and react to geographic data events.
 */

import { GeographicRegion, GeographicMunicipality, GeographicNeighborhood } from '../../shared/schema';
import { logger } from './logger';

// Event types
export enum GeographicEventType {
  // Region events
  REGION_CREATED = 'region:created',
  REGION_UPDATED = 'region:updated',
  REGION_DELETED = 'region:deleted',
  
  // Municipality events
  MUNICIPALITY_CREATED = 'municipality:created',
  MUNICIPALITY_UPDATED = 'municipality:updated',
  MUNICIPALITY_DELETED = 'municipality:deleted',
  
  // Neighborhood events
  NEIGHBORHOOD_CREATED = 'neighborhood:created',
  NEIGHBORHOOD_UPDATED = 'neighborhood:updated',
  NEIGHBORHOOD_DELETED = 'neighborhood:deleted',
  
  // Mapping events
  TOWNSHIP_RANGE_MAPPING_CREATED = 'township-range:created',
  TOWNSHIP_RANGE_MAPPING_UPDATED = 'township-range:updated',
  TOWNSHIP_RANGE_MAPPING_DELETED = 'township-range:deleted',
  
  TCA_MAPPING_CREATED = 'tca:created',
  TCA_MAPPING_UPDATED = 'tca:updated',
  TCA_MAPPING_DELETED = 'tca:deleted',
  
  // Cost matrix events
  COST_MATRIX_CREATED = 'cost-matrix:created',
  COST_MATRIX_UPDATED = 'cost-matrix:updated',
  COST_MATRIX_DELETED = 'cost-matrix:deleted',
  
  // Bulk events
  GEOGRAPHIC_DATA_MIGRATED = 'geo:migrated',
  CACHES_CLEARED = 'geo:caches-cleared'
}

// Event data interface
export interface GeographicEvent<T = any> {
  type: GeographicEventType;
  data: T;
  timestamp: number;
}

// Event handler type
export type GeographicEventHandler<T = any> = (event: GeographicEvent<T>) => void | Promise<void>;

/**
 * Geographic Event Emitter
 * Allows services to subscribe to and emit geographic events
 */
export class GeographicEventEmitter {
  private subscribers: Map<GeographicEventType, GeographicEventHandler[]>;
  private wildcardSubscribers: GeographicEventHandler[];
  
  constructor() {
    this.subscribers = new Map();
    this.wildcardSubscribers = [];
    logger.info('Geographic Event Emitter initialized');
  }
  
  /**
   * Subscribe to a specific geographic event
   * @param eventType The event type to subscribe to
   * @param handler The handler function to call when the event occurs
   * @returns A function to unsubscribe
   */
  subscribe(eventType: GeographicEventType, handler: GeographicEventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    this.subscribers.get(eventType)!.push(handler);
    logger.debug(`Subscribed to event: ${eventType}`);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscribers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
          logger.debug(`Unsubscribed from event: ${eventType}`);
        }
      }
    };
  }
  
  /**
   * Subscribe to all geographic events
   * @param handler The handler function to call when any event occurs
   * @returns A function to unsubscribe
   */
  subscribeToAll(handler: GeographicEventHandler): () => void {
    this.wildcardSubscribers.push(handler);
    logger.debug('Subscribed to all geographic events');
    
    // Return unsubscribe function
    return () => {
      const index = this.wildcardSubscribers.indexOf(handler);
      if (index !== -1) {
        this.wildcardSubscribers.splice(index, 1);
        logger.debug('Unsubscribed from all geographic events');
      }
    };
  }
  
  /**
   * Emit a geographic event
   * @param eventType The type of event to emit
   * @param data The data associated with the event
   */
  async emit<T>(eventType: GeographicEventType, data: T): Promise<void> {
    const event: GeographicEvent<T> = {
      type: eventType,
      data,
      timestamp: Date.now()
    };
    
    logger.debug(`Emitting event: ${eventType}`);
    
    // Notify specific subscribers
    const handlers = this.subscribers.get(eventType) || [];
    
    // Notify wildcard subscribers
    const allHandlers = [...handlers, ...this.wildcardSubscribers];
    
    // Execute handlers (potentially async)
    for (const handler of allHandlers) {
      try {
        await Promise.resolve(handler(event));
      } catch (error) {
        logger.error(`Error in event handler for ${eventType}:`, error);
      }
    }
  }
  
  /**
   * Get the number of subscribers for a specific event type
   * @param eventType The event type
   * @returns The number of subscribers
   */
  getSubscriberCount(eventType?: GeographicEventType): number {
    if (!eventType) {
      // Count all subscribers
      let total = this.wildcardSubscribers.length;
      for (const handlers of this.subscribers.values()) {
        total += handlers.length;
      }
      return total;
    }
    
    return (this.subscribers.get(eventType)?.length || 0) + this.wildcardSubscribers.length;
  }
}

// Export a singleton instance
export const geographicEventEmitter = new GeographicEventEmitter();