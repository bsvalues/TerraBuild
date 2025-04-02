/**
 * Natural Language Processing Service
 * 
 * This service integrates with OpenAI API to convert natural language queries
 * into structured database queries and return formatted results.
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';
import { IStorage } from '../storage';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Model Content Protocol components specific to building cost queries
const systemPrompt = `
You are a building cost analysis assistant for the Benton County Building Cost System (BCBS).
Your role is to parse natural language queries about building costs and convert them into structured queries that can be executed against our database.

The database contains the following tables and fields:
- buildings: id, buildingType, region, squareFeet, year, quality, complexity, condition
- costMatrix: id, buildingType, region, year, baseCost, adjustedCost, costPerSqFt
- costTrends: id, buildingType, region, year, quarter, costIndex
- materials: id, buildingId, materialType, percentage, cost

When responding, you MUST always follow this format:
{
  "query": {
    "type": "one of: comparison, trend, statistics, prediction",
    "filters": {
      "buildingTypes": ["array of building types mentioned"],
      "regions": ["array of regions mentioned"],
      "years": [array of years mentioned or range],
      "otherFilters": {}
    },
    "metrics": ["array of metrics to calculate"],
    "groupBy": ["array of fields to group by"],
    "operation": "one of: average, sum, count, min, max, median"
  },
  "interpretation": {
    "entities": ["all recognized entities"],
    "timeRange": "time range if specified",
    "metric": "primary metric requested",
    "operation": "primary operation requested"
  },
  "chartType": "recommended visualization type (bar, line, pie, table)",
  "explanation": "brief explanation of how you interpreted the query"
}
`;

// Types
export interface NLQueryResult {
  results: any[];
  interpretation: {
    entities: string[];
    timeRange: string | null;
    metric: string;
    operation: string;
  };
  summary: string;
  chartType?: 'bar' | 'line' | 'pie' | 'table';
}

export interface QueryFilters {
  buildingTypes?: string[];
  regions?: string[];
  year?: number;
  [key: string]: any;
}

/**
 * Process a natural language query into structured data
 */
export async function processNaturalLanguageQuery(
  query: string, 
  existingFilters: QueryFilters | null,
  storage: IStorage
): Promise<NLQueryResult> {
  try {
    // Create messages for OpenAI
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Query: ${query}\nExisting filters: ${JSON.stringify(existingFilters || {})}` }
    ];
    
    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.1,
      max_tokens: 1000
    });
    
    // Extract structured query
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response received from AI model");
    }
    
    // Parse JSON from response
    try {
      // Extract JSON from the response (in case there's any surrounding text)
      const jsonMatch = responseContent.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      // Execute the structured query against our database
      const results = await executeStructuredQuery(parsedResponse.query, storage);
      
      // Return formatted results along with interpretation
      return {
        results,
        interpretation: parsedResponse.interpretation,
        summary: parsedResponse.explanation,
        chartType: parsedResponse.chartType
      };
    } catch (error) {
      console.error("Error parsing AI response:", error);
      throw new Error("Failed to parse the AI response. Please try rephrasing your query.");
    }
  } catch (error) {
    console.error("NLP query failed:", error);
    throw error;
  }
}

/**
 * Execute a structured query against our data storage
 */
async function executeStructuredQuery(structuredQuery: any, storage: IStorage): Promise<any[]> {
  const { type, filters, metrics, groupBy, operation } = structuredQuery;
  
  // Get base data based on query type
  let data: any[] = [];
  
  switch (type) {
    case 'comparison':
      // Get data for comparison queries (costs across different categories)
      data = await storage.getAllCostMatrix();
      break;
      
    case 'trend':
      // Get data for trend queries (costs over time)
      data = await storage.getCostTrends();
      break;
      
    case 'statistics':
      // Get data for statistical queries
      data = await storage.getAllCostMatrix();
      break;
      
    case 'prediction':
      // For prediction queries, we just pass the parameters to the prediction model
      // in the frontend, so we return the filters directly
      return [{ prediction: true, filters }];
      
    default:
      // Default to cost matrix data
      data = await storage.getAllCostMatrix();
  }
  
  // Apply filters if specified
  if (filters) {
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      const buildingTypeFilters = filters.buildingTypes.map((bt: string) => bt.toLowerCase());
      data = data.filter(item => 
        item.buildingType && buildingTypeFilters.includes(item.buildingType.toLowerCase())
      );
    }
    
    if (filters.regions && filters.regions.length > 0) {
      const regionFilters = filters.regions.map((r: string) => r.toLowerCase());
      data = data.filter(item => 
        item.region && regionFilters.includes(item.region.toLowerCase())
      );
    }
    
    if (filters.years) {
      if (Array.isArray(filters.years)) {
        data = data.filter(item => filters.years.includes(item.year));
      } else if (typeof filters.years === 'object' && filters.years.min && filters.years.max) {
        data = data.filter(item => 
          item.year >= filters.years.min && item.year <= filters.years.max
        );
      }
    }
    
    // Apply other custom filters if present
    if (filters.otherFilters) {
      Object.entries(filters.otherFilters).forEach(([key, value]) => {
        data = data.filter(item => item[key] === value);
      });
    }
  }
  
  // Group data if groupBy specified
  if (groupBy && groupBy.length > 0) {
    const groupedData = new Map();
    
    for (const item of data) {
      // Create grouping key based on all groupBy fields
      const groupKey = groupBy.map(field => item[field]).join('|');
      
      if (!groupedData.has(groupKey)) {
        groupedData.set(groupKey, {
          // Include the groupBy fields in the result
          ...groupBy.reduce((acc, field) => ({ ...acc, [field]: item[field] }), {}),
          items: []
        });
      }
      
      groupedData.get(groupKey).items.push(item);
    }
    
    // Process metrics for each group
    data = Array.from(groupedData.values()).map(group => {
      const result = { ...group };
      delete result.items;
      
      // Calculate metrics for this group
      for (const metric of metrics) {
        const values = group.items.map((item: any) => item[metric]).filter((v: any) => v !== undefined && v !== null);
        
        if (values.length === 0) continue;
        
        switch (operation) {
          case 'average':
            result[metric] = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
            break;
          case 'sum':
            result[metric] = values.reduce((sum: number, val: number) => sum + val, 0);
            break;
          case 'count':
            result[metric] = values.length;
            break;
          case 'min':
            result[metric] = Math.min(...values);
            break;
          case 'max':
            result[metric] = Math.max(...values);
            break;
          case 'median':
            values.sort((a: number, b: number) => a - b);
            const mid = Math.floor(values.length / 2);
            result[metric] = values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
            break;
          default:
            result[metric] = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
        }
      }
      
      // Format the result for visualization
      result.name = groupBy.map(field => result[field]).join(' - ');
      result.value = result[metrics[0]]; // Use first metric as the main value for charts
      
      return result;
    });
  }
  
  return data;
}