/**
 * Advanced Prediction API Routes
 * 
 * Routes for enhanced prediction, feature importance, and what-if analysis
 */

import express from 'express';
import { z } from 'zod';
import { storage } from '../storage-implementation';
import { 
  predictCostWithConfidence,
  getInfluentialFactors,
  performWhatIfAnalysis,
  generateSensitivityAnalysis,
  getModelCrossValidation
} from '../services/advanced-prediction-service';

const router = express.Router();

// Schemas for validating incoming requests
const predictionInputSchema = z.object({
  buildingType: z.string(),
  region: z.string(),
  squareFootage: z.number().positive(),
  quality: z.string().optional(),
  complexity: z.string().optional(),
  year: z.number().optional()
});

const whatIfAnalysisSchema = z.object({
  baseInput: predictionInputSchema,
  variations: z.array(z.object({
    parameter: z.string(),
    values: z.array(z.any())
  }))
});

/**
 * POST /api/ai/predict-cost-advanced
 * 
 * Generate an advanced cost prediction with confidence metrics
 */
router.post('/predict-cost-advanced', async (req, res) => {
  try {
    // Validate request body
    const result = predictionInputSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input parameters',
        details: result.error.errors
      });
    }
    
    // Generate prediction
    const prediction = await predictCostWithConfidence(result.data, storage);
    
    // Log the activity
    await storage.createActivity({
      action: `Advanced cost prediction generated for ${result.data.buildingType} in ${result.data.region}`,
      icon: "ri-line-chart-line",
      iconColor: "primary"
    });
    
    res.json(prediction);
  } catch (error: any) {
    console.error('Error generating advanced prediction:', error);
    res.status(500).json({
      error: 'Failed to generate prediction',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/factor-importance
 * 
 * Get the most influential factors for a building type
 */
router.get('/factor-importance', async (req, res) => {
  try {
    const buildingType = req.query.buildingType as string;
    
    if (!buildingType) {
      return res.status(400).json({
        error: 'Missing parameter',
        message: 'buildingType is required'
      });
    }
    
    const factors = await getInfluentialFactors(buildingType, storage);
    
    res.json(factors);
  } catch (error: any) {
    console.error('Error getting factor importance:', error);
    res.status(500).json({
      error: 'Failed to get factor importance',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/what-if-analysis
 * 
 * Perform what-if analysis by varying input parameters
 */
router.post('/what-if-analysis', async (req, res) => {
  try {
    // Validate request body
    const result = whatIfAnalysisSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input parameters',
        details: result.error.errors
      });
    }
    
    const analysis = await performWhatIfAnalysis(
      result.data.baseInput,
      result.data.variations,
      storage
    );
    
    // Log the activity
    await storage.createActivity({
      action: `What-if analysis performed for ${result.data.baseInput.buildingType}`,
      icon: "ri-dashboard-line",
      iconColor: "primary"
    });
    
    res.json(analysis);
  } catch (error: any) {
    console.error('Error performing what-if analysis:', error);
    res.status(500).json({
      error: 'Failed to perform what-if analysis',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/sensitivity-analysis
 * 
 * Generate sensitivity analysis for input parameters
 */
router.post('/sensitivity-analysis', async (req, res) => {
  try {
    // Validate request body
    const result = predictionInputSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input parameters',
        details: result.error.errors
      });
    }
    
    const analysis = await generateSensitivityAnalysis(result.data, storage);
    
    res.json(analysis);
  } catch (error: any) {
    console.error('Error generating sensitivity analysis:', error);
    res.status(500).json({
      error: 'Failed to generate sensitivity analysis',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/model-validation
 * 
 * Get cross-validation metrics for the prediction model
 */
router.get('/model-validation', async (req, res) => {
  try {
    const validation = await getModelCrossValidation(storage);
    res.json(validation);
  } catch (error: any) {
    console.error('Error getting model validation:', error);
    res.status(500).json({
      error: 'Failed to get model validation',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/validate-prediction
 * 
 * Validate a prediction against historical data
 */
router.post('/validate-prediction', async (req, res) => {
  try {
    const { prediction, input } = req.body;
    
    if (!prediction || !input) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Both prediction and input are required'
      });
    }
    
    // In a real implementation, this would compare the prediction to historical data
    // For this demo, we'll return a simulated validation result
    
    const similarCases = Math.floor(Math.random() * 20) + 5; // 5-25 similar cases
    const validationScore = 0.7 + (Math.random() * 0.2); // 0.7-0.9
    const historicalDeviation = Math.random() * 0.15; // 0-15% deviation
    
    const recommendations = [];
    
    if (historicalDeviation > 0.1) {
      recommendations.push('Consider refining your input parameters, as this prediction deviates from historical data');
    }
    
    if (similarCases < 10) {
      recommendations.push('Limited historical data is available for this case. Consider using a broader range of inputs.');
    }
    
    if (validationScore < 0.8) {
      recommendations.push('This prediction has moderate uncertainty. Consider examining the confidence intervals.');
    }
    
    res.json({
      validationScore,
      similarCases,
      historicalDeviation,
      recommendations
    });
  } catch (error: any) {
    console.error('Error validating prediction:', error);
    res.status(500).json({
      error: 'Failed to validate prediction',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;