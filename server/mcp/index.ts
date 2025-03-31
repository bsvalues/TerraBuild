/**
 * Model Content Protocol (MCP) Integration
 * 
 * This module provides integration with AI models through the Model Content Protocol
 * to power building cost predictions, analytics, and explanations.
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { buildingCostFunctions } from './functions/buildingCostFunctions';

// OpenAI client initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function registry stores all available AI functions
const functionRegistry = {
  ...buildingCostFunctions
};

// Import our validation module
import validation, { 
  costPredictionSchema, 
  validateCostPredictionData,
  normalizeInputData
} from '@shared/mcp-validation';

// Schema for cost prediction request - using our enhanced validation schema
export const costPredictionRequestSchema = costPredictionSchema;

// Cost prediction agent that uses OpenAI to generate building cost predictions
export async function costPredictionAgent(data: z.infer<typeof costPredictionRequestSchema>) {
  try {
    // Validate and normalize request data with enhanced validation
    const validationResult = validateCostPredictionData(data);
    
    // If data is invalid, throw an error with validation messages
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.validationErrors.join(', ')}`);
    }
    
    // Get the normalized data
    const validatedData = validationResult.normalizedData;
    
    // Check for data quality warnings
    if (validationResult.dataQualityWarnings.length > 0) {
      console.warn('Data quality warnings:', validationResult.dataQualityWarnings);
    }
    
    // Context information to provide to the AI
    const contextInfo = {
      currentYear: new Date().getFullYear(),
      modelVersion: '1.0',
      dataSource: 'Benton County Cost Matrix'
    };
    
    // Construct the prompt for the AI
    const userMessage = `
      Based on the following building information, predict the building cost:
      
      Building Type: ${validatedData.buildingType}
      Square Footage: ${validatedData.squareFootage} sq ft
      Region: ${validatedData.region}
      ${validatedData.yearBuilt ? `Year Built: ${validatedData.yearBuilt}` : ''}
      ${validatedData.condition ? `Condition: ${validatedData.condition}` : ''}
      ${validatedData.features && validatedData.features.length > 0 
        ? `Special Features: ${validatedData.features.join(', ')}` 
        : ''}
      
      Please provide:
      1. Cost per square foot
      2. Total estimated cost
      3. Brief explanation of factors affecting the cost
      4. Confidence score (0.0-1.0)
    `;
    
    // Call OpenAI API with structured parameters
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert building cost estimator. You will receive building details and provide cost 
                    estimates based on the Benton County Cost Matrix data. Your estimates should be realistic and 
                    based on current construction costs in Washington state. Always explain your reasoning.
                    
                    Context: ${JSON.stringify(contextInfo)}`
        },
        { role: "user", content: userMessage }
      ],
      temperature: 0.4, // Lower temperature for more predictable cost estimates
      max_tokens: 1200,
    });
    
    // Extract the AI's response
    const aiResponse = response.choices[0].message.content;
    
    // Parse the AI's response to extract structured data
    const costMatch = aiResponse?.match(/Total estimated cost: \$?([\d,]+\.?\d*)/i);
    const costPerSqFtMatch = aiResponse?.match(/Cost per square foot: \$?([\d,]+\.?\d*)/i);
    const confidenceMatch = aiResponse?.match(/Confidence score:? (0\.\d+)/i);
    
    // Extract explanation paragraph
    let explanation = '';
    if (aiResponse) {
      const explanationSections = aiResponse.split('\n\n');
      for (const section of explanationSections) {
        if (section.toLowerCase().includes('explanation') || 
            section.toLowerCase().includes('factors') || 
            section.toLowerCase().includes('affecting')) {
          explanation = section.replace(/^(Explanation:|Factors affecting the cost:|Brief explanation:)/i, '').trim();
          break;
        }
      }
      
      // If no explicit explanation section was found, use the remaining text
      if (!explanation && explanationSections.length > 2) {
        explanation = explanationSections[2];
      }
    }
    
    // Parse numeric values
    const totalCost = costMatch 
      ? parseFloat(costMatch[1].replace(/,/g, '')) 
      : 0;
    
    const costPerSquareFoot = costPerSqFtMatch 
      ? parseFloat(costPerSqFtMatch[1].replace(/,/g, '')) 
      : 0;
    
    const confidenceScore = confidenceMatch 
      ? parseFloat(confidenceMatch[1]) 
      : 0.7; // Default confidence if not provided
    
    // Process data quality information
    const anomalies = [];
    let dataQualityScore = 0.85; // Default high quality score
    
    // Check for anomalies based on normalizedData
    if (validatedData.yearBuilt && validatedData.yearBuilt < 1900) {
      anomalies.push("The building age is unusually old, which may affect prediction accuracy.");
      dataQualityScore -= 0.1;
    }
    
    if (validatedData.squareFootage > 500000) {
      anomalies.push("Very large square footage may lead to less accurate cost estimates.");
      dataQualityScore -= 0.15;
    }
    
    if (validatedData.complexity && validatedData.complexity > 1.8) {
      anomalies.push("High complexity buildings have more variable costs and less predictable estimates.");
      dataQualityScore -= 0.1;
    }
    
    // Calculate breakdown of costs
    const baseCost = totalCost / (validatedData.squareFootage || 1);
    const regionFactor = validatedData.region === "central" ? 1.0 : 
                       validatedData.region === "north" ? 1.05 :
                       validatedData.region === "south" ? 0.95 :
                       validatedData.region === "east" ? 0.98 :
                       validatedData.region === "west" ? 1.1 : 1.0;
    
    const complexityFactor = validatedData.complexity || 1.0;
    
    // Return structured prediction result with enhanced data quality information
    return {
      totalCost,
      costPerSquareFoot,
      confidenceScore,
      explanation,
      rawResponse: aiResponse,
      
      // Data quality information
      dataQualityScore,
      anomalies: anomalies.length > 0 ? anomalies : undefined,
      
      // Cost breakdown fields
      baseCost: baseCost * validatedData.squareFootage,
      regionFactor,
      complexityFactor,
      costPerSqft: costPerSquareFoot
    };
  } catch (error) {
    console.error('Error in cost prediction agent:', error);
    throw error;
  }
}

// Matrix analysis agent that uses OpenAI to analyze building cost matrices
export async function matrixAnalysisAgent(matrixData: any) {
  try {
    // Construct the prompt for the AI
    const userMessage = `
      Analyze the following building cost matrix data:
      
      ${JSON.stringify(matrixData, null, 2)}
      
      Please provide:
      1. A comprehensive analysis of the cost patterns
      2. Regional cost variations
      3. Building type cost comparisons
      4. Insights into cost factors
      5. Notable outliers or anomalies
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert building cost analyst. You will receive building cost matrix data and provide 
                    detailed analysis and insights. Focus on identifying patterns, regional variations, and cost 
                    factors that impact building costs. Organize your analysis in clear sections with headers.`
        },
        { role: "user", content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    
    // Extract the AI's response
    const analysis = response.choices[0].message.content;
    
    return { analysis };
  } catch (error) {
    console.error('Error in matrix analysis agent:', error);
    throw error;
  }
}

// Calculation explanation agent that uses OpenAI to explain building cost calculations
export async function calculationExplanationAgent(calculationData: any) {
  try {
    // Construct the prompt for the AI
    const userMessage = `
      Explain the following building cost calculation in detail:
      
      ${JSON.stringify(calculationData, null, 2)}
      
      Please provide:
      1. A detailed explanation of how the cost was calculated
      2. What factors were considered
      3. How regional variations affected the cost
      4. How building type affected the cost
      5. Explanation of any adjustments or multipliers
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert in building cost calculations. You will receive data about a building cost 
                    calculation and provide a detailed, easy-to-understand explanation of how the cost was 
                    determined. Use plain language that a non-technical person can understand.`
        },
        { role: "user", content: userMessage }
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });
    
    // Extract the AI's response
    const explanation = response.choices[0].message.content;
    
    return { explanation };
  } catch (error) {
    console.error('Error in calculation explanation agent:', error);
    throw error;
  }
}

/**
 * Initialize the MCP module
 * This function should be called at application startup
 */
export function initializeMCP() {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY environment variable is not set. MCP functionality will be limited.');
  } else {
    console.log('MCP initialized with OpenAI API key');
  }
  
  // Additional initialization tasks can be added here
}

export default {
  costPredictionAgent,
  matrixAnalysisAgent,
  calculationExplanationAgent,
  functionRegistry
};