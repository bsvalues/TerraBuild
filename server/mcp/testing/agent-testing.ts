/**
 * MCP Agent Testing Framework
 * 
 * This module provides utilities for testing AI agents within the MCP framework,
 * including functions for validating agent responses, simulating agent interactions,
 * and verifying compliance with the inter-agent communication protocol.
 */

import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '../event-bus';
import { logger } from '../../utils/logger';
import { AgentMessage, MessageType, Priority } from '../agent-communication';

// Test result interface
export interface TestResult {
  agentId: string;
  testId: string;
  success: boolean;
  description: string;
  details?: any;
  timestamp: number;
  duration: number;
}

// Test case interface
export interface TestCase {
  id: string;
  description: string;
  testFn: (agentId: string) => Promise<TestResult>;
  timeout?: number;
}

/**
 * Agent Testing Service
 * 
 * Provides functions for testing agents in the MCP framework
 */
class AgentTestingService {
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  
  /**
   * Test an agent's capability to respond to a specific message type
   * 
   * @param agentId The ID of the agent to test
   * @param messageType The type of message to test
   * @param subject The subject of the message
   * @param content The content of the message
   * @param options Additional test options
   * @returns Test result
   */
  async testAgentResponse(
    agentId: string,
    messageType: MessageType,
    subject: string,
    content: any,
    options: {
      timeout?: number;
      description?: string;
      expectedResponseContent?: any;
      validateFn?: (response: any) => boolean;
    } = {}
  ): Promise<TestResult> {
    const testId = uuidv4();
    const startTime = Date.now();
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;
    const description = options.description || `Testing ${agentId} response to ${subject}`;
    
    logger.info(`[AgentTest] Starting test ${testId}: ${description}`);
    
    // Default test result (failure)
    const failResult: TestResult = {
      agentId,
      testId,
      success: false,
      description,
      timestamp: startTime,
      duration: 0
    };
    
    try {
      // Create a promise that will resolve when we get a response or timeout
      const responsePromise = new Promise<any>((resolve, reject) => {
        // Setup response handler
        const handlerId = eventBus.subscribe('agent:response', (event) => {
          const response = event.payload;
          
          // Check if this is a response for our test
          if (response.to === 'test-framework' && response.from === agentId) {
            // Unsubscribe to prevent memory leaks
            eventBus.unsubscribe(handlerId);
            resolve(response);
          }
        });
        
        // Setup timeout
        setTimeout(() => {
          // Unsubscribe to prevent memory leaks
          eventBus.unsubscribe(handlerId);
          reject(new Error(`Test timed out after ${timeout}ms`));
        }, timeout);
        
        // Send test message
        const message: AgentMessage = {
          id: testId,
          type: messageType,
          priority: Priority.NORMAL,
          from: 'test-framework',
          to: agentId,
          subject,
          content,
          timestamp: Date.now()
        };
        
        // Published based on message type
        const topic = `agent:${messageType.toLowerCase()}`;
        eventBus.publish(topic, message);
      });
      
      // Wait for response
      const response = await responsePromise;
      const endTime = Date.now();
      
      // Validate response if validation function provided
      let success = true;
      let details = { response };
      
      if (options.validateFn) {
        success = options.validateFn(response.content);
        details.validationResult = success;
      } else if (options.expectedResponseContent) {
        // Simple equality check
        success = JSON.stringify(response.content) === JSON.stringify(options.expectedResponseContent);
        details.expectedContent = options.expectedResponseContent;
      }
      
      // Return success result
      return {
        agentId,
        testId,
        success,
        description,
        details,
        timestamp: startTime,
        duration: endTime - startTime
      };
    } catch (error) {
      const endTime = Date.now();
      
      // Return failure result
      return {
        ...failResult,
        details: { error: error.message },
        duration: endTime - startTime
      };
    }
  }
  
  /**
   * Run a series of tests on an agent
   * 
   * @param agentId The ID of the agent to test
   * @param testCases The test cases to run
   * @returns Array of test results
   */
  async runTestSuite(agentId: string, testCases: TestCase[]): Promise<TestResult[]> {
    logger.info(`[AgentTest] Running test suite for ${agentId} (${testCases.length} tests)`);
    
    const results: TestResult[] = [];
    
    for (const testCase of testCases) {
      try {
        logger.info(`[AgentTest] Running test: ${testCase.description}`);
        const result = await testCase.testFn(agentId);
        results.push(result);
        
        logger.info(`[AgentTest] Test ${result.testId} completed: ${result.success ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        logger.error(`[AgentTest] Error running test ${testCase.id}:`, error);
        
        // Add failure result
        results.push({
          agentId,
          testId: testCase.id,
          success: false,
          description: testCase.description,
          details: { error: error.message },
          timestamp: Date.now(),
          duration: 0
        });
      }
    }
    
    // Log summary
    const passedCount = results.filter(r => r.success).length;
    logger.info(`[AgentTest] Test suite completed: ${passedCount}/${results.length} tests passed`);
    
    return results;
  }
  
  /**
   * Test agent's compliance capability
   * 
   * @param agentId The ID of the compliance agent
   * @param regulationCode The regulation code to check
   * @param testData The test data to validate
   * @returns Test result
   */
  async testComplianceValidation(
    agentId: string,
    regulationCode: string,
    testData: any
  ): Promise<TestResult> {
    return this.testAgentResponse(
      agentId,
      MessageType.REQUEST,
      'compliance:validate:request',
      {
        regulationCode,
        data: testData
      },
      {
        description: `Testing compliance validation for ${regulationCode}`,
        validateFn: (response) => {
          // Ensure we have a valid compliance response
          return (
            response &&
            typeof response.success === 'boolean' &&
            Array.isArray(response.complianceIssues)
          );
        }
      }
    );
  }
  
  /**
   * Test data quality validation capability
   * 
   * @param agentId The ID of the data quality agent
   * @param testData The test data to validate
   * @returns Test result
   */
  async testDataQualityValidation(
    agentId: string,
    testData: any
  ): Promise<TestResult> {
    return this.testAgentResponse(
      agentId,
      MessageType.REQUEST,
      'data:validate:request',
      { data: testData },
      {
        description: 'Testing data quality validation',
        validateFn: (response) => {
          // Ensure we have a valid data quality response
          return (
            response &&
            typeof response.success === 'boolean' &&
            Array.isArray(response.issues)
          );
        }
      }
    );
  }
  
  /**
   * Test cost analysis capability
   * 
   * @param agentId The ID of the cost analysis agent
   * @param buildingType The type of building
   * @param squareFeet The square footage
   * @param region The region
   * @returns Test result
   */
  async testCostEstimation(
    agentId: string,
    buildingType: string,
    squareFeet: number,
    region: string
  ): Promise<TestResult> {
    return this.testAgentResponse(
      agentId,
      MessageType.REQUEST,
      'cost:estimate:request',
      {
        buildingType,
        squareFeet,
        region
      },
      {
        description: `Testing cost estimation for ${buildingType} in ${region}`,
        validateFn: (response) => {
          // Ensure we have a valid cost estimation response
          return (
            response &&
            typeof response.success === 'boolean' &&
            response.estimate &&
            typeof response.estimate.cost === 'number'
          );
        }
      }
    );
  }
}

// Create the singleton instance
export const agentTesting = new AgentTestingService();