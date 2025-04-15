/**
 * Reconnection Manager
 * 
 * This module provides a CRON-style retry mechanism for reconnecting to Supabase
 * when the connection is lost. It uses exponential backoff and monitors network
 * status to optimize reconnection attempts.
 */

import { checkSupabaseConnection } from '@/lib/utils/supabaseClient';
import supabaseCircuitBreaker from '@/lib/utils/circuitBreaker';

// Reconnection options
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

// Default options
const DEFAULT_OPTIONS: ReconnectionOptions = {
  initialDelay: 2000,       // 2 seconds
  maxDelay: 60000,          // 1 minute
  backoffFactor: 1.5,
  jitter: 0.2,
  maxAttempts: 0,           // Unlimited attempts
  resetIntervalOnSuccess: 60000 * 5, // 5 minutes
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
    
    // Set up network status listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Start automatic reconnection attempts
   */
  start(reconnectTask: () => Promise<boolean>): void {
    this.reconnectTask = reconnectTask;
    
    // If we're online, schedule the first attempt
    if (this.online) {
      this.scheduleReconnect();
    } else {
      console.log('Network is offline. Reconnection attempts will start when online.');
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('Network is online. Scheduling reconnection attempt...');
    this.online = true;
    
    // Clear existing retry and start with a short delay to let network stabilize
    this.clearTimers();
    this.attempts = 0; // Reset attempts on network state change
    
    // Attempt reconnect after a short delay to allow network to stabilize
    setTimeout(() => {
      this.scheduleReconnect(1000);
    }, 500);
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('Network is offline. Pausing reconnection attempts.');
    this.online = false;
    this.clearTimers();
  };

  /**
   * Schedule the next reconnection attempt
   */
  private scheduleReconnect(overrideDelay?: number): void {
    // Don't schedule if:
    // 1. Already reconnecting
    // 2. Offline
    // 3. No reconnect task set
    // 4. Max attempts reached
    if (
      this.isReconnecting || 
      !this.online || 
      !this.reconnectTask ||
      (this.options.maxAttempts > 0 && this.attempts >= this.options.maxAttempts)
    ) {
      return;
    }
    
    // Calculate delay with jitter
    const baseDelay = overrideDelay || this.currentDelay;
    const jitterAmount = baseDelay * this.options.jitter;
    const delay = baseDelay + (Math.random() * jitterAmount * 2 - jitterAmount);
    
    console.log(`Scheduling reconnection attempt #${this.attempts + 1} in ${Math.round(delay / 1000)} seconds.`);
    
    // If there's a callback, call it
    if (this.options.onReconnectAttempt) {
      this.options.onReconnectAttempt(this.attempts + 1, delay);
    }
    
    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Schedule the reconnection attempt
    this.reconnectTimer = setTimeout(this.attemptReconnect, delay);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect = async (): void => {
    if (!this.online || !this.reconnectTask) {
      return;
    }
    
    this.isReconnecting = true;
    this.attempts++;
    
    try {
      console.log(`Reconnection attempt #${this.attempts}...`);
      const success = await this.reconnectTask();
      
      if (success) {
        console.log('Reconnection successful!');
        this.handleReconnectSuccess();
      } else {
        console.log('Reconnection failed.');
        this.handleReconnectFailure();
      }
    } catch (error) {
      console.error('Error during reconnection attempt:', error);
      this.handleReconnectFailure();
    } finally {
      this.isReconnecting = false;
    }
  };

  /**
   * Handle a successful reconnection
   */
  private handleReconnectSuccess(): void {
    // Reset attempt counter
    this.attempts = 0;
    this.currentDelay = this.options.initialDelay;
    this.lastSuccessTime = Date.now();
    
    // If there's a callback, call it
    if (this.options.onReconnectSuccess) {
      this.options.onReconnectSuccess();
    }
    
    // Set timer to reset the circuit breaker (if not already done)
    if (supabaseCircuitBreaker.isOpen()) {
      supabaseCircuitBreaker.reset();
    }
    
    // Schedule the next reset interval (checking is healthy after some time)
    if (this.options.resetIntervalOnSuccess > 0) {
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      
      this.resetTimer = setTimeout(() => {
        console.log('Running periodic Supabase connection health check...');
        this.attemptReconnect();
      }, this.options.resetIntervalOnSuccess);
    }
  }

  /**
   * Handle a failed reconnection
   */
  private handleReconnectFailure(): void {
    // Increase the delay for the next attempt (with a cap)
    this.currentDelay = Math.min(
      this.currentDelay * this.options.backoffFactor,
      this.options.maxDelay
    );
    
    // If there's a callback, call it
    if (this.options.onReconnectFailure) {
      this.options.onReconnectFailure(this.attempts);
    }
    
    // Schedule the next attempt
    this.scheduleReconnect();
  }

  /**
   * Force an immediate reconnection attempt
   */
  forceReconnect(): void {
    // Reset attempts and current delay
    this.attempts = 0;
    this.currentDelay = this.options.initialDelay;
    
    // Clear timers and attempt reconnection immediately
    this.clearTimers();
    
    if (this.online && this.reconnectTask) {
      console.log('Forcing immediate reconnection attempt...');
      this.scheduleReconnect(0);
    }
  }

  /**
   * Stop reconnection attempts
   */
  stop(): void {
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

// Create a reconnection manager instance
export const reconnectionManager = new ReconnectionManager({
  onReconnectAttempt: (attempt, delay) => {
    console.info(`Supabase reconnection attempt #${attempt} in ${Math.round(delay / 1000)} seconds.`);
  },
  onReconnectSuccess: () => {
    console.info('Supabase connection restored!');
  },
  onReconnectFailure: (attempt) => {
    console.warn(`Supabase reconnection attempt #${attempt} failed.`);
  }
});

// Start the reconnection manager with the Supabase connection check
export const startReconnectionManager = (): void => {
  reconnectionManager.start(async () => {
    try {
      return await checkSupabaseConnection();
    } catch (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
  });
};

export default reconnectionManager;