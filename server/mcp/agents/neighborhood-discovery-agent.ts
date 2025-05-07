/**
 * Neighborhood Discovery Agent
 * 
 * This agent analyzes property data to identify and define neighborhoods
 * based on geographic patterns, property characteristics, and municipal boundaries.
 * It uses clustering and pattern recognition to determine natural neighborhood boundaries.
 */

import { logger } from '../../utils/logger';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eventBus } from '../event-bus';
import type { MCPEvent } from '../types';
import { geoMappingAgent } from './geo-mapping-agent';
import { eq, and, or, like } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client if API key is available
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Neighborhood characteristics model
interface NeighborhoodCharacteristics {
  name?: string;
  hood_cd?: string;
  prefix?: string;
  propertyCount: number;
  averageValue?: number;
  dominantPropertyType?: string;
  averageYearBuilt?: number;
  geographicCentroid?: { lat: number; lng: number };
  boundaryPoints?: Array<{ lat: number; lng: number }>;
  confidence: number;
}

// Neighborhood discovery model parameters
interface DiscoveryParameters {
  minimumProperties: number;
  distanceThreshold: number;
  useAI: boolean;
  limitResults?: number;
}

// Default discovery parameters
const DEFAULT_PARAMETERS: DiscoveryParameters = {
  minimumProperties: 5,
  distanceThreshold: 0.5, // km
  useAI: true,
  limitResults: 20
};

/**
 * Neighborhood Discovery Agent Class
 */
export class NeighborhoodDiscoveryAgent {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the agent
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Register event handlers
    eventBus.subscribe('neighborhood:discover:request', this.handleDiscoveryRequest.bind(this));
    eventBus.subscribe('neighborhood:analyze:request', this.handleAnalysisRequest.bind(this));
    
    this.isInitialized = true;
    
    // Announce the agent is ready
    eventBus.publish('agent:initialized', {
      agentId: 'neighborhood-discovery-agent',
      agentName: 'Neighborhood Discovery Agent'
    });
    
    logger.info('Neighborhood Discovery Agent initialized');
  }

  /**
   * Handle neighborhood discovery request
   */
  private async handleDiscoveryRequest(event: MCPEvent): void {
    try {
      const { requestId, sessionId, parameters } = event.payload || {};
      
      if (!requestId) {
        logger.error('Missing requestId in neighborhood discovery request');
        return;
      }
      
      logger.info(`Processing neighborhood discovery request ${requestId}`);
      
      // Merge default parameters with any provided parameters
      const discoveryParams: DiscoveryParameters = {
        ...DEFAULT_PARAMETERS,
        ...parameters
      };
      
      // Discover neighborhoods
      const neighborhoods = await this.discoverNeighborhoods(discoveryParams);
      
      // Publish results
      eventBus.publish('neighborhood:discover:completed', {
        requestId,
        sessionId,
        result: {
          neighborhoods,
          parameters: discoveryParams
        }
      });
      
    } catch (error) {
      logger.error(`Error in neighborhood discovery: ${error.message}`);
      
      // Publish error
      eventBus.publish('neighborhood:discover:failed', {
        requestId: event.payload?.requestId,
        sessionId: event.payload?.sessionId,
        error: error.message || 'Unknown error in neighborhood discovery'
      });
    }
  }

  /**
   * Handle neighborhood analysis request
   */
  private async handleAnalysisRequest(event: MCPEvent): void {
    try {
      const { requestId, sessionId, hood_cd } = event.payload || {};
      
      if (!requestId || !hood_cd) {
        logger.error('Missing requestId or hood_cd in neighborhood analysis request');
        return;
      }
      
      logger.info(`Processing neighborhood analysis request for ${hood_cd}`);
      
      // Analyze the neighborhood
      const analysis = await this.analyzeNeighborhood(hood_cd);
      
      // Publish results
      eventBus.publish('neighborhood:analyze:completed', {
        requestId,
        sessionId,
        result: analysis
      });
      
    } catch (error) {
      logger.error(`Error in neighborhood analysis: ${error.message}`);
      
      // Publish error
      eventBus.publish('neighborhood:analyze:failed', {
        requestId: event.payload?.requestId,
        sessionId: event.payload?.sessionId,
        error: error.message || 'Unknown error in neighborhood analysis'
      });
    }
  }

  /**
   * Discover neighborhoods based on property data
   */
  async discoverNeighborhoods(params: DiscoveryParameters): Promise<NeighborhoodCharacteristics[]> {
    // Start with existing hood_cd values as seed points
    const existingHoodCds = await this.getExistingHoodCds();
    
    // Group properties by hood_cd and analyze each group
    const neighborhoods: NeighborhoodCharacteristics[] = [];
    
    for (const hood_cd of existingHoodCds) {
      if (!hood_cd) continue;
      
      const properties = await this.getPropertiesByHoodCd(hood_cd);
      
      if (properties.length < params.minimumProperties) continue;
      
      // Perform base characteristics analysis
      const characteristics = await this.analyzePropertyGroup(properties, hood_cd);
      
      if (characteristics) {
        neighborhoods.push(characteristics);
      }
      
      // Limit results if specified
      if (params.limitResults && neighborhoods.length >= params.limitResults) {
        break;
      }
    }
    
    // Use AI to enhance neighborhood understanding if available and requested
    if (params.useAI && anthropic && neighborhoods.length > 0) {
      await this.enhanceWithAI(neighborhoods);
    }
    
    return neighborhoods;
  }

  /**
   * Analyze a specific neighborhood by hood_cd
   */
  async analyzeNeighborhood(hood_cd: string): Promise<NeighborhoodCharacteristics | null> {
    const properties = await this.getPropertiesByHoodCd(hood_cd);
    
    if (properties.length === 0) {
      return null;
    }
    
    // Perform basic characteristics analysis
    const characteristics = await this.analyzePropertyGroup(properties, hood_cd);
    
    // Use AI to enhance understanding if available
    if (anthropic && characteristics) {
      const enhancedNeighborhoods = [characteristics];
      await this.enhanceWithAI(enhancedNeighborhoods);
      return enhancedNeighborhoods[0];
    }
    
    return characteristics;
  }

  /**
   * Get properties by hood_cd
   */
  private async getPropertiesByHoodCd(hood_cd: string): Promise<any[]> {
    try {
      const properties = await db.select()
        .from(schema.properties)
        .where(eq(schema.properties.hood_cd, hood_cd))
        .limit(100);
      
      return properties;
    } catch (error) {
      logger.error(`Error getting properties by hood_cd: ${error.message}`);
      return [];
    }
  }

  /**
   * Get all existing unique hood_cd values
   */
  private async getExistingHoodCds(): Promise<string[]> {
    try {
      const properties = await db.select({ hood_cd: schema.properties.hood_cd })
        .from(schema.properties)
        .where(and(
          schema.properties.hood_cd.isNotNull(),
          schema.properties.hood_cd.notEquals('')
        ));
      
      // Extract unique hood_cd values
      const hoodCdSet = new Set<string>();
      properties.forEach(p => {
        if (p.hood_cd) hoodCdSet.add(p.hood_cd);
      });
      
      return Array.from(hoodCdSet);
    } catch (error) {
      logger.error(`Error getting existing hood_cd values: ${error.message}`);
      return [];
    }
  }

  /**
   * Analyze a group of properties to determine neighborhood characteristics
   */
  private async analyzePropertyGroup(properties: any[], hood_cd: string): Promise<NeighborhoodCharacteristics | null> {
    if (properties.length === 0) return null;
    
    try {
      // Extract hood_cd prefix (typically represents the city or area)
      const prefix = hood_cd.split(' ')[0];
      
      // Count properties
      const propertyCount = properties.length;
      
      // Calculate average value if available
      let totalValue = 0;
      let valueCount = 0;
      
      // Track property types
      const propertyTypes: Record<string, number> = {};
      
      // Track years built
      const yearBuilt: number[] = [];
      
      // Process each property
      properties.forEach(property => {
        // Process value
        if (property.assessed_value) {
          totalValue += parseFloat(property.assessed_value);
          valueCount++;
        }
        
        // Process property type
        if (property.property_type) {
          propertyTypes[property.property_type] = (propertyTypes[property.property_type] || 0) + 1;
        }
        
        // Process year built
        if (property.year_built) {
          yearBuilt.push(parseInt(property.year_built));
        }
      });
      
      // Calculate averages and find dominant type
      const averageValue = valueCount > 0 ? totalValue / valueCount : undefined;
      const averageYearBuilt = yearBuilt.length > 0 
        ? Math.round(yearBuilt.reduce((sum, year) => sum + year, 0) / yearBuilt.length) 
        : undefined;
      
      // Find dominant property type
      let dominantPropertyType: string | undefined;
      let maxCount = 0;
      
      Object.entries(propertyTypes).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantPropertyType = type;
        }
      });
      
      // Get city name from prefix if possible
      const possibleCity = this.determineCityFromPrefix(prefix);
      
      // Derive a name if none exists
      let name: string | undefined;
      if (possibleCity !== 'Unknown') {
        name = `${possibleCity} - ${hood_cd}`;
      } else {
        name = `Neighborhood ${hood_cd}`;
      }
      
      // Create the neighborhood characteristics
      const characteristics: NeighborhoodCharacteristics = {
        name,
        hood_cd,
        prefix,
        propertyCount,
        averageValue,
        dominantPropertyType,
        averageYearBuilt,
        confidence: 0.7 // Base confidence
      };
      
      return characteristics;
    } catch (error) {
      logger.error(`Error analyzing property group: ${error.message}`);
      return null;
    }
  }

  /**
   * Enhance neighborhood data using Anthropic AI
   */
  private async enhanceWithAI(neighborhoods: NeighborhoodCharacteristics[]): Promise<void> {
    if (!anthropic || neighborhoods.length === 0) return;
    
    try {
      // Prepare data for AI analysis
      const neighborhoodData = neighborhoods.map(n => ({
        hood_cd: n.hood_cd,
        prefix: n.prefix,
        propertyCount: n.propertyCount,
        averageValue: n.averageValue,
        dominantPropertyType: n.dominantPropertyType,
        averageYearBuilt: n.averageYearBuilt
      }));
      
      // Create a prompt for Anthropic
      const prompt = `You are a real estate and urban planning expert. Analyze these neighborhood data points and provide insights about each one:
      
${JSON.stringify(neighborhoodData, null, 2)}

For each neighborhood, please:
1. Suggest a more descriptive name based on the hood_cd and available data
2. Describe the likely character of the neighborhood (e.g., "established residential area", "newer suburban development")
3. Estimate a confidence level (0.0-1.0) for these assessments

Format your response as JSON with the following structure:
[{
  "hood_cd": "the original hood_cd",
  "suggested_name": "your suggested name",
  "character": "your description of the character",
  "confidence": 0.0 to 1.0
}]`;
      
      // Call Anthropic API
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219", // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });
      
      // Parse the response
      const responseText = response.content[0].text;
      
      // Extract JSON from response (handle possible markdown code blocks)
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/) ||
                        [null, responseText];
      
      const jsonText = jsonMatch[1] || responseText;
      
      try {
        const aiInsights = JSON.parse(jsonText);
        
        // Update neighborhoods with AI insights
        for (const neighborhood of neighborhoods) {
          const insight = aiInsights.find((i: any) => i.hood_cd === neighborhood.hood_cd);
          
          if (insight) {
            neighborhood.name = insight.suggested_name || neighborhood.name;
            neighborhood.confidence = insight.confidence || neighborhood.confidence;
          }
        }
      } catch (parseError) {
        logger.error(`Error parsing AI response: ${parseError.message}`);
      }
    } catch (error) {
      logger.error(`Error enhancing neighborhoods with AI: ${error.message}`);
    }
  }

  /**
   * Determine city name from hood_cd prefix
   */
  private determineCityFromPrefix(prefix: string): string {
    // This is based on the patterns in real Benton County data
    const prefixMappings: Record<string, string> = {
      '530300': 'Richland',
      '540100': 'Kennewick',
      '550000': 'Prosser',
      '520200': 'West Richland',
      '560100': 'Benton City',
      '570200': 'Finley'
    };
    
    return prefixMappings[prefix] || 'Unknown';
  }
}

export const neighborhoodDiscoveryAgent = new NeighborhoodDiscoveryAgent();