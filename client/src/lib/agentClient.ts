/**
 * Agent API Client
 * 
 * This module provides functions for interacting with the MCP agent API.
 */

import { apiRequest } from './queryClient';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: string;
}

interface AgentTestResult {
  agentId: string;
  passed: number;
  failed: number;
  total: number;
  passRate: number;
  results: any[];
  message: string;
}

/**
 * Get all agents
 * @returns List of agents
 */
export async function getAllAgents(): Promise<Agent[]> {
  try {
    const response = await apiRequest('/mcp/agents');
    return response.agents || [];
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw new Error('Failed to fetch agents');
  }
}

/**
 * Get a specific agent
 * @param agentId Agent ID
 * @returns Agent details
 */
export async function getAgent(agentId: string): Promise<Agent> {
  try {
    const response = await apiRequest(`/mcp/agents/${agentId}`);
    return response.agent;
  } catch (error) {
    console.error(`Error fetching agent ${agentId}:`, error);
    throw new Error(`Failed to fetch agent ${agentId}`);
  }
}

/**
 * Run tests for a specific agent
 * @param agentId Agent ID
 * @param agentName Agent name
 * @returns Test results
 */
export async function runAgentTests(agentId: string, agentName?: string): Promise<AgentTestResult> {
  try {
    const response = await apiRequest('/mcp/test/run', {
      method: 'POST',
      body: JSON.stringify({
        agentId,
        agentName: agentName || agentId
      })
    });
    return response.results;
  } catch (error) {
    console.error(`Error running tests for agent ${agentId}:`, error);
    throw new Error(`Failed to run tests for agent ${agentId}`);
  }
}

/**
 * Run tests for all agents
 * @returns Test results for all agents
 */
export async function runAllAgentTests(): Promise<AgentTestResult[]> {
  try {
    const response = await apiRequest('/mcp/test/run-all', {
      method: 'POST'
    });
    return response.results;
  } catch (error) {
    console.error('Error running all agent tests:', error);
    throw new Error('Failed to run all agent tests');
  }
}

/**
 * Test the data quality agent
 * @param testData Test data
 * @returns Test results
 */
export async function testDataQualityAgent(testData?: any): Promise<AgentTestResult> {
  try {
    const response = await apiRequest('/mcp/test/data-quality', {
      method: 'POST',
      body: JSON.stringify({
        testData
      })
    });
    return response.result;
  } catch (error) {
    console.error('Error testing data quality agent:', error);
    throw new Error('Failed to test data quality agent');
  }
}

/**
 * Test the compliance agent
 * @param testData Test data
 * @param regulationCode Regulation code
 * @returns Test results
 */
export async function testComplianceAgent(testData?: any, regulationCode?: string): Promise<AgentTestResult> {
  try {
    const response = await apiRequest('/mcp/test/compliance', {
      method: 'POST',
      body: JSON.stringify({
        testData,
        regulationCode
      })
    });
    return response.result;
  } catch (error) {
    console.error('Error testing compliance agent:', error);
    throw new Error('Failed to test compliance agent');
  }
}

/**
 * Test the cost analysis agent
 * @param buildingType Building type
 * @param squareFeet Square footage
 * @param region Region
 * @returns Test results
 */
export async function testCostAnalysisAgent(
  buildingType?: string,
  squareFeet?: number,
  region?: string
): Promise<AgentTestResult> {
  try {
    const response = await apiRequest('/mcp/test/cost-analysis', {
      method: 'POST',
      body: JSON.stringify({
        buildingType,
        squareFeet,
        region
      })
    });
    return response.result;
  } catch (error) {
    console.error('Error testing cost analysis agent:', error);
    throw new Error('Failed to test cost analysis agent');
  }
}

/**
 * Validate a region value using the Data Quality Agent
 * @param regionValue The region value to validate
 * @param regionType The type of region (city, tca, hood_code, township_range)
 * @returns Validation results
 */
export async function validateRegion(regionValue: string, regionType: 'city' | 'tca' | 'hood_code' | 'township_range'): Promise<any> {
  try {
    const response = await apiRequest('/mcp/diagnostic/validate-region', {
      method: 'POST',
      body: JSON.stringify({
        regionValue,
        regionType
      })
    });
    return response;
  } catch (error) {
    console.error('Error validating region:', error);
    throw new Error(`Failed to validate ${regionType} region: ${regionValue}`);
  }
}

/**
 * Validate cost matrix data
 * @param matrices Array of cost matrices to validate
 * @param includeQualityMetrics Whether to include quality metrics in the results
 * @param detectAnomalies Whether to detect anomalies in the data
 * @returns Validation results
 */
export async function validateCostMatrix(
  matrices: any[],
  includeQualityMetrics = false,
  detectAnomalies = false
): Promise<any> {
  try {
    const response = await apiRequest('/mcp/diagnostic/validate-cost-matrix', {
      method: 'POST',
      body: JSON.stringify({
        matrices,
        includeQualityMetrics,
        detectAnomalies
      })
    });
    return response;
  } catch (error) {
    console.error('Error validating cost matrix:', error);
    throw new Error('Failed to validate cost matrix');
  }
}

/**
 * Analyze cost matrix data quality
 * @param matrices Array of cost matrices to analyze
 * @param detectAnomalies Whether to detect anomalies in the data
 * @returns Analysis results
 */
export async function analyzeCostQuality(
  matrices: any[],
  detectAnomalies = false
): Promise<any> {
  try {
    const response = await apiRequest('/mcp/diagnostic/analyze-cost-quality', {
      method: 'POST',
      body: JSON.stringify({
        matrices,
        detectAnomalies
      })
    });
    return response;
  } catch (error) {
    console.error('Error analyzing cost quality:', error);
    throw new Error('Failed to analyze cost quality');
  }
}