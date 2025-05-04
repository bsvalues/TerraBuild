/**
 * Geographic Service for Benton County Building System
 * 
 * This service implements the geographic data operations for the system,
 * providing a comprehensive API for working with regions, municipalities, 
 * neighborhoods, and their relationships. It also handles mapping between
 * different geographic identifiers used in Benton County.
 */

import { db } from '../db';
import { eq, and, or, like, sql } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import {
  GeographicRegion, GeographicMunicipality, GeographicNeighborhood,
  TownshipRangeMap, TaxCodeAreaMap, EnhancedCostMatrix,
  InsertGeographicRegion, InsertGeographicMunicipality, InsertGeographicNeighborhood,
  InsertTownshipRangeMap, InsertTaxCodeAreaMap, InsertEnhancedCostMatrix
} from '../../shared/schema';

/**
 * Geographic data service for managing location data in the application
 */
export class GeographicService {
  /**
   * Get all geographic regions
   * @returns List of all geographic regions
   */
  async getRegions(): Promise<GeographicRegion[]> {
    return db.select().from(schema.geographicRegions).where(eq(schema.geographicRegions.isActive, true));
  }

  /**
   * Get a geographic region by ID
   * @param id Region ID
   * @returns Geographic region or null if not found
   */
  async getRegionById(id: number): Promise<GeographicRegion | null> {
    const [region] = await db
      .select()
      .from(schema.geographicRegions)
      .where(eq(schema.geographicRegions.id, id));
    return region || null;
  }

  /**
   * Get a geographic region by code
   * @param regionCode Region code
   * @returns Geographic region or null if not found
   */
  async getRegionByCode(regionCode: string): Promise<GeographicRegion | null> {
    const [region] = await db
      .select()
      .from(schema.geographicRegions)
      .where(eq(schema.geographicRegions.regionCode, regionCode));
    return region || null;
  }

  /**
   * Create a new geographic region
   * @param region Region data
   * @returns Created region
   */
  async createRegion(region: InsertGeographicRegion): Promise<GeographicRegion> {
    const [createdRegion] = await db
      .insert(schema.geographicRegions)
      .values(region)
      .returning();
    return createdRegion;
  }

  /**
   * Update a geographic region
   * @param id Region ID
   * @param region Updated region data
   * @returns Updated region or null if not found
   */
  async updateRegion(id: number, region: Partial<GeographicRegion>): Promise<GeographicRegion | null> {
    const [updatedRegion] = await db
      .update(schema.geographicRegions)
      .set({ ...region, updatedAt: new Date() })
      .where(eq(schema.geographicRegions.id, id))
      .returning();
    return updatedRegion || null;
  }

  /**
   * Delete a geographic region (soft delete)
   * @param id Region ID
   * @returns True if successful, false otherwise
   */
  async deleteRegion(id: number): Promise<boolean> {
    const [updated] = await db
      .update(schema.geographicRegions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.geographicRegions.id, id))
      .returning({ id: schema.geographicRegions.id });
    return !!updated;
  }

  /**
   * Get all municipalities
   * @param regionId Optional region ID to filter by
   * @returns List of municipalities
   */
  async getMunicipalities(regionId?: number): Promise<GeographicMunicipality[]> {
    if (regionId) {
      return db
        .select()
        .from(schema.geographicMunicipalities)
        .where(
          and(
            eq(schema.geographicMunicipalities.regionId, regionId),
            eq(schema.geographicMunicipalities.isActive, true)
          )
        );
    }
    return db
      .select()
      .from(schema.geographicMunicipalities)
      .where(eq(schema.geographicMunicipalities.isActive, true));
  }

  /**
   * Get a municipality by ID
   * @param id Municipality ID
   * @returns Municipality or null if not found
   */
  async getMunicipalityById(id: number): Promise<GeographicMunicipality | null> {
    const [municipality] = await db
      .select()
      .from(schema.geographicMunicipalities)
      .where(eq(schema.geographicMunicipalities.id, id));
    return municipality || null;
  }

  /**
   * Get a municipality by code
   * @param municipalityCode Municipality code
   * @returns Municipality or null if not found
   */
  async getMunicipalityByCode(municipalityCode: string): Promise<GeographicMunicipality | null> {
    const [municipality] = await db
      .select()
      .from(schema.geographicMunicipalities)
      .where(eq(schema.geographicMunicipalities.municipalityCode, municipalityCode));
    return municipality || null;
  }

  /**
   * Create a new municipality
   * @param municipality Municipality data
   * @returns Created municipality
   */
  async createMunicipality(municipality: InsertGeographicMunicipality): Promise<GeographicMunicipality> {
    const [createdMunicipality] = await db
      .insert(schema.geographicMunicipalities)
      .values(municipality)
      .returning();
    return createdMunicipality;
  }

  /**
   * Update a municipality
   * @param id Municipality ID
   * @param municipality Updated municipality data
   * @returns Updated municipality or null if not found
   */
  async updateMunicipality(id: number, municipality: Partial<GeographicMunicipality>): Promise<GeographicMunicipality | null> {
    const [updatedMunicipality] = await db
      .update(schema.geographicMunicipalities)
      .set({ ...municipality, updatedAt: new Date() })
      .where(eq(schema.geographicMunicipalities.id, id))
      .returning();
    return updatedMunicipality || null;
  }

  /**
   * Delete a municipality (soft delete)
   * @param id Municipality ID
   * @returns True if successful, false otherwise
   */
  async deleteMunicipality(id: number): Promise<boolean> {
    const [updated] = await db
      .update(schema.geographicMunicipalities)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.geographicMunicipalities.id, id))
      .returning({ id: schema.geographicMunicipalities.id });
    return !!updated;
  }

  /**
   * Get all neighborhoods
   * @param municipalityId Optional municipality ID to filter by
   * @returns List of neighborhoods
   */
  async getNeighborhoods(municipalityId?: number): Promise<GeographicNeighborhood[]> {
    if (municipalityId) {
      return db
        .select()
        .from(schema.geographicNeighborhoods)
        .where(
          and(
            eq(schema.geographicNeighborhoods.municipalityId, municipalityId),
            eq(schema.geographicNeighborhoods.isActive, true)
          )
        );
    }
    return db
      .select()
      .from(schema.geographicNeighborhoods)
      .where(eq(schema.geographicNeighborhoods.isActive, true));
  }

  /**
   * Get a neighborhood by ID
   * @param id Neighborhood ID
   * @returns Neighborhood or null if not found
   */
  async getNeighborhoodById(id: number): Promise<GeographicNeighborhood | null> {
    const [neighborhood] = await db
      .select()
      .from(schema.geographicNeighborhoods)
      .where(eq(schema.geographicNeighborhoods.id, id));
    return neighborhood || null;
  }

  /**
   * Get a neighborhood by hood_cd value
   * @param hoodCd Neighborhood code (hood_cd)
   * @returns Neighborhood or null if not found
   */
  async getNeighborhoodByHoodCd(hoodCd: string): Promise<GeographicNeighborhood | null> {
    const [neighborhood] = await db
      .select()
      .from(schema.geographicNeighborhoods)
      .where(eq(schema.geographicNeighborhoods.hoodCd, hoodCd));
    return neighborhood || null;
  }

  /**
   * Create a new neighborhood
   * @param neighborhood Neighborhood data
   * @returns Created neighborhood
   */
  async createNeighborhood(neighborhood: InsertGeographicNeighborhood): Promise<GeographicNeighborhood> {
    const [createdNeighborhood] = await db
      .insert(schema.geographicNeighborhoods)
      .values(neighborhood)
      .returning();
    return createdNeighborhood;
  }

  /**
   * Update a neighborhood
   * @param id Neighborhood ID
   * @param neighborhood Updated neighborhood data
   * @returns Updated neighborhood or null if not found
   */
  async updateNeighborhood(id: number, neighborhood: Partial<GeographicNeighborhood>): Promise<GeographicNeighborhood | null> {
    const [updatedNeighborhood] = await db
      .update(schema.geographicNeighborhoods)
      .set({ ...neighborhood, updatedAt: new Date() })
      .where(eq(schema.geographicNeighborhoods.id, id))
      .returning();
    return updatedNeighborhood || null;
  }

  /**
   * Delete a neighborhood (soft delete)
   * @param id Neighborhood ID
   * @returns True if successful, false otherwise
   */
  async deleteNeighborhood(id: number): Promise<boolean> {
    const [updated] = await db
      .update(schema.geographicNeighborhoods)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.geographicNeighborhoods.id, id))
      .returning({ id: schema.geographicNeighborhoods.id });
    return !!updated;
  }

  /**
   * Get full geographic hierarchy info for a hood_cd
   * @param hoodCd Neighborhood code (hood_cd)
   * @returns Complete hierarchy with neighborhood, municipality, and region
   */
  async getGeographicHierarchyByHoodCd(hoodCd: string): Promise<{ 
    neighborhood: GeographicNeighborhood | null,
    municipality: GeographicMunicipality | null,
    region: GeographicRegion | null 
  }> {
    // Get the neighborhood first
    const [neighborhood] = await db
      .select()
      .from(schema.geographicNeighborhoods)
      .where(eq(schema.geographicNeighborhoods.hoodCd, hoodCd));
    
    if (!neighborhood) {
      return { neighborhood: null, municipality: null, region: null };
    }

    // Get the municipality
    const [municipality] = await db
      .select()
      .from(schema.geographicMunicipalities)
      .where(eq(schema.geographicMunicipalities.id, neighborhood.municipalityId));
    
    if (!municipality) {
      return { neighborhood, municipality: null, region: null };
    }

    // Get the region
    const [region] = await db
      .select()
      .from(schema.geographicRegions)
      .where(eq(schema.geographicRegions.id, municipality.regionId));
    
    return { neighborhood, municipality, region: region || null };
  }

  /**
   * Map a township/range combination to a geographic hierarchy
   * @param townshipCode Township code
   * @param rangeCode Range code
   * @returns Geographic hierarchy data or null values if not found
   */
  async mapTownshipRangeToGeography(townshipCode: string, rangeCode: string): Promise<{
    region: GeographicRegion | null,
    municipality: GeographicMunicipality | null,
    neighborhood: GeographicNeighborhood | null
  }> {
    // Find the mapping
    const [mapping] = await db
      .select()
      .from(schema.townshipRangeMapping)
      .where(
        and(
          eq(schema.townshipRangeMapping.townshipCode, townshipCode),
          eq(schema.townshipRangeMapping.rangeCode, rangeCode)
        )
      );
    
    if (!mapping) {
      return { region: null, municipality: null, neighborhood: null };
    }

    // Get the region
    const [region] = mapping.regionId ? await db
      .select()
      .from(schema.geographicRegions)
      .where(eq(schema.geographicRegions.id, mapping.regionId)) : [];
    
    // Get the municipality
    const [municipality] = mapping.municipalityId ? await db
      .select()
      .from(schema.geographicMunicipalities)
      .where(eq(schema.geographicMunicipalities.id, mapping.municipalityId)) : [];
    
    // Get the neighborhood
    const [neighborhood] = mapping.hoodCd ? await db
      .select()
      .from(schema.geographicNeighborhoods)
      .where(eq(schema.geographicNeighborhoods.hoodCd, mapping.hoodCd)) : [];
    
    return { 
      region: region || null, 
      municipality: municipality || null, 
      neighborhood: neighborhood || null 
    };
  }

  /**
   * Map a tax code area (TCA) to a geographic hierarchy
   * @param tca Tax code area
   * @returns Geographic hierarchy data or null values if not found
   */
  async mapTcaToGeography(tca: string): Promise<{
    region: GeographicRegion | null,
    municipality: GeographicMunicipality | null
  }> {
    // Find the mapping
    const [mapping] = await db
      .select()
      .from(schema.taxCodeAreaMapping)
      .where(eq(schema.taxCodeAreaMapping.tca, tca));
    
    if (!mapping) {
      return { region: null, municipality: null };
    }

    // Get the region
    const [region] = mapping.regionId ? await db
      .select()
      .from(schema.geographicRegions)
      .where(eq(schema.geographicRegions.id, mapping.regionId)) : [];
    
    // Get the municipality
    const [municipality] = mapping.municipalityId ? await db
      .select()
      .from(schema.geographicMunicipalities)
      .where(eq(schema.geographicMunicipalities.id, mapping.municipalityId)) : [];
    
    return { 
      region: region || null, 
      municipality: municipality || null
    };
  }

  /**
   * Get cost matrix values for a specific building in a specific location
   * @param buildingTypeId Building type code
   * @param regionId Region ID
   * @param municipalityId Municipality ID
   * @param year Matrix year
   * @returns Enhanced cost matrix data or null if not found
   */
  async getEnhancedCostMatrix(
    buildingTypeId: string,
    regionId: number,
    municipalityId?: number,
    year?: number
  ): Promise<EnhancedCostMatrix | null> {
    const currentYear = year || new Date().getFullYear();
    
    let query = db
      .select()
      .from(schema.enhancedCostMatrix)
      .where(
        and(
          eq(schema.enhancedCostMatrix.buildingTypeId, buildingTypeId),
          eq(schema.enhancedCostMatrix.regionId, regionId),
          eq(schema.enhancedCostMatrix.matrixYear, currentYear),
          eq(schema.enhancedCostMatrix.isActive, true)
        )
      );
    
    // If municipality is specified, add it to the query
    if (municipalityId) {
      query = query.where(eq(schema.enhancedCostMatrix.municipalityId, municipalityId));
    }
    
    const [matrix] = await query;
    return matrix || null;
  }

  /**
   * Get region for a property based on all available identifiers
   * Uses a priority order for determination:
   * 1. Direct hood_cd mapping
   * 2. Township/Range mapping
   * 3. TCA mapping
   */
  async getRegionForProperty(propertyData: {
    hoodCd?: string;
    townshipCode?: string;
    rangeCode?: string;
    tca?: string;
  }): Promise<GeographicRegion | null> {
    // Try hood_cd first (highest priority)
    if (propertyData.hoodCd) {
      const { region } = await this.getGeographicHierarchyByHoodCd(propertyData.hoodCd);
      if (region) {
        return region;
      }
    }
    
    // Try township/range next
    if (propertyData.townshipCode && propertyData.rangeCode) {
      const { region } = await this.mapTownshipRangeToGeography(
        propertyData.townshipCode,
        propertyData.rangeCode
      );
      if (region) {
        return region;
      }
    }
    
    // Try TCA last
    if (propertyData.tca) {
      const { region } = await this.mapTcaToGeography(propertyData.tca);
      if (region) {
        return region;
      }
    }
    
    // If all fails, return null
    return null;
  }

  /**
   * Create a new township/range mapping
   * @param mapping Township/range mapping data
   * @returns Created mapping
   */
  async createTownshipRangeMapping(mapping: InsertTownshipRangeMap): Promise<TownshipRangeMap> {
    const [createdMapping] = await db
      .insert(schema.townshipRangeMapping)
      .values(mapping)
      .returning();
    return createdMapping;
  }

  /**
   * Create a new tax code area mapping
   * @param mapping Tax code area mapping data
   * @returns Created mapping
   */
  async createTaxCodeAreaMapping(mapping: InsertTaxCodeAreaMap): Promise<TaxCodeAreaMap> {
    const [createdMapping] = await db
      .insert(schema.taxCodeAreaMapping)
      .values(mapping)
      .returning();
    return createdMapping;
  }

  /**
   * Create a new enhanced cost matrix
   * @param matrix Enhanced cost matrix data
   * @returns Created matrix
   */
  async createEnhancedCostMatrix(matrix: InsertEnhancedCostMatrix): Promise<EnhancedCostMatrix> {
    const [createdMatrix] = await db
      .insert(schema.enhancedCostMatrix)
      .values(matrix)
      .returning();
    return createdMatrix;
  }
}

// Export a singleton instance
export const geographicService = new GeographicService();