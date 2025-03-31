/**
 * MCP Type Definitions
 * 
 * This file contains the type definitions for the Model Content Protocol implementation.
 * Following the MCP recommendation, we define schemas first before implementation.
 */

import { z } from 'zod';

// Content Safety Classification
export const ContentSafetySchema = z.object({
  harmCategory: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
  confidence: z.number().min(0).max(1),
  rationale: z.string().optional()
});

export type ContentSafety = z.infer<typeof ContentSafetySchema>;

// Content Metadata
export const ContentMetadataSchema = z.object({
  id: z.string().optional(),
  timestamp: z.date().optional(),
  source: z.string().optional(),
  creator: z.string().optional(),
  contentType: z.string().optional(),
  version: z.string().optional()
});

export type ContentMetadata = z.infer<typeof ContentMetadataSchema>;

// Content Block (for multi-modal content)
export const ContentBlockSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'TABLE', 'CODE', 'CHART']),
  content: z.string(),
  metadata: ContentMetadataSchema.optional()
});

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

// Function Parameter
export const FunctionParameterSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'ARRAY', 'OBJECT']),
  required: z.boolean().default(false),
  schema: z.any().optional() // JSON Schema for validation
});

export type FunctionParameter = z.infer<typeof FunctionParameterSchema>;

// Function Definition
export const FunctionDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.array(FunctionParameterSchema).optional(),
  returnType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'ARRAY', 'OBJECT', 'VOID']),
  returnSchema: z.any().optional(), // JSON Schema for validation
  permissions: z.array(z.string()).optional(),
  timeout: z.number().optional() // in milliseconds
});

export type FunctionDefinition = z.infer<typeof FunctionDefinitionSchema>;

// Function Invocation
export const FunctionInvocationSchema = z.object({
  functionId: z.string(),
  parameters: z.record(z.any()).optional(),
  contextId: z.string().optional(),
  callerInfo: z.object({
    agentId: z.string().optional(),
    sessionId: z.string().optional()
  }).optional()
});

export type FunctionInvocation = z.infer<typeof FunctionInvocationSchema>;

// Function Response
export const FunctionResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  metadata: z.object({
    executionTime: z.number().optional(), // in milliseconds
    contentSafety: ContentSafetySchema.optional()
  }).optional()
});

export type FunctionResponse = z.infer<typeof FunctionResponseSchema>;

// Agent Definition
export const AgentDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  capabilities: z.array(z.string()).optional(), // array of function IDs
  permissions: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;

// Agent State
export const AgentStateSchema = z.object({
  agentId: z.string(),
  sessionId: z.string().optional(),
  context: z.record(z.any()).optional(),
  memory: z.array(z.any()).optional(),
  lastUpdated: z.date().optional()
});

export type AgentState = z.infer<typeof AgentStateSchema>;

// Workaround for recursive types in Zod
const workflowStepBase = {
  id: z.string(),
  type: z.enum(['FUNCTION_CALL', 'CONDITION', 'PARALLEL', 'SEQUENCE']),
  name: z.string().optional(),
  description: z.string().optional(),
  function: z.string().optional(), // Function ID for FUNCTION_CALL type
  condition: z.any().optional(), // For CONDITION type
  onSuccess: z.string().optional(), // Step ID to go to on success
  onFailure: z.string().optional(), // Step ID to go to on failure
  retry: z.object({
    maxAttempts: z.number().optional(),
    backoffFactor: z.number().optional()
  }).optional()
};

// Define the schema with proper typing
export const WorkflowStepSchema: z.ZodType<any> = z.lazy(() => {
  return z.object({
    ...workflowStepBase,
    steps: z.array(WorkflowStepSchema).optional() // For SEQUENCE or PARALLEL type
  });
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

// Workflow Definition
export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  initialStep: z.string(), // ID of the first step
  steps: z.record(WorkflowStepSchema),
  finalStep: z.string().optional(), // ID of the last step
  timeout: z.number().optional(), // in milliseconds
  permissions: z.array(z.string()).optional()
});

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

// Building Cost specific schemas
export const CostPredictionRequestSchema = z.object({
  buildingType: z.string(),
  squareFootage: z.number().positive(),
  region: z.string(),
  yearBuilt: z.number().optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'FAIR', 'POOR']).optional(),
  features: z.array(z.string()).optional(),
  costFactors: z.record(z.string(), z.number()).optional()
});

export type CostPredictionRequest = z.infer<typeof CostPredictionRequestSchema>;

export const CostPredictionResponseSchema = z.object({
  predictedCost: z.number(),
  confidenceScore: z.number().min(0).max(1),
  breakdowns: z.record(z.string(), z.number()).optional(),
  rationale: z.string().optional(),
  comparables: z.array(z.object({
    description: z.string(),
    cost: z.number(),
    similarityScore: z.number().min(0).max(1)
  })).optional()
});

export type CostPredictionResponse = z.infer<typeof CostPredictionResponseSchema>;