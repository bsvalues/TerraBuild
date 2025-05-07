/**
 * Geographic Mapping Agent
 * 
 * This agent maps Benton County property data to the correct geographic hierarchy
 * using the actual hood_cd, city, and other property identifiers.
 */

import { db } from '../../db';
import { eq, like, and, or } from 'drizzle-orm';
import * as schema from '../../../shared/schema';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Geographic Mapping Agent Class
 */
export class GeoMappingAgent {
  constructor() {
    console.log('Geographic Mapping Agent initialized');
  }

  /**
   * Map a property to its geographic hierarchy using all available identifiers
   * @param property Property data
   * @returns Geographic hierarchy
   */
  async mapPropertyToGeography(property: any) {
    try {
      const {
        hood_cd,
        township_code,
        range_code,
        property_use_cd,
        tca,
        city,
        geo_id
      } = property;

      // Build comprehensive geographic mapping
      const result = await this.buildGeographicMapping(
        hood_cd,
        city,
        township_code,
        range_code,
        tca,
        property_use_cd,
        geo_id
      );

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error mapping property to geography:', error);
      return {
        success: false,
        error: error.message || 'Unknown error in geographic mapping'
      };
    }
  }

  /**
   * Build a complete geographic mapping using available property identifiers
   */
  private async buildGeographicMapping(
    hood_cd: string | null,
    city: string | null,
    township_code: string | null,
    range_code: string | null,
    tca: string | null,
    property_use_cd: string | null,
    geo_id: string | null
  ) {
    // First try to get existing mapping from database if hood_cd is available
    if (hood_cd) {
      const neighborhood = await this.getNeighborhoodByHoodCd(hood_cd);
      if (neighborhood) {
        return {
          neighborhood: neighborhood,
          municipality: await this.getMunicipalityById(neighborhood.municipalityId),
          region: await this.getRegionForMunicipalityId(neighborhood.municipalityId)
        };
      }
    }

    // If not found by hood_cd, try to determine using city
    if (city) {
      const municipality = await this.getMunicipalityByName(city);
      if (municipality) {
        return {
          neighborhood: null, // No specific neighborhood
          municipality: municipality,
          region: await this.getRegionForMunicipalityId(municipality.id)
        };
      }
    }

    // If not found by city, try by township/range
    if (township_code && range_code) {
      const mapping = await this.mapByTownshipRange(township_code, range_code);
      if (mapping) {
        return mapping;
      }
    }

    // If nothing else works, use AI to analyze the property data for geographic context
    return await this.analyzePropertyGeographyWithAI({
      hood_cd,
      city,
      township_code,
      range_code,
      tca,
      property_use_cd,
      geo_id
    });
  }

  /**
   * Get neighborhood by hood_cd
   */
  private async getNeighborhoodByHoodCd(hood_cd: string) {
    const neighborhoods = await db.select().from(schema.geographicNeighborhoods)
      .where(eq(schema.geographicNeighborhoods.hoodCd, hood_cd));
    
    return neighborhoods.length > 0 ? neighborhoods[0] : null;
  }

  /**
   * Get municipality by ID
   */
  private async getMunicipalityById(id: number) {
    const municipalities = await db.select().from(schema.geographicMunicipalities)
      .where(eq(schema.geographicMunicipalities.id, id));
    
    return municipalities.length > 0 ? municipalities[0] : null;
  }
  
  /**
   * Get municipality by name (case insensitive)
   */
  private async getMunicipalityByName(name: string) {
    // Convert lookup name to lowercase for comparison
    const lookupName = name.toLowerCase();
    
    // Get all municipalities
    const municipalities = await db.select().from(schema.geographicMunicipalities);
    
    // Find municipality with matching name (case insensitive)
    for (const municipality of municipalities) {
      if (municipality.name.toLowerCase() === lookupName) {
        return municipality;
      }
    }
    
    return null;
  }

  /**
   * Get region for a municipality
   */
  private async getRegionForMunicipalityId(municipalityId: number) {
    const municipality = await this.getMunicipalityById(municipalityId);
    if (!municipality || !municipality.regionId) return null;
    
    const regions = await db.select().from(schema.geographicRegions)
      .where(eq(schema.geographicRegions.id, municipality.regionId));
    
    return regions.length > 0 ? regions[0] : null;
  }

  /**
   * Map by township and range
   */
  private async mapByTownshipRange(township_code: string, range_code: string) {
    // Query township_range_mapping table
    const mappings = await db.query.township_range_mapping.findMany({
      where: and(
        eq(schema.township_range_mapping.townshipCode, township_code),
        eq(schema.township_range_mapping.rangeCode, range_code)
      )
    });
    
    if (mappings.length > 0) {
      const mapping = mappings[0];
      
      return {
        neighborhood: null,
        municipality: mapping.municipalityId ? 
          await this.getMunicipalityById(mapping.municipalityId) : null,
        region: mapping.regionId ? 
          await db.query.geographicRegions.findFirst({
            where: eq(schema.geographicRegions.id, mapping.regionId)
          }) : null
      };
    }
    
    return null;
  }

  /**
   * Use Anthropic AI to analyze property data for geographic context
   */
  private async analyzePropertyGeographyWithAI(propertyData: any) {
    try {
      // Get all municipalities and regions for reference
      const municipalities = await db.select().from(schema.geographicMunicipalities);
      const regions = await db.select().from(schema.geographicRegions);
      
      // Prepare context information
      const municipalityInfo = municipalities.map(m => 
        `${m.name} (${m.municipalityCode}): ${m.description || 'No description'}`
      ).join('\n');
      
      const regionInfo = regions.map(r => 
        `${r.name} (${r.regionCode}): ${r.description || 'No description'}`
      ).join('\n');
      
      // Create prompt with property data and available geographic entities
      const prompt = `
I need to determine the most likely geographic location in Benton County, Washington for a property with these characteristics:

Property Data:
${Object.entries(propertyData)
  .filter(([_, value]) => value !== null && value !== undefined)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

Available Municipalities in Benton County:
${municipalityInfo}

Available Regions in Benton County:
${regionInfo}

Based only on the property data provided, please determine:
1. The most likely municipality (city) this property belongs to
2. Which region it should be classified under

Explain your reasoning, then provide the final answer in this JSON format:
{
  "municipality": "name of municipality",
  "municipalityCode": "code of municipality", 
  "region": "name of region",
  "regionCode": "code of region",
  "confidence": 0.X (between 0-1)
}
`;

      // Call Anthropic API
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      });

      // Extract JSON from response
      const match = response.content[0].text.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error('Could not extract JSON from AI response');
      }

      const result = JSON.parse(match[0]);
      
      // Find the actual municipality and region objects
      const municipality = municipalities.find(m => 
        m.name.toLowerCase() === result.municipality.toLowerCase() || 
        m.municipalityCode === result.municipalityCode
      );
      
      const region = regions.find(r => 
        r.name.toLowerCase() === result.region.toLowerCase() || 
        r.regionCode === result.regionCode
      );
      
      return {
        neighborhood: null,
        municipality: municipality || null,
        region: region || null,
        confidence: result.confidence,
        aiAnalysis: result
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        neighborhood: null,
        municipality: null,
        region: null,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Create a new neighborhood mapping
   */
  async createNeighborhoodMapping(hood_cd: string, municipalityId: number, name?: string) {
    try {
      const neighborhood = {
        hoodCd: hood_cd,
        name: name || `Neighborhood ${hood_cd}`,
        municipalityId: municipalityId,
        description: `Neighborhood with hood_cd ${hood_cd}`,
        isActive: true
      };
      
      const [created] = await db.insert(schema.geographicNeighborhoods)
        .values(neighborhood)
        .returning();
      
      return {
        success: true,
        data: created
      };
    } catch (error) {
      console.error('Error creating neighborhood mapping:', error);
      return {
        success: false,
        error: error.message || 'Unknown error creating neighborhood'
      };
    }
  }
}

// Export singleton instance
export const geoMappingAgent = new GeoMappingAgent();