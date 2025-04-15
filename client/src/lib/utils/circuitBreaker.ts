/**
 * Circuit Breaker Pattern Implementation
 * 
 * This module implements the circuit breaker pattern to prevent
 * cascading failures when Supabase or other external services are down.
 * It tracks failures and automatically opens the circuit after a threshold,
 * preventing redundant calls to failing services.
 */

// Circuit breaker states
export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation, requests pass through
  OPEN = 'OPEN',       // Failure threshold exceeded, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back online
}

// Configuration options for circuit breaker
export interface CircuitBreakerOptions {
  failureThreshold: number;     // Number of failures before opening circuit
  resetTimeout: number;         // Time in ms to wait before attempting reset
  halfOpenSuccessThreshold: number; // Successes needed to close circuit
  monitorInterval?: number;     // Interval to log circuit state
  onStateChange?: (from: CircuitState, to: CircuitState) => void; // State change callback
  logStateChanges?: boolean;    // Whether to log state changes to console
}

// Default options
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  halfOpenSuccessThreshold: 3,
  monitorInterval: 60000, // 1 minute
  logStateChanges: true
};

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;
  private monitorTimer: ReturnType<typeof setInterval> | null = null;
  private options: CircuitBreakerOptions;
  private services: Map<string, boolean> = new Map();  // Track individual services

  constructor(
    public readonly name: string,
    options: Partial<CircuitBreakerOptions> = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Start monitoring if interval provided
    if (this.options.monitorInterval) {
      this.startMonitoring();
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, serviceName?: string): Promise<T> {
    // Check if specific service is tracked and has open circuit
    if (serviceName && this.services.has(serviceName) && !this.services.get(serviceName)) {
      throw new Error(`Circuit is open for service: ${serviceName}`);
    }
    
    // Check main circuit state
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try again
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.transitionToHalfOpen();
      } else {
        throw new Error(`Circuit breaker is open for ${this.name}`);
      }
    }
    
    try {
      // Call the function
      const result = await fn();
      
      // Handle success
      this.handleSuccess(serviceName);
      
      return result;
    } catch (error) {
      // Handle failure
      this.handleFailure(serviceName);
      
      throw error;
    }
  }

  /**
   * Register a specific service with the circuit breaker
   */
  registerService(serviceName: string): void {
    this.services.set(serviceName, true);
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if the circuit is closed (allowing requests)
   */
  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Check if the circuit is open (blocking requests)
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Check specific service status
   */
  isServiceAvailable(serviceName: string): boolean {
    if (!this.services.has(serviceName)) {
      return true; // Default to available if not tracked
    }
    return this.services.get(serviceName) === true;
  }

  /**
   * Force open the circuit
   */
  forceOpen(): void {
    this.transitionToState(CircuitState.OPEN);
  }

  /**
   * Force close the circuit
   */
  forceClose(): void {
    this.reset();
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset(serviceName?: string): void {
    if (serviceName) {
      this.services.set(serviceName, true);
    } else {
      this.failureCount = 0;
      this.successCount = 0;
      this.transitionToState(CircuitState.CLOSED);
      
      // Reset all services
      this.services.forEach((_, service) => {
        this.services.set(service, true);
      });
      
      // Clear any pending timers
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
        this.resetTimer = null;
      }
    }
  }

  /**
   * Start monitoring the circuit state for logging
   */
  private startMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }
    
    this.monitorTimer = setInterval(() => {
      console.info(`Circuit breaker ${this.name} state: ${this.state}`);
      
      // Log service status if any services are registered
      if (this.services.size > 0) {
        console.info('Service status:', 
          Array.from(this.services.entries())
            .map(([service, status]) => `${service}: ${status ? 'available' : 'unavailable'}`)
            .join(', ')
        );
      }
    }, this.options.monitorInterval);
  }

  /**
   * Handle successful operation
   */
  private handleSuccess(serviceName?: string): void {
    // Update service status if specified
    if (serviceName) {
      this.services.set(serviceName, true);
    }
    
    // Only count success in half-open state for main circuit
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      // If we've reached the threshold, close the circuit
      if (this.successCount >= this.options.halfOpenSuccessThreshold) {
        this.transitionToState(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Handle failed operation
   */
  private handleFailure(serviceName?: string): void {
    // Update service status if specified
    if (serviceName) {
      // Track repeated failures for this specific service
      const serviceFailureKey = `${serviceName}_failures`;
      const currentFailures = Number(localStorage.getItem(serviceFailureKey) || '0');
      
      if (currentFailures >= this.options.failureThreshold) {
        // Mark service as unavailable
        this.services.set(serviceName, false);
        console.warn(`Circuit opened for service: ${serviceName}`);
        
        // Set timer to retry this service
        setTimeout(() => {
          console.info(`Attempting to reset circuit for service: ${serviceName}`);
          this.services.set(serviceName, true);
          localStorage.setItem(serviceFailureKey, '0');
        }, this.options.resetTimeout);
      } else {
        // Increment failure count
        localStorage.setItem(serviceFailureKey, (currentFailures + 1).toString());
      }
    }
    
    // Update main circuit state
    this.lastFailureTime = Date.now();
    
    // In closed state, increment failure counter
    if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      // If threshold reached, open the circuit
      if (this.failureCount >= this.options.failureThreshold) {
        this.transitionToState(CircuitState.OPEN);
      }
    } 
    // In half-open state, immediately open circuit on any failure
    else if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToState(CircuitState.OPEN);
    }
  }

  /**
   * Transition to half-open state 
   */
  private transitionToHalfOpen(): void {
    this.transitionToState(CircuitState.HALF_OPEN);
    this.successCount = 0;
  }

  /**
   * Transition circuit to a new state
   */
  private transitionToState(newState: CircuitState): void {
    if (this.state === newState) return;
    
    const oldState = this.state;
    this.state = newState;
    
    // Log state change
    if (this.options.logStateChanges) {
      console.info(`Circuit breaker ${this.name} state changed from ${oldState} to ${newState}`);
    }
    
    // Call callback if provided
    if (this.options.onStateChange) {
      this.options.onStateChange(oldState, newState);
    }
    
    // Set up timer for auto-transition if opening the circuit
    if (newState === CircuitState.OPEN) {
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      
      this.resetTimer = setTimeout(() => {
        this.transitionToHalfOpen();
      }, this.options.resetTimeout);
    }
  }

  /**
   * Clean up timers
   */
  destroy(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }
  }
}

// Create circuit breakers for different services
export const supabaseCircuitBreaker = new CircuitBreaker('supabase', {
  failureThreshold: 3,
  resetTimeout: 10000,  // 10 seconds for faster recovery in development
  halfOpenSuccessThreshold: 2
});

// Register specific Supabase services
supabaseCircuitBreaker.registerService('auth');
supabaseCircuitBreaker.registerService('database');
supabaseCircuitBreaker.registerService('storage');
supabaseCircuitBreaker.registerService('functions');
supabaseCircuitBreaker.registerService('realtime');

export default supabaseCircuitBreaker;