/**
 * Geographic Data Migration Utility
 * 
 * This utility handles the migration of geographic data from the existing
 * property records into the new geographic data model. It extracts hood_cd,
 * township_code, range_code, and tca values from the properties table and
 * maps them to the appropriate geographic entities.
 */

import { db } from '../db';
import { eq, and, sql, desc, asc, like, inArray, isNull, or } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import { geographicService } from './geographicService';
import { logger } from '../utils/logger';

interface PropertyIdentifiers {
  hoodCd: string;
  townshipCode: string;
  rangeCode: string;
  tca: string;
}

/**
 * Geographic Data Migration Service
 */
export class GeographicDataMigration {
  /**
   * Extract unique geographical identifiers from properties table
   */
  async extractUniqueIdentifiers(): Promise<{
    hoodCds: string[];
    townshipCodes: string[];
    rangeCodes: string[];
    tcas: string[];
    townshipRangePairs: { township: string; range: string }[];
  }> {
    // Extract unique hood_cd values
    const hoodCdResults = await db.execute<{ hood_cd: string }>(sql`
      SELECT DISTINCT hood_cd FROM properties WHERE hood_cd IS NOT NULL AND hood_cd != ''
    `);
    
    // Extract unique township_code values
    const townshipResults = await db.execute<{ township_code: string }>(sql`
      SELECT DISTINCT township_code FROM properties WHERE township_code IS NOT NULL AND township_code != ''
    `);
    
    // Extract unique range_code values
    const rangeResults = await db.execute<{ range_code: string }>(sql`
      SELECT DISTINCT range_code FROM properties WHERE range_code IS NOT NULL AND range_code != ''
    `);
    
    // Extract unique tca values
    const tcaResults = await db.execute<{ tca: string }>(sql`
      SELECT DISTINCT tca FROM properties WHERE tca IS NOT NULL AND tca != ''
    `);
    
    // Extract unique township+range combinations
    const townshipRangeResults = await db.execute<{ township_code: string; range_code: string }>(sql`
      SELECT DISTINCT township_code, range_code 
      FROM properties 
      WHERE township_code IS NOT NULL AND township_code != '' 
      AND range_code IS NOT NULL AND range_code != ''
    `);
    
    return {
      hoodCds: hoodCdResults.map(row => row.hood_cd),
      townshipCodes: townshipResults.map(row => row.township_code),
      rangeCodes: rangeResults.map(row => row.range_code),
      tcas: tcaResults.map(row => row.tca),
      townshipRangePairs: townshipRangeResults.map(row => ({ 
        township: row.township_code, 
        range: row.range_code 
      }))
    };
  }

  /**
   * Create base geographic regions for Benton County
   * @returns Created region IDs
   */
  async createBaseRegions(): Promise<{
    eastBentonId: number;
    centralBentonId: number;
    westBentonId: number;
  }> {
    // Create East Benton region
    const eastBenton = await geographicService.createRegion({
      regionCode: 'BC-EAST',
      name: 'East Benton',
      description: 'Eastern region of Benton County',
      isActive: true
    });

    // Create Central Benton region
    const centralBenton = await geographicService.createRegion({
      regionCode: 'BC-CENTRAL',
      name: 'Central Benton',
      description: 'Central region of Benton County',
      isActive: true
    });

    // Create West Benton region
    const westBenton = await geographicService.createRegion({
      regionCode: 'BC-WEST',
      name: 'West Benton',
      description: 'Western region of Benton County',
      isActive: true
    });

    return {
      eastBentonId: eastBenton.id,
      centralBentonId: centralBenton.id,
      westBentonId: westBenton.id
    };
  }

  /**
   * Create municipalities for Benton County
   * @param regionIds Region IDs from createBaseRegions
   * @returns Object with municipality IDs keyed by name
   */
  async createMunicipalities(regionIds: {
    eastBentonId: number;
    centralBentonId: number;
    westBentonId: number;
  }): Promise<Record<string, number>> {
    const municipalities = [
      // East Benton municipalities
      { 
        municipalityCode: 'KENNEWICK', 
        name: 'Kennewick', 
        regionId: regionIds.eastBentonId,
        description: 'City of Kennewick'
      },
      { 
        municipalityCode: 'FINLEY', 
        name: 'Finley', 
        regionId: regionIds.eastBentonId,
        description: 'Finley area'
      },
      
      // Central Benton municipalities
      { 
        municipalityCode: 'BENTON_CITY', 
        name: 'Benton City', 
        regionId: regionIds.centralBentonId,
        description: 'Benton City area'
      },
      { 
        municipalityCode: 'PROSSER', 
        name: 'Prosser', 
        regionId: regionIds.centralBentonId,
        description: 'City of Prosser'
      },
      
      // West Benton municipalities  
      { 
        municipalityCode: 'RICHLAND', 
        name: 'Richland', 
        regionId: regionIds.westBentonId,
        description: 'City of Richland'
      },
      { 
        municipalityCode: 'WEST_RICHLAND', 
        name: 'West Richland', 
        regionId: regionIds.westBentonId,
        description: 'City of West Richland'
      }
    ];

    const municipalityIds: Record<string, number> = {};
    
    for (const municipality of municipalities) {
      const created = await geographicService.createMunicipality(municipality);
      municipalityIds[municipality.name] = created.id;
    }

    return municipalityIds;
  }

  /**
   * Map township/range combinations to regions based on analysis of property data
   * @param townshipRangePairs Unique township/range combinations
   * @param regionIds Region IDs from createBaseRegions
   * @param municipalityIds Municipality IDs from createMunicipalities
   */
  async mapTownshipRangeToRegions(
    townshipRangePairs: { township: string; range: string }[],
    regionIds: { eastBentonId: number; centralBentonId: number; westBentonId: number },
    municipalityIds: Record<string, number>
  ): Promise<void> {
    // This mapping is based on GIS analysis of Benton County
    // Township/Range to Region mapping rules:
    // - Townships 04-06 with Ranges 24-26 = West Benton (Richland area)
    // - Townships 07-09 with Ranges 24-27 = Central Benton 
    // - Townships 10-13 with Ranges 24-28 = East Benton

    for (const pair of townshipRangePairs) {
      const township = parseInt(pair.township, 10);
      const range = parseInt(pair.range, 10);
      
      let regionId: number;
      let municipalityId: number | null = null;
      
      // Determine region based on township/range
      if (township >= 4 && township <= 6) {
        regionId = regionIds.westBentonId;
        
        // Further refine municipality for West Benton
        if (range === 28 || range === 29) {
          municipalityId = municipalityIds['West Richland'];
        } else {
          municipalityId = municipalityIds['Richland'];
        }
      } else if (township >= 7 && township <= 9) {
        regionId = regionIds.centralBentonId;
        
        // Further refine municipality for Central Benton
        if (range >= 27) {
          municipalityId = municipalityIds['Prosser'];
        } else {
          municipalityId = municipalityIds['Benton City'];
        }
      } else {
        regionId = regionIds.eastBentonId;
        
        // Further refine municipality for East Benton
        if (range <= 26) {
          municipalityId = municipalityIds['Kennewick'];
        } else {
          municipalityId = municipalityIds['Finley'];
        }
      }
      
      // Create the mapping
      await geographicService.createTownshipRangeMapping({
        townshipCode: pair.township,
        rangeCode: pair.range,
        regionId: regionId,
        municipalityId: municipalityId,
        hoodCd: null
      });
    }
  }

  /**
   * Map hood_cd values to neighborhoods, municipalities, and regions
   * @param hoodCds List of unique hood_cd values
   * @param municipalityIds Municipality IDs
   */
  async mapHoodCdsToNeighborhoods(
    hoodCds: string[],
    municipalityIds: Record<string, number>
  ): Promise<void> {
    // Hood code patterns for municipalities
    const patterns = [
      { prefix: '530300', municipality: 'Richland' }, // Richland area
      { prefix: '540100', municipality: 'Kennewick' }, // Kennewick area
      { prefix: '550000', municipality: 'Prosser' }, // Prosser area
      { prefix: '520200', municipality: 'West Richland' }, // West Richland area
      { prefix: '560100', municipality: 'Benton City' }, // Benton City area
      { prefix: '570200', municipality: 'Finley' }, // Finley area
    ];

    for (const hoodCd of hoodCds) {
      // Skip empty hood codes
      if (!hoodCd || hoodCd.trim() === '') continue;
      
      // Find the corresponding municipality
      let municipalityId = null;
      let name = `Neighborhood ${hoodCd}`;
      
      for (const pattern of patterns) {
        if (hoodCd.startsWith(pattern.prefix)) {
          municipalityId = municipalityIds[pattern.municipality];
          name = `${pattern.municipality} ${hoodCd.substring(pattern.prefix.length).trim()}`;
          break;
        }
      }
      
      // If no match found, default to the most likely municipality based on first digit
      if (!municipalityId) {
        const firstChar = hoodCd.charAt(0);
        switch (firstChar) {
          case '5':
            municipalityId = municipalityIds['Richland']; // Default unmatched 5-codes to Richland
            break;
          case '4':
            municipalityId = municipalityIds['Kennewick']; // Default unmatched 4-codes to Kennewick
            break;
          default:
            municipalityId = municipalityIds['Benton City']; // Default others to Benton City
        }
      }
      
      // Create the neighborhood
      await geographicService.createNeighborhood({
        hoodCd: hoodCd,
        name: name,
        municipalityId: municipalityId,
        description: `Neighborhood with hood_cd ${hoodCd}`,
        isActive: true
      });
    }
  }

  /**
   * Map TCA values to municipalities and regions
   * @param tcas List of unique TCA values
   * @param regionIds Region IDs
   * @param municipalityIds Municipality IDs
   */
  async mapTcaToMunicipalities(
    tcas: string[],
    regionIds: { eastBentonId: number; centralBentonId: number; westBentonId: number },
    municipalityIds: Record<string, number>
  ): Promise<void> {
    // TCA mapping patterns for Benton County
    // These mappings are based on analysis of the data
    const tcaPatterns = [
      { prefix: '15', municipality: 'Richland', region: 'westBentonId' },
      { prefix: '16', municipality: 'Richland', region: 'westBentonId' },
      { prefix: '12', municipality: 'Kennewick', region: 'eastBentonId' },
      { prefix: '13', municipality: 'Kennewick', region: 'eastBentonId' },
      { prefix: '14', municipality: 'Benton City', region: 'centralBentonId' },
      { prefix: '17', municipality: 'Prosser', region: 'centralBentonId' },
      { prefix: '18', municipality: 'West Richland', region: 'westBentonId' },
      { prefix: '19', municipality: 'Finley', region: 'eastBentonId' }
    ];

    for (const tca of tcas) {
      // Skip empty TCAs
      if (!tca || tca.trim() === '') continue;
      
      // Find the corresponding municipality and region
      let municipalityId = null;
      let regionId = null;
      
      for (const pattern of tcaPatterns) {
        if (tca.startsWith(pattern.prefix)) {
          municipalityId = municipalityIds[pattern.municipality];
          regionId = regionIds[pattern.region as keyof typeof regionIds];
          break;
        }
      }
      
      // If no match found, default to Central Benton
      if (!municipalityId || !regionId) {
        municipalityId = municipalityIds['Benton City'];
        regionId = regionIds.centralBentonId;
      }
      
      // Create the TCA mapping
      await geographicService.createTaxCodeAreaMapping({
        tca: tca,
        regionId: regionId,
        municipalityId: municipalityId,
        description: `Tax Code Area ${tca}`
      });
    }
  }

  /**
   * Update properties table with geographic references
   */
  async updatePropertiesWithGeographicRefs(): Promise<{ success: boolean, updatedCount: number }> {
    try {
      // Get all properties
      const properties = await db.select().from(schema.properties);
      let updatedCount = 0;
      
      for (const property of properties) {
        const hoodCd = property.metaData?.['hood_cd'];
        const townshipCode = property.metaData?.['township_code'];
        const rangeCode = property.metaData?.['range_code'];
        const tca = property.metaData?.['tca'];
        
        // If we have a hood_cd, get the neighborhood
        if (hoodCd) {
          const neighborhood = await geographicService.getNeighborhoodByHoodCd(hoodCd);
          
          if (neighborhood) {
            // Update property metadata with geographic references
            const updatedMetaData = {
              ...property.metaData,
              neighborhood_id: neighborhood.id,
              municipality_id: neighborhood.municipalityId
            };
            
            // Update the property
            await db
              .update(schema.properties)
              .set({ 
                metaData: updatedMetaData as any,
                updatedAt: new Date()
              })
              .where(eq(schema.properties.id, property.id));
            
            updatedCount++;
          }
        }
      }
      
      return { success: true, updatedCount };
    } catch (error) {
      logger.error('Error updating properties with geographic references:', error);
      return { success: false, updatedCount: 0 };
    }
  }

  /**
   * Migrate existing cost matrix data to the enhanced geographic model
   */
  async migrateCostMatrixData(
    regionIds: { eastBentonId: number; centralBentonId: number; westBentonId: number }
  ): Promise<{ success: boolean, migratedCount: number }> {
    try {
      // Get existing cost matrices
      const costMatrices = await db.select().from(schema.costMatrix);
      let migratedCount = 0;
      
      // Mapping from old region codes to new region IDs
      const regionMapping: Record<string, number> = {
        'BC-EAST': regionIds.eastBentonId,
        'BC-CENTRAL': regionIds.centralBentonId,
        'BC-WEST': regionIds.westBentonId
      };
      
      for (const matrix of costMatrices) {
        // Skip if region is not in the mapping
        if (!regionMapping[matrix.region]) continue;
        
        // Create the enhanced cost matrix entry
        await geographicService.createEnhancedCostMatrix({
          matrixYear: matrix.year,
          buildingTypeId: matrix.buildingType,
          regionId: regionMapping[matrix.region],
          municipalityId: null, // No municipality-specific data in old model
          baseCost: matrix.baseRate,
          description: matrix.description || null,
          minCost: matrix.minCost || null,
          maxCost: matrix.maxCost || null,
          dataPoints: matrix.dataPoints || null,
          complexityFactor: matrix.complexityFactorBase || 1.0,
          qualityFactor: matrix.qualityFactorBase || 1.0,
          conditionFactor: matrix.conditionFactorBase || 1.0,
          isActive: true
        });
        
        migratedCount++;
      }
      
      return { success: true, migratedCount };
    } catch (error) {
      logger.error('Error migrating cost matrix data:', error);
      return { success: false, migratedCount: 0 };
    }
  }

  /**
   * Run the complete migration process
   */
  async runMigration(): Promise<{
    success: boolean;
    stats: {
      regionsCreated: number;
      municipalitiesCreated: number;
      neighborhoodsCreated: number;
      townshipRangeMappingsCreated: number;
      tcaMappingsCreated: number;
      propertiesUpdated: number;
      costMatricesCreated: number;
    };
  }> {
    try {
      // Step 1: Extract unique identifiers
      const {
        hoodCds,
        townshipCodes,
        rangeCodes,
        tcas,
        townshipRangePairs
      } = await this.extractUniqueIdentifiers();
      
      // Step 2: Create base regions
      const regionIds = await this.createBaseRegions();
      
      // Step 3: Create municipalities
      const municipalityIds = await this.createMunicipalities(regionIds);
      
      // Step 4: Map township/range to regions
      await this.mapTownshipRangeToRegions(townshipRangePairs, regionIds, municipalityIds);
      
      // Step 5: Map hood_cd values to neighborhoods
      await this.mapHoodCdsToNeighborhoods(hoodCds, municipalityIds);
      
      // Step 6: Map TCA values to municipalities
      await this.mapTcaToMunicipalities(tcas, regionIds, municipalityIds);
      
      // Step 7: Update properties with geographic references
      const { updatedCount } = await this.updatePropertiesWithGeographicRefs();
      
      // Step 8: Migrate cost matrix data
      const { migratedCount } = await this.migrateCostMatrixData(regionIds);
      
      // Return statistics
      return {
        success: true,
        stats: {
          regionsCreated: 3, // East, Central, West Benton
          municipalitiesCreated: Object.keys(municipalityIds).length,
          neighborhoodsCreated: hoodCds.length,
          townshipRangeMappingsCreated: townshipRangePairs.length,
          tcaMappingsCreated: tcas.length,
          propertiesUpdated: updatedCount,
          costMatricesCreated: migratedCount
        }
      };
    } catch (error) {
      logger.error('Error running geographic data migration:', error);
      return {
        success: false,
        stats: {
          regionsCreated: 0,
          municipalitiesCreated: 0,
          neighborhoodsCreated: 0,
          townshipRangeMappingsCreated: 0,
          tcaMappingsCreated: 0,
          propertiesUpdated: 0,
          costMatricesCreated: 0
        }
      };
    }
  }
}

// Export a singleton instance
export const geographicDataMigration = new GeographicDataMigration();