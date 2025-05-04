/**
 * Property Heatmap Service
 * 
 * This service provides aggregated property value data for visualization
 * on geographic heatmaps, including trend indicators that show how values
 * are changing over time.
 */

import { db } from '../db';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { 
  properties, 
  propertyValueHistory, 
  geographicRegions, 
  geographicMunicipalities, 
  geographicNeighborhoods 
} from '../../shared/schema';
import { CacheManager } from '../utils/cacheManager';

const CACHE_TTL = 3600; // 1 hour cache expiration

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
    this.cache = cache || new CacheManager();
  }

  /**
   * Get property value heatmap data aggregated by region
   */
  async getRegionalHeatmap(): Promise<HeatmapResponse> {
    const cacheKey = 'heatmap:region';
    const cachedData = this.cache.get<HeatmapResponse>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // Get the latest value history date to use for calculations
      const [latestEntry] = await db
        .select({ valuationDate: propertyValueHistory.valuationDate })
        .from(propertyValueHistory)
        .orderBy(desc(propertyValueHistory.valuationDate))
        .limit(1);

      if (!latestEntry) {
        return {
          entities: [],
          valueRange: { min: 0, max: 0, median: 0, avg: 0, stdDev: 0 },
          lastUpdated: new Date()
        };
      }

      // Get region data with aggregated property values
      const regionsData = await db.execute(sql`
        SELECT 
          gr.id, 
          gr.region_code as code, 
          gr.name,
          COUNT(DISTINCT p.id) as property_count,
          AVG(pvh.appraised_value) as avg_appraised_value,
          AVG(pvh.assessed_value) as avg_assessed_value,
          MIN(pvh.appraised_value) as min_value,
          MAX(pvh.appraised_value) as max_value,
          SUM(pvh.appraised_value) as total_value
        FROM 
          geographic_regions gr
        LEFT JOIN 
          properties p ON p.meta_data->>'region_id' = gr.id::text
        LEFT JOIN 
          property_value_history pvh ON pvh.property_id = p.id
        WHERE 
          pvh.valuation_date = ${latestEntry.valuationDate}
        GROUP BY 
          gr.id, gr.region_code, gr.name
        ORDER BY 
          gr.name
      `);

      // Calculate trends
      const regions = await this.calculateRegionTrends(regionsData.rows);
      
      // Calculate value range statistics
      const valueRange = this.calculateValueRange(
        regions.map(r => Number(r.avgAppraisedValue))
      );

      const response: HeatmapResponse = {
        entities: regions,
        valueRange,
        lastUpdated: new Date()
      };

      // Cache the response
      this.cache.set(cacheKey, response, CACHE_TTL);
      
      return response;
    } catch (error) {
      console.error('Error getting regional heatmap data:', error);
      throw new Error('Failed to retrieve regional heatmap data');
    }
  }

  /**
   * Get property value heatmap data aggregated by municipality
   */
  async getMunicipalHeatmap(): Promise<HeatmapResponse> {
    const cacheKey = 'heatmap:municipality';
    const cachedData = this.cache.get<HeatmapResponse>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // Get the latest value history date to use for calculations
      const [latestEntry] = await db
        .select({ valuationDate: propertyValueHistory.valuationDate })
        .from(propertyValueHistory)
        .orderBy(desc(propertyValueHistory.valuationDate))
        .limit(1);

      if (!latestEntry) {
        return {
          entities: [],
          valueRange: { min: 0, max: 0, median: 0, avg: 0, stdDev: 0 },
          lastUpdated: new Date()
        };
      }

      // Get municipality data with aggregated property values
      const municipalityData = await db.execute(sql`
        SELECT 
          gm.id, 
          gm.municipality_code as code, 
          gm.name,
          gm.region_id as region_id,
          COUNT(DISTINCT p.id) as property_count,
          AVG(pvh.appraised_value) as avg_appraised_value,
          AVG(pvh.assessed_value) as avg_assessed_value,
          MIN(pvh.appraised_value) as min_value,
          MAX(pvh.appraised_value) as max_value,
          SUM(pvh.appraised_value) as total_value
        FROM 
          geographic_municipalities gm
        LEFT JOIN 
          properties p ON p.meta_data->>'municipality_id' = gm.id::text
        LEFT JOIN 
          property_value_history pvh ON pvh.property_id = p.id
        WHERE 
          pvh.valuation_date = ${latestEntry.valuationDate}
        GROUP BY 
          gm.id, gm.municipality_code, gm.name, gm.region_id
        ORDER BY 
          gm.name
      `);

      // Calculate trends
      const municipalities = await this.calculateMunicipalityTrends(municipalityData.rows);
      
      // Calculate value range statistics
      const valueRange = this.calculateValueRange(
        municipalities.map(m => Number(m.avgAppraisedValue))
      );

      const response: HeatmapResponse = {
        entities: municipalities,
        valueRange,
        lastUpdated: new Date()
      };

      // Cache the response
      this.cache.set(cacheKey, response, CACHE_TTL);
      
      return response;
    } catch (error) {
      console.error('Error getting municipality heatmap data:', error);
      throw new Error('Failed to retrieve municipality heatmap data');
    }
  }

  /**
   * Get property value heatmap data aggregated by neighborhood
   */
  async getNeighborhoodHeatmap(): Promise<HeatmapResponse> {
    const cacheKey = 'heatmap:neighborhood';
    const cachedData = this.cache.get<HeatmapResponse>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // Get the latest value history date to use for calculations
      const [latestEntry] = await db
        .select({ valuationDate: propertyValueHistory.valuationDate })
        .from(propertyValueHistory)
        .orderBy(desc(propertyValueHistory.valuationDate))
        .limit(1);

      if (!latestEntry) {
        return {
          entities: [],
          valueRange: { min: 0, max: 0, median: 0, avg: 0, stdDev: 0 },
          lastUpdated: new Date()
        };
      }

      // Get mapping of hood_cd to region
      const hoodToRegionMap = await this.getHoodCdToRegionMapping();

      // Get neighborhood data with aggregated property values
      const neighborhoodData = await db.execute(sql`
        SELECT 
          gn.id, 
          gn.hood_cd as code, 
          gn.name,
          gn.municipality_id as municipality_id,
          COUNT(DISTINCT p.id) as property_count,
          AVG(pvh.appraised_value) as avg_appraised_value,
          AVG(pvh.assessed_value) as avg_assessed_value,
          MIN(pvh.appraised_value) as min_value,
          MAX(pvh.appraised_value) as max_value,
          SUM(pvh.appraised_value) as total_value
        FROM 
          geographic_neighborhoods gn
        LEFT JOIN 
          properties p ON p.meta_data->>'hood_cd' = gn.hood_cd
        LEFT JOIN 
          property_value_history pvh ON pvh.property_id = p.id
        WHERE 
          pvh.valuation_date = ${latestEntry.valuationDate}
        GROUP BY 
          gn.id, gn.hood_cd, gn.name, gn.municipality_id
        ORDER BY 
          gn.name
      `);

      // Calculate trends
      const neighborhoods = await this.calculateNeighborhoodTrends(neighborhoodData.rows);
      
      // Calculate value range statistics
      const valueRange = this.calculateValueRange(
        neighborhoods.map(n => Number(n.avgAppraisedValue))
      );

      const response: HeatmapResponse = {
        entities: neighborhoods,
        valueRange,
        lastUpdated: new Date()
      };

      // Cache the response
      this.cache.set(cacheKey, response, CACHE_TTL);
      
      return response;
    } catch (error) {
      console.error('Error getting neighborhood heatmap data:', error);
      throw new Error('Failed to retrieve neighborhood heatmap data');
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
    areaId: number,
    months: number = 12
  ): Promise<PropertyTrend[]> {
    const cacheKey = `trend:${areaType}:${areaId}:${months}`;
    const cachedData = this.cache.get<PropertyTrend[]>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // Calculate the date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      let propertyIds: number[] = [];

      // Get properties in the specified area
      if (areaType === 'region') {
        const properties = await db.execute(sql`
          SELECT p.id
          FROM properties p
          WHERE p.meta_data->>'region_id' = ${areaId.toString()}
        `);
        propertyIds = properties.rows.map(row => row.id);
      } else if (areaType === 'municipality') {
        const properties = await db.execute(sql`
          SELECT p.id
          FROM properties p
          WHERE p.meta_data->>'municipality_id' = ${areaId.toString()}
        `);
        propertyIds = properties.rows.map(row => row.id);
      } else if (areaType === 'neighborhood') {
        const neighborhood = await db
          .select()
          .from(geographicNeighborhoods)
          .where(eq(geographicNeighborhoods.id, areaId))
          .limit(1);

        if (neighborhood && neighborhood.length > 0) {
          const properties = await db.execute(sql`
            SELECT p.id
            FROM properties p
            WHERE p.meta_data->>'hood_cd' = ${neighborhood[0].hoodCd}
          `);
          propertyIds = properties.rows.map(row => row.id);
        }
      }

      if (propertyIds.length === 0) {
        return [];
      }

      // Get property value history for the properties in the area
      const trends: PropertyTrend[] = [];

      for (const propertyId of propertyIds) {
        const valueHistory = await db
          .select({
            valuationDate: propertyValueHistory.valuationDate,
            appraisedValue: propertyValueHistory.appraisedValue,
            assessedValue: propertyValueHistory.assessedValue
          })
          .from(propertyValueHistory)
          .where(and(
            eq(propertyValueHistory.propertyId, propertyId),
            gte(propertyValueHistory.valuationDate, startDate),
            lte(propertyValueHistory.valuationDate, endDate)
          ))
          .orderBy(propertyValueHistory.valuationDate);

        if (valueHistory.length >= 2) {
          const firstValue = Number(valueHistory[0].appraisedValue);
          const lastValue = Number(valueHistory[valueHistory.length - 1].appraisedValue);
          const percentChange = firstValue > 0 
            ? ((lastValue - firstValue) / firstValue) * 100 
            : 0;

          trends.push({
            propertyId,
            periods: valueHistory.map(vh => ({
              date: vh.valuationDate,
              appraisedValue: Number(vh.appraisedValue),
              assessedValue: Number(vh.assessedValue)
            })),
            percentChange
          });
        }
      }

      // Cache the results
      this.cache.set(cacheKey, trends, CACHE_TTL);

      return trends;
    } catch (error) {
      console.error(`Error getting ${areaType} value trend:`, error);
      throw new Error(`Failed to retrieve ${areaType} value trend data`);
    }
  }

  /**
   * Initialize property value history with current values
   * This method can be used to seed the property_value_history table
   * with current values as a starting point
   */
  async initializePropertyValueHistory(): Promise<void> {
    try {
      // Check if we already have data
      const [existingCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(propertyValueHistory);

      if (existingCount && existingCount.count > 0) {
        console.log(`Property value history already contains ${existingCount.count} records. Skipping initialization.`);
        return;
      }

      // Get all properties with their assessed values
      const allProperties = await db
        .select({
          id: properties.id,
          assessedValue: properties.assessedValue,
          totalValue: properties.totalValue,
          landValue: properties.landValue
        })
        .from(properties)
        .where(sql`assessed_value IS NOT NULL`);

      if (allProperties.length === 0) {
        console.log('No properties with assessed values found. Nothing to initialize.');
        return;
      }

      // Initialize with current date as valuation date
      const valuationDate = new Date();
      
      // Batch insert records
      const batchSize = 100;
      for (let i = 0; i < allProperties.length; i += batchSize) {
        const batch = allProperties.slice(i, i + batchSize);
        
        await db.transaction(async (tx) => {
          for (const property of batch) {
            await tx.insert(propertyValueHistory).values({
              propertyId: property.id,
              valuationDate,
              appraisedValue: property.totalValue || 0,
              assessedValue: property.assessedValue || 0,
              landValue: property.landValue || 0,
              source: 'system_initialization',
              assessmentYear: valuationDate.getFullYear()
            });
          }
        });
      }

      console.log(`Initialized property value history with ${allProperties.length} records.`);
    } catch (error) {
      console.error('Error initializing property value history:', error);
      throw new Error('Failed to initialize property value history');
    }
  }

  /**
   * Clear all heatmap caches
   */
  clearCaches(): void {
    this.cache.delete('heatmap:region');
    this.cache.delete('heatmap:municipality');
    this.cache.delete('heatmap:neighborhood');
    
    // Clear trend caches (pattern-based deletion)
    const trendKeys = this.cache.keys().filter(key => key.startsWith('trend:'));
    trendKeys.forEach(key => this.cache.delete(key));
    
    console.log(`Cleared ${3 + trendKeys.length} heatmap cache entries`);
  }

  private async getHoodCdToRegionMapping(): Promise<Map<string, number>> {
    const mapping = new Map<string, number>();
    
    // Get the mapping from neighborhoods to municipalities to regions
    const neighborhoods = await db
      .select({
        hoodCd: geographicNeighborhoods.hoodCd,
        municipalityId: geographicNeighborhoods.municipalityId
      })
      .from(geographicNeighborhoods);

    for (const neighborhood of neighborhoods) {
      if (neighborhood.municipalityId) {
        const [municipality] = await db
          .select({
            regionId: geographicMunicipalities.regionId
          })
          .from(geographicMunicipalities)
          .where(eq(geographicMunicipalities.id, neighborhood.municipalityId))
          .limit(1);

        if (municipality && municipality.regionId) {
          mapping.set(neighborhood.hoodCd, municipality.regionId);
        }
      }
    }

    return mapping;
  }

  /**
   * Calculate value range statistics
   */
  private calculateValueRange(values: number[]): HeatmapValueRange {
    if (values.length === 0) {
      return { min: 0, max: 0, median: 0, avg: 0, stdDev: 0 };
    }

    const filteredValues = values.filter(v => !isNaN(v));
    
    if (filteredValues.length === 0) {
      return { min: 0, max: 0, median: 0, avg: 0, stdDev: 0 };
    }

    // Sort for min, max, and median
    filteredValues.sort((a, b) => a - b);
    
    const min = filteredValues[0];
    const max = filteredValues[filteredValues.length - 1];
    
    let median: number;
    const mid = Math.floor(filteredValues.length / 2);
    if (filteredValues.length % 2 === 0) {
      median = (filteredValues[mid - 1] + filteredValues[mid]) / 2;
    } else {
      median = filteredValues[mid];
    }

    // Calculate average
    const sum = filteredValues.reduce((acc, val) => acc + val, 0);
    const avg = sum / filteredValues.length;

    // Calculate standard deviation
    const squareDiffs = filteredValues.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    return { min, max, median, avg, stdDev };
  }

  private async calculateRegionTrends(regions: any[]): Promise<PropertyValueAggregate[]> {
    // Get the previous period data (6 months ago) for trend calculation
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

    return Promise.all(regions.map(async (region) => {
      // Find previous period values
      const previousPeriodData = await db.execute(sql`
        SELECT 
          AVG(pvh.appraised_value) as avg_appraised_value
        FROM 
          geographic_regions gr
        LEFT JOIN 
          properties p ON p.meta_data->>'region_id' = gr.id::text
        LEFT JOIN 
          property_value_history pvh ON pvh.property_id = p.id
        WHERE 
          gr.id = ${region.id}
          AND pvh.valuation_date >= ${sixMonthsAgo}
          AND pvh.valuation_date < ${currentDate}
        GROUP BY 
          gr.id
        LIMIT 1
      `);

      // Calculate trend if previous data exists
      let valueTrend = 0;
      if (previousPeriodData.rows.length > 0 && previousPeriodData.rows[0].avg_appraised_value) {
        const previousValue = Number(previousPeriodData.rows[0].avg_appraised_value);
        const currentValue = Number(region.avg_appraised_value);
        
        if (previousValue > 0) {
          valueTrend = ((currentValue - previousValue) / previousValue) * 100;
        }
      }

      return {
        id: region.id,
        code: region.code,
        name: region.name,
        propertyCount: Number(region.property_count),
        avgAppraisedValue: Number(region.avg_appraised_value),
        avgAssessedValue: Number(region.avg_assessed_value),
        minValue: Number(region.min_value),
        maxValue: Number(region.max_value),
        totalValue: Number(region.total_value),
        valueTrend
      };
    }));
  }

  private async calculateMunicipalityTrends(municipalities: any[]): Promise<PropertyValueAggregate[]> {
    // Similar to calculateRegionTrends, but for municipalities
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

    return Promise.all(municipalities.map(async (municipality) => {
      // Find previous period values
      const previousPeriodData = await db.execute(sql`
        SELECT 
          AVG(pvh.appraised_value) as avg_appraised_value
        FROM 
          geographic_municipalities gm
        LEFT JOIN 
          properties p ON p.meta_data->>'municipality_id' = gm.id::text
        LEFT JOIN 
          property_value_history pvh ON pvh.property_id = p.id
        WHERE 
          gm.id = ${municipality.id}
          AND pvh.valuation_date >= ${sixMonthsAgo}
          AND pvh.valuation_date < ${currentDate}
        GROUP BY 
          gm.id
        LIMIT 1
      `);

      // Calculate trend if previous data exists
      let valueTrend = 0;
      if (previousPeriodData.rows.length > 0 && previousPeriodData.rows[0].avg_appraised_value) {
        const previousValue = Number(previousPeriodData.rows[0].avg_appraised_value);
        const currentValue = Number(municipality.avg_appraised_value);
        
        if (previousValue > 0) {
          valueTrend = ((currentValue - previousValue) / previousValue) * 100;
        }
      }

      return {
        id: municipality.id,
        code: municipality.code,
        name: municipality.name,
        propertyCount: Number(municipality.property_count),
        avgAppraisedValue: Number(municipality.avg_appraised_value),
        avgAssessedValue: Number(municipality.avg_assessed_value),
        minValue: Number(municipality.min_value),
        maxValue: Number(municipality.max_value),
        totalValue: Number(municipality.total_value),
        regionId: municipality.region_id,
        valueTrend
      };
    }));
  }

  private async calculateNeighborhoodTrends(neighborhoods: any[]): Promise<PropertyValueAggregate[]> {
    // Similar to calculateRegionTrends, but for neighborhoods
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

    return Promise.all(neighborhoods.map(async (neighborhood) => {
      // Find previous period values
      const previousPeriodData = await db.execute(sql`
        SELECT 
          AVG(pvh.appraised_value) as avg_appraised_value
        FROM 
          geographic_neighborhoods gn
        LEFT JOIN 
          properties p ON p.meta_data->>'hood_cd' = gn.hood_cd
        LEFT JOIN 
          property_value_history pvh ON pvh.property_id = p.id
        WHERE 
          gn.id = ${neighborhood.id}
          AND pvh.valuation_date >= ${sixMonthsAgo}
          AND pvh.valuation_date < ${currentDate}
        GROUP BY 
          gn.id
        LIMIT 1
      `);

      // Calculate trend if previous data exists
      let valueTrend = 0;
      if (previousPeriodData.rows.length > 0 && previousPeriodData.rows[0].avg_appraised_value) {
        const previousValue = Number(previousPeriodData.rows[0].avg_appraised_value);
        const currentValue = Number(neighborhood.avg_appraised_value);
        
        if (previousValue > 0) {
          valueTrend = ((currentValue - previousValue) / previousValue) * 100;
        }
      }

      return {
        id: neighborhood.id,
        code: neighborhood.code,
        name: neighborhood.name,
        propertyCount: Number(neighborhood.property_count),
        avgAppraisedValue: Number(neighborhood.avg_appraised_value),
        avgAssessedValue: Number(neighborhood.avg_assessed_value),
        minValue: Number(neighborhood.min_value),
        maxValue: Number(neighborhood.max_value),
        totalValue: Number(neighborhood.total_value),
        municipalityId: neighborhood.municipality_id,
        valueTrend
      };
    }));
  }
}

export const propertyHeatmapService = new PropertyHeatmapService();