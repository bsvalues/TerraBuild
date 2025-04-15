/**
 * Reconnection Manager
 * 
 * This module provides a CRON-style retry mechanism for reconnecting to Supabase
 * when the connection is lost. It uses exponential backoff and monitors network
 * status to optimize reconnection attempts.
 */

import { checkSupabaseConnection } from "./supabaseClient";

export interface ReconnectionOptions {
  initialDelay: number;       // Initial delay in ms
  maxDelay: number;           // Maximum delay in ms
  backoffFactor: number;      // Factor to multiply delay on each attempt
  jitter: number;             // Random jitter factor (0-1) to avoid thundering herd
  maxAttempts: number;        // Maximum number of attempts (0 = unlimited)
  resetIntervalOnSuccess: number; // Time in ms to reset attempt counter after success
  onReconnectAttempt?: (attempt: number, delay: number) => void; // Callback on attempt
  onReconnectSuccess?: () => void; // Callback on success
  onReconnectFailure?: (attempt: number) => void; // Callback on failure
}

const DEFAULT_OPTIONS: ReconnectionOptions = {
  initialDelay: 1000,         // Start with 1 second
  maxDelay: 60000,            // Maximum 1 minute
  backoffFactor: 2,           // Double each time
  jitter: 0.2,                // 20% randomness
  maxAttempts: 0,             // Unlimited by default
  resetIntervalOnSuccess: 60000 * 5, // Reset attempt counter after 5 minutes of stable connection
};

/**
 * Reconnection Manager class
 */
export class ReconnectionManager {
  private options: ReconnectionOptions;
  private attempts: number = 0;
  private currentDelay: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;
  private isReconnecting: boolean = false;
  private lastSuccessTime: number = Date.now();
  private online: boolean = navigator.onLine;
  private reconnectTask: (() => Promise<boolean>) | null = null;

  constructor(options: Partial<ReconnectionOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.currentDelay = this.options.initialDelay;
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Start automatic reconnection attempts
   */
  start(reconnectTask: () => Promise<boolean>): void {
    this.reconnectTask = reconnectTask;
    
    // Immediately try to connect
    if (this.online) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.online = true;
    console.log('Network came online. Scheduling reconnection...');
    
    // Try to reconnect immediately when we come online
    this.forceReconnect();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.online = false;
    console.log('Network went offline. Pausing reconnection attempts...');
    
    // Cancel any pending reconnection attempts
    this.clearTimers();
  };

  /**
   * Schedule the next reconnection attempt
   */
  private scheduleReconnect(overrideDelay?: number): void {
    // Don't schedule if we're not online
    if (!this.online) return;
    
    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Calculate delay with jitter
    const delay = overrideDelay || this.currentDelay;
    const jitterAmount = delay * this.options.jitter;
    const actualDelay = delay + (Math.random() * jitterAmount * 2 - jitterAmount);
    
    console.log(`Scheduling next reconnection attempt in ${Math.round(actualDelay)}ms`);
    
    // Schedule next attempt
    this.reconnectTimer = setTimeout(() => this.attemptReconnect(), actualDelay);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect = async (): Promise<boolean> => {
    // Don't attempt if already reconnecting or offline
    if (this.isReconnecting || !this.online || !this.reconnectTask) {
      return false;
    }
    
    this.isReconnecting = true;
    this.attempts++;
    
    // Calculate next delay with exponential backoff
    this.currentDelay = Math.min(
      this.currentDelay * this.options.backoffFactor,
      this.options.maxDelay
    );
    
    // Notify about attempt
    if (this.options.onReconnectAttempt) {
      this.options.onReconnectAttempt(this.attempts, this.currentDelay);
    }
    
    console.log(`Reconnection attempt ${this.attempts}...`);
    
    try {
      // Execute the reconnection task
      const success = await this.reconnectTask();
      
      if (success) {
        this.handleReconnectSuccess();
        return true;
      } else {
        this.handleReconnectFailure();
        return false;
      }
    } catch (error) {
      console.error('Error during reconnection attempt:', error);
      this.handleReconnectFailure();
      return false;
    } finally {
      this.isReconnecting = false;
    }
  };

  /**
   * Handle a successful reconnection
   */
  private handleReconnectSuccess(): void {
    console.log(`Reconnection successful after ${this.attempts} attempts`);
    
    this.lastSuccessTime = Date.now();
    
    // Reset counters
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    
    // Schedule a reset of the attempt counter
    this.resetTimer = setTimeout(() => {
      console.log('Resetting reconnection attempt counter after period of stability');
      this.attempts = 0;
      this.currentDelay = this.options.initialDelay;
    }, this.options.resetIntervalOnSuccess);
    
    // Notify about success
    if (this.options.onReconnectSuccess) {
      this.options.onReconnectSuccess();
    }
  }

  /**
   * Handle a failed reconnection
   */
  private handleReconnectFailure(): void {
    console.log(`Reconnection attempt ${this.attempts} failed`);
    
    // Check if we've reached max attempts
    if (this.options.maxAttempts > 0 && this.attempts >= this.options.maxAttempts) {
      console.log(`Reached maximum reconnection attempts (${this.options.maxAttempts})`);
      
      if (this.options.onReconnectFailure) {
        this.options.onReconnectFailure(this.attempts);
      }
      
      return;
    }
    
    // Schedule the next attempt
    this.scheduleReconnect();
    
    // Notify about failure
    if (this.options.onReconnectFailure) {
      this.options.onReconnectFailure(this.attempts);
    }
  }

  /**
   * Force an immediate reconnection attempt
   */
  forceReconnect(): void {
    if (this.isReconnecting) return;
    
    console.log('Forcing immediate reconnection attempt');
    
    // Clear any pending timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Attempt reconnection immediately
    this.attemptReconnect();
  }

  /**
   * Stop reconnection attempts
   */
  stop(): void {
    console.log('Stopping reconnection manager');
    this.clearTimers();
    this.reconnectTask = null;
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

// Create a singleton instance with default options
export const reconnectionManager = new ReconnectionManager({
  onReconnectAttempt: (attempt, delay) => {
    console.log(`Reconnection attempt ${attempt}, next attempt in ${Math.round(delay / 1000)}s`);
  },
  onReconnectSuccess: () => {
    console.log('Reconnected to Supabase successfully');
  },
  onReconnectFailure: (attempt) => {
    console.warn(`Reconnection attempt ${attempt} failed`);
  }
});

export const startReconnectionManager = async (): Promise<void> => {
  reconnectionManager.start(async () => {
    try {
      return await checkSupabaseConnection();
    } catch (error) {
      console.error('Connection check error:', error);
      return false;
    }
  });
};

export default reconnectionManager;