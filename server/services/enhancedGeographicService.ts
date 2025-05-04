/**
 * Enhanced Geographic Service for Benton County Building System
 * 
 * This service improves upon the base geographic service by adding:
 * - Caching for frequently accessed geographic data
 * - Standardized error handling
 * - Performance optimizations
 * - Batch operations
 */

import { db } from '../db';
import { eq, and, or, like, sql, inArray } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import {
  GeographicRegion, GeographicMunicipality, GeographicNeighborhood,
  TownshipRangeMap, TaxCodeAreaMap, EnhancedCostMatrix,
  InsertGeographicRegion, InsertGeographicMunicipality, InsertGeographicNeighborhood,
  InsertTownshipRangeMap, InsertTaxCodeAreaMap, InsertEnhancedCostMatrix
} from '../../shared/schema';
import { CacheManager, globalCache } from '../utils/cacheManager';
import { GeographicServiceError } from '../utils/errors';
import { logger } from '../utils/logger';

// Cache TTL values (in milliseconds)
const CACHE_TTL = {
  REGIONS: 3600000, // 1 hour
  MUNICIPALITIES: 3600000, // 1 hour
  NEIGHBORHOODS: 3600000, // 1 hour
  TOWNSHIP_RANGE: 3600000, // 1 hour
  TCA: 3600000, // 1 hour
  COST_MATRIX: 3600000, // 1 hour
};

// Cache key prefixes
const CACHE_KEY = {
  REGION_BY_ID: 'region:id:',
  REGION_BY_CODE: 'region:code:',
  REGIONS_ALL: 'regions:all',
  MUNICIPALITY_BY_ID: 'municipality:id:',
  MUNICIPALITY_BY_CODE: 'municipality:code:',
  MUNICIPALITIES_BY_REGION: 'municipalities:region:',
  MUNICIPALITIES_ALL: 'municipalities:all',
  NEIGHBORHOOD_BY_ID: 'neighborhood:id:',
  NEIGHBORHOOD_BY_CODE: 'neighborhood:code:',
  NEIGHBORHOODS_BY_MUNICIPALITY: 'neighborhoods:municipality:',
  TOWNSHIP_RANGE: 'township-range:',
  TCA: 'tca:',
  COST_MATRIX: 'cost-matrix:',
  HIERARCHY_BY_HOOD_CD: 'hierarchy:hood-cd:',
};

/**
 * Enhanced geographic data service with caching and improved error handling
 */
export class EnhancedGeographicService {
  private cache: CacheManager;

  /**
   * Creates a new instance of EnhancedGeographicService
   * @param cache Optional cache manager (uses global cache if not provided)
   */
  constructor(cache?: CacheManager) {
    this.cache = cache || globalCache;
  }

  /**
   * Get all geographic regions
   * @returns List of all geographic regions
   */
  async getRegions(): Promise<GeographicRegion[]> {
    try {
      // Try to get from cache first
      const cachedRegions = this.cache.get<GeographicRegion[]>(CACHE_KEY.REGIONS_ALL);
      if (cachedRegions) {
        return cachedRegions;
      }

      // Query from database
      const regions = await db
        .select()
        .from(schema.geographicRegions)
        .where(eq(schema.geographicRegions.isActive, true));

      // Cache the result
      this.cache.set(CACHE_KEY.REGIONS_ALL, regions, CACHE_TTL.REGIONS);

      return regions;
    } catch (error) {
      logger.error('Error retrieving regions:', error);
      throw new GeographicServiceError(
        'Failed to retrieve geographic regions',
        500,
        'GEO_FETCH_ERROR'
      );
    }
  }

  /**
   * Get a geographic region by ID
   * @param id Region ID
   * @returns Geographic region or null if not found
   */
  async getRegionById(id: number): Promise<GeographicRegion> {
    try {
      // Try to get from cache first
      const cacheKey = `${CACHE_KEY.REGION_BY_ID}${id}`;
      const cachedRegion = this.cache.get<GeographicRegion>(cacheKey);
      if (cachedRegion) {
        return cachedRegion;
      }

      // Query from database
      const [region] = await db
        .select()
        .from(schema.geographicRegions)
        .where(eq(schema.geographicRegions.id, id));

      if (!region) {
        throw GeographicServiceError.entityNotFound('Region', id);
      }

      // Cache the result
      this.cache.set(cacheKey, region, CACHE_TTL.REGIONS);

      return region;
    } catch (error) {
      if (error instanceof GeographicServiceError) {
        throw error;
      }
      logger.error(`Error retrieving region with ID ${id}:`, error);
      throw new GeographicServiceError(
        `Failed to retrieve geographic region with ID ${id}`,
        500,
        'GEO_FETCH_ERROR'
      );
    }
  }

  /**
   * Get a geographic region by code
   * @param regionCode Region code
   * @returns Geographic region or null if not found
   */
  async getRegionByCode(regionCode: string): Promise<GeographicRegion> {
    try {
      // Try to get from cache first
      const cacheKey = `${CACHE_KEY.REGION_BY_CODE}${regionCode}`;
      const cachedRegion = this.cache.get<GeographicRegion>(cacheKey);
      if (cachedRegion) {
        return cachedRegion;
      }

      // Query from database
      const [region] = await db
        .select()
        .from(schema.geographicRegions)
        .where(eq(schema.geographicRegions.regionCode, regionCode));

      if (!region) {
        throw GeographicServiceError.entityNotFound('Region', regionCode);
      }

      // Cache the result
      this.cache.set(cacheKey, region, CACHE_TTL.REGIONS);

      return region;
    } catch (error) {
      if (error instanceof GeographicServiceError) {
        throw error;
      }
      logger.error(`Error retrieving region with code ${regionCode}:`, error);
      throw new GeographicServiceError(
        `Failed to retrieve geographic region with code ${regionCode}`,
        500,
        'GEO_FETCH_ERROR'
      );
    }
  }

  /**
   * Create a new geographic region
   * @param region Region data
   * @returns Created region
   */
  async createRegion(region: InsertGeographicRegion): Promise<GeographicRegion> {
    try {
      // Check if region with same code already exists
      try {
        const existingRegion = await this.getRegionByCode(region.regionCode);
        if (existingRegion) {
          throw GeographicServiceError.duplicateEntity('Region', region.regionCode);
        }
      } catch (error) {
        // If error is not found, that's good, continue
        if (!(error instanceof GeographicServiceError) || error.errorCode !== 'GEO_ENTITY_NOT_FOUND') {
          throw error;
        }
      }

      // Create new region
      const [createdRegion] = await db
        .insert(schema.geographicRegions)
        .values(region)
        .returning();

      if (!createdRegion) {
        throw new GeographicServiceError(
          'Failed to create region - no result returned',
          500,
          'GEO_CREATE_ERROR'
        );
      }

      // Invalidate relevant caches
      this.cache.delete(CACHE_KEY.REGIONS_ALL);
      this.cache.set(
        `${CACHE_KEY.REGION_BY_ID}${createdRegion.id}`,
        createdRegion,
        CACHE_TTL.REGIONS
      );
      this.cache.set(
        `${CACHE_KEY.REGION_BY_CODE}${createdRegion.regionCode}`,
        createdRegion,
        CACHE_TTL.REGIONS
      );

      return createdRegion;
    } catch (error) {
      if (error instanceof GeographicServiceError) {
        throw error;
      }
      logger.error('Error creating region:', error);
      throw new GeographicServiceError(
        'Failed to create geographic region',
        500,
        'GEO_CREATE_ERROR'
      );
    }
  }

  /**
   * Update a geographic region
   * @param id Region ID
   * @param region Updated region data
   * @returns Updated region
   */
  async updateRegion(id: number, region: Partial<GeographicRegion>): Promise<GeographicRegion> {
    try {
      // Ensure region exists
      await this.getRegionById(id);

      // Update region
      const [updatedRegion] = await db
        .update(schema.geographicRegions)
        .set({ ...region, updatedAt: new Date() })
        .where(eq(schema.geographicRegions.id, id))
        .returning();

      if (!updatedRegion) {
        throw new GeographicServiceError(
          'Failed to update region - no result returned',
          500,
          'GEO_UPDATE_ERROR'
        );
      }

      // Invalidate relevant caches
      this.cache.delete(CACHE_KEY.REGIONS_ALL);
      this.cache.delete(`${CACHE_KEY.REGION_BY_ID}${id}`);
      if (updatedRegion.regionCode) {
        this.cache.delete(`${CACHE_KEY.REGION_BY_CODE}${updatedRegion.regionCode}`);
      }

      // Update cache with new values
      this.cache.set(
        `${CACHE_KEY.REGION_BY_ID}${updatedRegion.id}`,
        updatedRegion,
        CACHE_TTL.REGIONS
      );
      this.cache.set(
        `${CACHE_KEY.REGION_BY_CODE}${updatedRegion.regionCode}`,
        updatedRegion,
        CACHE_TTL.REGIONS
      );

      return updatedRegion;
    } catch (error) {
      if (error instanceof GeographicServiceError) {
        throw error;
      }
      logger.error(`Error updating region with ID ${id}:`, error);
      throw new GeographicServiceError(
        `Failed to update geographic region with ID ${id}`,
        500,
        'GEO_UPDATE_ERROR'
      );
    }
  }

  /**
   * Create township/range mappings in bulk
   * @param mappings Array of township/range mappings
   * @returns Created mappings
   */
  async createTownshipRangeMappings(
    mappings: InsertTownshipRangeMap[]
  ): Promise<TownshipRangeMap[]> {
    try {
      if (!mappings.length) {
        return [];
      }

      // Insert all mappings in a single operation
      const createdMappings = await db
        .insert(schema.townshipRangeMapping)
        .values(mappings)
        .returning();

      // Invalidate caches for each township/range pair
      for (const mapping of createdMappings) {
        const cacheKey = `${CACHE_KEY.TOWNSHIP_RANGE}${mapping.townshipCode}-${mapping.rangeCode}`;
        this.cache.delete(cacheKey);
        this.cache.set(cacheKey, mapping, CACHE_TTL.TOWNSHIP_RANGE);
      }

      return createdMappings;
    } catch (error) {
      logger.error('Error creating township/range mappings:', error);
      throw new GeographicServiceError(
        'Failed to create township/range mappings',
        500,
        'GEO_CREATE_ERROR'
      );
    }
  }

  /**
   * Create tax code area mappings in bulk
   * @param mappings Array of tax code area mappings
   * @returns Created mappings
   */
  async createTaxCodeAreaMappings(
    mappings: InsertTaxCodeAreaMap[]
  ): Promise<TaxCodeAreaMap[]> {
    try {
      if (!mappings.length) {
        return [];
      }

      // Insert all mappings in a single operation
      const createdMappings = await db
        .insert(schema.taxCodeAreaMapping)
        .values(mappings)
        .returning();

      // Invalidate caches for each TCA
      for (const mapping of createdMappings) {
        const cacheKey = `${CACHE_KEY.TCA}${mapping.tca}`;
        this.cache.delete(cacheKey);
        this.cache.set(cacheKey, mapping, CACHE_TTL.TCA);
      }

      return createdMappings;
    } catch (error) {
      logger.error('Error creating tax code area mappings:', error);
      throw new GeographicServiceError(
        'Failed to create tax code area mappings',
        500,
        'GEO_CREATE_ERROR'
      );
    }
  }

  /**
   * Map township/range to geography
   * @param townshipCode Township code
   * @param rangeCode Range code
   * @returns Geographic data or null if not found
   */
  async mapTownshipRangeToGeography(
    townshipCode: string,
    rangeCode: string
  ): Promise<{
    region?: GeographicRegion;
    municipality?: GeographicMunicipality;
    neighborhood?: GeographicNeighborhood;
  }> {
    try {
      // Try to get from cache first
      const cacheKey = `${CACHE_KEY.TOWNSHIP_RANGE}${townshipCode}-${rangeCode}`;
      const cachedMapping = this.cache.get<{
        region?: GeographicRegion;
        municipality?: GeographicMunicipality;
        neighborhood?: GeographicNeighborhood;
      }>(cacheKey);

      if (cachedMapping) {
        return cachedMapping;
      }

      // Query from database with all relations
      const mapping = await db.query.townshipRangeMapping.findFirst({
        where: and(
          eq(schema.townshipRangeMapping.townshipCode, townshipCode),
          eq(schema.townshipRangeMapping.rangeCode, rangeCode)
        ),
        with: {
          region: true,
          municipality: true,
          neighborhood: true,
        },
      });

      if (!mapping) {
        // Return empty object if no mapping found
        return {};
      }

      const result = {
        region: mapping.region,
        municipality: mapping.municipality,
        neighborhood: mapping.neighborhood,
      };

      // Cache the result
      this.cache.set(cacheKey, result, CACHE_TTL.TOWNSHIP_RANGE);

      return result;
    } catch (error) {
      logger.error(
        `Error mapping township/range ${townshipCode}-${rangeCode} to geography:`,
        error
      );
      throw new GeographicServiceError(
        `Failed to map township/range ${townshipCode}-${rangeCode} to geography`,
        500,
        'GEO_MAPPING_ERROR'
      );
    }
  }

  /**
   * Map TCA to geography
   * @param tca Tax code area
   * @returns Geographic data or null if not found
   */
  async mapTcaToGeography(
    tca: string
  ): Promise<{
    region?: GeographicRegion;
    municipality?: GeographicMunicipality;
  }> {
    try {
      // Try to get from cache first
      const cacheKey = `${CACHE_KEY.TCA}${tca}`;
      const cachedMapping = this.cache.get<{
        region?: GeographicRegion;
        municipality?: GeographicMunicipality;
      }>(cacheKey);

      if (cachedMapping) {
        return cachedMapping;
      }

      // Query from database with all relations
      const mapping = await db.query.taxCodeAreaMapping.findFirst({
        where: eq(schema.taxCodeAreaMapping.tca, tca),
        with: {
          region: true,
          municipality: true,
        },
      });

      if (!mapping) {
        // Return empty object if no mapping found
        return {};
      }

      const result = {
        region: mapping.region,
        municipality: mapping.municipality,
      };

      // Cache the result
      this.cache.set(cacheKey, result, CACHE_TTL.TCA);

      return result;
    } catch (error) {
      logger.error(`Error mapping TCA ${tca} to geography:`, error);
      throw new GeographicServiceError(
        `Failed to map TCA ${tca} to geography`,
        500,
        'GEO_MAPPING_ERROR'
      );
    }
  }

  /**
   * Get geographic hierarchy by hood_cd
   * @param hoodCd Neighborhood code
   * @returns Geographic hierarchy or null if not found
   */
  async getGeographicHierarchyByHoodCd(
    hoodCd: string
  ): Promise<{
    neighborhood?: GeographicNeighborhood;
    municipality?: GeographicMunicipality;
    region?: GeographicRegion;
  }> {
    try {
      // Try to get from cache first
      const cacheKey = `${CACHE_KEY.HIERARCHY_BY_HOOD_CD}${hoodCd}`;
      const cachedHierarchy = this.cache.get<{
        neighborhood?: GeographicNeighborhood;
        municipality?: GeographicMunicipality;
        region?: GeographicRegion;
      }>(cacheKey);

      if (cachedHierarchy) {
        return cachedHierarchy;
      }

      // Query from database with all relations
      const neighborhood = await db.query.geographicNeighborhoods.findFirst({
        where: eq(schema.geographicNeighborhoods.hoodCd, hoodCd),
        with: {
          municipality: {
            with: {
              region: true,
            },
          },
        },
      });

      if (!neighborhood) {
        // Return empty object if no neighborhood found
        return {};
      }

      const result = {
        neighborhood,
        municipality: neighborhood.municipality,
        region: neighborhood.municipality?.region,
      };

      // Cache the result
      this.cache.set(cacheKey, result, CACHE_TTL.NEIGHBORHOODS);

      return result;
    } catch (error) {
      logger.error(`Error getting geographic hierarchy for hood_cd ${hoodCd}:`, error);
      throw new GeographicServiceError(
        `Failed to get geographic hierarchy for hood_cd ${hoodCd}`,
        500,
        'GEO_HIERARCHY_ERROR'
      );
    }
  }

  /**
   * Clear all geographic caches
   * This should be called after large data migrations or updates
   */
  clearCaches(): void {
    this.cache.invalidatePattern(/^(region|municipality|neighborhood|township-range|tca|cost-matrix|hierarchy)/);
  }
}

// Export a singleton instance
export const enhancedGeographicService = new EnhancedGeographicService();