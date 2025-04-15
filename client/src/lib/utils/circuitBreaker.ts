/**
 * Circuit Breaker Pattern for Supabase Client
 * 
 * This module implements the circuit breaker pattern to prevent
 * cascading failures when Supabase services are unavailable.
 * It tracks failures and temporarily disables calls to services
 * that exceed failure thresholds.
 */

export interface CircuitBreakerOptions {
  failureThreshold: number;      // Number of failures before opening circuit
  resetTimeout: number;          // Time in ms before trying to close circuit after opening
  timeout: number;               // Time in ms to wait before considering a call a failure
  halfOpenMaxCalls: number;      // Max number of calls in half-open state
  serviceCooldown: number;       // Time in ms to wait before resetting failures for a service
  onOpen?: (service: string) => void;               // Callback when circuit opens
  onClose?: (service: string) => void;              // Callback when circuit closes
  onHalfOpen?: (service: string) => void;           // Callback when circuit goes half-open
  onTimeout?: (service: string, time: number) => void; // Callback on timeout
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface ServiceState {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  lastSuccess: number;
  openTime: number | null;
  halfOpenCalls: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,        // Open after 5 failures
  resetTimeout: 30000,        // Try again after 30 seconds
  timeout: 10000,             // Timeout after 10 seconds
  halfOpenMaxCalls: 3,        // Allow 3 calls in half-open state
  serviceCooldown: 60000,     // Reset failure count after 1 minute of success
};

/**
 * Circuit Breaker implementation for Supabase services
 */
export class CircuitBreaker {
  private options: CircuitBreakerOptions;
  private services: Map<string, ServiceState> = new Map();
  
  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Execute a function with circuit breaker protection
   * @param fn Function to execute
   * @param service Service identifier (e.g., 'database', 'auth', etc.)
   * @returns Promise with the result of the function
   */
  async execute<T>(fn: () => Promise<T>, service: string = 'default'): Promise<T> {
    // Get or initialize state for this service
    const state = this.getServiceState(service);
    
    // Check if circuit is open
    if (state.state === 'OPEN') {
      // Check if it's time to try half-open
      if (Date.now() - (state.openTime || 0) > this.options.resetTimeout) {
        this.setCircuitHalfOpen(service);
      } else {
        // Circuit is still open, fail fast
        throw new Error(`Circuit for service '${service}' is OPEN. Try again later.`);
      }
    }
    
    // If circuit is half-open, check if we can make the call
    if (state.state === 'HALF_OPEN') {
      if (state.halfOpenCalls >= this.options.halfOpenMaxCalls) {
        throw new Error(`Maximum calls in HALF_OPEN state reached for service '${service}'.`);
      }
      
      // Increment half-open calls counter
      state.halfOpenCalls++;
    }
    
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        if (this.options.onTimeout) {
          this.options.onTimeout(service, this.options.timeout);
        }
        reject(new Error(`Request to '${service}' timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);
    });
    
    try {
      // Race between the function and timeout
      const result = await Promise.race([fn(), timeoutPromise]);
      
      // Call succeeded, handle success
      this.handleSuccess(service);
      
      return result;
    } catch (error) {
      // Call failed, handle failure
      this.handleFailure(service);
      
      // Re-throw the error
      throw error;
    }
  }
  
  /**
   * Get the current state of the circuit breaker for a service
   * @param service Service identifier
   * @returns Circuit state
   */
  getState(service: string = 'default'): CircuitState {
    return this.getServiceState(service).state;
  }
  
  /**
   * Check if the circuit is open for a service
   * @param service Service identifier
   * @returns True if circuit is open
   */
  isOpen(service: string = 'default'): boolean {
    return this.getState(service) === 'OPEN';
  }
  
  /**
   * Reset the circuit breaker for a service
   * @param service Service identifier
   */
  reset(service: string = 'default'): void {
    if (this.services.has(service)) {
      const defaultState = this.createDefaultState();
      this.services.set(service, defaultState);
      
      if (this.options.onClose) {
        this.options.onClose(service);
      }
    }
  }
  
  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.services.forEach((_, service) => {
      this.reset(service);
    });
  }
  
  /**
   * Get or create service state
   * @param service Service identifier
   * @returns Service state
   */
  private getServiceState(service: string): ServiceState {
    if (!this.services.has(service)) {
      const state = this.createDefaultState();
      this.services.set(service, state);
      return state;
    }
    
    return this.services.get(service)!;
  }
  
  /**
   * Create default service state
   * @returns Default service state
   */
  private createDefaultState(): ServiceState {
    return {
      state: 'CLOSED',
      failures: 0,
      lastFailure: 0,
      lastSuccess: 0,
      openTime: null,
      halfOpenCalls: 0,
    };
  }
  
  /**
   * Handle a successful call
   * @param service Service identifier
   */
  private handleSuccess(service: string): void {
    const state = this.getServiceState(service);
    
    // Update last success time
    state.lastSuccess = Date.now();
    
    // If currently in half-open state, and this is a success, close circuit
    if (state.state === 'HALF_OPEN') {
      this.setCircuitClosed(service);
      return;
    }
    
    // If it's been a while since a failure, reset the failure count
    const timeSinceLastFailure = Date.now() - state.lastFailure;
    if (state.failures > 0 && timeSinceLastFailure > this.options.serviceCooldown) {
      state.failures = 0;
    }
  }
  
  /**
   * Handle a failed call
   * @param service Service identifier
   */
  private handleFailure(service: string): void {
    const state = this.getServiceState(service);
    
    // Increment failure count
    state.failures++;
    state.lastFailure = Date.now();
    
    // If in half-open state, any failure immediately opens the circuit again
    if (state.state === 'HALF_OPEN') {
      this.setCircuitOpen(service);
      return;
    }
    
    // Check if we've reached the failure threshold
    if (state.failures >= this.options.failureThreshold) {
      this.setCircuitOpen(service);
    }
  }
  
  /**
   * Set circuit to open state
   * @param service Service identifier
   */
  private setCircuitOpen(service: string): void {
    const state = this.getServiceState(service);
    
    state.state = 'OPEN';
    state.openTime = Date.now();
    state.halfOpenCalls = 0;
    
    if (this.options.onOpen) {
      this.options.onOpen(service);
    }
    
    console.warn(`Circuit for service '${service}' is now OPEN. Failures: ${state.failures}`);
  }
  
  /**
   * Set circuit to half-open state
   * @param service Service identifier
   */
  private setCircuitHalfOpen(service: string): void {
    const state = this.getServiceState(service);
    
    state.state = 'HALF_OPEN';
    state.halfOpenCalls = 0;
    
    if (this.options.onHalfOpen) {
      this.options.onHalfOpen(service);
    }
    
    console.info(`Circuit for service '${service}' is now HALF_OPEN.`);
  }
  
  /**
   * Set circuit to closed state
   * @param service Service identifier
   */
  private setCircuitClosed(service: string): void {
    const state = this.getServiceState(service);
    
    state.state = 'CLOSED';
    state.failures = 0;
    state.openTime = null;
    state.halfOpenCalls = 0;
    
    if (this.options.onClose) {
      this.options.onClose(service);
    }
    
    console.info(`Circuit for service '${service}' is now CLOSED.`);
  }
}

// Create a singleton instance with default options
const supabaseCircuitBreaker = new CircuitBreaker({
  onOpen: (service) => {
    console.warn(`Supabase service '${service}' is unavailable. Circuit is now OPEN.`);
  },
  onClose: (service) => {
    console.log(`Supabase service '${service}' is available again. Circuit is now CLOSED.`);
  },
  onHalfOpen: (service) => {
    console.log(`Supabase service '${service}' is being tested. Circuit is now HALF_OPEN.`);
  },
  onTimeout: (service, time) => {
    console.warn(`Request to Supabase service '${service}' timed out after ${time}ms.`);
  }
});

export default supabaseCircuitBreaker;