/**
 * AI Routes for Cost Prediction
 * 
 * This module defines the API routes for AI-powered cost prediction
 * and other AI-related functionality.
 */

import express from 'express';
import { z } from 'zod';
import { 
  generateCostPrediction, 
  checkOpenAIApiKeyStatus, 
  clearAICache,
  CostPredictionParams 
} from '../services/aiService';
import { processNaturalLanguageQuery } from '../services/nlp-service';
import { storage } from '../storage';

const router = express.Router();

/**
 * POST /api/ai/predict-cost
 * 
 * Generate a cost prediction using the AI service
 */
router.post('/predict-cost', async (req, res) => {
  try {
    // Validate request data
    const schema = z.object({
      buildingType: z.string(),
      region: z.string(),
      targetYear: z.number().int().min(2023).max(2050),
      squareFootage: z.number().optional(),
      selectedFactors: z.array(z.string()).optional(),
      forceRefresh: z.boolean().optional(),
    });

    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: result.error.errors
      });
    }

    const params: CostPredictionParams = result.data;
    const prediction = await generateCostPrediction(params);
    
    res.json(prediction);
  } catch (error: any) {
    console.error('Error generating cost prediction:', error);
    res.status(500).json({
      error: 'Failed to generate cost prediction',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/openai-status
 * 
 * Check if OpenAI API key is configured
 */
router.get('/openai-status', async (req, res) => {
  try {
    const status = await checkOpenAIApiKeyStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to check OpenAI API key status',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/clear-cache
 * 
 * Clear the AI prediction cache
 * Requires admin permission in a production environment
 */
router.post('/clear-cache', async (req, res) => {
  try {
    // In a production environment, this would check for admin permissions
    // For now, we'll allow it in development mode
    clearAICache();
    
    res.json({
      success: true,
      message: 'AI prediction cache cleared successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to clear AI cache',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/nlp/query
 * 
 * Process a natural language query about building costs
 */
router.post('/nlp/query', async (req, res) => {
  try {
    // Validate request data
    const schema = z.object({
      query: z.string().min(1, "Query is required"),
      filters: z.record(z.any()).nullable().optional(),
    });

    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: result.error.errors
      });
    }

    const { query, filters } = result.data;
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'The OpenAI API key is missing. Please configure it in the environment variables.'
      });
    }
    
    // Process the natural language query
    const queryResult = await processNaturalLanguageQuery(query, filters || null, storage);
    
    // Log the activity
    await storage.createActivity({
      action: `Natural language query processed: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`,
      icon: "ri-chat-3-line",
      iconColor: "primary",
    });
    
    res.json(queryResult);
  } catch (error: any) {
    console.error('Error processing natural language query:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;