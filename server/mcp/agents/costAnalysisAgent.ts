/**
 * Cost Analysis Agent for Model Content Protocol
 * 
 * This file implements an agent that analyzes building costs using the MCP framework.
 * It follows the agent lifecycle defined in the MCP specification.
 */

import { AgentDefinition, AgentState, FunctionResponse } from '../schemas/types';
import { functionRegistry } from '../functions/functionRegistry';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cost Analysis Agent class
 * Implements the MCP agent lifecycle and capabilities for building cost analysis
 */
export class CostAnalysisAgent {
  private definition: AgentDefinition;
  private state: AgentState;
  
  /**
   * Create a new Cost Analysis Agent
   */
  constructor() {
    // Define the agent
    this.definition = {
      id: 'cost-analysis-agent',
      name: 'Building Cost Analysis Agent',
      description: 'Analyzes building costs and provides insightful recommendations',
      capabilities: [
        'predictBuildingCost',
        'analyzeCostMatrix',
        'explainCalculation'
      ]
    };
    
    // Initialize agent state
    this.state = {
      agentId: this.definition.id,
      sessionId: uuidv4(),
      context: {},
      memory: [],
      lastUpdated: new Date()
    };
  }
  
  /**
   * Predict the cost of a building using AI
   * 
   * @param buildingDetails The building details
   * @returns A promise that resolves to the prediction response
   */
  async predictBuildingCost(buildingDetails: {
    buildingType: string;
    squareFootage: number;
    region: string;
    condition?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'FAIR' | 'POOR';
    yearBuilt?: number;
    features?: string[];
    costFactors?: Record<string, number>;
  }): Promise<FunctionResponse> {
    console.log('Cost Analysis Agent: Predicting building cost...');
    
    // Perception: Process the input data and prepare for reasoning
    this.updateState({
      currentTask: 'cost_prediction',
      inputData: buildingDetails
    });
    
    // Reasoning: Determine the appropriate function to call
    // In more complex scenarios, this would involve planning and resource allocation
    
    // Execution: Invoke the function through the registry
    const result = await functionRegistry.invokeFunction({
      functionId: 'predictBuildingCost',
      parameters: buildingDetails,
      contextId: this.state.sessionId,
      callerInfo: {
        agentId: this.state.agentId,
        sessionId: this.state.sessionId
      }
    });
    
    // Update agent memory with the result
    this.recordMemory({
      type: 'prediction',
      input: buildingDetails,
      output: result,
      timestamp: new Date()
    });
    
    // Return the result
    return result;
  }
  
  /**
   * Analyze a cost matrix to identify patterns and insights
   * 
   * @param matrixData The cost matrix data
   * @returns A promise that resolves to the analysis response
   */
  async analyzeCostMatrix(matrixData: any): Promise<FunctionResponse> {
    console.log('Cost Analysis Agent: Analyzing cost matrix...');
    
    // Perception
    this.updateState({
      currentTask: 'matrix_analysis',
      inputData: { matrixSize: this.getMatrixSize(matrixData) }
    });
    
    // Reasoning
    
    // Execution
    const result = await functionRegistry.invokeFunction({
      functionId: 'analyzeCostMatrix',
      parameters: { matrixData },
      contextId: this.state.sessionId,
      callerInfo: {
        agentId: this.state.agentId,
        sessionId: this.state.sessionId
      }
    });
    
    // Update agent memory
    this.recordMemory({
      type: 'analysis',
      inputSummary: `Cost matrix with ${this.getMatrixSize(matrixData)} entries`,
      output: result,
      timestamp: new Date()
    });
    
    return result;
  }
  
  /**
   * Generate a natural language explanation for a building cost calculation
   * 
   * @param calculationData The calculation data
   * @returns A promise that resolves to the explanation response
   */
  async explainCalculation(calculationData: any): Promise<FunctionResponse> {
    console.log('Cost Analysis Agent: Generating calculation explanation...');
    
    // Perception
    this.updateState({
      currentTask: 'calculation_explanation',
      inputData: { calculationType: calculationData.type }
    });
    
    // Reasoning
    
    // Execution
    const result = await functionRegistry.invokeFunction({
      functionId: 'explainCalculation',
      parameters: { calculationData },
      contextId: this.state.sessionId,
      callerInfo: {
        agentId: this.state.agentId,
        sessionId: this.state.sessionId
      }
    });
    
    // Update agent memory
    this.recordMemory({
      type: 'explanation',
      inputSummary: `Calculation of type ${calculationData.type}`,
      output: result,
      timestamp: new Date()
    });
    
    return result;
  }
  
  /**
   * Get the agent definition
   * 
   * @returns The agent definition
   */
  getDefinition(): AgentDefinition {
    return this.definition;
  }
  
  /**
   * Get the current agent state
   * 
   * @returns The agent state
   */
  getState(): AgentState {
    return this.state;
  }
  
  /**
   * Update the agent state with new context
   * 
   * @param context The new context to merge with existing state
   */
  private updateState(context: Record<string, any>): void {
    this.state = {
      ...this.state,
      context: {
        ...this.state.context,
        ...context
      },
      lastUpdated: new Date()
    };
  }
  
  /**
   * Record an item in the agent's memory
   * 
   * @param memoryItem The item to add to memory
   */
  private recordMemory(memoryItem: any): void {
    // Limit memory size to prevent unbounded growth
    const MAX_MEMORY_SIZE = 100;
    
    if (this.state.memory && this.state.memory.length >= MAX_MEMORY_SIZE) {
      // Remove oldest memory item
      this.state.memory.shift();
    }
    
    this.state.memory = [
      ...(this.state.memory || []),
      memoryItem
    ];
  }
  
  /**
   * Helper function to get the size of a matrix for logging purposes
   * 
   * @param matrixData The matrix data
   * @returns A string description of the matrix size
   */
  private getMatrixSize(matrixData: any): string {
    if (!matrixData) return 'empty';
    
    if (Array.isArray(matrixData)) {
      return `${matrixData.length} entries`;
    }
    
    if (typeof matrixData === 'object') {
      const keys = Object.keys(matrixData);
      return `${keys.length} keys`;
    }
    
    return 'unknown';
  }
}

// Export a singleton instance of the agent
export const costAnalysisAgent = new CostAnalysisAgent();