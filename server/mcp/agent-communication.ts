/**
 * MCP Agent Communication Service
 * 
 * This service facilitates communication between agents in the MCP framework,
 * allowing for a structured approach to inter-agent collaborations.
 */

import { eventBus } from './event-bus';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Message types for agent communication
export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  BROADCAST = 'broadcast',
  NOTIFICATION = 'notification'
}

// Message priority levels
export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Agent message interface
export interface AgentMessage {
  id: string;
  type: MessageType;
  priority: Priority;
  from: string;
  to?: string;
  subject: string;
  content: any;
  timestamp: number;
  correlationId?: string;
  metadata?: Record<string, any>;
}

// Agent Communication Service
class AgentCommunicationService {
  // Map to track pending requests
  private pendingRequests: Map<string, { 
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  private DEFAULT_TIMEOUT = 30000; // 30 seconds

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for agent communication
   */
  private setupEventListeners(): void {
    // Listen for agent responses
    eventBus.subscribe('agent:response', (event) => {
      const response = event.payload;
      const requestId = response?.correlationId;

      if (requestId && this.pendingRequests.has(requestId)) {
        const { resolve, timeout } = this.pendingRequests.get(requestId)!;
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        resolve(response);
      }
    });

    // Listen for agent errors
    eventBus.subscribe('agent:error:response', (event) => {
      const error = event.payload;
      const requestId = error?.correlationId;

      if (requestId && this.pendingRequests.has(requestId)) {
        const { reject, timeout } = this.pendingRequests.get(requestId)!;
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }

  /**
   * Send a request to another agent and wait for a response
   * 
   * @param from Source agent ID
   * @param to Target agent ID
   * @param subject Message subject
   * @param content Message content
   * @param options Additional options
   * @returns Promise that resolves with the response
   */
  sendRequest(
    from: string,
    to: string,
    subject: string,
    content: any,
    options: {
      priority?: Priority;
      timeout?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<any> {
    const messageId = uuidv4();
    const message: AgentMessage = {
      id: messageId,
      type: MessageType.REQUEST,
      priority: options.priority || Priority.NORMAL,
      from,
      to,
      subject,
      content,
      timestamp: Date.now(),
      metadata: options.metadata
    };

    // Create promise to track the request
    return new Promise((resolve, reject) => {
      // Set timeout to reject the promise if no response received
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error(`Request timed out: ${subject}`));
        }
      }, options.timeout || this.DEFAULT_TIMEOUT);

      // Store the promise resolvers and timeout
      this.pendingRequests.set(messageId, { resolve, reject, timeout });

      // Emit the request event
      logger.debug(`[AgentComm] Sending request: ${from} -> ${to}: ${subject}`);
      eventBus.publish('agent:request', message);
    });
  }

  /**
   * Send a response to a request
   * 
   * @param from Source agent ID
   * @param to Target agent ID
   * @param subject Message subject
   * @param content Message content
   * @param correlationId Original request ID
   * @param options Additional options
   */
  sendResponse(
    from: string,
    to: string,
    subject: string,
    content: any,
    correlationId: string,
    options: {
      priority?: Priority;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const message: AgentMessage = {
      id: uuidv4(),
      type: MessageType.RESPONSE,
      priority: options.priority || Priority.NORMAL,
      from,
      to,
      subject,
      content,
      correlationId,
      timestamp: Date.now(),
      metadata: options.metadata
    };

    logger.debug(`[AgentComm] Sending response: ${from} -> ${to}: ${subject}`);
    eventBus.publish('agent:response', message);
  }

  /**
   * Broadcast a message to all agents
   * 
   * @param from Source agent ID
   * @param subject Message subject
   * @param content Message content
   * @param options Additional options
   */
  broadcast(
    from: string,
    subject: string,
    content: any,
    options: {
      priority?: Priority;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const message: AgentMessage = {
      id: uuidv4(),
      type: MessageType.BROADCAST,
      priority: options.priority || Priority.NORMAL,
      from,
      subject,
      content,
      timestamp: Date.now(),
      metadata: options.metadata
    };

    logger.debug(`[AgentComm] Broadcasting: ${from}: ${subject}`);
    eventBus.publish('agent:broadcast', message);
  }

  /**
   * Send a notification to another agent (no response expected)
   * 
   * @param from Source agent ID
   * @param to Target agent ID
   * @param subject Message subject
   * @param content Message content
   * @param options Additional options
   */
  sendNotification(
    from: string,
    to: string,
    subject: string,
    content: any,
    options: {
      priority?: Priority;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const message: AgentMessage = {
      id: uuidv4(),
      type: MessageType.NOTIFICATION,
      priority: options.priority || Priority.NORMAL,
      from,
      to,
      subject,
      content,
      timestamp: Date.now(),
      metadata: options.metadata
    };

    logger.debug(`[AgentComm] Sending notification: ${from} -> ${to}: ${subject}`);
    eventBus.publish('agent:notification', message);
  }
}

// Create the singleton instance
export const agentCommunication = new AgentCommunicationService();