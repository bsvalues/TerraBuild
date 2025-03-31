/**
 * Model Content Protocol (MCP) Initialization
 * 
 * This file initializes the Model Content Protocol framework for the Building Cost Building System.
 * It sets up the function registry, registers functions, and initializes agents.
 */

import { functionRegistry } from './functions/functionRegistry';
import { registerBuildingCostFunctions } from './functions/buildingCostFunctions';
import { costAnalysisAgent } from './agents/costAnalysisAgent';

/**
 * Initialize the MCP framework
 */
export function initializeMCP() {
  console.log('Initializing Model Content Protocol framework...');
  
  // Register all functions with the registry
  registerBuildingCostFunctions();
  
  // List registered functions
  const registeredFunctions = functionRegistry.getAllFunctions();
  console.log(`Registered ${registeredFunctions.length} functions:`);
  registeredFunctions.forEach(func => {
    console.log(`- ${func.name}: ${func.description || 'No description'}`);
  });
  
  // Initialize agents
  const agentDefinition = costAnalysisAgent.getDefinition();
  console.log(`Initialized agent: ${agentDefinition.name} (${agentDefinition.id})`);
  console.log(`Agent capabilities: ${agentDefinition.capabilities?.join(', ')}`);
  
  console.log('Model Content Protocol framework initialized successfully');
  
  return {
    functionRegistry,
    costAnalysisAgent
  };
}

// Export components for direct import
export { functionRegistry } from './functions/functionRegistry';
export { costAnalysisAgent } from './agents/costAnalysisAgent';
export * from './schemas/types';