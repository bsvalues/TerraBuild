import { Router } from 'express';
import { OpenAI } from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const OPENAI_MODEL = "gpt-4o";

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
    const responseText = response.choices[0].message.content;
    
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

export default mcpRouter;