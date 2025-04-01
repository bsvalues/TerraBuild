/**
 * Function Registry for MCP
 * 
 * This module implements the Function Registry and Executor for the Model Content Protocol.
 * It provides functionality to register, retrieve, and execute functions with validation.
 */

import { SchemaRegistry, SchemaValidator } from './schemaRegistry';

/**
 * Function definition interface
 */
export interface MCPFunction {
  name: string;
  description: string;
  inputSchema: string;
  outputSchema: string;
  fn: (params: any) => Promise<any> | any;
  timeout?: number;
  idempotent?: boolean;
  examples?: Array<{ input: any; output: any }>;
}

/**
 * Function Registry for storing and managing functions
 */
export class FunctionRegistry {
  private functions: Map<string, MCPFunction>;
  private schemaRegistry: SchemaRegistry;

  /**
   * Create a new function registry
   * @param schemaRegistry Schema registry for validation
   */
  constructor(schemaRegistry: SchemaRegistry) {
    this.functions = new Map();
    this.schemaRegistry = schemaRegistry;
  }

  /**
   * Register a function in the registry
   * @param functionDef Function definition
   * @throws Error if input or output schema doesn't exist
   */
  register(functionDef: MCPFunction): void {
    // Verify that the input and output schemas exist
    if (!this.schemaRegistry.exists(functionDef.inputSchema)) {
      throw new Error(`Input schema ${functionDef.inputSchema} not found in registry`);
    }
    
    if (!this.schemaRegistry.exists(functionDef.outputSchema)) {
      throw new Error(`Output schema ${functionDef.outputSchema} not found in registry`);
    }
    
    this.functions.set(functionDef.name, functionDef);
  }

  /**
   * Retrieve a function by name
   * @param name Function name
   * @returns Function definition
   * @throws Error if function not found
   */
  get(name: string): MCPFunction {
    if (!this.functions.has(name)) {
      throw new Error(`Function ${name} not found in registry`);
    }
    return this.functions.get(name)!;
  }

  /**
   * Check if a function exists in the registry
   * @param name Function name
   * @returns boolean indicating if function exists
   */
  exists(name: string): boolean {
    return this.functions.has(name);
  }

  /**
   * List all registered function names
   * @returns Array of function names
   */
  listAll(): string[] {
    return Array.from(this.functions.keys());
  }
}

/**
 * Function Executor for executing functions with input/output validation
 */
export class FunctionExecutor {
  private functionRegistry: FunctionRegistry;
  private schemaValidator: SchemaValidator;

  /**
   * Create a new function executor
   * @param functionRegistry Function registry containing function definitions
   * @param schemaRegistry Schema registry for validation
   */
  constructor(functionRegistry: FunctionRegistry, schemaRegistry: SchemaRegistry) {
    this.functionRegistry = functionRegistry;
    this.schemaValidator = new SchemaValidator(schemaRegistry);
  }

  /**
   * Execute a function by name with parameters
   * @param functionName Name of the function to execute
   * @param params Parameters to pass to the function
   * @returns Function result
   * @throws Error if function not found, validation fails, or execution fails
   */
  async execute(functionName: string, params: any): Promise<any> {
    // Get function definition
    const functionDef = this.functionRegistry.get(functionName);
    
    // Validate input parameters
    const inputValidation = this.schemaValidator.validate(functionDef.inputSchema, params);
    if (!inputValidation.valid) {
      const errors = JSON.stringify(inputValidation.errors);
      throw new Error(`Input validation failed for function ${functionName}: ${errors}`);
    }

    // Execute function
    let result;
    try {
      result = await Promise.resolve(functionDef.fn(params));
    } catch (error) {
      throw new Error(`Execution failed for function ${functionName}: ${(error as Error).message}`);
    }
    
    // Validate output result
    const outputValidation = this.schemaValidator.validate(functionDef.outputSchema, result);
    if (!outputValidation.valid) {
      const errors = JSON.stringify(outputValidation.errors);
      throw new Error(`Output validation failed for function ${functionName}: ${errors}`);
    }
    
    return result;
  }
}

/**
 * Create a function executor with default registries
 * @returns Initialized function executor
 */
export function createDefaultExecutor(): FunctionExecutor {
  // This will be used to create a pre-populated executor
  // with common functions for the application
  const schemaRegistry = new SchemaRegistry();
  const functionRegistry = new FunctionRegistry(schemaRegistry);
  
  // Register schemas and functions will be added here in a future implementation
  
  return new FunctionExecutor(functionRegistry, schemaRegistry);
}