/**
 * Simple test for the Cost Estimation Agent
 */

import { costEstimationAgent } from './server/mcp/agents/costEstimationAgent.ts';

console.log('Testing Cost Estimation Agent functionality...');

// Verify the agent exists and is properly initialized
console.log('Agent ID:', costEstimationAgent.agentId);
console.log('Agent Name:', costEstimationAgent.name);

// Test calculation functionality directly
const request = {
  buildingType: 'residential',
  squareFeet: 2000,
  region: 'western',
  quality: 'MEDIUM',
  condition: 'GOOD',
  yearBuilt: 2010,
  constructionDetails: {
    stories: 2,
    foundation: 'BASEMENT',
    roofType: 'HIP',
    heating: 'FORCED_AIR',
    cooling: 'CENTRAL'
  }
};

// Create a mock event
const mockEvent = {
  source: 'test-script',
  correlationId: '12345-test-id',
  type: 'cost:estimate:request',
  data: {
    request: request,
    requestId: 'test-request-123'
  }
};

// Capture emitted events
const emittedEvents = [];
const originalEmitEvent = costEstimationAgent.emitEvent;

// @ts-ignore - Override emitEvent for testing
costEstimationAgent.emitEvent = function(type, data) {
  console.log(`Event emitted: ${type}`);
  emittedEvents.push({ type, data });
  return Promise.resolve();
};

// @ts-ignore - Override recordMemory for testing
costEstimationAgent.recordMemory = function(item) {
  console.log(`Memory recorded: ${item.type}`);
};

// Run the test
const runTest = async () => {
  try {
    // @ts-ignore - Call private method
    await costEstimationAgent.handleCostEstimationRequest(mockEvent, {});
    
    // Print results
    if (emittedEvents.length > 0) {
      console.log('\nTest succeeded! Event emitted:');
      console.log('- Event type:', emittedEvents[0].type);
      
      const estimationData = emittedEvents[0].data.data.estimation;
      console.log('\nEstimation result:');
      console.log('- Estimated cost:', estimationData.estimatedCost);
      console.log('- Base rate:', estimationData.baseRate);
      console.log('- Region factor:', estimationData.appliedFactors.region);
      console.log('- Confidence level:', estimationData.confidenceLevel);
      
      console.log('\nAdjustment factors:');
      for (const [key, value] of Object.entries(estimationData.appliedFactors)) {
        console.log(`- ${key}: ${value}`);
      }
      
      console.log('\nNotes:');
      estimationData.notes.forEach((note, index) => {
        console.log(`${index + 1}. ${note}`);
      });
    } else {
      console.error('Test failed: No events emitted');
    }
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Restore original methods
    // @ts-ignore
    costEstimationAgent.emitEvent = originalEmitEvent;
  }
};

runTest();