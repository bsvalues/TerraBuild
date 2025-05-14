import { Express } from 'express';
import mcpRouter from './routes';
import { agentCoordinator } from './experience';
import { developmentAgent } from './agents/developmentAgent';
import { designAgent } from './agents/designAgent';
import { dataAnalysisAgent } from './agents/dataAnalysisAgent';
import { mcpOrchestrator } from './orchestrator';
import { bentonCountyConversionAgent } from './agents/conversionAgent';
import { mcpDevOpsKit } from './devops';
import { geoMappingAgent } from './agents/geo-mapping-agent';
import { neighborhoodDiscoveryAgent } from './agents/neighborhood-discovery-agent';
import { initGeoMappingAgent } from './handlers/geo-mapping-handler';
import { registerNeighborhoodDiscoveryAgent } from './handlers/neighborhood-discovery-handler';
import { registerDataQualityAgent } from './handlers/data-quality-handler';
import { registerComplianceAgent } from './handlers/compliance-handler';
import { registerCostAnalysisAgent } from './handlers/cost-analysis-handler';
import { agentRegistry } from './agent-registry';

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
    
    // Initialize the MCP DevOps Kit
    mcpDevOpsKit.initialize().catch(error => {
      console.error('Error initializing MCP DevOps Kit:', error);
      // Continue despite DevOps Kit errors to maintain core functionality
    });
    
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
    
    // Initialize our geographic mapping agent
    try {
      const geoAgent = initGeoMappingAgent();
      if (geoAgent) {
        agentRegistry.registerAgent(geoAgent);
        console.log('Geographic Mapping Agent registered successfully');
      } else {
        console.warn('Geographic Mapping Agent did not return a valid agent object');
      }
    } catch (geoError) {
      console.error('Error initializing Geographic Mapping Agent:', geoError);
      // Continue despite errors to maintain core functionality
    }
    
    // Initialize our neighborhood discovery agent
    try {
      const neighborhoodAgent = registerNeighborhoodDiscoveryAgent();
      agentRegistry.registerAgent(neighborhoodAgent);
      console.log('Neighborhood Discovery Agent registered successfully');
    } catch (neiError) {
      console.error('Error initializing Neighborhood Discovery Agent:', neiError);
      // Continue despite errors to maintain core functionality
    }
    
    // Initialize our core agents using the agent registry
    try {
      // Initialize all registered agents in our registry
      agentRegistry.initializeAllAgents();
    } catch (initError) {
      console.error('Error initializing agents through registry:', initError);
      // Continue despite errors to maintain core functionality
      
      // Try to initialize individual agents as fallback
      try {
        // Data Quality Agent
        const dataQualityAgent = registerDataQualityAgent();
        agentRegistry.registerAgent(dataQualityAgent);
        console.log('Data Quality Agent registered successfully');
        
        // Compliance Agent
        const complianceAgent = registerComplianceAgent();
        agentRegistry.registerAgent(complianceAgent);
        console.log('Compliance Agent registered successfully');
        
        // Cost Analysis Agent
        const costAnalysisAgent = registerCostAnalysisAgent();
        agentRegistry.registerAgent(costAnalysisAgent);
        console.log('Cost Analysis Agent registered successfully');
      } catch (agentError) {
        console.error('Error initializing individual agents:', agentError);
      }
    }
    
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