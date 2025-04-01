/**
 * Model Content Protocol (MCP) Implementation
 * 
 * This is the main entry point for the MCP implementation, exporting all
 * components and utilities for standardizing AI content processing.
 */

// Export schema interfaces and definitions
export * from './schemas';

// Export Schema Registry and Validator
export {
  SchemaRegistry,
  SchemaValidator,
  ValidationResult,
  createDefaultRegistry
} from './schemaRegistry';

// Export Function Registry and Executor
export {
  MCPFunction,
  FunctionRegistry,
  FunctionExecutor,
  createDefaultExecutor
} from './functionRegistry';

// Export Workflow Engine
export {
  WorkflowState,
  WorkflowStep,
  WorkflowDefinition,
  WorkflowExecutionResult,
  WorkflowEngine,
  createStandardWorkflowSteps
} from './workflow';

/**
 * Initialize the MCP environment with default components
 * @returns Object containing initialized MCP components
 */
export function initializeMCP() {
  const schemaRegistry = createDefaultRegistry();
  const functionExecutor = createDefaultExecutor();
  const workflowEngine = new WorkflowEngine();
  
  return {
    schemaRegistry,
    functionExecutor,
    workflowEngine
  };
}