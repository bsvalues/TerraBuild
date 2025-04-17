import { Express } from 'express';
import mcpRouter from './routes';
import { agentCoordinator } from './experience';
import { developmentAgent } from './agents/developmentAgent';
import { designAgent } from './agents/designAgent';
import { dataAnalysisAgent } from './agents/dataAnalysisAgent';
import { mcpOrchestrator } from './orchestrator';
import { bentonCountyConversionAgent } from './agents/conversionAgent';

/**
 * Initialize the Model Content Protocol (MCP) framework
 * 
 * @param app Express application instance
 */
export function initMCP(app: Express): void {
  console.log('Initializing MCP framework...');
  
  try {
    // Register MCP routes
    app.use('/mcp', mcpRouter);
    
    // Initialize core agents
    initializeAgents();
    
    // Initialize the MCP orchestrator
    mcpOrchestrator.initialize();
    
    console.log('MCP framework initialized successfully');
  } catch (error) {
    console.error('Error initializing MCP framework:', error);
    throw error;
  }
}

/**
 * Initialize and register all MCP agents
 */
function initializeAgents(): void {
  try {
    // Initialize agents using the agent registry
    // The agents are already imported and instantiated in the agent registry
    
    // Let the MCP framework know about the Benton County Conversion Agent
    console.log('Registering Benton County Conversion Agent with MCP framework');
    
    // We don't need to explicitly register agents - they're already in the registry
    // Instead, we'll update the agentRegistry with our new agents by having the 
    // coordinator update its registry
    agentCoordinator.updateAgentRegistry();
    
    console.log('All MCP agents initialized successfully');
  } catch (error) {
    console.error('Error initializing MCP agents:', error);
    throw error;
  }
}