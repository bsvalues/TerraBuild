/**
 * Circuit Breaker Pattern
 * 
 * This module implements the circuit breaker pattern to prevent cascading failures
 * by temporarily disabling calls to services that are consistently failing.
 * It automatically attempts recovery after a cooldown period.
 */

// Circuit state enum
export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation, requests pass through
  OPEN = 'OPEN',       // Circuit is tripped, requests fail immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service has recovered
}

// Circuit breaker options
export interface CircuitBreakerOptions {
  failureThreshold: number;   // Number of failures before opening circuit
  resetTimeout: number;       // Time in ms before attempting recovery
  failureDecayTime: number;   // Time in ms to decay failure count by 1
  successThreshold: number;   // Number of successes in half-open state to close circuit
  timeout: number;            // Timeout for function calls in ms
}

// Default options
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  failureDecayTime: 60000, // 1 minute
  successThreshold: 2,
  timeout: 10000, // 10 seconds
};

// Circuit breaker event type
export type CircuitBreakerEvent = 'OPEN' | 'CLOSE' | 'HALF_OPEN' | 'SUCCESS' | 'FAILURE';

// Event listener type
type EventListener = (event: CircuitBreakerEvent) => void;

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;
  private resetTimer: number | null = null;
  private decayTimer: number | null = null;
  private options: CircuitBreakerOptions;
  private eventListeners: Map<CircuitBreakerEvent, EventListener[]> = new Map();
  private name: string;

  /**
   * Create a new circuit breaker
   * @param name Name of the circuit (for logging)
   * @param options Circuit breaker options
   */
  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startFailureDecay();
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn Function to execute
   * @returns Result of function or error if circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // If circuit is open, fail fast
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now < this.nextAttemptTime) {
        console.log(`[CircuitBreaker:${this.name}] Circuit open, fast failing`);
        throw new Error(`Circuit ${this.name} is open`);
      } else {
        // Time to try recovery
        console.log(`[CircuitBreaker:${this.name}] Entering half-open state for recovery`);
        this.transitionToHalfOpen();
      }
    }

    try {
      // Execute function with timeout
      const result = await this.executeWithTimeout(fn);
      
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit health statistics
   */
  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      isOpen: this.state === CircuitState.OPEN,
      isHalfOpen: this.state === CircuitState.HALF_OPEN,
      isClosed: this.state === CircuitState.CLOSED,
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.emit('CLOSE');
    
    // Clear any pending timers
    if (this.resetTimer) {
      window.clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Manually trip the circuit (for testing)
   */
  trip(): void {
    this.state = CircuitState.OPEN;
    this.failures = this.options.failureThreshold;
    this.successes = 0;
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    this.emit('OPEN');
    
    // Schedule half-open attempt
    this.scheduleReset();
  }

  /**
   * Add event listener
   * @param event Event to listen for
   * @param callback Callback function
   * @returns Function to remove listener
   */
  on(event: CircuitBreakerEvent, callback: EventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    const listeners = this.eventListeners.get(event)!;
    listeners.push(callback);
    
    return () => {
      const index = listeners.indexOf(callback);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      this.emit('SUCCESS');
      
      if (this.successes >= this.options.successThreshold) {
        console.log(`[CircuitBreaker:${this.name}] Success threshold reached, closing circuit`);
        this.transitionToClosed();
      }
    }
  }

  /**
   * Record a failed operation
   */
  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.emit('FAILURE');
    
    if (this.state === CircuitState.CLOSED && this.failures >= this.options.failureThreshold) {
      console.log(`[CircuitBreaker:${this.name}] Failure threshold reached, opening circuit`);
      this.transitionToOpen();
    } else if (this.state === CircuitState.HALF_OPEN) {
      console.log(`[CircuitBreaker:${this.name}] Failure in half-open state, opening circuit`);
      this.transitionToOpen();
    }
  }

  /**
   * Transition to open state
   */
  private transitionToOpen(): void {
    this.state = CircuitState.OPEN;
    this.successes = 0;
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    this.emit('OPEN');
    
    // Schedule attempt to recover
    this.scheduleReset();
  }

  /**
   * Transition to half-open state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successes = 0;
    this.emit('HALF_OPEN');
  }

  /**
   * Transition to closed state
   */
  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.emit('CLOSE');
    
    if (this.resetTimer) {
      window.clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Execute a function with timeout
   */
  private executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error(`Circuit ${this.name} timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);
      
      fn()
        .then(result => {
          window.clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          window.clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Schedule reset timer
   */
  private scheduleReset(): void {
    if (this.resetTimer) {
      window.clearTimeout(this.resetTimer);
    }
    
    this.resetTimer = window.setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        console.log(`[CircuitBreaker:${this.name}] Reset timeout reached, entering half-open state`);
        this.transitionToHalfOpen();
      }
      this.resetTimer = null;
    }, this.options.resetTimeout);
  }

  /**
   * Start failure decay timer
   */
  private startFailureDecay(): void {
    this.decayTimer = window.setInterval(() => {
      if (this.failures > 0 && this.state === CircuitState.CLOSED) {
        this.failures--;
      }
    }, this.options.failureDecayTime);
  }

  /**
   * Clean up timers
   */
  public dispose(): void {
    if (this.resetTimer) {
      window.clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    
    if (this.decayTimer) {
      window.clearInterval(this.decayTimer);
      this.decayTimer = null;
    }
  }

  /**
   * Emit an event
   */
  private emit(event: CircuitBreakerEvent): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[CircuitBreaker:${this.name}] Error in event listener:`, error);
        }
      });
    }
  }
}

// Factory to create circuit breakers
export class CircuitBreakerFactory {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultOptions: Partial<CircuitBreakerOptions>;

  constructor(defaultOptions: Partial<CircuitBreakerOptions> = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Get or create a circuit breaker
   * @param name Circuit breaker name
   * @param options Options to override defaults
   */
  getBreaker(name: string, options: Partial<CircuitBreakerOptions> = {}): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const mergedOptions = { ...this.defaultOptions, ...options };
      this.breakers.set(name, new CircuitBreaker(name, mergedOptions));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Dispose all circuit breakers
   */
  disposeAll(): void {
    this.breakers.forEach(breaker => breaker.dispose());
    this.breakers.clear();
  }
}

// Create and export singleton factory instance
export const circuitBreakerFactory = new CircuitBreakerFactory();

export default circuitBreakerFactory;