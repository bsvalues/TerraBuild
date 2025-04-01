/**
 * Workflow Engine Tests
 * 
 * This file contains tests for the MCP Workflow Engine functionality
 * which validates the workflow definition and execution capabilities.
 */

import { 
  WorkflowEngine, 
  WorkflowDefinition, 
  WorkflowStep, 
  WorkflowState 
} from '../workflow';

// Mock steps for testing
const perceptionStep: WorkflowStep = {
  name: 'perception',
  execute: jest.fn().mockImplementation(async (input, state) => {
    return { 
      ...input, 
      perception: 'data processed', 
      timestamp: Date.now() 
    };
  })
};

const reasoningStep: WorkflowStep = {
  name: 'reasoning',
  execute: jest.fn().mockImplementation(async (input, state) => {
    if (!input.perception) {
      throw new Error('Perception data required');
    }
    return { 
      ...input, 
      reasoning: 'analysis complete', 
      decision: 'calculated result' 
    };
  })
};

const actionStep: WorkflowStep = {
  name: 'action',
  execute: jest.fn().mockImplementation(async (input, state) => {
    if (!input.reasoning) {
      throw new Error('Reasoning data required');
    }
    return { 
      ...input, 
      action: 'executed action',
      result: 'final result'
    };
  })
};

describe('WorkflowEngine', () => {
  let workflowEngine: WorkflowEngine;
  
  beforeEach(() => {
    workflowEngine = new WorkflowEngine();
    
    // Reset mock call counts
    (perceptionStep.execute as jest.Mock).mockClear();
    (reasoningStep.execute as jest.Mock).mockClear();
    (actionStep.execute as jest.Mock).mockClear();
  });

  test('should register a workflow definition', () => {
    const workflowDef: WorkflowDefinition = {
      name: 'testWorkflow',
      steps: [perceptionStep, reasoningStep, actionStep]
    };
    
    workflowEngine.registerWorkflow(workflowDef);
    expect(workflowEngine.hasWorkflow('testWorkflow')).toBe(true);
  });

  test('should execute a workflow with sequential steps', async () => {
    const workflowDef: WorkflowDefinition = {
      name: 'testWorkflow',
      steps: [perceptionStep, reasoningStep, actionStep]
    };
    
    workflowEngine.registerWorkflow(workflowDef);
    
    const initialInput = { data: 'initial input' };
    const result = await workflowEngine.executeWorkflow('testWorkflow', initialInput);
    
    // Verify steps executed in order
    expect(perceptionStep.execute).toHaveBeenCalledTimes(1);
    expect(reasoningStep.execute).toHaveBeenCalledTimes(1);
    expect(actionStep.execute).toHaveBeenCalledTimes(1);
    
    // Verify execution order
    expect(reasoningStep.execute).toHaveBeenCalledAfter(perceptionStep.execute as jest.Mock);
    expect(actionStep.execute).toHaveBeenCalledAfter(reasoningStep.execute as jest.Mock);
    
    // Verify final result contains all data
    expect(result).toMatchObject({
      data: 'initial input',
      perception: 'data processed',
      reasoning: 'analysis complete',
      decision: 'calculated result',
      action: 'executed action',
      result: 'final result'
    });
  });

  test('should maintain workflow state between steps', async () => {
    // Create steps that read/write to workflow state
    const stateReadingStep: WorkflowStep = {
      name: 'stateReader',
      execute: jest.fn().mockImplementation(async (input, state) => {
        return { 
          ...input, 
          stateValue: state.get('testKey')
        };
      })
    };
    
    const stateWritingStep: WorkflowStep = {
      name: 'stateWriter',
      execute: jest.fn().mockImplementation(async (input, state) => {
        state.set('testKey', 'state value');
        return input;
      })
    };
    
    const workflowDef: WorkflowDefinition = {
      name: 'stateWorkflow',
      steps: [stateWritingStep, stateReadingStep]
    };
    
    workflowEngine.registerWorkflow(workflowDef);
    
    const result = await workflowEngine.executeWorkflow('stateWorkflow', {});
    
    expect(result).toMatchObject({
      stateValue: 'state value'
    });
  });

  test('should handle errors in workflow steps', async () => {
    // Create a step that throws an error
    const errorStep: WorkflowStep = {
      name: 'errorStep',
      execute: jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      })
    };
    
    const workflowDef: WorkflowDefinition = {
      name: 'errorWorkflow',
      steps: [perceptionStep, errorStep, actionStep]
    };
    
    workflowEngine.registerWorkflow(workflowDef);
    
    await expect(workflowEngine.executeWorkflow('errorWorkflow', {}))
      .rejects
      .toThrow('Error executing workflow step errorStep: Test error');
    
    // Verify only steps before error were executed
    expect(perceptionStep.execute).toHaveBeenCalledTimes(1);
    expect(errorStep.execute).toHaveBeenCalledTimes(1);
    expect(actionStep.execute).not.toHaveBeenCalled();
  });

  test('should throw error for non-existent workflow', async () => {
    await expect(workflowEngine.executeWorkflow('nonExistentWorkflow', {}))
      .rejects
      .toThrow('Workflow nonExistentWorkflow not found');
  });
});