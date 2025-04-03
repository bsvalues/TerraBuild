import Anthropic from '@anthropic-ai/sdk';

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const CLAUDE_LATEST_MODEL = 'claude-3-7-sonnet-20250219';

/**
 * Anthropic Claude integration for the Model Content Protocol (MCP) framework
 */
export class AnthropicService {
  private client: Anthropic;
  
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  /**
   * Generates a building cost prediction using Claude
   * @param params Building parameters for prediction
   * @returns Prediction result with cost and insights
   */
  async generateBuildingCostPrediction(params: any): Promise<any> {
    try {
      const { 
        buildingType, 
        squareFootage,
        region,
        quality,
        buildingAge,
        yearBuilt,
        complexityFactor,
        conditionFactor,
        features,
        targetYear 
      } = params;

      const systemPrompt = `
        You are a specialized building cost analyzer for Benton County, Washington. 
        Your task is to analyze building parameters and generate accurate cost predictions.
        Return your response as a structured JSON object only, with no additional text.
      `;
      
      const userPrompt = `
        Generate a detailed building cost prediction based on these parameters:
        - Building Type: ${buildingType}
        - Square Footage: ${squareFootage}
        - Region: ${region}
        - Quality Level: ${quality}
        - Building Age: ${buildingAge} years (built in ${yearBuilt})
        - Complexity Factor: ${complexityFactor}
        - Condition Factor: ${conditionFactor}
        - Features: ${features ? features.join(', ') : 'None'}
        - Target Year for Prediction: ${targetYear || new Date().getFullYear() + 1}

        Provide your response as a JSON object with the following structure:
        {
          "totalCost": "number as string with commas (e.g. 250,000)",
          "costPerSquareFoot": number,
          "predictionFactors": [
            {
              "factor": "string - name of factor",
              "impact": "positive | negative | neutral",
              "importance": number between 0-1,
              "explanation": "string explanation"
            },
            ...more factors
          ],
          "materialSubstitutions": [
            {
              "originalMaterial": "string",
              "substituteMaterial": "string",
              "potentialSavings": "string (e.g. $5,000 - $8,000)",
              "qualityImpact": "None | Low | Moderate | High"
            },
            ...more substitutions
          ]
        }
      `;

      const response = await this.client.messages.create({
        model: CLAUDE_LATEST_MODEL,
        max_tokens: 1500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });

      // Parse the response content to extract the JSON
      const content = typeof response.content[0] === 'object' && 'text' in response.content[0] 
                      ? response.content[0].text 
                      : JSON.stringify(response.content[0]);
      let predictionData = this.extractJsonFromString(content);

      return {
        success: true,
        provider: 'anthropic',
        model: 'claude',
        ...predictionData
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  /**
   * Analyze building materials for potential substitutions
   * @param materials Current materials list
   * @param constraints Quality and budget constraints
   * @returns List of material substitution recommendations
   */
  async analyzeMaterialSubstitutions(materials: string[], constraints: any): Promise<any> {
    try {
      const systemPrompt = `
        You are a building materials expert for Benton County, Washington.
        Analyze the provided materials and recommend cost-effective substitutions
        that meet the specified quality constraints.
        Return your response as a structured JSON object only, with no additional text.
      `;
      
      const userPrompt = `
        Analyze these building materials and suggest cost-effective substitutions:
        Materials: ${materials.join(', ')}
        
        Quality Constraint: ${constraints.qualityLevel || 'AVERAGE'}
        Budget Constraint: ${constraints.budgetLevel || 'STANDARD'}
        Building Type: ${constraints.buildingType || 'RESIDENTIAL'}
        
        Provide your response as a JSON object with the following structure:
        {
          "materialSubstitutions": [
            {
              "originalMaterial": "string",
              "substituteMaterial": "string",
              "potentialSavings": "string (e.g. $5,000 - $8,000)",
              "qualityImpact": "None | Low | Moderate | High"
            },
            ...more substitutions
          ]
        }
      `;

      const response = await this.client.messages.create({
        model: CLAUDE_LATEST_MODEL,
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });

      // Parse the response content to extract the JSON
      const content = typeof response.content[0] === 'object' && 'text' in response.content[0] 
                    ? response.content[0].text 
                    : JSON.stringify(response.content[0]);
      return this.extractJsonFromString(content);
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  /**
   * Helper method to extract JSON from a string that might contain extra text
   */
  private extractJsonFromString(text: string): any {
    // Find anything that looks like a JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error('Failed to parse JSON from Anthropic response:', error);
        throw new Error('Failed to parse JSON from model response');
      }
    }
    throw new Error('No valid JSON found in model response');
  }
}

export default new AnthropicService();