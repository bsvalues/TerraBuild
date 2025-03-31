/**
 * MCP API Routes
 * 
 * This file defines the API routes for accessing MCP functionality in the BCBS application.
 */

import { Express, Request, Response } from 'express';
import { costAnalysisAgent } from './agents/costAnalysisAgent';
import { functionRegistry } from './functions/functionRegistry';
import { CostPredictionRequestSchema } from './schemas/types';

/**
 * Set up MCP API routes
 * 
 * @param app Express application instance
 */
export function setupMCPRoutes(app: Express) {
  // Get available MCP functions
  app.get('/api/mcp/functions', (req: Request, res: Response) => {
    const functions = functionRegistry.getAllFunctions().map(func => ({
      id: func.name,
      description: func.description,
      parameters: func.parameters
    }));
    
    res.json({
      success: true,
      functions
    });
  });
  
  // Get agent information
  app.get('/api/mcp/agents', (req: Request, res: Response) => {
    const agent = costAnalysisAgent.getDefinition();
    
    res.json({
      success: true,
      agents: [agent]
    });
  });
  
  // Predict building cost
  app.post('/api/mcp/predict-cost', async (req: Request, res: Response) => {
    try {
      // Validate request body against schema
      const validationResult = CostPredictionRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }
      
      // Predict building cost using agent
      const result = await costAnalysisAgent.predictBuildingCost(validationResult.data);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error predicting building cost:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to predict building cost'
      });
    }
  });
  
  // Analyze cost matrix
  app.post('/api/mcp/analyze-matrix', async (req: Request, res: Response) => {
    try {
      const { matrixData } = req.body;
      
      if (!matrixData) {
        return res.status(400).json({
          success: false,
          error: 'Matrix data is required'
        });
      }
      
      // Analyze cost matrix using agent
      const result = await costAnalysisAgent.analyzeCostMatrix(matrixData);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error analyzing cost matrix:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze cost matrix'
      });
    }
  });
  
  // Explain calculation
  app.post('/api/mcp/explain-calculation', async (req: Request, res: Response) => {
    try {
      const { calculationData } = req.body;
      
      if (!calculationData) {
        return res.status(400).json({
          success: false,
          error: 'Calculation data is required'
        });
      }
      
      // Generate explanation using agent
      const result = await costAnalysisAgent.explainCalculation(calculationData);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error explaining calculation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to explain calculation'
      });
    }
  });
  
  // Invoke any MCP function directly (for advanced usage)
  app.post('/api/mcp/invoke', async (req: Request, res: Response) => {
    try {
      const { functionId, parameters } = req.body;
      
      if (!functionId) {
        return res.status(400).json({
          success: false,
          error: 'Function ID is required'
        });
      }
      
      // Invoke the function through registry
      const result = await functionRegistry.invokeFunction({
        functionId,
        parameters,
        contextId: req.sessionID,
        callerInfo: {
          sessionId: req.sessionID
        }
      });
      
      res.json(result);
    } catch (error: any) {
      console.error(`Error invoking function:`, error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to invoke function'
      });
    }
  });
}