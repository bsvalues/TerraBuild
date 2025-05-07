/**
 * Neighborhood Discovery Agent Handler
 * 
 * This handler registers the Neighborhood Discovery Agent with the MCP framework
 * and coordinates its interactions with other components.
 */

import { logger } from '../../utils/logger';
import { eventBus } from '../event-bus';
import { neighborhoodDiscoveryAgent } from '../agents/neighborhood-discovery-agent';
import type { Agent, AgentStatus } from '../types';

const AGENT_ID = 'neighborhood-discovery-agent';
const AGENT_NAME = 'Neighborhood Discovery Agent';

/**
 * Register the Neighborhood Discovery Agent with the MCP framework
 */
export function registerNeighborhoodDiscoveryAgent(): Agent {
  try {
    logger.info('Initializing Neighborhood Discovery Agent');
    
    // Create the agent definition
    const agent: Agent = {
      id: AGENT_ID,
      name: AGENT_NAME,
      status: 'active',
      capabilities: [
        'neighborhood:discover',
        'neighborhood:analyze',
        'geographic:pattern:analyze'
      ],
      metadata: {
        description: 'Identifies and analyzes neighborhoods based on property data patterns',
        version: '1.0.0',
        supports_anthropic: !!process.env.ANTHROPIC_API_KEY
      },
      lastUpdated: Date.now()
    };
    
    // Update agent status when the agent initializes
    eventBus.subscribe('agent:initialized', (event) => {
      const { agentId } = event.payload || {};
      
      if (agentId === AGENT_ID) {
        logger.info(`Agent ${AGENT_NAME} initialized`);
        
        // Notify about agent status
        eventBus.publish('agent:status', {
          agentId: AGENT_ID,
          status: 'active',
          message: `${AGENT_NAME} is ready`
        });
      }
    });
    
    // Handle errors
    eventBus.subscribe('neighborhood:discover:failed', (event) => {
      const { error } = event.payload || {};
      
      logger.error(`Neighborhood discovery error: ${error}`);
      
      // Notify about error status
      eventBus.publish('agent:status', {
        agentId: AGENT_ID,
        status: 'error',
        message: `Error in neighborhood discovery: ${error}`,
        errorDetails: error
      });
    });
    
    // Handle errors in analysis
    eventBus.subscribe('neighborhood:analyze:failed', (event) => {
      const { error } = event.payload || {};
      
      logger.error(`Neighborhood analysis error: ${error}`);
      
      // Notify about error status
      eventBus.publish('agent:status', {
        agentId: AGENT_ID,
        status: 'error',
        message: `Error in neighborhood analysis: ${error}`,
        errorDetails: error
      });
    });
    
    logger.info('Neighborhood Discovery Agent registered successfully');
    
    return agent;
  } catch (error) {
    logger.error(`Error registering Neighborhood Discovery Agent: ${error.message}`);
    
    // Create an error agent definition
    const errorAgent: Agent = {
      id: AGENT_ID,
      name: AGENT_NAME,
      status: 'error',
      capabilities: [],
      metadata: {
        error: error.message
      },
      lastUpdated: Date.now()
    };
    
    return errorAgent;
  }
}