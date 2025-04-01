/**
 * Schema Registry for MCP
 * 
 * This module implements the Schema Registry and Validator for the Model Content Protocol.
 * It provides functionality to register, retrieve, and validate against JSON schemas.
 */

import Ajv, { JSONSchemaType, ErrorObject } from 'ajv';

/**
 * Schema Registry for storing and managing JSON schemas
 */
export class SchemaRegistry {
  private schemas: Map<string, JSONSchemaType<any>>;

  constructor() {
    this.schemas = new Map();
  }

  /**
   * Register a schema with a given name
   * @param name Unique identifier for the schema
   * @param schema JSON schema definition
   */
  register(name: string, schema: JSONSchemaType<any>): void {
    this.schemas.set(name, schema);
  }

  /**
   * Retrieve a schema by name
   * @param name Schema identifier
   * @returns The JSON schema
   * @throws Error if schema not found
   */
  get(name: string): JSONSchemaType<any> {
    if (!this.schemas.has(name)) {
      throw new Error(`Schema ${name} not found in registry`);
    }
    return this.schemas.get(name)!;
  }

  /**
   * Check if a schema exists in the registry
   * @param name Schema identifier
   * @returns boolean indicating if schema exists
   */
  exists(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * List all registered schema names
   * @returns Array of schema names
   */
  listAll(): string[] {
    return Array.from(this.schemas.keys());
  }
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[] | null;
}

/**
 * Schema Validator for validating data against registered schemas
 */
export class SchemaValidator {
  private ajv: Ajv;
  private registry: SchemaRegistry;

  /**
   * Create a new validator instance
   * @param registry Schema registry to use for validation
   */
  constructor(registry: SchemaRegistry) {
    this.registry = registry;
    this.ajv = new Ajv({
      allErrors: true,
      strict: true,
      strictSchema: false, // Allow additional formats for nicer error messages
    });
  }

  /**
   * Validate data against a named schema
   * @param schemaName Name of the schema to validate against
   * @param data Data to validate
   * @returns Validation result with errors if any
   * @throws Error if schema not found
   */
  validate(schemaName: string, data: any): ValidationResult {
    const schema = this.registry.get(schemaName);
    const validate = this.ajv.compile(schema);
    const valid = validate(data);
    
    return {
      valid,
      errors: valid ? null : validate.errors
    };
  }
}

/**
 * Create and initialize a schema registry with common schemas
 * @returns Initialized schema registry
 */
export function createDefaultRegistry(): SchemaRegistry {
  // This will be used to create a pre-populated registry
  // with all standard schemas for the application
  const registry = new SchemaRegistry();
  
  // Import schemas will be added here in a future implementation
  
  return registry;
}