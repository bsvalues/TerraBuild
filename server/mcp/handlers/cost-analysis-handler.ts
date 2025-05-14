import { EventBus } from '../event-bus';
import { costAnalysisAgent } from '../agents/costAnalysisAgent';

/**
 * Initialize and register the Cost Analysis Agent with the MCP framework
 * 
 * @returns {void}
 */
export function registerCostAnalysisAgent(): void {
  console.log('Initializing Cost Analysis Agent');
  
  try {
    // Initialize the agent
    costAnalysisAgent.initialize();
    
    // Register event handlers for cost analysis events
    registerEventHandlers();
    
    // Register capabilities with the agent registry
    costAnalysisAgent.registerCapability('cost:analyze', async (data) => {
      console.log('Cost Analysis Agent processing analysis request');
      return await costAnalysisAgent.analyzeCost(data);
    });
    
    costAnalysisAgent.registerCapability('cost:estimate', async (data) => {
      console.log('Cost Analysis Agent processing estimation request');
      return await costAnalysisAgent.estimateCost(data);
    });
    
    costAnalysisAgent.registerCapability('cost:compare', async (data) => {
      console.log('Cost Analysis Agent processing comparison request');
      return await costAnalysisAgent.compareCosts(data);
    });
    
    // Emit initialized event
    EventBus.emit('agent:initialized', {
      agentId: 'cost-analysis-agent',
      agentName: 'Cost Analysis Agent'
    });
    
    console.log('[2025-05-14] [INFO] [TerraBuild] Cost Analysis Agent registered successfully');
  } catch (error) {
    console.error('Error initializing Cost Analysis Agent:', error);
    
    // Emit error event
    EventBus.emit('agent:error', {
      agentId: 'cost-analysis-agent',
      error: error
    });
    
    throw error;
  }
}

/**
 * Register event handlers for cost analysis related events
 */
function registerEventHandlers(): void {
  // Subscribe to cost analysis request events
  EventBus.subscribe('cost:analyze:request', async (event) => {
    try {
      const result = await costAnalysisAgent.analyzeCost(event.payload);
      
      // Emit success event with results
      EventBus.emit('cost:analyze:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      console.error('Error handling cost analysis request:', error);
      
      // Emit failure event
      EventBus.emit('cost:analyze:failed', {
        requestId: event.id,
        error
      });
    }
  }, 'Cost Analysis Agent');
  
  // Subscribe to cost estimation request events
  EventBus.subscribe('cost:estimate:request', async (event) => {
    try {
      const result = await costAnalysisAgent.estimateCost(event.payload);
      
      // Emit success event with results
      EventBus.emit('cost:estimate:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      console.error('Error handling cost estimation request:', error);
      
      // Emit failure event
      EventBus.emit('cost:estimate:failed', {
        requestId: event.id,
        error
      });
    }
  }, 'Cost Analysis Agent');
  
  // Subscribe to cost comparison request events
  EventBus.subscribe('cost:compare:request', async (event) => {
    try {
      const result = await costAnalysisAgent.compareCosts(event.payload);
      
      // Emit success event with results
      EventBus.emit('cost:compare:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      console.error('Error handling cost comparison request:', error);
      
      // Emit failure event
      EventBus.emit('cost:compare:failed', {
        requestId: event.id,
        error
      });
    }
  }, 'Cost Analysis Agent');
}