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
    
    // Create the agent definition
    const agent: Agent = {
      id: AGENT_ID,
      name: AGENT_NAME,
      status: 'active',
      capabilities: [
        'data:validate',
        'data:analyze:quality',
        'data:repair'
      ],
      metadata: {
        description: 'Validates data quality and identifies issues in property data',
        version: '1.0.0'
      },
      lastUpdated: Date.now()
    };
    
    // Notify system that agent is initialized
    eventBus.publish('agent:initialized', {
      agentId: AGENT_ID,
      agentName: AGENT_NAME
    });
    
    logger.info(`[TerraBuild] ${AGENT_NAME} registered successfully`);
    
    return agent;
  } catch (error) {
    logger.error(`Error initializing ${AGENT_NAME}:`, error);
    
    // Emit error event
    eventBus.publish('agent:error', {
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
  eventBus.subscribe('data:validate:request', async (event) => {
    try {
      logger.info('Data Quality Agent processing validation request');
      const result = await validateData(event.payload);
      
      // Emit success event with results
      eventBus.publish('data:validate:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      logger.error('Error handling data validation request:', error);
      
      // Emit failure event
      eventBus.publish('data:validate:failed', {
        requestId: event.id,
        error
      });
    }
  });
  
  // Subscribe to data quality analysis request events
  eventBus.subscribe('data:analyze:quality:request', async (event) => {
    try {
      logger.info('Data Quality Agent processing quality analysis request');
      const result = await analyzeQuality(event.payload);
      
      // Emit success event with results
      eventBus.publish('data:analyze:quality:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      logger.error('Error handling data quality analysis request:', error);
      
      // Emit failure event
      eventBus.publish('data:analyze:quality:failed', {
        requestId: event.id,
        error
      });
    }
  });
  
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
}

/**
 * Validate data quality
 * 
 * @param data The data to validate
 * @returns Validation results
 */
async function validateData(data: any): Promise<any> {
  // Implementation of data validation logic
  const validationResults = {
    success: true,
    issues: [] as any[],
    regionIssues: [] as any[],
    message: 'Data validation completed successfully'
  };
  
  // Handle different data types
  if (!data) {
    validationResults.success = false;
    validationResults.message = 'No data provided for validation';
    return validationResults;
  }
  
  // Check if this is a cost matrix validation request
  if (data.type === 'cost_matrix' || data.matrices) {
    // Use the enhanced data quality agent for cost matrix validation
    try {
      const costMatrixResults = dataQualityAgent.validateCostMatrix(data);
      
      // Merge results
      validationResults.success = costMatrixResults.valid;
      validationResults.issues = costMatrixResults.issues || [];
      validationResults.regionIssues = costMatrixResults.regionIssues || [];
      validationResults.message = costMatrixResults.message;
      
      // Add quality metrics if requested
      if (data.includeQualityMetrics) {
        validationResults.qualityMetrics = dataQualityAgent.analyzeCostDataQuality(data);
      }
      
      // Add anomaly detection if requested
      if (data.detectAnomalies) {
        validationResults.anomalies = dataQualityAgent.detectCostAnomalies(data);
      }
      
      return validationResults;
    } catch (error) {
      logger.error('Error in cost matrix validation:', error);
      validationResults.success = false;
      validationResults.message = 'Error validating cost matrix data';
      validationResults.issues.push({
        severity: 'error',
        message: error.message || 'Unknown error in cost matrix validation'
      });
      return validationResults;
    }
  }
  
  // Otherwise, handle property data validation (original functionality)
  if (data.properties) {
    for (const property of data.properties) {
      // Check for required fields
      if (!property.id || !property.address) {
        validationResults.issues.push({
          severity: 'error',
          message: 'Property missing required fields',
          property: property.id || 'unknown'
        });
        validationResults.success = false;
      }
      
      // Validate property regions if present
      if (property.regions) {
        for (const [regionType, regionValue] of Object.entries(property.regions)) {
          // Skip if region value is not provided
          if (!regionValue) continue;
          
          // Validate only if it's a known region type
          if (['city', 'tca', 'hood_code', 'township_range'].includes(regionType)) {
            try {
              const regionValidation = dataQualityAgent.validateRegion(
                regionValue as string, 
                regionType as any
              );
              
              if (!regionValidation.valid) {
                validationResults.regionIssues.push({
                  severity: 'warning',
                  property: property.id,
                  region_type: regionType,
                  region_value: regionValue,
                  message: regionValidation.message
                });
              }
            } catch (error) {
              logger.error(`Error validating region for property ${property.id}:`, error);
            }
          }
        }
      }
    }
  }
  
  // Update message if validation failed
  if (!validationResults.success) {
    validationResults.message = 'Data validation completed with issues';
  }
  
  return validationResults;
}

/**
 * Analyze data quality
 * 
 * @param data The data to analyze
 * @returns Analysis results
 */
async function analyzeQuality(data: any): Promise<any> {
  // Implementation of data quality analysis logic
  const analysisResults = {
    success: true,
    metrics: {
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      overall: 0
    },
    recommendations: [] as string[],
    message: 'Quality analysis completed successfully'
  };
  
  // Example analysis logic
  if (data && data.properties) {
    const totalProperties = data.properties.length;
    let completeProperties = 0;
    let fieldsPresent = 0;
    let totalFields = 0;
    
    for (const property of data.properties) {
      const requiredFields = ['id', 'address', 'type', 'value', 'year_built'];
      const presentFields = requiredFields.filter(field => property[field] !== undefined);
      
      fieldsPresent += presentFields.length;
      totalFields += requiredFields.length;
      
      if (presentFields.length === requiredFields.length) {
        completeProperties++;
      }
    }
    
    // Calculate quality metrics
    analysisResults.metrics.completeness = totalProperties > 0 ? (completeProperties / totalProperties) * 100 : 0;
    analysisResults.metrics.accuracy = 95; // Placeholder - would need more sophisticated analysis
    analysisResults.metrics.consistency = totalFields > 0 ? (fieldsPresent / totalFields) * 100 : 0;
    analysisResults.metrics.overall = (analysisResults.metrics.completeness + 
                                      analysisResults.metrics.accuracy + 
                                      analysisResults.metrics.consistency) / 3;
    
    // Generate recommendations
    if (analysisResults.metrics.completeness < 90) {
      analysisResults.recommendations.push(
        'Improve data completeness by ensuring all properties have required fields'
      );
    }
  }
  
  return analysisResults;
}