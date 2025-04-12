import { Express } from 'express';
import mcpRouter from './routes';
import { agentCoordinator } from './experience';
import { developmentAgent } from './agents/developmentAgent';
import { designAgent } from './agents/designAgent';
import { dataAnalysisAgent } from './agents/dataAnalysisAgent';
import { mcpOrchestrator } from './orchestrator';

export function initMCP(app: Express) {
  console.log('Initializing Model Content Protocol (MCP) framework...');
  
  // Check if API keys are available
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OpenAI API key is not set. OpenAI-based features will use fallback mechanisms.');
  } else {
    console.log('MCP initialized with OpenAI API key');
  }
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: Anthropic API key is not set. Claude-based features will not be available.');
  } else {
    console.log('MCP initialized with Anthropic API key');
  }
  
  // Initialize agent coordinator
  console.log('Initializing Agent Coordinator...');
  agentCoordinator.initialize().catch(error => {
    console.error('Error initializing Agent Coordinator:', error);
  });
  
  // Initialize MCP agents
  console.log('Initializing MCP agents...');
  
  // Development Agent
  developmentAgent.initialize().catch(error => {
    console.error('Error initializing Development Agent:', error);
  });
  
  // Design Agent
  designAgent.initialize().catch(error => {
    console.error('Error initializing Design Agent:', error);
  });
  
  // Data Analysis Agent
  dataAnalysisAgent.initialize().catch(error => {
    console.error('Error initializing Data Analysis Agent:', error);
  });
  
  // Initialize the orchestrator
  mcpOrchestrator.initialize().catch(error => {
    console.error('Error initializing MCP Orchestrator:', error);
  });
  
  // Register MCP routes under /api/mcp path
  app.use('/api/mcp', mcpRouter);
  
  console.log('MCP framework initialized successfully');
}