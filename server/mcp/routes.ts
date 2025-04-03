import { Router } from 'express';
import { OpenAI } from 'openai';
import { z } from 'zod';
import anthropicService from './anthropic';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const OPENAI_MODEL = "gpt-4o";

// Available AI providers
const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic'
};

// Create router
const mcpRouter = Router();

// Schema for the enhanced cost prediction request
const enhancedPredictionRequestSchema = z.object({
  buildingType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL']),
  region: z.string(),
  squareFootage: z.number().positive(),
  quality: z.enum(['ECONOMY', 'AVERAGE', 'GOOD', 'PREMIUM', 'LUXURY']),
  buildingAge: z.number().nonnegative(),
  yearBuilt: z.number(),
  complexityFactor: z.number().min(0.5).max(1.5).default(1.0),
  conditionFactor: z.number().min(0.5).max(1.5).default(1.0),
  features: z.array(z.string()).default([]),
  targetYear: z.number().optional(),
  provider: z.enum([AI_PROVIDERS.OPENAI, AI_PROVIDERS.ANTHROPIC]).optional(),
});

// Define the enhanced prediction endpoint
mcpRouter.post('/enhanced-predict-cost', async (req, res) => {
  try {
    // Validate the request body
    const validationResult = enhancedPredictionRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.format(),
      });
    }
    
    const predictionData = validationResult.data;
    
    // Create the prompt for OpenAI
    const prompt = `
    You are an expert building cost estimator for Benton County, Washington. Based on the following information, provide a detailed cost prediction with explanation:
    
    Building Details:
    - Type: ${predictionData.buildingType}
    - Region: ${predictionData.region}
    - Square Footage: ${predictionData.squareFootage}
    - Quality Level: ${predictionData.quality}
    - Year Built: ${predictionData.yearBuilt} (Age: ${predictionData.buildingAge} years)
    - Complexity Factor: ${predictionData.complexityFactor}
    - Condition Factor: ${predictionData.conditionFactor}
    - Special Features: ${predictionData.features.join(', ')}
    ${predictionData.targetYear ? `- Target Year for Prediction: ${predictionData.targetYear}` : ''}
    
    Use the following general cost guidelines:
    - RESIDENTIAL buildings in Washington state typically cost $150-300 per square foot depending on quality.
    - COMMERCIAL buildings typically cost $180-450 per square foot.
    - INDUSTRIAL buildings typically cost $120-350 per square foot.
    
    Your prediction should include:
    1. The total estimated cost
    2. Cost per square foot
    3. A list of key prediction factors with their impact (positive, negative, neutral) and relative importance (as a decimal from 0 to 1)
    4. Short explanations for each factor's impact
    5. Recommendations for 2-3 potential material substitutions that could optimize cost while minimizing quality impact (include potential savings and quality impact rating)
    
    Return the data in JSON format only. No introduction or explanatory text.
    `;
    
    let responseText;
    
    try {
      // Determine which AI provider to use
      const selectedProvider = predictionData.provider || AI_PROVIDERS.OPENAI;
      
      if (selectedProvider === AI_PROVIDERS.ANTHROPIC && process.env.ANTHROPIC_API_KEY) {
        // Use Anthropic Claude for prediction
        try {
          const claudePrediction = await anthropicService.generateBuildingCostPrediction(predictionData);
          return res.json(claudePrediction);
        } catch (claudeError) {
          console.error('Anthropic API error:', claudeError);
          // If Claude fails, try OpenAI as backup if available
          if (process.env.OPENAI_API_KEY) {
            console.log('Falling back to OpenAI after Anthropic failure');
          } else {
            // Both providers failed, use fallback
            throw new Error('All AI providers failed');
          }
        }
      }
      
      // If we're here, either OpenAI was selected or Anthropic failed
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not available');
      }
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { 
            role: "system", 
            content: "You are a building cost estimation AI specialized in Benton County, Washington construction projects. Provide detailed, accurate cost predictions based on building specifications and regional cost data."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });
      
      // Parse the response text as JSON
      responseText = response.choices[0].message.content;
    } catch (apiError) {
      console.error('AI provider error:', apiError);
      
      // Generate fallback prediction without using AI
      // This ensures the application works even when API limits are reached
      const baseRates = {
        RESIDENTIAL: { ECONOMY: 150, AVERAGE: 200, GOOD: 250, PREMIUM: 300, LUXURY: 350 },
        COMMERCIAL: { ECONOMY: 180, AVERAGE: 250, GOOD: 300, PREMIUM: 375, LUXURY: 450 },
        INDUSTRIAL: { ECONOMY: 120, AVERAGE: 175, GOOD: 225, PREMIUM: 275, LUXURY: 350 }
      };
      
      // Calculate base rate
      const baseRate = baseRates[predictionData.buildingType][predictionData.quality];
      
      // Apply adjustments
      const ageAdjustment = 1 - (Math.min(predictionData.buildingAge, 30) * 0.01);
      const regionAdjustment = predictionData.region.toLowerCase().includes('western') ? 1.15 : 1.0;
      const adjustedRate = baseRate * predictionData.complexityFactor * predictionData.conditionFactor * ageAdjustment * regionAdjustment;
      const totalCost = adjustedRate * predictionData.squareFootage;
      
      // Create fallback prediction
      const fallbackPrediction = {
        totalCost: Math.round(totalCost).toLocaleString(),
        costPerSquareFoot: Math.round(adjustedRate),
        predictionFactors: [
          {
            factor: "Building Type",
            impact: "neutral",
            importance: 0.8,
            explanation: `Standard ${predictionData.buildingType.toLowerCase()} building rates applied.`
          },
          {
            factor: "Quality Level",
            impact: "neutral",
            importance: 0.9,
            explanation: `${predictionData.quality} quality level construction.`
          },
          {
            factor: "Region",
            impact: predictionData.region.toLowerCase().includes('western') ? "negative" : "neutral",
            importance: 0.7,
            explanation: predictionData.region.toLowerCase().includes('western') ? "Western regions typically have higher costs." : "Standard regional rates applied."
          },
          {
            factor: "Age",
            impact: predictionData.buildingAge > 20 ? "negative" : "neutral",
            importance: 0.6,
            explanation: `Building age of ${predictionData.buildingAge} years factored into valuation.`
          }
        ],
        materialSubstitutions: [
          {
            originalMaterial: "Premium Flooring",
            substituteMaterial: "Standard Hardwood",
            potentialSavings: "$8,000 - $12,000",
            qualityImpact: "Low"
          },
          {
            originalMaterial: "Custom Lighting",
            substituteMaterial: "Standard LED Fixtures",
            potentialSavings: "$3,000 - $5,000",
            qualityImpact: "Low"
          }
        ],
        note: "This is a fallback prediction as the AI service is temporarily unavailable. For more detailed analysis, please try again later."
      };
      
      return res.json({
        success: true,
        fallback: true,
        ...fallbackPrediction
      });
    }
    
    if (!responseText) {
      throw new Error('Failed to get a response from OpenAI');
    }
    
    try {
      const predictionResult = JSON.parse(responseText);
      
      // Return the prediction result
      return res.json({
        success: true,
        ...predictionResult
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw response:', responseText);
      
      // Attempt to extract useful information even if JSON parsing fails
      return res.status(500).json({
        success: false,
        error: 'Failed to parse prediction result',
        rawResponse: responseText
      });
    }
  } catch (error) {
    console.error('Error in enhanced cost prediction:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// Endpoint to check available AI providers
mcpRouter.get('/providers', (req, res) => {
  const providers = [
    {
      id: AI_PROVIDERS.OPENAI,
      name: 'OpenAI GPT-4o',
      available: !!process.env.OPENAI_API_KEY,
      capabilities: ['Cost Prediction', 'Material Substitution', 'What-If Analysis'],
      default: true
    },
    {
      id: AI_PROVIDERS.ANTHROPIC,
      name: 'Anthropic Claude 3',
      available: !!process.env.ANTHROPIC_API_KEY,
      capabilities: ['Cost Prediction', 'Material Substitution'],
      default: false
    }
  ];
  
  res.json({
    success: true,
    providers,
    defaultProvider: AI_PROVIDERS.OPENAI
  });
});

export default mcpRouter;