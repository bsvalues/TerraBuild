/**
 * Model Content Protocol (MCP) Routes
 * 
 * This module sets up the API routes for the Model Content Protocol integration,
 * which provides AI-powered building cost predictions, analytics, and explanations.
 */

import type { Express, Request, Response } from "express";
import { costPredictionAgent, matrixAnalysisAgent, calculationExplanationAgent } from "./index";
import { costPredictionRequestSchema } from "./index";
import { z } from "zod";
import predictionEngine, { costPredictionInputSchema } from "../ai/predictionEngine";

// Schema for enhanced AI cost prediction request
export const enhancedCostPredictionRequestSchema = costPredictionInputSchema;

// Schema for matrix analysis request
const matrixAnalysisRequestSchema = z.object({
  matrixData: z.any()
});

// Schema for calculation explanation request
const calculationExplanationRequestSchema = z.object({
  calculationData: z.any()
});

/**
 * Setup MCP routes
 * 
 * @param app Express application
 */
export function setupMCPRoutes(app: Express) {
  // Prediction route
  app.post("/api/mcp/predict-cost", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const data = costPredictionRequestSchema.parse(req.body);
      
      // Call the cost prediction agent
      const result = await costPredictionAgent(data);
      
      res.json(result);
    } catch (error) {
      console.error("Error in cost prediction:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          error: "Error processing request",
          message: (error as Error).message
        });
      }
    }
  });
  
  // Analysis route
  app.post("/api/mcp/analyze-matrix", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const { matrixData } = matrixAnalysisRequestSchema.parse(req.body);
      
      // Call the matrix analysis agent
      const result = await matrixAnalysisAgent(matrixData);
      
      res.json(result);
    } catch (error) {
      console.error("Error in matrix analysis:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          error: "Error processing request",
          message: (error as Error).message
        });
      }
    }
  });
  
  // Explanation route
  app.post("/api/mcp/explain-calculation", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const { calculationData } = calculationExplanationRequestSchema.parse(req.body);
      
      // Call the calculation explanation agent
      const result = await calculationExplanationAgent(calculationData);
      
      res.json(result);
    } catch (error) {
      console.error("Error in calculation explanation:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          error: "Error processing request",
          message: (error as Error).message
        });
      }
    }
  });
  
  // Enhanced AI Cost Prediction route
  app.post("/api/mcp/enhanced-predict-cost", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const data = enhancedCostPredictionRequestSchema.parse(req.body);
      
      // Call the enhanced prediction engine
      const result = await predictionEngine.generateCostPrediction(
        data.buildingType,
        data.region,
        data.year,
        {
          squareFootage: data.squareFootage,
          complexity: data.complexity,
          condition: data.condition,
          features: data.features
        }
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error in enhanced cost prediction:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          error: "Error processing request",
          message: (error as Error).message
        });
      }
    }
  });
  
  // AI engine connection test route
  app.get("/api/mcp/test-connection", async (req: Request, res: Response) => {
    try {
      const connectionStatus = await predictionEngine.testConnection();
      res.json(connectionStatus);
    } catch (error) {
      console.error("Error in connection test:", error);
      res.status(500).json({ 
        status: "error",
        message: (error as Error).message
      });
    }
  });

  // MCP status route - useful for checking if MCP is working
  app.get("/api/mcp/status", async (req: Request, res: Response) => {
    try {
      // Check if OpenAI API key is configured
      const hasApiKey = !!process.env.OPENAI_API_KEY;
      
      res.json({
        status: hasApiKey ? "ready" : "api_key_missing",
        message: hasApiKey 
          ? "MCP is ready to use" 
          : "OpenAI API key not configured. Set OPENAI_API_KEY in environment variables."
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error",
        message: (error as Error).message
      });
    }
  });
}