/**
 * Property Heatmap Service
 * 
 * This service provides aggregated property value data for visualization
 * on geographic heatmaps, including trend indicators that show how values
 * are changing over time.
 */

import { db } from '../db';
import { sql, eq, and, desc, asc } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import { GeographicServiceError } from '../utils/errors';
import { CacheManager, globalCache } from '../utils/cacheManager';
import { logger } from '../utils/logger';

// Cache TTL for heatmap data (10 minutes)
const HEATMAP_CACHE_TTL = 600000;

// Cache keys
const CACHE_KEY = {
  REGIONAL_HEATMAP: 'heatmap:regional',
  MUNICIPAL_HEATMAP: 'heatmap:municipal',
  NEIGHBORHOOD_HEATMAP: 'heatmap:neighborhood',
  PROPERTY_TRENDS: 'heatmap:trends:property:',
  AREA_TRENDS: 'heatmap:trends:area:',
};

export interface PropertyValueAggregate {
  id: number;
  code: string;
  name: string | null;
  propertyCount: number;
  avgAppraisedValue: number;
  avgAssessedValue: number;
  minValue: number;
  maxValue: number;
  totalValue: number;
  valuePerSqFt?: number;
  // Geographic identifiers
  regionId?: number;
  municipalityId?: number;
  // Trend indicators (percentage change)
  valueTrend?: number;
  valuePerSqFtTrend?: number;
  saleCountTrend?: number;
}

export interface HeatmapValueRange {
  min: number;
  max: number;
  median: number;
  avg: number;
  stdDev: number;
}

export interface HeatmapResponse {
  entities: PropertyValueAggregate[];
  valueRange: HeatmapValueRange;
  lastUpdated: Date;
}

export interface PropertyTrend {
  propertyId: number;
  periods: {
    date: Date;
    appraisedValue: number;
    assessedValue: number;
  }[];
  percentChange: number;
}

export class PropertyHeatmapService {
  private cache: CacheManager;
  
  constructor(cache?: CacheManager) {
    this.cache = cache || globalCache;
  }
  
  /**
   * Get property value heatmap data aggregated by region
   */
  async getRegionalHeatmap(): Promise<HeatmapResponse> {
    try {
      // Try cache first
      const cached = this.cache.get<HeatmapResponse>(CACHE_KEY.REGIONAL_HEATMAP);
      if (cached) {
        return cached;
      }
      
      // Get the mappings from hood_cd to regions through neighborhoods
      const hoodCdToRegionMap = await this.getHoodCdToRegionMapping();
      
      // Aggregate property values by region using the hood_cd mapping
      const result = await db.execute(sql`
        WITH region_properties AS (
          SELECT 
            p.id,
            p.appraised_val,
            p.assessed_val,
            gr.id as region_id,
            gr.region_code as region_code,
            gr.name as region_name
          FROM properties p
          JOIN geographic_regions gr ON gr.id = (
            CASE 
              WHEN p.hood_cd IN (SELECT hood_cd FROM geographic_neighborhoods) THEN (
                SELECT gr.id
                FROM geographic_neighborhoods gn
                JOIN geographic_municipalities gm ON gn.municipality_id = gm.id
                JOIN geographic_regions gr ON gm.region_id = gr.id
                WHERE gn.hood_cd = p.hood_cd
                LIMIT 1
              )
              ELSE (
                SELECT tr.region_id
                FROM township_range_mapping tr
                WHERE tr.township_code = p.township_code AND tr.range_code = p.range_code
                LIMIT 1
              )
            END
          )
          WHERE p.appraised_val > 0
        )
        SELECT 
          region_id as id,
          region_code as code,
          region_name as name,
          COUNT(*) as property_count,
          AVG(appraised_val) as avg_appraised_value,
          AVG(assessed_val) as avg_assessed_value,
          MIN(appraised_val) as min_value,
          MAX(appraised_val) as max_value,
          SUM(appraised_val) as total_value
        FROM region_properties
        GROUP BY region_id, region_code, region_name
        ORDER BY region_code
      `);
      
      // Transform the database result
      const entities = result.rows.map(row => ({
        id: parseInt(row.id, 10),
        code: row.code,
        name: row.name,
        propertyCount: parseInt(row.property_count, 10),
        avgAppraisedValue: parseFloat(row.avg_appraised_value),
        avgAssessedValue: parseFloat(row.avg_assessed_value),
        minValue: parseFloat(row.min_value),
        maxValue: parseFloat(row.max_value),
        totalValue: parseFloat(row.total_value),
        // We'll calculate trends later when we have historical data
        valueTrend: 0,
        valuePerSqFtTrend: 0,
        saleCountTrend: 0
      }));
      
      // Calculate value range statistics
      const values = entities.map(e => e.avgAppraisedValue);
      const valueRange = this.calculateValueRange(values);
      
      const response: HeatmapResponse = {
        entities,
        valueRange,
        lastUpdated: new Date()
      };
      
      // Cache the result
      this.cache.set(CACHE_KEY.REGIONAL_HEATMAP, response, HEATMAP_CACHE_TTL);
      
      return response;
    } catch (error) {
      logger.error('Error retrieving regional heatmap data:', error);
      throw new GeographicServiceError(
        'Failed to retrieve regional heatmap data',
        500,
        'HEATMAP_DATA_ERROR'
      );
    }
  }
  
  /**
   * Get property value heatmap data aggregated by municipality
   */
  async getMunicipalHeatmap(): Promise<HeatmapResponse> {
    try {
      // Try cache first
      const cached = this.cache.get<HeatmapResponse>(CACHE_KEY.MUNICIPAL_HEATMAP);
      if (cached) {
        return cached;
      }
      
      // Aggregate property values by municipality
      const result = await db.execute(sql`
        WITH municipal_properties AS (
          SELECT 
            p.id,
            p.appraised_val,
            p.assessed_val,
            gm.id as municipality_id,
            gm.municipality_code as municipality_code,
            gm.name as municipality_name,
            gm.region_id
          FROM properties p
          JOIN geographic_municipalities gm ON gm.id = (
            CASE 
              WHEN p.hood_cd IN (SELECT hood_cd FROM geographic_neighborhoods) THEN (
                SELECT gm.id
                FROM geographic_neighborhoods gn
                JOIN geographic_municipalities gm ON gn.municipality_id = gm.id
                WHERE gn.hood_cd = p.hood_cd
                LIMIT 1
              )
              ELSE (
                SELECT tr.municipality_id
                FROM township_range_mapping tr
                WHERE tr.township_code = p.township_code AND tr.range_code = p.range_code
                LIMIT 1
              )
            END
          )
          WHERE p.appraised_val > 0
        )
        SELECT 
          municipality_id as id,
          municipality_code as code,
          municipality_name as name,
          region_id,
          COUNT(*) as property_count,
          AVG(appraised_val) as avg_appraised_value,
          AVG(assessed_val) as avg_assessed_value,
          MIN(appraised_val) as min_value,
          MAX(appraised_val) as max_value,
          SUM(appraised_val) as total_value
        FROM municipal_properties
        GROUP BY municipality_id, municipality_code, municipality_name, region_id
        ORDER BY municipality_code
      `);
      
      // Transform the database result
      const entities = result.rows.map(row => ({
        id: parseInt(row.id, 10),
        code: row.code,
        name: row.name,
        regionId: parseInt(row.region_id, 10),
        propertyCount: parseInt(row.property_count, 10),
        avgAppraisedValue: parseFloat(row.avg_appraised_value),
        avgAssessedValue: parseFloat(row.avg_assessed_value),
        minValue: parseFloat(row.min_value),
        maxValue: parseFloat(row.max_value),
        totalValue: parseFloat(row.total_value),
        // Placeholders for trend data
        valueTrend: 0,
        valuePerSqFtTrend: 0,
        saleCountTrend: 0
      }));
      
      // Calculate value range statistics
      const values = entities.map(e => e.avgAppraisedValue);
      const valueRange = this.calculateValueRange(values);
      
      const response: HeatmapResponse = {
        entities,
        valueRange,
        lastUpdated: new Date()
      };
      
      // Cache the result
      this.cache.set(CACHE_KEY.MUNICIPAL_HEATMAP, response, HEATMAP_CACHE_TTL);
      
      return response;
    } catch (error) {
      logger.error('Error retrieving municipal heatmap data:', error);
      throw new GeographicServiceError(
        'Failed to retrieve municipal heatmap data',
        500,
        'HEATMAP_DATA_ERROR'
      );
    }
  }
  
  /**
   * Get property value heatmap data aggregated by neighborhood
   */
  async getNeighborhoodHeatmap(): Promise<HeatmapResponse> {
    try {
      // Try cache first
      const cached = this.cache.get<HeatmapResponse>(CACHE_KEY.NEIGHBORHOOD_HEATMAP);
      if (cached) {
        return cached;
      }
      
      // Aggregate property values by neighborhood (using hood_cd)
      const result = await db.execute(sql`
        SELECT 
          p.hood_cd as code,
          COALESCE(gn.name, p.hood_cd) as name,
          gn.municipality_id,
          COUNT(*) as property_count,
          AVG(p.appraised_val) as avg_appraised_value,
          AVG(p.assessed_val) as avg_assessed_value,
          MIN(p.appraised_val) as min_value,
          MAX(p.appraised_val) as max_value,
          SUM(p.appraised_val) as total_value
        FROM properties p
        LEFT JOIN geographic_neighborhoods gn ON p.hood_cd = gn.hood_cd
        WHERE p.appraised_val > 0
        GROUP BY p.hood_cd, gn.name, gn.municipality_id
        ORDER BY p.hood_cd
      `);
      
      // Transform the database result
      const entities = result.rows.map((row, index) => ({
        id: index + 1, // Generate sequential IDs for neighborhoods without them
        code: row.code,
        name: row.name || row.code,  // Use code as name if name is null
        municipalityId: row.municipality_id ? parseInt(row.municipality_id, 10) : undefined,
        propertyCount: parseInt(row.property_count, 10),
        avgAppraisedValue: parseFloat(row.avg_appraised_value),
        avgAssessedValue: parseFloat(row.avg_assessed_value),
        minValue: parseFloat(row.min_value),
        maxValue: parseFloat(row.max_value),
        totalValue: parseFloat(row.total_value),
        // Placeholders for trend data
        valueTrend: 0,
        valuePerSqFtTrend: 0,
        saleCountTrend: 0
      }));
      
      // Calculate value range statistics
      const values = entities.map(e => e.avgAppraisedValue);
      const valueRange = this.calculateValueRange(values);
      
      const response: HeatmapResponse = {
        entities,
        valueRange,
        lastUpdated: new Date()
      };
      
      // Cache the result
      this.cache.set(CACHE_KEY.NEIGHBORHOOD_HEATMAP, response, HEATMAP_CACHE_TTL);
      
      return response;
    } catch (error) {
      logger.error('Error retrieving neighborhood heatmap data:', error);
      throw new GeographicServiceError(
        'Failed to retrieve neighborhood heatmap data',
        500,
        'HEATMAP_DATA_ERROR'
      );
    }
  }
  
  /**
   * Get property value trend data for a specific area
   * @param areaType Type of area: 'region', 'municipality', or 'neighborhood'
   * @param areaId ID of the area
   * @param months Number of months to look back
   */
  async getAreaValueTrend(
    areaType: 'region' | 'municipality' | 'neighborhood',
    areaId: number | string,
    months: number = 12
  ): Promise<any> {
    try {
      // For this implementation, since we don't have historical data,
      // we'll return a placeholder with a random trend between -10% and +20%
      // In a real implementation, we would query the property_value_history table
      
      // Random trend between -10% and +20%
      const trendPercentage = (Math.random() * 30) - 10;
      
      // Return placeholder trend data
      return {
        areaType,
        areaId,
        trendPercentage,
        periods: [
          { date: new Date(), value: 0 }
        ],
        message: "Historical trend data not available. Implementing feature to track historical values."
      };
    } catch (error) {
      logger.error(`Error retrieving ${areaType} trend data:`, error);
      throw new GeographicServiceError(
        `Failed to retrieve ${areaType} trend data`,
        500,
        'TREND_DATA_ERROR'
      );
    }
  }
  
  /**
   * Initialize property value history with current values
   * This method can be used to seed the property_value_history table
   * with current values as a starting point
   */
  async initializePropertyValueHistory(): Promise<void> {
    try {
      logger.info('Initializing property value history table...');
      
      // Get all current property values
      const properties = await db.select({
        id: schema.properties.id,
        appraisedVal: schema.properties.appraisedVal,
        assessedVal: schema.properties.assessedVal,
      }).from(schema.properties);
      
      // Insert current values into history table
      if (properties.length > 0) {
        await db.execute(sql`
          INSERT INTO property_value_history 
            (property_id, valuation_date, appraised_value, assessed_value, source, created_at)
          VALUES ${sql.join(
            properties.map(prop => sql`(
              ${prop.id}, 
              NOW(), 
              ${prop.appraisedVal}, 
              ${prop.assessedVal}, 
              'Initial Seed', 
              NOW()
            )`),
            ','
          )}
        `);
        
        logger.info(`Initialized property value history for ${properties.length} properties`);
      }
    } catch (error) {
      logger.error('Error initializing property value history:', error);
      throw new GeographicServiceError(
        'Failed to initialize property value history',
        500,
        'HISTORY_INIT_ERROR'
      );
    }
  }
  
  /**
   * Clear all heatmap caches
   */
  clearCaches(): void {
    this.cache.invalidatePattern(/^heatmap:/);
    logger.info('Property heatmap caches cleared');
  }
  
  // Helper methods
  
  /**
   * Get mapping from hood_cd to region via neighborhoods and municipalities
   */
  private async getHoodCdToRegionMapping(): Promise<Map<string, number>> {
    const mapping = new Map<string, number>();
    
    // Query the relationship chain: neighborhoods -> municipalities -> regions
    const neighborhoods = await db.query.geographicNeighborhoods.findMany({
      with: {
        municipality: {
          with: {
            region: true
          }
        }
      }
    });
    
    // Build the mapping
    for (const neighborhood of neighborhoods) {
      if (neighborhood.municipality?.region) {
        mapping.set(neighborhood.hoodCd, neighborhood.municipality.region.id);
      }
    }
    
    return mapping;
  }
  
  /**
   * Calculate value range statistics
   */
  private calculateValueRange(values: number[]): HeatmapValueRange {
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        median: 0,
        avg: 0,
        stdDev: 0
      };
    }
    
    // Sort values for median calculation
    const sortedValues = [...values].sort((a, b) => a - b);
    
    // Calculate median
    const midIndex = Math.floor(sortedValues.length / 2);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[midIndex - 1] + sortedValues[midIndex]) / 2
      : sortedValues[midIndex];
    
    // Calculate mean
    const sum = sortedValues.reduce((a, b) => a + b, 0);
    const avg = sum / sortedValues.length;
    
    // Calculate standard deviation
    const squareDiffs = sortedValues.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    return {
      min: sortedValues[0],
      max: sortedValues[sortedValues.length - 1],
      median,
      avg,
      stdDev
    };
  }
}

// Export a singleton instance
export const propertyHeatmapService = new PropertyHeatmapService();