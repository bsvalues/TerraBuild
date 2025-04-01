/**
 * AI Routes for Cost Prediction
 * 
 * This module defines the API routes for AI-powered cost prediction
 * and other AI-related functionality.
 */

import express from 'express';
import { z } from 'zod';
import { generateCostPrediction, checkOpenAIApiKeyStatus, CostPredictionParams } from '../services/aiService';

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

export default router;