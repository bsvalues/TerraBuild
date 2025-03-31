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

// Schema for cost prediction request
export const costPredictionRequestSchema = z.object({
  buildingType: z.string(),
  squareFootage: z.number().positive(),
  region: z.string(),
  yearBuilt: z.number().int().positive().optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'FAIR', 'POOR']).optional(),
  features: z.array(z.string()).optional()
});

// Cost prediction agent that uses OpenAI to generate building cost predictions
export async function costPredictionAgent(data: z.infer<typeof costPredictionRequestSchema>) {
  try {
    // Validate request data
    const validatedData = costPredictionRequestSchema.parse(data);
    
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
    
    // Return structured prediction result
    return {
      totalCost,
      costPerSquareFoot,
      confidenceScore,
      explanation,
      rawResponse: aiResponse
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