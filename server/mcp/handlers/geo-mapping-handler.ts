/**
 * Geographic Mapping Agent Handler
 * 
 * This module registers and handles requests for the geographic mapping agent
 */

import { geoMappingAgent } from '../agents/geo-mapping-agent';
import { eventBus } from '../event-bus';
import { MCPEvent } from '../types';

/**
 * Initialize the Geographic Mapping Agent and register its handlers
 */
export function initGeoMappingAgent() {
  console.log('Initializing Geographic Mapping Agent');
  
  // Register handler for property geography mapping
  eventBus.subscribe('geography:map:property', async (event: MCPEvent) => {
    const { propertyData, sessionId, requestId } = event.payload || {};
    
    if (!propertyData) {
      eventBus.publish('geography:map:failed', {
        error: 'No property data provided',
        requestId,
        sessionId
      });
      return;
    }
    
    try {
      console.log(`Processing geographic mapping request for property ${propertyData.prop_id || 'unknown'}`);
      const result = await geoMappingAgent.mapPropertyToGeography(propertyData);
      
      eventBus.publish('geography:map:completed', {
        result,
        requestId,
        sessionId
      });
    } catch (error) {
      console.error('Error in geography mapping handler:', error);
      eventBus.publish('geography:map:failed', {
        error: error.message || 'Unknown error in geographic mapping',
        requestId,
        sessionId
      });
    }
  });
  
  // Register handler for neighborhood creation
  eventBus.subscribe('geography:neighborhood:create', async (event: MCPEvent) => {
    const { hood_cd, municipalityId, name, requestId, sessionId } = event.payload || {};
    
    if (!hood_cd || !municipalityId) {
      eventBus.publish('geography:neighborhood:failed', {
        error: 'Required parameters missing',
        requestId,
        sessionId
      });
      return;
    }
    
    try {
      const result = await geoMappingAgent.createNeighborhoodMapping(
        hood_cd, 
        municipalityId,
        name
      );
      
      eventBus.publish('geography:neighborhood:completed', {
        result,
        requestId,
        sessionId
      });
    } catch (error) {
      console.error('Error in neighborhood creation handler:', error);
      eventBus.publish('geography:neighborhood:failed', {
        error: error.message || 'Unknown error creating neighborhood',
        requestId,
        sessionId
      });
    }
  });

  // Let the system know the agent is ready
  eventBus.publish('agent:initialized', {
    agentId: 'geo-mapping-agent',
    agentName: 'Geographic Mapping Agent',
    capabilities: [
      'geography:map:property',
      'geography:neighborhood:create'
    ]
  });
  
  console.log('Geographic Mapping Agent initialized successfully');
}