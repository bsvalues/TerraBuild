/**
 * Cost Analysis Agent Handler
 * 
 * This handler registers the Cost Analysis Agent with the MCP framework
 * and coordinates its interactions with other components.
 */

import { logger } from '../../utils/logger';
import { eventBus } from '../event-bus';
import { costAnalysisAgent } from '../agents/costAnalysisAgent';
import type { Agent, AgentStatus } from '../types';

const AGENT_ID = 'cost-analysis-agent';
const AGENT_NAME = 'Cost Analysis Agent';

/**
 * Initialize and register the Cost Analysis Agent with the MCP framework
 */
export function registerCostAnalysisAgent(): Agent {
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
        'cost:analyze',
        'cost:estimate',
        'cost:compare'
      ],
      metadata: {
        description: 'Analyzes building cost data and provides estimation services',
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
 * Register event handlers for cost analysis related events
 */
function registerEventHandlers(): void {
  // Subscribe to cost analysis request events
  eventBus.subscribe('cost:analyze:request', async (event) => {
    try {
      logger.info('Cost Analysis Agent processing analysis request');
      const result = await analyzeCost(event.payload);
      
      // Emit success event with results
      eventBus.publish('cost:analyze:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      logger.error('Error handling cost analysis request:', error);
      
      // Emit failure event
      eventBus.publish('cost:analyze:failed', {
        requestId: event.id,
        error
      });
    }
  });
  
  // Subscribe to cost estimation request events
  eventBus.subscribe('cost:estimate:request', async (event) => {
    try {
      logger.info('Cost Analysis Agent processing estimation request');
      const result = await estimateCost(event.payload);
      
      // Emit success event with results
      eventBus.publish('cost:estimate:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      logger.error('Error handling cost estimation request:', error);
      
      // Emit failure event
      eventBus.publish('cost:estimate:failed', {
        requestId: event.id,
        error
      });
    }
  });
  
  // Subscribe to cost comparison request events
  eventBus.subscribe('cost:compare:request', async (event) => {
    try {
      logger.info('Cost Analysis Agent processing comparison request');
      const result = await compareCosts(event.payload);
      
      // Emit success event with results
      eventBus.publish('cost:compare:completed', {
        requestId: event.id,
        result
      });
    } catch (error) {
      logger.error('Error handling cost comparison request:', error);
      
      // Emit failure event
      eventBus.publish('cost:compare:failed', {
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
 * Analyze cost data
 * 
 * @param data The data to analyze
 * @returns Analysis results
 */
async function analyzeCost(data: any): Promise<any> {
  // Implementation of cost analysis logic
  const analysisResults = {
    success: true,
    metrics: {
      averageCost: 0,
      medianCost: 0,
      minCost: 0,
      maxCost: 0,
      standardDeviation: 0
    },
    trends: [] as any[],
    message: 'Cost analysis completed successfully'
  };
  
  // Example analysis logic
  if (data && data.costs) {
    const costs = data.costs.map((item: any) => parseFloat(item.value)).filter((value: number) => !isNaN(value));
    
    if (costs.length > 0) {
      // Calculate basic statistics
      analysisResults.metrics.averageCost = costs.reduce((sum: number, value: number) => sum + value, 0) / costs.length;
      
      // Sort costs for median and min/max
      const sortedCosts = [...costs].sort((a, b) => a - b);
      analysisResults.metrics.minCost = sortedCosts[0];
      analysisResults.metrics.maxCost = sortedCosts[sortedCosts.length - 1];
      
      // Calculate median
      const midIndex = Math.floor(sortedCosts.length / 2);
      analysisResults.metrics.medianCost = sortedCosts.length % 2 === 0
        ? (sortedCosts[midIndex - 1] + sortedCosts[midIndex]) / 2
        : sortedCosts[midIndex];
      
      // Calculate standard deviation
      const variance = costs.reduce((sum: number, value: number) => {
        return sum + Math.pow(value - analysisResults.metrics.averageCost, 2);
      }, 0) / costs.length;
      analysisResults.metrics.standardDeviation = Math.sqrt(variance);
      
      // Identify trends if historical data is available
      if (data.historicalCosts) {
        const periods = Object.keys(data.historicalCosts).sort();
        let previousPeriodAvg = null;
        
        for (const period of periods) {
          const periodCosts = data.historicalCosts[period].map((item: any) => parseFloat(item.value)).filter((value: number) => !isNaN(value));
          const periodAvg = periodCosts.reduce((sum: number, value: number) => sum + value, 0) / periodCosts.length;
          
          if (previousPeriodAvg !== null) {
            const percentageChange = ((periodAvg - previousPeriodAvg) / previousPeriodAvg) * 100;
            analysisResults.trends.push({
              period,
              averageCost: periodAvg,
              percentageChange: percentageChange,
              direction: percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'stable'
            });
          }
          
          previousPeriodAvg = periodAvg;
        }
      }
    }
  }
  
  return analysisResults;
}

/**
 * Estimate cost based on parameters
 * 
 * @param data The estimation parameters
 * @returns Cost estimation results
 */
async function estimateCost(data: any): Promise<any> {
  // Implementation of cost estimation logic
  const estimationResults = {
    success: true,
    estimate: {
      cost: 0,
      confidenceLevel: 'medium',
      range: {
        min: 0,
        max: 0
      }
    },
    factors: [] as any[],
    message: 'Cost estimation completed successfully'
  };
  
  // Example estimation logic
  if (data) {
    // Extract parameters
    const buildingType = data.buildingType || 'unknown';
    const squareFeet = parseFloat(data.squareFeet) || 0;
    const region = data.region || 'unknown';
    const quality = data.quality || 'average';
    const yearBuilt = parseInt(data.yearBuilt) || new Date().getFullYear();
    
    // Base cost calculation (simplified example)
    let baseCost = 0;
    let confidenceLevel = 'low';
    
    // Calculate base cost by building type
    if (buildingType === 'residential') {
      baseCost = 125; // $125 per sq ft
      confidenceLevel = 'high';
    } else if (buildingType === 'commercial') {
      baseCost = 150; // $150 per sq ft
      confidenceLevel = 'medium';
    } else if (buildingType === 'industrial') {
      baseCost = 100; // $100 per sq ft
      confidenceLevel = 'medium';
    } else {
      baseCost = 135; // default
    }
    
    // Apply regional factor
    let regionalFactor = 1.0;
    if (region === 'urban') {
      regionalFactor = 1.2;
    } else if (region === 'suburban') {
      regionalFactor = 1.0;
    } else if (region === 'rural') {
      regionalFactor = 0.9;
    }
    
    // Apply quality factor
    let qualityFactor = 1.0;
    if (quality === 'premium') {
      qualityFactor = 1.4;
    } else if (quality === 'above_average') {
      qualityFactor = 1.2;
    } else if (quality === 'average') {
      qualityFactor = 1.0;
    } else if (quality === 'below_average') {
      qualityFactor = 0.8;
    }
    
    // Apply age factor
    const currentYear = new Date().getFullYear();
    const ageInYears = currentYear - yearBuilt;
    const ageFactor = Math.max(0.7, 1 - (ageInYears * 0.005)); // 0.5% depreciation per year, minimum 70% value
    
    // Calculate final estimate
    const totalCostPerSqFt = baseCost * regionalFactor * qualityFactor * ageFactor;
    const totalCost = totalCostPerSqFt * squareFeet;
    
    // Setup uncertainty range (simplified)
    const uncertainty = confidenceLevel === 'high' ? 0.05 : confidenceLevel === 'medium' ? 0.15 : 0.25;
    const minCost = totalCost * (1 - uncertainty);
    const maxCost = totalCost * (1 + uncertainty);
    
    // Populate results
    estimationResults.estimate.cost = Math.round(totalCost);
    estimationResults.estimate.confidenceLevel = confidenceLevel;
    estimationResults.estimate.range.min = Math.round(minCost);
    estimationResults.estimate.range.max = Math.round(maxCost);
    
    // Document factors used
    estimationResults.factors = [
      { name: 'Base Cost', value: `$${baseCost.toFixed(2)} per sq ft`, description: `Base cost for ${buildingType} building type` },
      { name: 'Regional Factor', value: regionalFactor.toFixed(2), description: `Adjustment for ${region} region` },
      { name: 'Quality Factor', value: qualityFactor.toFixed(2), description: `Adjustment for ${quality} quality level` },
      { name: 'Age Factor', value: ageFactor.toFixed(2), description: `Adjustment for ${ageInYears} years of age` },
      { name: 'Total Area', value: `${squareFeet.toFixed(0)} sq ft`, description: 'Total building area' }
    ];
  }
  
  return estimationResults;
}

/**
 * Compare multiple cost estimates
 * 
 * @param data The comparison parameters
 * @returns Comparison results
 */
async function compareCosts(data: any): Promise<any> {
  // Implementation of cost comparison logic
  const comparisonResults = {
    success: true,
    items: [] as any[],
    differences: {
      percentage: 0,
      absolute: 0
    },
    recommendations: [] as string[],
    message: 'Cost comparison completed successfully'
  };
  
  // Example comparison logic
  if (data && data.items && Array.isArray(data.items) && data.items.length >= 2) {
    // Process comparison items
    const processedItems = data.items.map((item: any, index: number) => {
      return {
        id: index + 1,
        name: item.name || `Item ${index + 1}`,
        cost: parseFloat(item.cost) || 0,
        source: item.source || 'unknown',
        date: item.date || new Date().toISOString(),
        notes: item.notes || ''
      };
    });
    
    // Sort by cost
    comparisonResults.items = processedItems.sort((a, b) => a.cost - b.cost);
    
    // Calculate differences
    const lowestCost = comparisonResults.items[0].cost;
    const highestCost = comparisonResults.items[comparisonResults.items.length - 1].cost;
    
    comparisonResults.differences.absolute = highestCost - lowestCost;
    comparisonResults.differences.percentage = lowestCost > 0 
      ? ((highestCost - lowestCost) / lowestCost) * 100 
      : 0;
    
    // Generate recommendations
    if (comparisonResults.differences.percentage > 25) {
      comparisonResults.recommendations.push(
        'Significant cost variation detected. Consider investigating the higher cost estimates for potential savings opportunities.'
      );
    }
    
    if (comparisonResults.items.some(item => item.source === 'unknown')) {
      comparisonResults.recommendations.push(
        'Some cost estimates have unknown sources. Verify all data sources for more accurate comparisons.'
      );
    }
    
    // If there's a clear lowest cost
    if (comparisonResults.items.length > 1 && 
        (comparisonResults.items[1].cost - comparisonResults.items[0].cost) / comparisonResults.items[0].cost > 0.1) {
      comparisonResults.recommendations.push(
        `${comparisonResults.items[0].name} offers the best value at ${comparisonResults.items[0].cost.toFixed(2)}, approximately ${((comparisonResults.differences.percentage).toFixed(1))}% lower than the highest estimate.`
      );
    }
  }
  
  return comparisonResults;
}