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
    // Register core agents with the coordinator
    agentCoordinator.registerAgent(developmentAgent);
    agentCoordinator.registerAgent(designAgent);
    agentCoordinator.registerAgent(dataAnalysisAgent);
    
    // Register Benton County Conversion Agent
    agentCoordinator.registerAgent(bentonCountyConversionAgent);
    
    console.log('All MCP agents initialized successfully');
  } catch (error) {
    console.error('Error initializing MCP agents:', error);
    throw error;
  }
}