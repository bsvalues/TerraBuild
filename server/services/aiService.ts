/**
 * AI Service for Cost Prediction
 * 
 * This service is responsible for communicating with OpenAI API
 * to generate intelligent cost predictions based on historical data
 * and market trends.
 * 
 * Features:
 * - Request caching to reduce API calls
 * - Retry logic with exponential backoff
 * - Optimized prompts for better results and reduced token usage
 */

import { OpenAI } from 'openai';
import { storage } from '../storage';
import NodeCache from 'node-cache';

// Initialize request cache
const aiCache = new NodeCache({
  stdTTL: 3600, // Default TTL is 1 hour
  checkperiod: 600, // Check for expired entries every 10 minutes
  useClones: false // Use references instead of clones for better performance
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  backoffFactor: 2, // Double the delay each time
  // HTTP status codes that should trigger a retry
  retryableStatusCodes: [429, 500, 502, 503, 504]
};

export interface CostPredictionParams {
  buildingType: string;
  region: string;
  targetYear: number;
  squareFootage?: number;
  selectedFactors?: string[];
  forceRefresh?: boolean; // Skip cache if true
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
 * Enhanced with caching and retry logic to improve reliability
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

    // Generate cache key from parameters
    const cacheKey = generateCacheKey(params);
    
    // Check cache first (unless forceRefresh is true)
    if (!params.forceRefresh) {
      const cachedResult = aiCache.get<CostPredictionResult>(cacheKey);
      if (cachedResult) {
        console.log(`Using cached prediction for ${params.buildingType} in ${params.region}`);
        return cachedResult;
      }
    }

    // Get historical cost data to provide context for the AI
    const historicalData = await fetchHistoricalData(params.buildingType, params.region);

    // Create the optimized prompt with detailed context
    const prompt = createPredictionPrompt(params, historicalData);

    // Call OpenAI API with retry logic
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
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
    });

    // Parse the response
    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("Empty response from OpenAI API");
    }

    const response = JSON.parse(responseText);
    
    // Create the result object
    const result: CostPredictionResult = {
      predictedCost: Number(response.predictedCost),
      confidenceInterval: {
        lower: Number(response.confidenceInterval.lower),
        upper: Number(response.confidenceInterval.upper)
      },
      factors: response.factors,
      summary: response.summary
    };
    
    // Cache the result
    aiCache.set(cacheKey, result);
    
    // Log token usage for monitoring
    if (completion.usage) {
      console.log(`Token usage for prediction: ${completion.usage.total_tokens} tokens`);
    }
    
    return result;
  } catch (error: any) {
    console.error("Error generating cost prediction:", error);
    
    // Check for specific OpenAI quota limit error
    const isQuotaError = error.message?.includes("quota") || 
      error.code === "insufficient_quota" || 
      error.status === 429;
    
    // Provide a friendly error message
    const errorMsg = isQuotaError
      ? "OpenAI API quota exceeded. Please check your subscription or billing details."
      : error.message?.includes("timeout")
        ? "Request to AI service timed out. Please try again later."
        : "An error occurred while generating the prediction";
    
    return {
      predictedCost: 0,
      confidenceInterval: { lower: 0, upper: 0 },
      factors: [],
      summary: errorMsg,
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
 * Create an optimized prompt for OpenAI with context data
 * This version uses token-efficient formatting and prioritizes the most relevant data
 * 
 * @param params Prediction parameters
 * @param historicalData Historical cost data
 * @returns Formatted prompt string
 */
function createPredictionPrompt(
  params: CostPredictionParams,
  historicalData: any
): string {
  // First, filter out only the essential data points from historical data
  // This reduces token usage while preserving valuable context
  const essentialMatrixData = historicalData.matrixEntries.map((entry: any) => ({
    region: entry.region,
    buildingType: entry.buildingType,
    baseCost: entry.baseCost,
    regionFactor: entry.regionFactor,
    complexityFactor: entry.complexityFactor,
    yearBuilt: entry.yearBuilt || 'N/A'
  }));
  
  // Format selected historical cost calculations (up to 3 most recent)
  const recentCosts = historicalData.buildingCosts
    .slice(0, 3)
    .map((cost: any) => ({
      buildingType: cost.buildingType,
      region: cost.region,
      squareFootage: cost.squareFootage,
      costPerSqft: cost.costPerSqft,
      totalCost: cost.totalCost,
      createdAt: cost.createdAt
    }));
  
  // Calculate years difference for projection
  const currentYear = new Date().getFullYear();
  const yearsDifference = params.targetYear - currentYear;
  
  // Create a more compact JSON representation
  const matrixJson = JSON.stringify(essentialMatrixData);
  const costsJson = JSON.stringify(recentCosts);
  
  return `Provide a building cost prediction with these parameters:
Building Type: ${params.buildingType}
Region: ${params.region}
Target Year: ${params.targetYear} (${yearsDifference} years from now)
${params.squareFootage ? `Square Footage: ${params.squareFootage}` : ''}
${params.selectedFactors && params.selectedFactors.length > 0 ? 
  `Selected Factors: ${params.selectedFactors.join(', ')}` : ''}

Historical cost matrix: ${matrixJson}
Recent building costs: ${costsJson}

Analyze market conditions, economic factors, and building costs in ${params.region} for ${params.buildingType} construction.

Respond only with this JSON:
{
  "predictedCost": number,
  "confidenceInterval": {"lower": number, "upper": number},
  "factors": [{"name": string, "impact": "low|medium|high", "description": string}],
  "summary": string
}`;
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

/**
 * Utility function to generate a cache key from prediction parameters
 * 
 * @param params Prediction parameters
 * @returns Cache key string
 */
function generateCacheKey(params: CostPredictionParams): string {
  const { buildingType, region, targetYear, squareFootage, selectedFactors } = params;
  
  return `prediction_${buildingType}_${region}_${targetYear}_${squareFootage || 'default'}_${
    selectedFactors ? selectedFactors.sort().join('_') : 'none'
  }`;
}

/**
 * Utility function to clear the AI prediction cache
 * Exposed for testing purposes
 */
export function clearAICache(): void {
  aiCache.flushAll();
}

/**
 * Make API call with retry logic
 * 
 * @param operation Function that makes the API call
 * @param retryConfig Retry configuration
 * @returns Result of the API call
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  retryConfig = RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  let delay = retryConfig.initialDelay;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // If it's a retry attempt, log it
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} of ${retryConfig.maxRetries}...`);
      }
      
      // Attempt the operation
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Determine if we should retry based on the error status
      const shouldRetry = 
        attempt < retryConfig.maxRetries && 
        (retryConfig.retryableStatusCodes.includes(error.status) || 
         error.message?.includes('timeout') ||
         error.message?.includes('rate limit'));
      
      if (!shouldRetry) {
        throw error;
      }
      
      // Log the error and retry delay
      console.log(`OpenAI API error: ${error.message}. Retrying in ${delay}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry using exponential backoff
      delay = delay * retryConfig.backoffFactor;
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError || new Error('Operation failed after max retries');
}