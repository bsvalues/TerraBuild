/**
 * AI Prediction Engine
 * 
 * This module provides AI-powered cost prediction capabilities using the OpenAI API
 * through the Model Content Protocol (MCP) framework.
 */

import OpenAI from 'openai';
import { z } from 'zod';
import NodeCache from 'node-cache';

// Cache for storing prediction results
const predictionCache = new NodeCache({ 
  stdTTL: 3600, // Cache expires after 1 hour
  checkperiod: 600 // Check for expired entries every 10 minutes
});

// OpenAI client is initialized in MCP module
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error);
}

// Schema for cost prediction input
export const costPredictionInputSchema = z.object({
  buildingType: z.string(),
  region: z.string(),
  year: z.number().int().positive(),
  squareFootage: z.number().positive().optional(),
  complexity: z.number().min(0).max(10).optional(),
  condition: z.string().optional(),
  features: z.array(z.string()).optional()
});

export type CostPredictionInput = z.infer<typeof costPredictionInputSchema>;

// Schema for cost prediction output
export const costPredictionOutputSchema = z.object({
  predictedCost: z.number().positive(),
  confidenceInterval: z.tuple([z.number(), z.number()]).optional(),
  factors: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  timestamp: z.string()
});

export type CostPredictionOutput = z.infer<typeof costPredictionOutputSchema>;

/**
 * Test connection to OpenAI API
 * 
 * @returns Connection status
 */
export async function testConnection() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { status: 'not_configured', message: 'API key not configured' };
    }
    
    // Make a simple API call to test the connection
    await openai.models.list();
    
    return { status: 'connected', message: 'Successfully connected to OpenAI API' };
  } catch (error) {
    console.error("OpenAI API connection test failed:", error);
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate a building cost prediction using AI
 * 
 * @param buildingType Type of building
 * @param region Geographic region
 * @param year Year for prediction
 * @param options Additional prediction options
 * @returns Prediction result
 */
export async function generateCostPrediction(
  buildingType: string,
  region: string,
  year: number,
  options: Partial<CostPredictionInput> = {}
): Promise<CostPredictionOutput | { error: { message: string } }> {
  try {
    // Validate input parameters
    const validationResult = costPredictionInputSchema.safeParse({
      buildingType,
      region,
      year,
      ...options
    });
    
    if (!validationResult.success) {
      return {
        error: {
          message: `Invalid input parameters: ${validationResult.error.message}`
        }
      };
    }
    
    const input = validationResult.data;
    
    // Generate cache key based on input parameters
    const cacheKey = `prediction_${input.buildingType}_${input.region}_${input.year}_${JSON.stringify(options)}`;
    
    // Check if prediction is in cache
    const cachedPrediction = predictionCache.get<CostPredictionOutput>(cacheKey);
    if (cachedPrediction) {
      return cachedPrediction;
    }
    
    // Make sure OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return {
        error: {
          message: 'OpenAI API key not configured'
        }
      };
    }
    
    // Get contextual information about building costs
    // In a real implementation, this would come from database queries
    const contextInfo = {
      currentYear: new Date().getFullYear(),
      inflationRate: 2.5, // Example inflation rate
      regionalFactors: {
        "Benton County": 1.0,
        "Franklin County": 0.95,
        "Yakima County": 0.92,
        "Grant County": 0.88,
        "Adams County": 0.85,
        "Walla Walla County": 0.97,
        "Other": 0.9
      },
      buildingTypeFactors: {
        "RESIDENTIAL": 1.0,
        "COMMERCIAL": 1.2,
        "INDUSTRIAL": 1.15,
        "AGRICULTURAL": 0.8,
        "OTHER": 1.0
      },
      // Add more contextual information as needed
    };
    
    // Construct prompt for the AI model
    const userMessage = `
      I need a building cost prediction with the following parameters:
      
      Building Type: ${input.buildingType}
      Region: ${input.region}
      Year: ${input.year}
      ${input.squareFootage ? `Square Footage: ${input.squareFootage}` : ''}
      ${input.complexity ? `Complexity Factor: ${input.complexity}/10` : ''}
      ${input.condition ? `Building Condition: ${input.condition}` : ''}
      ${input.features && input.features.length > 0 
        ? `Special Features: ${input.features.join(', ')}` 
        : ''}
      
      Please provide:
      1. Predicted cost per square foot (in USD)
      2. A confidence interval for the prediction
      3. Key factors affecting this prediction
      4. A brief explanation of the prediction
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert building cost estimator with detailed knowledge of 
                    construction costs in Washington state. You will receive building details 
                    and provide precise cost predictions based on the Benton County Cost Matrix data.
                    Your predictions should be data-driven, realistic and account for regional variations,
                    building types, and economic factors.
                    
                    Current context: ${JSON.stringify(contextInfo)}`
        },
        { role: "user", content: userMessage }
      ],
      temperature: 0.3, // Lower temperature for more consistent predictions
      max_tokens: 1000,
    });
    
    // Extract the AI's response
    const aiResponse = response.choices[0].message.content;
    
    if (!aiResponse) {
      throw new Error('Received empty response from OpenAI API');
    }
    
    // Parse the AI's response to extract structured data
    const costMatch = aiResponse.match(/\$?([\d,]+\.?\d*)/);
    const confidenceMatch = aiResponse.match(/confidence interval:?\s*\$?([\d,]+\.?\d*)\s*-\s*\$?([\d,]+\.?\d*)/i);
    
    if (!costMatch) {
      throw new Error('Could not extract predicted cost from AI response');
    }
    
    // Extract factors affecting the prediction
    const factorsMatch = aiResponse.match(/factors?:?\s*(.+?)(?:\n|$)/i);
    const factors = factorsMatch 
      ? factorsMatch[1].split(/,|;/).map(factor => factor.trim())
      : [];
    
    // Parse numbers and create structured output
    const predictedCost = parseFloat(costMatch[1].replace(/,/g, ''));
    
    const prediction: CostPredictionOutput = {
      predictedCost,
      confidenceInterval: confidenceMatch 
        ? [
            parseFloat(confidenceMatch[1].replace(/,/g, '')), 
            parseFloat(confidenceMatch[2].replace(/,/g, ''))
          ] 
        : undefined,
      factors,
      explanation: aiResponse,
      timestamp: new Date().toISOString()
    };
    
    // Cache the prediction result
    predictionCache.set(cacheKey, prediction);
    
    return prediction;
    
  } catch (error) {
    console.error("Error generating cost prediction:", error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred during prediction'
      }
    };
  }
}

/**
 * Clear the prediction cache
 */
export function clearPredictionCache() {
  predictionCache.flushAll();
}

export default {
  testConnection,
  generateCostPrediction,
  clearPredictionCache
};