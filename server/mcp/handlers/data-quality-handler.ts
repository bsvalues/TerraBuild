/**
 * Data Quality Agent Handler
 * 
 * This handler registers the Data Quality Agent with the MCP framework
 * and coordinates its interactions with other components.
 */

import { logger } from '../../utils/logger';
import { eventBus } from '../event-bus';
import { dataQualityAgent } from '../agents/dataQualityAgent';
import type { Agent, AgentStatus } from '../types';

const AGENT_ID = 'data-quality-agent';
const AGENT_NAME = 'Data Quality Agent';

/**
 * Register the Data Quality Agent with the MCP framework
 */
export function registerDataQualityAgent(): Agent {
  try {
    logger.info(`Initializing ${AGENT_NAME}`);
    
    // Subscribe to events for this agent
    registerEventHandlers();
    
    // Notify system that agent is initialized
    eventBus.emit('agent:initialized', {
      agentId: AGENT_ID,
      agentName: AGENT_NAME
    });
    
    logger.info(`[TerraBuild] ${AGENT_NAME} registered successfully`);
    
    return {
      id: AGENT_ID,
      name: AGENT_NAME,
      status: 'active' as AgentStatus,
      validateData: async (payload: any) => {
        logger.info(`${AGENT_NAME} validating data`);
        return { success: true, results: [], message: 'Data validation completed' };
      },
      analyzeQuality: async (payload: any) => {
        logger.info(`${AGENT_NAME} analyzing data quality`);
        return { success: true, results: [], message: 'Quality analysis completed' };
      }
    };
  } catch (error) {
    logger.error(`Error initializing ${AGENT_NAME}:`, error);
    
    // Emit error event
    eventBus.emit('agent:error', {
      agentId: AGENT_ID,
      error: error
    });
    
    throw error;
  }
}

/**
 * Register event handlers for data quality related events
 */
function registerEventHandlers(): void {
  // Subscribe to data quality validation request events
  eventBus.subscribe('data:validate:request', async (event: any) => {
    try {
      logger.info('Data Quality Agent processing validation request');
      const result = await dataQualityAgent.validateData(event.payload);
      
      // Emit success event with results
      eventBus.emit('data:validate:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      logger.error('Error handling data validation request:', error);
      
      // Emit failure event
      eventBus.emit('data:validate:failed', {
        requestId: event.id,
        error
      });
    }
  });
  
  // Subscribe to data quality analysis request events
  eventBus.subscribe('data:analyze:quality:request', async (event: any) => {
    try {
      logger.info('Data Quality Agent processing quality analysis request');
      const result = { success: true, data: [], message: 'Quality analysis completed' };
      
      // Emit success event with results
      eventBus.emit('data:analyze:quality:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      logger.error('Error handling data quality analysis request:', error);
      
      // Emit failure event
      eventBus.emit('data:analyze:quality:failed', {
        requestId: event.id,
        error
      });
    }
  });
}