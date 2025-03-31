/**
 * Function Registry for Model Content Protocol
 * 
 * This file implements the function registry that manages registration, discovery,
 * and invocation of functions within the MCP framework.
 */

import { 
  FunctionDefinition, 
  FunctionInvocation, 
  FunctionResponse 
} from '../schemas/types';

/**
 * Function Registry class that manages MCP functions
 */
export class FunctionRegistry {
  private functions: Map<string, FunctionDefinition> = new Map();
  private implementations: Map<string, Function> = new Map();

  /**
   * Register a function with the registry
   * 
   * @param definition The function definition
   * @param implementation The function implementation
   */
  registerFunction(definition: FunctionDefinition, implementation: Function): void {
    if (this.functions.has(definition.name)) {
      console.warn(`Function ${definition.name} is already registered. Overwriting.`);
    }
    
    this.functions.set(definition.name, definition);
    this.implementations.set(definition.name, implementation);
    
    console.info(`Registered function ${definition.name}`);
  }

  /**
   * Get a function definition by name
   * 
   * @param name The function name
   * @returns The function definition or undefined if not found
   */
  getFunction(name: string): FunctionDefinition | undefined {
    return this.functions.get(name);
  }

  /**
   * Get all registered function definitions
   * 
   * @returns Array of all function definitions
   */
  getAllFunctions(): FunctionDefinition[] {
    return Array.from(this.functions.values());
  }

  /**
   * Invoke a function by its invocation request
   * 
   * @param invocation The function invocation request
   * @returns A promise that resolves to the function response
   */
  async invokeFunction(invocation: FunctionInvocation): Promise<FunctionResponse> {
    const startTime = Date.now();
    
    try {
      const functionDef = this.functions.get(invocation.functionId);
      const implementation = this.implementations.get(invocation.functionId);
      
      if (!functionDef || !implementation) {
        console.error(`Function ${invocation.functionId} not found`);
        return {
          success: false,
          error: `Function ${invocation.functionId} not found`,
          metadata: {
            executionTime: Date.now() - startTime
          }
        };
      }
      
      console.debug(`Invoking function ${invocation.functionId}`);
      
      // TODO: Add parameter validation against function definition schema
      
      let response: FunctionResponse;
      try {
        const result = await implementation(invocation.parameters || {});
        
        response = {
          success: true,
          data: result,
          metadata: {
            executionTime: Date.now() - startTime
          }
        };
      } catch (error: any) {
        console.error(`Error executing function ${invocation.functionId}: ${error.message}`);
        response = {
          success: false,
          error: error.message || 'Unknown error during execution',
          metadata: {
            executionTime: Date.now() - startTime
          }
        };
      }
      
      return response;
    } catch (error: any) {
      console.error(`Error invoking function: ${error.message}`);
      return {
        success: false,
        error: `Error invoking function: ${error.message}`,
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Unregister a function from the registry
   * 
   * @param name The function name to unregister
   * @returns Whether the function was successfully unregistered
   */
  unregisterFunction(name: string): boolean {
    const functionExists = this.functions.has(name);
    
    if (functionExists) {
      this.functions.delete(name);
      this.implementations.delete(name);
      console.info(`Unregistered function ${name}`);
    }
    
    return functionExists;
  }
}

// Singleton instance
export const functionRegistry = new FunctionRegistry();