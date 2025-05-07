/**
 * Geographic Mapping Agent
 * 
 * This agent maps Benton County property data to the correct geographic hierarchy
 * using the actual hood_cd, city, and other property identifiers.
 */

import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { GeographicMapping, Municipality, Neighborhood, Region } from '../types';
import Anthropic from '@anthropic-ai/sdk';
import { eq, and, like, or } from 'drizzle-orm';

// Initialize Anthropic AI
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Geographic Mapping Agent Class
 */
export class GeoMappingAgent {
  constructor() {
    console.log('Initializing Geographic Mapping Agent');
  }

  /**
   * Map a property to its geographic hierarchy using all available identifiers
   * @param property Property data
   * @returns Geographic hierarchy
   */
  async mapPropertyToGeography(property: any): Promise<GeographicMapping> {
    console.log(`Mapping property geography for: ${JSON.stringify(property)}`);
    
    try {
      const { prop_id, geo_id, hood_cd } = property;
      
      // Start with confidence of 0
      let confidence = 0;
      
      // Build mapping using available property data
      const mapping = await this.buildGeographicMapping({
        prop_id,
        geo_id,
        hood_cd,
        township_code: property.township_code,
        range_code: property.range_code,
        city: property.city,
        county: property.county || 'Benton',
        property // Pass along full property record for AI analysis if needed
      });
      
      // Calculate confidence based on the completeness of the mapping
      if (mapping.neighborhood) confidence += 0.4;
      if (mapping.municipality) confidence += 0.3;
      if (mapping.region) confidence += 0.3;
      
      return {
        property: {
          prop_id: prop_id,
          geo_id: geo_id,
          hood_cd: hood_cd
        },
        neighborhood: mapping.neighborhood,
        municipality: mapping.municipality,
        region: mapping.region,
        confidence
      };
    } catch (error) {
      console.error('Error in geographic mapping:', error);
      throw new Error(`Geographic mapping failed: ${error.message}`);
    }
  }

  /**
   * Build a complete geographic mapping using available property identifiers
   */
  private async buildGeographicMapping(
    propertyInfo: {
      prop_id?: string;
      geo_id?: string;
      hood_cd?: string;
      township_code?: string;
      range_code?: string;
      city?: string;
      county?: string;
      property?: any;
    }
  ): Promise<{
    neighborhood?: Neighborhood;
    municipality?: Municipality;
    region?: Region;
  }> {
    const { hood_cd, city, county, township_code, range_code, property } = propertyInfo;
    
    // Initialize result
    const result: {
      neighborhood?: Neighborhood;
      municipality?: Municipality;
      region?: Region;
    } = {};
    
    // Try to find neighborhood by hood_cd
    if (hood_cd) {
      result.neighborhood = await this.getNeighborhoodByHoodCd(hood_cd);
      
      // If neighborhood found, get municipality and region
      if (result.neighborhood) {
        const municipalityId = result.neighborhood.municipalityId;
        const municipality = await this.getMunicipalityById(municipalityId);
        
        if (municipality) {
          result.municipality = municipality;
          
          // Get region from municipality
          const region = await this.getRegionForMunicipalityId(municipalityId);
          if (region) {
            result.region = region;
          }
        }
        
        // We've found the complete hierarchy, return it
        if (result.neighborhood && result.municipality && result.region) {
          return result;
        }
      }
    }
    
    // Try to find municipality by city name
    if (city && !result.municipality) {
      const municipality = await this.getMunicipalityByName(city);
      if (municipality) {
        result.municipality = municipality;
        
        // Get region from municipality
        const region = await this.getRegionForMunicipalityId(municipality.id);
        if (region) {
          result.region = region;
        }
      }
    }
    
    // Try township/range mapping
    if (township_code && range_code && (!result.neighborhood || !result.municipality)) {
      const townshipRangeMapping = await this.mapByTownshipRange(township_code, range_code);
      
      if (townshipRangeMapping.municipality && !result.municipality) {
        result.municipality = townshipRangeMapping.municipality;
        
        // Get region if not already found
        if (!result.region && townshipRangeMapping.municipality.id) {
          const region = await this.getRegionForMunicipalityId(townshipRangeMapping.municipality.id);
          if (region) {
            result.region = region;
          }
        }
      }
    }
    
    // If we have full property data but still couldn't map it, try AI analysis
    if (property && (!result.neighborhood || !result.municipality || !result.region)) {
      try {
        const aiAnalysis = await this.analyzePropertyGeographyWithAI(property);
        
        // Update any missing pieces with AI suggestions
        if (aiAnalysis.municipalityName && !result.municipality) {
          const municipality = await this.getMunicipalityByName(aiAnalysis.municipalityName);
          if (municipality) {
            result.municipality = municipality;
            
            // Get region if not already found
            if (!result.region) {
              const region = await this.getRegionForMunicipalityId(municipality.id);
              if (region) {
                result.region = region;
              }
            }
          }
        }
        
        // If we have hood_cd but no neighborhood match, create a new one
        if (hood_cd && !result.neighborhood && result.municipality) {
          // Create a new neighborhood mapping based on AI suggestions
          const newNeighborhood = await this.createNeighborhoodMapping(
            hood_cd,
            result.municipality.id,
            aiAnalysis.neighborhoodName || `Neighborhood ${hood_cd}`
          );
          
          if (newNeighborhood) {
            result.neighborhood = newNeighborhood;
          }
        }
      } catch (error) {
        console.warn('AI analysis of property geography failed:', error);
        // Continue with what we have - AI is just an enhancement
      }
    }
    
    return result;
  }

  /**
   * Convert a GeographicNeighborhood to Neighborhood for our use
   */
  private convertToNeighborhood(geoNeighborhood: any): Neighborhood {
    return {
      id: geoNeighborhood.id,
      municipalityId: geoNeighborhood.municipalityId || 0, // Default to 0 if null to match type
      hood_cd: geoNeighborhood.hoodCd,
      name: geoNeighborhood.name,
      description: geoNeighborhood.description
    };
  }

  /**
   * Get neighborhood by hood_cd
   */
  private async getNeighborhoodByHoodCd(hood_cd: string): Promise<Neighborhood | undefined> {
    try {
      // Use the schema's geographicNeighborhoods table
      const [neighborhood] = await db
        .select()
        .from(schema.geographicNeighborhoods)
        .where(eq(schema.geographicNeighborhoods.hoodCd, hood_cd));
      
      return neighborhood ? this.convertToNeighborhood(neighborhood) : undefined;
    } catch (error) {
      console.error(`Error getting neighborhood by hood_cd ${hood_cd}:`, error);
      return undefined;
    }
  }

  /**
   * Get municipality by ID
   */
  private async getMunicipalityById(id: number): Promise<Municipality | undefined> {
    try {
      const [municipality] = await db
        .select()
        .from(schema.geographicMunicipalities)
        .where(eq(schema.geographicMunicipalities.id, id));
      
      return municipality ? this.convertToMunicipality(municipality) : undefined;
    } catch (error) {
      console.error(`Error getting municipality by ID ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Convert a GeographicMunicipality to Municipality for our use
   */
  private convertToMunicipality(geoMunicipality: any): Municipality {
    return {
      id: geoMunicipality.id,
      regionId: geoMunicipality.regionId,
      name: geoMunicipality.name,
      code: geoMunicipality.municipalityCode, // Use municipalityCode as code
      description: geoMunicipality.description
    };
  }

  /**
   * Get municipality by name (case insensitive)
   */
  private async getMunicipalityByName(name: string): Promise<Municipality | undefined> {
    try {
      // Convert to lowercase for comparison
      const lowercaseName = name.toLowerCase();
      
      // Get all municipalities and find one that matches case-insensitive
      const municipalities = await db
        .select()
        .from(schema.geographicMunicipalities);
      
      const match = municipalities.find(m => 
        m.name.toLowerCase() === lowercaseName ||
        m.name.toLowerCase().includes(lowercaseName) ||
        lowercaseName.includes(m.name.toLowerCase())
      );
      
      return match ? this.convertToMunicipality(match) : undefined;
    } catch (error) {
      console.error(`Error getting municipality by name ${name}:`, error);
      return undefined;
    }
  }

  /**
   * Convert a GeographicRegion to Region for our use
   */
  private convertToRegion(geoRegion: any): Region {
    return {
      id: geoRegion.id,
      code: geoRegion.regionCode, // Use regionCode as code
      name: geoRegion.name,
      description: geoRegion.description,
      county: geoRegion.countyCode || 'Benton' // Add required county field
    };
  }

  /**
   * Get region for a municipality
   */
  private async getRegionForMunicipalityId(municipalityId: number): Promise<Region | undefined> {
    try {
      const [municipality] = await db
        .select()
        .from(schema.geographicMunicipalities)
        .where(eq(schema.geographicMunicipalities.id, municipalityId));
      
      if (municipality && municipality.regionId) {
        const [region] = await db
          .select()
          .from(schema.geographicRegions)
          .where(eq(schema.geographicRegions.id, municipality.regionId));
        
        // Convert to our Region type
        if (region) {
          return this.convertToRegion(region);
        }
      }
      
      return undefined;
    } catch (error) {
      console.error(`Error getting region for municipality ID ${municipalityId}:`, error);
      return undefined;
    }
  }

  /**
   * Map by township and range
   */
  private async mapByTownshipRange(township_code: string, range_code: string): Promise<{
    municipality?: Municipality;
    region?: Region;
  }> {
    // Since we don't have a township_range_mapping table yet, use hard-coded mappings
    // based on known patterns in Benton County
    
    // This would ideally be replaced with a proper database table
    const townshipRangeMappings: {[key: string]: string} = {
      // Format is township_code-range_code: municipalityName
      '9N-24E': 'Richland',
      '9N-25E': 'Richland',
      '9N-26E': 'Richland',
      '9N-27E': 'Richland',
      '9N-28E': 'Richland',
      '9N-29E': 'Richland',
      '10N-26E': 'West Richland',
      '10N-27E': 'West Richland',
      '10N-28E': 'Benton City',
      '8N-24E': 'Kennewick',
      '8N-28E': 'Kennewick',
      '8N-29E': 'Kennewick',
      '8N-30E': 'Kennewick',
      '7N-29E': 'Finley',
      '7N-30E': 'Finley',
      '6N-25E': 'Prosser',
      '6N-26E': 'Prosser',
      '6N-27E': 'Prosser'
    };
    
    const key = `${township_code}-${range_code}`;
    const municipalityName = townshipRangeMappings[key];
    
    if (!municipalityName) {
      return {};
    }
    
    // Look up the municipality by name
    const municipality = await this.getMunicipalityByName(municipalityName);
    
    return { municipality };
  }

  /**
   * Use Anthropic AI to analyze property data for geographic context
   */
  private async analyzePropertyGeographyWithAI(propertyData: any): Promise<{
    municipalityName?: string;
    neighborhoodName?: string;
    regionName?: string;
  }> {
    // Skip if no API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not set, skipping AI analysis');
      return {};
    }
    
    try {
      console.log('Analyzing property geography with Anthropic Claude');
      
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 1024,
        system: `You are a geographic data analyst specializing in Benton County, Washington property records. 
        Your task is to analyze property records and extract the most likely municipality, neighborhood name, and region.
        Return your analysis as a JSON object with fields: municipalityName, neighborhoodName, and regionName.
        
        Common municipalities in Benton County include:
        - Richland
        - Kennewick
        - West Richland
        - Prosser
        - Benton City
        - Finley`,
        messages: [
          {
            role: 'user',
            content: `Analyze this Benton County property record and determine the municipality, neighborhood, and region:
            ${JSON.stringify(propertyData, null, 2)}
            
            Return only a JSON object with municipalityName, neighborhoodName, and regionName fields.`
          }
        ],
      });
      
      // Extract JSON from the response
      const content = response.content[0].text;
      
      // Try to parse JSON from the response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          return JSON.parse(jsonStr);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
      }
      
      return {};
    } catch (error) {
      console.error('Error analyzing property with AI:', error);
      return {};
    }
  }

  /**
   * Create a new neighborhood mapping
   */
  async createNeighborhoodMapping(hood_cd: string, municipalityId: number, name?: string): Promise<Neighborhood> {
    try {
      // Check if neighborhood already exists
      const existing = await this.getNeighborhoodByHoodCd(hood_cd);
      if (existing) {
        return existing; // Already converted by getNeighborhoodByHoodCd
      }
      
      // Create new neighborhood
      const [neighborhood] = await db
        .insert(schema.geographicNeighborhoods)
        .values({
          hoodCd: hood_cd,
          municipalityId: municipalityId || 0, // Ensure we never insert null
          name: name || `Neighborhood ${hood_cd}`,
          description: `Auto-mapped from property data with hood_cd ${hood_cd}`
        })
        .returning();
      
      // Convert to our Neighborhood type using our converter
      return this.convertToNeighborhood(neighborhood);
    } catch (error) {
      console.error(`Error creating neighborhood mapping for hood_cd ${hood_cd}:`, error);
      throw new Error(`Failed to create neighborhood mapping: ${error.message}`);
    }
  }
}

export const geoMappingAgent = new GeoMappingAgent();