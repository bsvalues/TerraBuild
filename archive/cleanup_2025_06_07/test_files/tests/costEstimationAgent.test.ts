/**
 * Cost Estimation Agent Tests
 * 
 * This file contains tests for the Cost Estimation Agent functionality
 * to ensure accurate building cost estimation with regional adjustments.
 */

import { costEstimationAgent } from '../server/mcp/agents/costEstimationAgent';
import { AgentEvent } from '../server/mcp/agents/customAgentBase';
import { v4 as uuidv4 } from 'uuid';

describe('Cost Estimation Agent', () => {
  // Setup spy on console methods
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let emitEventSpy: jest.SpyInstance;
  
  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-ignore - Accessing private method for testing
    emitEventSpy = jest.spyOn(costEstimationAgent, 'emitEvent').mockImplementation(() => Promise.resolve());
    // @ts-ignore - Accessing private method for testing
    jest.spyOn(costEstimationAgent, 'recordMemory').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    emitEventSpy.mockRestore();
  });
  
  test('should initialize correctly', async () => {
    expect(costEstimationAgent).toBeDefined();
    expect(costEstimationAgent.agentId).toBe('cost-estimation-agent');
    expect(costEstimationAgent.name).toBe('Cost Estimation Agent');
  });
  
  test('should handle valid cost estimation request', async () => {
    const correlationId = uuidv4();
    const event = {
      source: 'test-agent',
      correlationId,
      type: 'cost:estimate:request',
      data: {
        request: {
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
        },
        requestId: uuidv4()
      }
    };
    
    // @ts-ignore - Accessing private method for testing
    await costEstimationAgent.handleCostEstimationRequest(event, {});
    
    // Check that event was emitted with successful result
    expect(emitEventSpy).toHaveBeenCalledTimes(1);
    const emittedEventType = emitEventSpy.mock.calls[0][0];
    const emittedEventData = emitEventSpy.mock.calls[0][1];
    
    expect(emittedEventType).toBe('cost:estimate:completed');
    expect(emittedEventData.data.correlationId).toBe(correlationId);
    expect(emittedEventData.data.success).toBe(true);
    expect(emittedEventData.data.estimation).toBeDefined();
    
    // Check estimation details
    const estimation = emittedEventData.data.estimation;
    expect(estimation.estimatedCost).toBeGreaterThan(0);
    expect(estimation.baseRate).toBeGreaterThan(0);
    expect(estimation.adjustedRate).toBeGreaterThan(0);
    expect(estimation.appliedFactors.region).toBe(1.05); // Western region factor
    expect(estimation.confidenceLevel).toBe('HIGH');
  });
  
  test('should handle invalid cost estimation request', async () => {
    const correlationId = uuidv4();
    const event = {
      source: 'test-agent',
      correlationId,
      type: 'cost:estimate:request',
      data: {
        request: {
          // Missing required fields
          buildingType: 'residential'
          // No squareFeet
          // No region
        },
        requestId: uuidv4()
      }
    };
    
    // @ts-ignore - Accessing private method for testing
    await costEstimationAgent.handleCostEstimationRequest(event, {});
    
    // Check that error event was emitted
    expect(emitEventSpy).toHaveBeenCalledTimes(1);
    const emittedEventType = emitEventSpy.mock.calls[0][0];
    const emittedEventData = emitEventSpy.mock.calls[0][1];
    
    expect(emittedEventType).toBe('cost:estimate:error');
    expect(emittedEventData.data.correlationId).toBe(correlationId);
    expect(emittedEventData.data.errorMessage).toContain('Missing required parameters');
  });
  
  test('should handle matrix update request', async () => {
    const correlationId = uuidv4();
    const event = {
      source: 'test-agent',
      correlationId,
      type: 'cost:matrix:update',
      data: {
        matrix: {
          id: 'test-matrix-2025',
          buildingTypes: [
            { code: 'RESIDENTIAL', baseRate: 130 },
            { code: 'COMMERCIAL', baseRate: 180 },
            { code: 'INDUSTRIAL', baseRate: 155 }
          ]
        }
      }
    };
    
    // @ts-ignore - Accessing private method for testing
    await costEstimationAgent.handleCostMatrixUpdate(event, {});
    
    // Check that confirmation event was emitted
    expect(emitEventSpy).toHaveBeenCalledTimes(1);
    const emittedEventType = emitEventSpy.mock.calls[0][0];
    const emittedEventData = emitEventSpy.mock.calls[0][1];
    
    expect(emittedEventType).toBe('cost:matrix:updated');
    expect(emittedEventData.data.correlationId).toBe(correlationId);
    expect(emittedEventData.data.success).toBe(true);
  });
  
  test('should apply regional cost factors correctly', async () => {
    // Test multiple regions to verify correct factors are applied
    const requests = [
      {
        region: 'EASTERN',
        expectedFactor: 0.95
      },
      {
        region: 'CENTRAL',
        expectedFactor: 1.0
      },
      {
        region: 'WESTERN',
        expectedFactor: 1.05
      }
    ];
    
    for (const testCase of requests) {
      const correlationId = uuidv4();
      const event = {
        source: 'test-agent',
        correlationId,
        type: 'cost:estimate:request',
        data: {
          request: {
            buildingType: 'residential',
            squareFeet: 2000,
            region: testCase.region,
            quality: 'MEDIUM',
            condition: 'AVERAGE',
            yearBuilt: 2020
          },
          requestId: uuidv4()
        }
      };
      
      // Reset the spy
      emitEventSpy.mockClear();
      
      // @ts-ignore - Accessing private method for testing
      await costEstimationAgent.handleCostEstimationRequest(event, {});
      
      // Check region factor was applied correctly
      const emittedEventData = emitEventSpy.mock.calls[0][1];
      const estimation = emittedEventData.data.estimation;
      
      expect(estimation.appliedFactors.region).toBe(testCase.expectedFactor);
    }
  });
});