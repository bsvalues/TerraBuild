/**
 * AI Service for Model Content Protocol
 * 
 * This file provides an interface to AI models for the MCP framework.
 * It handles API calls to external AI providers like OpenAI.
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';

// Check if the OpenAI API key is available
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn('OPENAI_API_KEY environment variable is not set. AI capabilities will be limited.');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export interface AiServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Service for interacting with AI models
 */
export class AiService {
  private static instance: AiService;
  private defaultModel = 'gpt-4-turbo-preview';
  private defaultTemp = 0.2;
  private defaultMaxTokens = 1000;

  private constructor() {}

  /**
   * Get the AI service instance (singleton)
   * 
   * @returns The AI service instance
   */
  public static getInstance(): AiService {
    if (!AiService.instance) {
      AiService.instance = new AiService();
    }
    return AiService.instance;
  }

  /**
   * Generate text using an AI model
   * 
   * @param prompt The prompt to generate from
   * @param options Options for generation
   * @returns The generated text
   */
  public async generateText(prompt: string, options: AiServiceOptions = {}): Promise<string> {
    try {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key is not available');
      }

      const model = options.model || this.defaultModel;
      const temperature = options.temperature ?? this.defaultTemp;
      const maxTokens = options.maxTokens || this.defaultMaxTokens;

      console.debug(`Generating text with model ${model}, temp ${temperature}, max tokens ${maxTokens}`);
      
      const messages: ChatCompletionMessageParam[] = [];
      
      // Add system prompt if provided
      if (options.systemPrompt) {
        messages.push({
          role: 'system' as const,
          content: options.systemPrompt
        });
      }
      
      // Add user prompt
      messages.push({
        role: 'user' as const,
        content: prompt
      });
      
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const generatedText = response.choices[0]?.message?.content || '';
      return generatedText;
    } catch (error: any) {
      console.error(`Error generating text: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Extract structured data from text using an AI model
   * 
   * @param text The text to extract from
   * @param schema Description of the schema to extract
   * @param options Options for generation
   * @returns The extracted JSON data
   */
  public async extractStructuredData(text: string, schema: string, options: AiServiceOptions = {}): Promise<any> {
    try {
      const prompt = `
Extract structured data from the following text according to this schema:
${schema}

Return ONLY valid JSON without any explanations or markdown formatting.

TEXT:
${text}
`;

      const systemPrompt = "You are a data extraction assistant. Your only job is to extract structured data according to a schema. Only respond with valid JSON without any explanations or extra text.";
      
      const jsonText = await this.generateText(prompt, {
        ...options,
        systemPrompt,
        temperature: 0.1 // Lower temperature for more deterministic output
      });

      try {
        // Find the first JSON object in the response
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in the response');
        }
      } catch (parseError: any) {
        console.error(`Error parsing JSON from AI response: ${parseError.message}`);
        console.debug(`Raw AI response: ${jsonText}`);
        throw new Error(`Failed to parse structured data: ${parseError.message}`);
      }
    } catch (error: any) {
      console.error(`Error extracting structured data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze text for insights using an AI model
   * 
   * @param text The text to analyze
   * @param analysisType The type of analysis to perform
   * @param options Options for generation
   * @returns The analysis result
   */
  public async analyzeText(text: string, analysisType: string, options: AiServiceOptions = {}): Promise<string> {
    try {
      const prompt = `
Analyze the following text for ${analysisType}:

TEXT:
${text}

Provide a detailed analysis focusing on ${analysisType}.
`;

      return await this.generateText(prompt, {
        ...options,
        systemPrompt: `You are an expert analysis assistant specializing in ${analysisType}.`
      });
    } catch (error: any) {
      console.error(`Error analyzing text: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Predict building cost using AI
   * 
   * @param data The building data for cost prediction
   * @param options Options for generation
   * @returns The predicted cost
   */
  public async predictBuildingCost(data: any, options: AiServiceOptions = {}): Promise<any> {
    try {
      const prompt = `
Given the following building information, predict the cost per square foot and total cost:

${JSON.stringify(data, null, 2)}

Analyze the building type, region, and size to provide an accurate cost prediction.
Return your response as a JSON object with the following structure:
{
  "costPerSquareFoot": number,
  "totalCost": number,
  "confidenceScore": number,
  "explanation": string
}
`;

      const systemPrompt = "You are a building cost prediction expert. Analyze building information and provide accurate cost predictions based on building type, region, and size.";
      
      const response = await this.generateText(prompt, {
        ...options,
        systemPrompt,
        temperature: 0.2
      });
      
      try {
        // Extract the JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in the response');
        }
      } catch (parseError: any) {
        console.error(`Error parsing prediction JSON: ${parseError.message}`);
        throw new Error(`Failed to parse prediction data: ${parseError.message}`);
      }
    } catch (error: any) {
      console.error(`Error predicting building cost: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze cost matrix data using AI
   * 
   * @param matrixData The cost matrix data to analyze
   * @param options Options for generation
   * @returns The analysis result
   */
  public async analyzeCostMatrix(matrixData: any, options: AiServiceOptions = {}): Promise<string> {
    try {
      const prompt = `
Analyze the following building cost matrix data:

${JSON.stringify(matrixData, null, 2)}

Provide insights on:
1. Cost trends across building types
2. Regional cost variations
3. Notable outliers or anomalies
4. Recommendations for cost optimization
`;

      return await this.generateText(prompt, {
        ...options,
        systemPrompt: "You are a building cost analysis expert. Analyze cost matrix data to identify trends, variations, and provide meaningful insights.",
        maxTokens: 1500
      });
    } catch (error: any) {
      console.error(`Error analyzing cost matrix: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Explain a building cost calculation in detail
   * 
   * @param calculationData The calculation data to explain
   * @param options Options for generation
   * @returns The detailed explanation
   */
  public async explainCalculation(calculationData: any, options: AiServiceOptions = {}): Promise<string> {
    try {
      const prompt = `
Explain the following building cost calculation in detail:

${JSON.stringify(calculationData, null, 2)}

Break down how each factor contributes to the final cost and explain the reasoning behind the calculation method.
`;

      return await this.generateText(prompt, {
        ...options,
        systemPrompt: "You are a building cost calculation expert. Explain complex cost calculations in clear, understandable terms.",
        maxTokens: 1200
      });
    } catch (error: any) {
      console.error(`Error explaining calculation: ${error.message}`);
      throw error;
    }
  }
}

// Export the singleton instance
export const aiService = AiService.getInstance();