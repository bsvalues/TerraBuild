/**
 * MCP Agent Test Cases
 * 
 * This module defines common test cases for the MCP agent testing framework.
 */

import { v4 as uuidv4 } from 'uuid';
import { TestCase } from './agent-testing';
import { agentTesting } from './agent-testing';
import { MessageType } from '../agent-communication';

// Sample property data for testing
const sampleProperty = {
  id: 'TEST-PROP-001',
  address: '123 Main St, Richland, WA 99352',
  type: 'residential',
  value: 350000,
  year_built: 1985,
  sqft: 2800,
  lot_size: 0.35,
  bedrooms: 4,
  bathrooms: 2.5,
  features: ['garage', 'fireplace', 'deck']
};

// Sample assessment data for testing
const sampleAssessment = {
  id: 'TEST-ASMT-001',
  property_id: 'TEST-PROP-001',
  date: '2025-01-15',
  assessor: 'John Doe',
  method: 'cost',
  classification: 'residential',
  land_value: 120000,
  building_value: 230000,
  total_value: 350000,
  notes: 'Standard annual assessment'
};

// Sample building cost data for testing
const sampleBuildingCost = {
  buildingType: 'residential',
  squareFeet: 2800,
  region: 'Richland',
  quality: 'average',
  yearBuilt: 1985,
  features: ['garage', 'fireplace', 'deck']
};

/**
 * Common test cases for the Data Quality Agent
 */
export const dataQualityTestCases: TestCase[] = [
  {
    id: uuidv4(),
    description: 'Data Quality Agent should validate complete property data',
    testFn: async (agentId) => {
      return agentTesting.testAgentResponse(
        agentId,
        MessageType.REQUEST,
        'data:validate:request',
        { 
          properties: [sampleProperty]
        },
        {
          validateFn: (response) => {
            // Valid property should pass validation
            return response && response.success === true;
          }
        }
      );
    }
  },
  {
    id: uuidv4(),
    description: 'Data Quality Agent should identify missing fields',
    testFn: async (agentId) => {
      const incompleteProperty = { ...sampleProperty };
      delete incompleteProperty.address;
      delete incompleteProperty.year_built;
      
      return agentTesting.testAgentResponse(
        agentId,
        MessageType.REQUEST,
        'data:validate:request',
        { 
          properties: [incompleteProperty]
        },
        {
          validateFn: (response) => {
            // Should flag the missing fields
            return (
              response && 
              response.success === false && 
              Array.isArray(response.issues) && 
              response.issues.length > 0
            );
          }
        }
      );
    }
  },
  {
    id: uuidv4(),
    description: 'Data Quality Agent should analyze data quality metrics',
    testFn: async (agentId) => {
      return agentTesting.testAgentResponse(
        agentId,
        MessageType.REQUEST,
        'data:analyze:quality:request',
        { 
          properties: [
            sampleProperty,
            { ...sampleProperty, id: 'TEST-PROP-002', address: null },
            { ...sampleProperty, id: 'TEST-PROP-003' }
          ]
        },
        {
          validateFn: (response) => {
            // Should provide quality metrics
            return (
              response && 
              response.success === true && 
              response.metrics && 
              typeof response.metrics.completeness === 'number' &&
              typeof response.metrics.consistency === 'number' &&
              Array.isArray(response.recommendations)
            );
          }
        }
      );
    }
  }
];

/**
 * Common test cases for the Compliance Agent
 */
export const complianceTestCases: TestCase[] = [
  {
    id: uuidv4(),
    description: 'Compliance Agent should validate compliant assessment data',
    testFn: async (agentId) => {
      return agentTesting.testAgentResponse(
        agentId,
        MessageType.REQUEST,
        'compliance:validate:request',
        { 
          assessments: [sampleAssessment]
        },
        {
          validateFn: (response) => {
            // Valid assessment should pass validation
            return (
              response && 
              response.success === true && 
              Array.isArray(response.complianceIssues) && 
              response.complianceIssues.length === 0
            );
          }
        }
      );
    }
  },
  {
    id: uuidv4(),
    description: 'Compliance Agent should identify non-compliant assessment methods',
    testFn: async (agentId) => {
      const nonCompliantAssessment = { ...sampleAssessment, method: 'nonstandard' };
      
      return agentTesting.testAgentResponse(
        agentId,
        MessageType.REQUEST,
        'compliance:validate:request',
        { 
          assessments: [nonCompliantAssessment]
        },
        {
          validateFn: (response) => {
            // Should flag the non-compliant method
            return (
              response && 
              response.success === false && 
              Array.isArray(response.complianceIssues) && 
              response.complianceIssues.length > 0 &&
              response.complianceIssues.some(issue => 
                issue.category === 'assessment_method' && 
                issue.severity === 'error'
              )
            );
          }
        }
      );
    }
  },
  {
    id: uuidv4(),
    description: 'Compliance Agent should check specific regulations',
    testFn: async (agentId) => {
      return agentTesting.testAgentResponse(
        agentId,
        MessageType.REQUEST,
        'compliance:check:regulations:request',
        { 
          regulation: 'property_tax_assessment',
          data: {
            assessments: [sampleAssessment]
          }
        },
        {
          validateFn: (response) => {
            // Should provide specific regulation check results
            return (
              response && 
              response.success === true && 
              Array.isArray(response.checkResults) && 
              response.checkResults.length > 0 &&
              response.checkResults.some(result => 
                result.regulation && 
                result.status
              )
            );
          }
        }
      );
    }
  }
];

/**
 * Common test cases for the Cost Analysis Agent
 */
export const costAnalysisTestCases: TestCase[] = [
  {
    id: uuidv4(),
    description: 'Cost Analysis Agent should estimate building costs',
    testFn: async (agentId) => {
      return agentTesting.testAgentResponse(
        agentId,
        MessageType.REQUEST,
        'cost:estimate:request',
        sampleBuildingCost,
        {
          validateFn: (response) => {
            // Should provide cost estimate
            return (
              response && 
              response.success === true && 
              response.estimate && 
              typeof response.estimate.cost === 'number' &&
              typeof response.estimate.confidenceLevel === 'string' &&
              response.estimate.range &&
              typeof response.estimate.range.min === 'number' &&
              typeof response.estimate.range.max === 'number'
            );
          }
        }
      );
    }
  },
  {
    id: uuidv4(),
    description: 'Cost Analysis Agent should analyze cost data',
    testFn: async (agentId) => {
      return agentTesting.testAgentResponse(
        agentId,
        MessageType.REQUEST,
        'cost:analyze:request',
        { 
          costs: [
            { id: 'COST-001', type: 'residential', value: 125, region: 'Richland' },
            { id: 'COST-002', type: 'residential', value: 135, region: 'Kennewick' },
            { id: 'COST-003', type: 'residential', value: 120, region: 'Pasco' }
          ]
        },
        {
          validateFn: (response) => {
            // Should provide cost analysis
            return (
              response && 
              response.success === true && 
              response.metrics && 
              typeof response.metrics.averageCost === 'number' &&
              typeof response.metrics.medianCost === 'number' &&
              typeof response.metrics.minCost === 'number' &&
              typeof response.metrics.maxCost === 'number'
            );
          }
        }
      );
    }
  },
  {
    id: uuidv4(),
    description: 'Cost Analysis Agent should compare costs',
    testFn: async (agentId) => {
      return agentTesting.testAgentResponse(
        agentId,
        MessageType.REQUEST,
        'cost:compare:request',
        { 
          items: [
            { name: 'Richland Standard', cost: 350000, source: 'cost_matrix' },
            { name: 'Kennewick Standard', cost: 375000, source: 'cost_matrix' },
            { name: 'Pasco Standard', cost: 325000, source: 'cost_matrix' }
          ]
        },
        {
          validateFn: (response) => {
            // Should provide cost comparison
            return (
              response && 
              response.success === true && 
              Array.isArray(response.items) && 
              response.items.length === 3 &&
              response.differences &&
              typeof response.differences.percentage === 'number' &&
              typeof response.differences.absolute === 'number' &&
              Array.isArray(response.recommendations)
            );
          }
        }
      );
    }
  }
];