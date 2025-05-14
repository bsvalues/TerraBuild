/**
 * MCP Diagnostic Routes
 * 
 * Routes for debugging and diagnosing issues with the MCP framework
 */

import express from 'express';
import { agentRegistry } from '../agent-registry';
import { eventBus } from '../event-bus';
import { v4 as uuidv4 } from 'uuid';
import { dataQualityAgent } from '../agents/dataQualityAgent';

const router = express.Router();

// GET /api/mcp/diagnostic/registry - Get the current agent registry state
router.get('/registry', (req, res) => {
  try {
    const allAgents = agentRegistry.getAllAgents();
    const allIds = agentRegistry.getAllAgentIds();
    
    // Try to fetch specific agents
    const targetIds = ['data-quality-agent', 'compliance-agent', 'cost-analysis-agent'];
    const targetAgents = targetIds.map(id => {
      const agent = agentRegistry.getAgent(id);
      return {
        id,
        found: !!agent,
        agent: agent ? {
          id: agent.id,
          name: agent.name,
          status: agent.status
        } : null
      };
    });
    
    res.json({
      success: true,
      registry: {
        totalAgents: allAgents.length,
        allIds: allIds,
        specificAgents: targetAgents
      }
    });
  } catch (error) {
    console.error('Error in registry diagnostic:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching registry diagnostic information',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /api/mcp/diagnostic/validate-region - Test the region validation feature
router.post('/validate-region', (req, res) => {
  try {
    const { regionValue, regionType } = req.body;
    
    if (!regionValue || !regionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Both regionValue and regionType are required'
      });
    }
    
    // Check if this is a valid region type
    if (!['city', 'tca', 'hood_code', 'township_range'].includes(regionType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid region type',
        message: 'Region type must be one of: city, tca, hood_code, township_range'
      });
    }
    
    // Use the data quality agent to validate the region
    const validationResult = dataQualityAgent.validateRegion(regionValue, regionType as any);
    
    return res.json({
      success: true,
      validation: validationResult,
      region: {
        value: regionValue,
        type: regionType
      }
    });
  } catch (error: any) {
    console.error('Error in region validation diagnostic:', error);
    res.status(500).json({
      success: false,
      error: 'Error validating region',
      message: error?.message || String(error)
    });
  }
});

// POST /api/mcp/diagnostic/validate-cost-matrix - Test cost matrix validation
router.post('/validate-cost-matrix', (req, res) => {
  try {
    const { matrices, includeQualityMetrics = false, detectAnomalies = false } = req.body;
    
    if (!matrices || !Array.isArray(matrices)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid matrices',
        message: 'The request must include an array of matrices'
      });
    }
    
    // Create an event ID
    const requestId = uuidv4();
    
    // Store the result promise so we can await it
    let resultPromise: Promise<any>;
    
    // Set up a one-time event listener for the response
    resultPromise = new Promise((resolve) => {
      const completedHandler = (event: any) => {
        if (event.payload?.requestId === requestId) {
          resolve(event.payload.result);
          eventBus.unsubscribe('data:validate:completed', completedHandler);
          eventBus.unsubscribe('data:validate:failed', failedHandler);
        }
      };
      
      const failedHandler = (event: any) => {
        if (event.payload?.requestId === requestId) {
          resolve({ success: false, error: event.payload.error });
          eventBus.unsubscribe('data:validate:completed', completedHandler);
          eventBus.unsubscribe('data:validate:failed', failedHandler);
        }
      };
      
      eventBus.subscribe('data:validate:completed', completedHandler);
      eventBus.subscribe('data:validate:failed', failedHandler);
      
      // Publish the validation request
      eventBus.publish('data:validate:request', {
        id: requestId,
        type: 'cost_matrix',
        matrices,
        includeQualityMetrics,
        detectAnomalies
      });
    });
    
    // Wait for the result and send the response
    resultPromise.then(result => {
      res.json({
        success: true,
        validation: result
      });
    }).catch(error => {
      console.error('Error in cost matrix validation diagnostic:', error);
      res.status(500).json({
        success: false,
        error: 'Error validating cost matrix',
        message: error?.message || String(error)
      });
    });
  } catch (error: any) {
    console.error('Error in cost matrix validation diagnostic:', error);
    res.status(500).json({
      success: false,
      error: 'Error validating cost matrix',
      message: error?.message || String(error)
    });
  }
});

// POST /api/mcp/diagnostic/analyze-cost-quality - Test cost quality analysis
router.post('/analyze-cost-quality', (req, res) => {
  try {
    const { matrices, detectAnomalies = false } = req.body;
    
    if (!matrices || !Array.isArray(matrices)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid matrices',
        message: 'The request must include an array of matrices'
      });
    }
    
    // Create an event ID
    const requestId = uuidv4();
    
    // Store the result promise so we can await it
    let resultPromise: Promise<any>;
    
    // Set up a one-time event listener for the response
    resultPromise = new Promise((resolve) => {
      const completedHandler = (event: any) => {
        if (event.payload?.requestId === requestId) {
          resolve(event.payload.result);
          eventBus.unsubscribe('data:analyze:quality:completed', completedHandler);
          eventBus.unsubscribe('data:analyze:quality:failed', failedHandler);
        }
      };
      
      const failedHandler = (event: any) => {
        if (event.payload?.requestId === requestId) {
          resolve({ success: false, error: event.payload.error });
          eventBus.unsubscribe('data:analyze:quality:completed', completedHandler);
          eventBus.unsubscribe('data:analyze:quality:failed', failedHandler);
        }
      };
      
      eventBus.subscribe('data:analyze:quality:completed', completedHandler);
      eventBus.subscribe('data:analyze:quality:failed', failedHandler);
      
      // Publish the analysis request
      eventBus.publish('data:analyze:quality:request', {
        id: requestId,
        type: 'cost_matrix',
        matrices,
        detectAnomalies
      });
    });
    
    // Wait for the result and send the response
    resultPromise.then(result => {
      res.json({
        success: true,
        analysis: result
      });
    }).catch(error => {
      console.error('Error in cost quality analysis diagnostic:', error);
      res.status(500).json({
        success: false,
        error: 'Error analyzing cost quality',
        message: error?.message || String(error)
      });
    });
  } catch (error: any) {
    console.error('Error in cost quality analysis diagnostic:', error);
    res.status(500).json({
      success: false,
      error: 'Error analyzing cost quality',
      message: error?.message || String(error)
    });
  }
});

export default router;