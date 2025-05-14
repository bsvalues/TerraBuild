import { EventBus } from '../event-bus';
import { complianceAgent } from '../agents/complianceAgent';

/**
 * Initialize and register the Compliance Agent with the MCP framework
 * 
 * @returns {void}
 */
export function registerComplianceAgent(): void {
  console.log('Initializing Compliance Agent');
  
  try {
    // Initialize the agent
    complianceAgent.initialize();
    
    // Register event handlers for compliance events
    registerEventHandlers();
    
    // Register capabilities with the agent registry
    complianceAgent.registerCapability('compliance:validate', async (data) => {
      console.log('Compliance Agent processing validation request');
      return await complianceAgent.validateCompliance(data);
    });
    
    complianceAgent.registerCapability('compliance:check:regulations', async (data) => {
      console.log('Compliance Agent checking regulations compliance');
      return await complianceAgent.checkRegulations(data);
    });
    
    complianceAgent.registerCapability('compliance:generate:report', async (data) => {
      console.log('Compliance Agent generating compliance report');
      return await complianceAgent.generateReport(data);
    });
    
    // Emit initialized event
    EventBus.emit('agent:initialized', {
      agentId: 'compliance-agent',
      agentName: 'Compliance Agent'
    });
    
    console.log('[2025-05-14] [INFO] [TerraBuild] Compliance Agent registered successfully');
  } catch (error) {
    console.error('Error initializing Compliance Agent:', error);
    
    // Emit error event
    EventBus.emit('agent:error', {
      agentId: 'compliance-agent',
      error: error
    });
    
    throw error;
  }
}

/**
 * Register event handlers for compliance related events
 */
function registerEventHandlers(): void {
  // Subscribe to compliance validation request events
  EventBus.subscribe('compliance:validate:request', async (event) => {
    try {
      const result = await complianceAgent.validateCompliance(event.payload);
      
      // Emit success event with results
      EventBus.emit('compliance:validate:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      console.error('Error handling compliance validation request:', error);
      
      // Emit failure event
      EventBus.emit('compliance:validate:failed', {
        requestId: event.id,
        error
      });
    }
  }, 'Compliance Agent');
  
  // Subscribe to regulation check request events
  EventBus.subscribe('compliance:check:regulations:request', async (event) => {
    try {
      const result = await complianceAgent.checkRegulations(event.payload);
      
      // Emit success event with results
      EventBus.emit('compliance:check:regulations:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      console.error('Error handling regulation check request:', error);
      
      // Emit failure event
      EventBus.emit('compliance:check:regulations:failed', {
        requestId: event.id,
        error
      });
    }
  }, 'Compliance Agent');
  
  // Subscribe to compliance report generation request events
  EventBus.subscribe('compliance:generate:report:request', async (event) => {
    try {
      const result = await complianceAgent.generateReport(event.payload);
      
      // Emit success event with results
      EventBus.emit('compliance:generate:report:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      console.error('Error handling compliance report generation request:', error);
      
      // Emit failure event
      EventBus.emit('compliance:generate:report:failed', {
        requestId: event.id,
        error
      });
    }
  }, 'Compliance Agent');
}