/**
 * Reconnection Manager
 * 
 * This module manages reconnection attempts to Supabase when the connection is lost.
 * It uses exponential backoff to avoid overwhelming the server with reconnection attempts.
 */

type ReconnectionCallback = () => Promise<boolean>;
type ReconnectionStatusCallback = (status: ReconnectionStatus) => void;

// Reconnection status
export interface ReconnectionStatus {
  isReconnecting: boolean;
  attempt: number;
  maxAttempts: number;
  nextAttemptTime?: Date;
  lastAttemptTime?: Date;
}

/**
 * Manages reconnection attempts with exponential backoff
 */
export class ReconnectionManager {
  private isReconnecting: boolean = false;
  private reconnectionAttempts: number = 0;
  private maxReconnectionAttempts: number = 10;
  private baseDelay: number = 1000; // Start with 1 second delay
  private maxDelay: number = 60000; // Max delay of 60 seconds
  private reconnectTimer: number | null = null;
  private statusListeners: ReconnectionStatusCallback[] = [];
  private nextAttemptTime: Date | null = null;
  private lastAttemptTime: Date | null = null;

  constructor(maxAttempts?: number, baseDelay?: number, maxDelay?: number) {
    if (maxAttempts) this.maxReconnectionAttempts = maxAttempts;
    if (baseDelay) this.baseDelay = baseDelay;
    if (maxDelay) this.maxDelay = maxDelay;
  }

  /**
   * Start reconnection process with exponential backoff
   * @param reconnectCallback Function to call when attempting reconnection
   * @returns Promise that resolves when reconnection is successful or max attempts reached
   */
  async startReconnection(reconnectCallback: ReconnectionCallback): Promise<boolean> {
    // If already reconnecting, don't start again
    if (this.isReconnecting) {
      return false;
    }

    this.isReconnecting = true;
    this.reconnectionAttempts = 0;
    this.notifyStatusListeners();

    return this.attemptReconnect(reconnectCallback);
  }

  /**
   * Stop reconnection attempts
   */
  stopReconnection(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isReconnecting = false;
    this.notifyStatusListeners();
  }

  /**
   * Get current reconnection status
   */
  getStatus(): ReconnectionStatus {
    return {
      isReconnecting: this.isReconnecting,
      attempt: this.reconnectionAttempts,
      maxAttempts: this.maxReconnectionAttempts,
      nextAttemptTime: this.nextAttemptTime || undefined,
      lastAttemptTime: this.lastAttemptTime || undefined
    };
  }

  /**
   * Add a listener for reconnection status changes
   * @param listener Callback function to call when status changes
   * @returns Function to remove the listener
   */
  addStatusListener(listener: ReconnectionStatusCallback): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  /**
   * Reset reconnection attempts
   */
  reset(): void {
    this.stopReconnection();
    this.reconnectionAttempts = 0;
    this.nextAttemptTime = null;
    this.lastAttemptTime = null;
    this.notifyStatusListeners();
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private async attemptReconnect(reconnectCallback: ReconnectionCallback): Promise<boolean> {
    // If we've reached max attempts, stop trying
    if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
      console.warn(`Maximum reconnection attempts (${this.maxReconnectionAttempts}) reached. Giving up.`);
      this.isReconnecting = false;
      this.notifyStatusListeners();
      return false;
    }

    // Increment attempt counter
    this.reconnectionAttempts++;
    this.lastAttemptTime = new Date();
    this.notifyStatusListeners();

    try {
      // Try to reconnect
      console.log(`Attempting reconnection (${this.reconnectionAttempts}/${this.maxReconnectionAttempts})...`);
      const reconnected = await reconnectCallback();
      
      if (reconnected) {
        // Successfully reconnected
        console.log('Reconnection successful!');
        this.isReconnecting = false;
        this.notifyStatusListeners();
        return true;
      }
    } catch (error) {
      console.error('Error during reconnection attempt:', error);
    }

    // If we get here, reconnection failed. Calculate backoff time.
    const delay = this.calculateBackoff();
    console.log(`Reconnection failed. Retrying in ${delay / 1000} seconds...`);
    
    // Schedule next attempt
    this.nextAttemptTime = new Date(Date.now() + delay);
    this.notifyStatusListeners();
    
    return new Promise((resolve) => {
      this.reconnectTimer = window.setTimeout(async () => {
        const result = await this.attemptReconnect(reconnectCallback);
        resolve(result);
      }, delay);
    });
  }

  /**
   * Calculate backoff delay using exponential backoff with jitter
   */
  private calculateBackoff(): number {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = this.baseDelay * Math.pow(2, this.reconnectionAttempts - 1);
    
    // Add jitter (randomness) to avoid reconnection storms
    const jitter = Math.random() * 0.3 * exponentialDelay;
    
    // Apply max delay cap
    return Math.min(exponentialDelay + jitter, this.maxDelay);
  }

  /**
   * Notify status listeners of changes
   */
  private notifyStatusListeners(): void {
    const status = this.getStatus();
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in reconnection status listener:', error);
      }
    });
  }
}

// Create and export singleton instance
export const reconnectionManager = new ReconnectionManager();

export default reconnectionManager;