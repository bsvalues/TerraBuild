/**
 * AI Service for Cost Prediction
 * 
 * This service is responsible for communicating with OpenAI API
 * to generate intelligent cost predictions based on historical data
 * and market trends.
 */

import { OpenAI } from 'openai';
import { storage } from '../storage';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CostPredictionParams {
  buildingType: string;
  region: string;
  targetYear: number;
  squareFootage?: number;
  selectedFactors?: string[];
}

export interface CostPredictionResult {
  predictedCost: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  factors: Array<{
    name: string;
    impact: 'low' | 'medium' | 'high';
    description: string;
  }>;
  summary: string;
  error?: string;
}

/**
 * Generates a cost prediction using OpenAI API
 * 
 * @param params Parameters for cost prediction
 * @returns Prediction result with cost and confidence interval
 */
export async function generateCostPrediction(
  params: CostPredictionParams
): Promise<CostPredictionResult> {
  try {
    // Check if OpenAI API key is configured
    const apiKeyStatus = await checkOpenAIApiKeyStatus();
    if (!apiKeyStatus.configured) {
      return {
        predictedCost: 0,
        confidenceInterval: { lower: 0, upper: 0 },
        factors: [],
        summary: "OpenAI API key is not configured",
        error: "OpenAI API key is not configured"
      };
    }

    // Get historical cost data to provide context for the AI
    const historicalData = await fetchHistoricalData(params.buildingType, params.region);

    // Create the prompt with detailed context
    const prompt = createPredictionPrompt(params, historicalData);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a specialized construction cost prediction AI assistant for Benton County, Washington. 
          Your task is to predict building costs based on historical data, current trends, and economic factors.
          Respond ONLY with valid JSON containing the prediction details as specified.`
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Lower temperature for more deterministic results
    });

    // Parse the response
    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("Empty response from OpenAI API");
    }

    const response = JSON.parse(responseText);
    
    return {
      predictedCost: Number(response.predictedCost),
      confidenceInterval: {
        lower: Number(response.confidenceInterval.lower),
        upper: Number(response.confidenceInterval.upper)
      },
      factors: response.factors,
      summary: response.summary
    };
  } catch (error: any) {
    console.error("Error generating cost prediction:", error);
    return {
      predictedCost: 0,
      confidenceInterval: { lower: 0, upper: 0 },
      factors: [],
      summary: "An error occurred while generating the prediction",
      error: error.message || "Unknown error"
    };
  }
}

/**
 * Fetch historical cost data for a building type and region
 * 
 * @param buildingType Type of building
 * @param region Geographic region
 * @returns Array of historical cost entries
 */
async function fetchHistoricalData(buildingType: string, region: string) {
  try {
    // Get cost factors for the specified region and building type
    const costFactor = await storage.getCostFactorsByRegionAndType(region, buildingType);
    
    // Get all building costs
    const allBuildingCosts = await storage.getAllBuildingCosts();
    
    // Filter building costs by region and type
    const buildingCosts = allBuildingCosts.filter(cost => 
      cost.region === region && cost.buildingType === buildingType
    );
    
    // For now, use cost factors as a fallback for matrix data
    const matrixEntries = costFactor ? [costFactor] : [];
    
    return {
      costFactor,
      buildingCosts,
      matrixEntries
    };
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return {
      costFactor: null,
      buildingCosts: [],
      matrixEntries: []
    };
  }
}

/**
 * Create a detailed prompt for OpenAI with context data
 * 
 * @param params Prediction parameters
 * @param historicalData Historical cost data
 * @returns Formatted prompt string
 */
function createPredictionPrompt(
  params: CostPredictionParams,
  historicalData: any
): string {
  // Format the historical data for the prompt
  const matrixEntriesJson = JSON.stringify(historicalData.matrixEntries, null, 2);
  const buildingCostsJson = JSON.stringify(historicalData.buildingCosts, null, 2);
  
  // Calculate years difference for projection
  const currentYear = new Date().getFullYear();
  const yearsDifference = params.targetYear - currentYear;
  
  return `
    I need a detailed building cost prediction for the following parameters:
    
    - Building Type: ${params.buildingType}
    - Region: ${params.region}
    - Target Year: ${params.targetYear} (${yearsDifference} years from now)
    ${params.squareFootage ? `- Square Footage: ${params.squareFootage}` : ''}
    ${params.selectedFactors && params.selectedFactors.length > 0 ? 
      `- Selected Factors: ${params.selectedFactors.join(', ')}` : ''}
    
    Here is the historical cost matrix data:
    ${matrixEntriesJson}
    
    And here are past building cost calculations:
    ${buildingCostsJson}
    
    Please provide a cost prediction in the following JSON format:
    {
      "predictedCost": number,
      "confidenceInterval": {
        "lower": number,
        "upper": number
      },
      "factors": [
        {
          "name": "string",
          "impact": "low|medium|high",
          "description": "string"
        }
      ],
      "summary": "string"
    }
    
    The prediction should take into account:
    1. Historical trends
    2. Regional economic factors
    3. Building type specifics
    4. Current construction market conditions
    5. Inflation and cost of materials over time
  `;
}

/**
 * Check if OpenAI API key is configured
 * 
 * @returns Object with status of the API key
 */
export async function checkOpenAIApiKeyStatus() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  return {
    configured: !!apiKey && apiKey.startsWith('sk-'),
    message: apiKey 
      ? apiKey.startsWith('sk-') 
        ? 'OpenAI API key is configured' 
        : 'OpenAI API key is invalid' 
      : 'OpenAI API key is not configured'
  };
}