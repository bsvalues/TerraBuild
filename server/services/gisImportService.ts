/**
 * GIS Import Service for Benton County Building System
 * 
 * This service handles importing and synchronizing geographic data from the Benton County
 * GIS repository (https://github.com/bsvalues/bcbspacsmapping).
 * It ensures that our system's geographic data matches Benton County's official boundaries.
 */

import axios from 'axios';
import { GeographicService } from './geographicService';
import { 
  InsertGeographicRegion, InsertGeographicMunicipality, InsertGeographicNeighborhood,
  InsertTownshipRangeMap, InsertTaxCodeAreaMap
} from '../../shared/schema';
import { db } from '../db';
import { CacheManager } from '../utils/cacheManager';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';

// Event emitter for geographic updates
export const gisImportEvents = new EventEmitter();

// Cache key constants
const CACHE_PREFIX = 'gis_import:';
const CACHE_TTL = 3600; // 1 hour

export interface GisImportOptions {
  /**
   * Whether to clear existing geographic data before import
   */
  clearExisting?: boolean;
  
  /**
   * GitHub repository owner 
   */
  repoOwner?: string;
  
  /**
   * GitHub repository name
   */
  repoName?: string;
  
  /**
   * GitHub branch name
   */
  branch?: string;
  
  /**
   * Path to local file for import (instead of GitHub)
   */
  localFilePath?: string;
}

export interface GisImportResult {
  /**
   * Whether the import was successful
   */
  success: boolean;
  
  /**
   * Number of regions imported
   */
  regionCount: number;
  
  /**
   * Number of municipalities imported
   */
  municipalityCount: number;
  
  /**
   * Number of neighborhoods imported
   */
  neighborhoodCount: number;
  
  /**
   * Number of township/range mappings imported
   */
  townshipRangeMappingCount: number;
  
  /**
   * Number of tax code area mappings imported
   */
  taxCodeAreaMappingCount: number;
  
  /**
   * Error message if import failed
   */
  error?: string;
  
  /**
   * Timestamp when import completed
   */
  importDate: Date;
}

/**
 * Service for importing GIS data from Benton County's GitHub repository
 */
export class GisImportService {
  private cache: CacheManager;
  private geographicService: GeographicService;
  
  constructor() {
    this.cache = new CacheManager();
    this.geographicService = new GeographicService();
  }
  
  /**
   * Import GIS data from the Benton County GitHub repository
   * @param options Import options
   * @returns Import result
   */
  async importFromGitHub(options: GisImportOptions = {}): Promise<GisImportResult> {
    const defaultOptions = {
      clearExisting: false,
      repoOwner: 'bsvalues',
      repoName: 'TerraFusionMono',
      branch: 'main'
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      // Start with empty result
      const result: GisImportResult = {
        success: false,
        regionCount: 0,
        municipalityCount: 0,
        neighborhoodCount: 0,
        townshipRangeMappingCount: 0,
        taxCodeAreaMappingCount: 0,
        importDate: new Date()
      };
      
      // Check cache for recent import
      const cacheKey = `${CACHE_PREFIX}${mergedOptions.repoOwner}:${mergedOptions.repoName}:${mergedOptions.branch}`;
      const cachedResult = this.cache.get<GisImportResult>(cacheKey);
      
      if (cachedResult && !options.clearExisting) {
        console.log('Using cached GIS import result');
        return cachedResult;
      }
      
      // Proceed with import
      console.log(`Importing GIS data from GitHub: ${mergedOptions.repoOwner}/${mergedOptions.repoName}@${mergedOptions.branch}`);
      
      // Get repository structure
      const repoUrl = `https://api.github.com/repos/${mergedOptions.repoOwner}/${mergedOptions.repoName}/contents`;
      const response = await axios.get(repoUrl, {
        params: { ref: mergedOptions.branch }
      });
      
      // Find relevant GIS data files in the TerraFusionMono repo
      const gisFiles = response.data.filter((file: any) => {
        // Filter based on directory first
        if (file.type === 'dir' && 
           (file.name === 'geo_data' || file.name === 'geographic' || 
            file.name === 'benton' || file.name === 'gis')) {
          // This is a directory of interest, we'll need to fetch its contents
          return true;
        }
        
        // For regular files, check filename patterns
        const filename = file.name.toLowerCase();
        return (
          filename.endsWith('.geojson') || 
          filename.endsWith('.json') || 
          filename.includes('region') || 
          filename.includes('municipal') || 
          filename.includes('neighborhood') ||
          filename.includes('hood') ||
          filename.includes('township') ||
          filename.includes('range') ||
          filename.includes('tca') ||
          filename.includes('tax')
        );
      });
      
      // Clear existing data if requested
      if (mergedOptions.clearExisting) {
        await this.clearGeographicData();
      }
      
      // Process each file
      for (const file of gisFiles) {
        const fileContent = await this.fetchFileContent(file.download_url);
        if (!fileContent) continue;
        
        // Determine file type and process accordingly
        const filename = file.name.toLowerCase();
        
        if (filename.includes('region')) {
          const importedRegions = await this.processRegionData(fileContent);
          result.regionCount += importedRegions;
        } 
        else if (filename.includes('municipal')) {
          const importedMunicipalities = await this.processMunicipalityData(fileContent);
          result.municipalityCount += importedMunicipalities;
        }
        else if (filename.includes('neighborhood') || filename.includes('hood')) {
          const importedNeighborhoods = await this.processNeighborhoodData(fileContent);
          result.neighborhoodCount += importedNeighborhoods;
        }
        else if (filename.includes('township') || filename.includes('range')) {
          const importedMappings = await this.processTownshipRangeData(fileContent);
          result.townshipRangeMappingCount += importedMappings;
        }
        else if (filename.includes('tca') || filename.includes('tax')) {
          const importedMappings = await this.processTaxCodeAreaData(fileContent);
          result.taxCodeAreaMappingCount += importedMappings;
        }
      }
      
      // Mark import as successful
      result.success = true;
      
      // Cache the result
      this.cache.set(cacheKey, result, CACHE_TTL);
      
      // Emit event for geographic data update
      gisImportEvents.emit('gis:import:completed', result);
      
      return result;
    } catch (error) {
      console.error('Error importing GIS data:', error);
      return {
        success: false,
        regionCount: 0,
        municipalityCount: 0,
        neighborhoodCount: 0,
        townshipRangeMappingCount: 0,
        taxCodeAreaMappingCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        importDate: new Date()
      };
    }
  }
  
  /**
   * Import GIS data from a local file
   * @param filePath Path to local GIS data file
   * @param options Import options
   * @returns Import result
   */
  async importFromLocalFile(filePath: string, options: GisImportOptions = {}): Promise<GisImportResult> {
    try {
      // Start with empty result
      const result: GisImportResult = {
        success: false,
        regionCount: 0,
        municipalityCount: 0,
        neighborhoodCount: 0,
        townshipRangeMappingCount: 0,
        taxCodeAreaMappingCount: 0,
        importDate: new Date()
      };
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Read file content
      const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Clear existing data if requested
      if (options.clearExisting) {
        await this.clearGeographicData();
      }
      
      // Determine file type based on filename and process accordingly
      const filename = path.basename(filePath).toLowerCase();
      
      if (filename.includes('region')) {
        const importedRegions = await this.processRegionData(fileContent);
        result.regionCount = importedRegions;
      } 
      else if (filename.includes('municipal')) {
        const importedMunicipalities = await this.processMunicipalityData(fileContent);
        result.municipalityCount = importedMunicipalities;
      }
      else if (filename.includes('neighborhood') || filename.includes('hood')) {
        const importedNeighborhoods = await this.processNeighborhoodData(fileContent);
        result.neighborhoodCount = importedNeighborhoods;
      }
      else if (filename.includes('township') || filename.includes('range')) {
        const importedMappings = await this.processTownshipRangeData(fileContent);
        result.townshipRangeMappingCount = importedMappings;
      }
      else if (filename.includes('tca') || filename.includes('tax')) {
        const importedMappings = await this.processTaxCodeAreaData(fileContent);
        result.taxCodeAreaMappingCount = importedMappings;
      }
      
      // Mark import as successful
      result.success = true;
      
      // Emit event for geographic data update
      gisImportEvents.emit('gis:import:completed', result);
      
      return result;
    } catch (error) {
      console.error('Error importing GIS data from local file:', error);
      return {
        success: false,
        regionCount: 0,
        municipalityCount: 0,
        neighborhoodCount: 0,
        townshipRangeMappingCount: 0,
        taxCodeAreaMappingCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        importDate: new Date()
      };
    }
  }
  
  /**
   * Fetch content from a URL
   * @param url URL to fetch
   * @returns Parsed JSON data or null if fetch failed
   */
  private async fetchFileContent(url: string): Promise<any> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching file from ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Clear all geographic data from the database
   * This is a soft delete that marks records as inactive
   */
  private async clearGeographicData(): Promise<void> {
    try {
      // Start a transaction to ensure consistency
      await db.transaction(async (tx) => {
        // Soft delete all regions
        await tx.execute(
          `UPDATE geographic_regions SET is_active = false, updated_at = NOW()`
        );
        
        // Soft delete all municipalities
        await tx.execute(
          `UPDATE geographic_municipalities SET is_active = false, updated_at = NOW()`
        );
        
        // Soft delete all neighborhoods
        await tx.execute(
          `UPDATE geographic_neighborhoods SET is_active = false, updated_at = NOW()`
        );
        
        // Soft delete all township/range mappings
        await tx.execute(
          `UPDATE township_range_mapping SET is_active = false, updated_at = NOW()`
        );
        
        // Soft delete all tax code area mappings
        await tx.execute(
          `UPDATE tax_code_area_mapping SET is_active = false, updated_at = NOW()`
        );
      });
      
      console.log('All geographic data marked as inactive');
    } catch (error) {
      console.error('Error clearing geographic data:', error);
      throw error;
    }
  }
  
  /**
   * Process region data from a GIS file
   * @param data Region data from GIS file
   * @returns Number of regions imported
   */
  private async processRegionData(data: any): Promise<number> {
    try {
      let importCount = 0;
      
      // Handle GeoJSON format
      if (data.type === 'FeatureCollection') {
        for (const feature of data.features) {
          if (feature.properties) {
            const regionData: InsertGeographicRegion = {
              regionCode: feature.properties.region_code || `BC-${feature.properties.name?.toUpperCase().replace(/\s+/g, '-')}`,
              name: feature.properties.name || feature.properties.NAME || feature.properties.REGION_NAME,
              description: feature.properties.description || `${feature.properties.name || feature.properties.NAME} region of Benton County`,
              isActive: true,
              // Store geometry as JSON if present
              metadata: feature.geometry ? { geometry: feature.geometry } : null
            };
            
            // Skip if missing required fields
            if (!regionData.name || !regionData.regionCode) {
              console.warn('Skipping region import due to missing name or code:', feature.properties);
              continue;
            }
            
            // Check if region already exists
            const existingRegion = await this.geographicService.getRegionByCode(regionData.regionCode);
            
            if (existingRegion) {
              // Update existing region
              await this.geographicService.updateRegion(existingRegion.id, {
                name: regionData.name,
                description: regionData.description,
                isActive: true,
                metadata: regionData.metadata
              });
            } else {
              // Create new region
              await this.geographicService.createRegion(regionData);
            }
            
            importCount++;
          }
        }
      } 
      // Handle plain JSON array
      else if (Array.isArray(data)) {
        for (const item of data) {
          const regionData: InsertGeographicRegion = {
            regionCode: item.region_code || item.code || `BC-${item.name?.toUpperCase().replace(/\s+/g, '-')}`,
            name: item.name || item.NAME || item.region_name,
            description: item.description || `${item.name || item.NAME} region of Benton County`,
            isActive: true,
            metadata: item.metadata || item.geometry ? { geometry: item.geometry } : null
          };
          
          // Skip if missing required fields
          if (!regionData.name || !regionData.regionCode) {
            console.warn('Skipping region import due to missing name or code:', item);
            continue;
          }
          
          // Check if region already exists
          const existingRegion = await this.geographicService.getRegionByCode(regionData.regionCode);
          
          if (existingRegion) {
            // Update existing region
            await this.geographicService.updateRegion(existingRegion.id, {
              name: regionData.name,
              description: regionData.description,
              isActive: true,
              metadata: regionData.metadata
            });
          } else {
            // Create new region
            await this.geographicService.createRegion(regionData);
          }
          
          importCount++;
        }
      }
      
      console.log(`Imported ${importCount} regions`);
      return importCount;
    } catch (error) {
      console.error('Error processing region data:', error);
      return 0;
    }
  }
  
  /**
   * Process municipality data from a GIS file
   * @param data Municipality data from GIS file
   * @returns Number of municipalities imported
   */
  private async processMunicipalityData(data: any): Promise<number> {
    try {
      let importCount = 0;
      
      // Handle GeoJSON format
      if (data.type === 'FeatureCollection') {
        for (const feature of data.features) {
          if (feature.properties) {
            // Find associated region
            let regionId: number | null = null;
            const regionCode = feature.properties.region_code;
            
            if (regionCode) {
              const region = await this.geographicService.getRegionByCode(regionCode);
              if (region) {
                regionId = region.id;
              }
            }
            
            const municipalityData: InsertGeographicMunicipality = {
              municipalityCode: feature.properties.municipality_code || feature.properties.code || 
                               `BC-${feature.properties.name?.toUpperCase().replace(/\s+/g, '-')}`,
              name: feature.properties.name || feature.properties.NAME || feature.properties.MUNICIPALITY_NAME,
              regionId: regionId,
              description: feature.properties.description || `${feature.properties.name || feature.properties.NAME} in Benton County`,
              isActive: true,
              // Store geometry as JSON if present
              metadata: feature.geometry ? { geometry: feature.geometry } : null
            };
            
            // Skip if missing required fields
            if (!municipalityData.name || !municipalityData.municipalityCode) {
              console.warn('Skipping municipality import due to missing name or code:', feature.properties);
              continue;
            }
            
            // Check if municipality already exists
            const existingMunicipality = await this.geographicService.getMunicipalityByCode(municipalityData.municipalityCode);
            
            if (existingMunicipality) {
              // Update existing municipality
              await this.geographicService.updateMunicipality(existingMunicipality.id, {
                name: municipalityData.name,
                regionId: municipalityData.regionId,
                description: municipalityData.description,
                isActive: true,
                metadata: municipalityData.metadata
              });
            } else {
              // Create new municipality
              await this.geographicService.createMunicipality(municipalityData);
            }
            
            importCount++;
          }
        }
      } 
      // Handle plain JSON array
      else if (Array.isArray(data)) {
        for (const item of data) {
          // Find associated region
          let regionId: number | null = null;
          const regionCode = item.region_code;
          
          if (regionCode) {
            const region = await this.geographicService.getRegionByCode(regionCode);
            if (region) {
              regionId = region.id;
            }
          }
          
          const municipalityData: InsertGeographicMunicipality = {
            municipalityCode: item.municipality_code || item.code || 
                             `BC-${item.name?.toUpperCase().replace(/\s+/g, '-')}`,
            name: item.name || item.NAME || item.municipality_name,
            regionId: regionId,
            description: item.description || `${item.name || item.NAME} in Benton County`,
            isActive: true,
            metadata: item.metadata || item.geometry ? { geometry: item.geometry } : null
          };
          
          // Skip if missing required fields
          if (!municipalityData.name || !municipalityData.municipalityCode) {
            console.warn('Skipping municipality import due to missing name or code:', item);
            continue;
          }
          
          // Check if municipality already exists
          const existingMunicipality = await this.geographicService.getMunicipalityByCode(municipalityData.municipalityCode);
          
          if (existingMunicipality) {
            // Update existing municipality
            await this.geographicService.updateMunicipality(existingMunicipality.id, {
              name: municipalityData.name,
              regionId: municipalityData.regionId,
              description: municipalityData.description,
              isActive: true,
              metadata: municipalityData.metadata
            });
          } else {
            // Create new municipality
            await this.geographicService.createMunicipality(municipalityData);
          }
          
          importCount++;
        }
      }
      
      console.log(`Imported ${importCount} municipalities`);
      return importCount;
    } catch (error) {
      console.error('Error processing municipality data:', error);
      return 0;
    }
  }
  
  /**
   * Process neighborhood data from a GIS file
   * @param data Neighborhood data from GIS file
   * @returns Number of neighborhoods imported
   */
  private async processNeighborhoodData(data: any): Promise<number> {
    try {
      let importCount = 0;
      
      // Handle GeoJSON format
      if (data.type === 'FeatureCollection') {
        for (const feature of data.features) {
          if (feature.properties) {
            // Find associated municipality
            let municipalityId: number | null = null;
            const municipalityCode = feature.properties.municipality_code;
            
            if (municipalityCode) {
              const municipality = await this.geographicService.getMunicipalityByCode(municipalityCode);
              if (municipality) {
                municipalityId = municipality.id;
              }
            }
            
            const neighborhoodData: InsertGeographicNeighborhood = {
              hoodCd: feature.properties.hood_cd || feature.properties.code || 
                     `BC-NH-${feature.properties.name?.toUpperCase().replace(/\s+/g, '-')}`,
              name: feature.properties.name || feature.properties.NAME || feature.properties.NEIGHBORHOOD_NAME,
              municipalityId: municipalityId,
              description: feature.properties.description || 
                          `${feature.properties.name || feature.properties.NAME} neighborhood in Benton County`,
              isActive: true,
              // Store geometry as JSON if present
              metadata: feature.geometry ? { geometry: feature.geometry } : null
            };
            
            // Skip if missing required fields
            if (!neighborhoodData.name || !neighborhoodData.hoodCd) {
              console.warn('Skipping neighborhood import due to missing name or code:', feature.properties);
              continue;
            }
            
            // Check if neighborhood already exists
            const existingNeighborhood = await this.geographicService.getNeighborhoodByHoodCd(neighborhoodData.hoodCd);
            
            if (existingNeighborhood) {
              // Update existing neighborhood
              await this.geographicService.updateNeighborhood(existingNeighborhood.id, {
                name: neighborhoodData.name,
                municipalityId: neighborhoodData.municipalityId,
                description: neighborhoodData.description,
                isActive: true,
                metadata: neighborhoodData.metadata
              });
            } else {
              // Create new neighborhood
              await this.geographicService.createNeighborhood(neighborhoodData);
            }
            
            importCount++;
          }
        }
      } 
      // Handle plain JSON array
      else if (Array.isArray(data)) {
        for (const item of data) {
          // Find associated municipality
          let municipalityId: number | null = null;
          const municipalityCode = item.municipality_code;
          
          if (municipalityCode) {
            const municipality = await this.geographicService.getMunicipalityByCode(municipalityCode);
            if (municipality) {
              municipalityId = municipality.id;
            }
          }
          
          const neighborhoodData: InsertGeographicNeighborhood = {
            hoodCd: item.hood_cd || item.code || 
                   `BC-NH-${item.name?.toUpperCase().replace(/\s+/g, '-')}`,
            name: item.name || item.NAME || item.neighborhood_name,
            municipalityId: municipalityId,
            description: item.description || 
                        `${item.name || item.NAME} neighborhood in Benton County`,
            isActive: true,
            metadata: item.metadata || item.geometry ? { geometry: item.geometry } : null
          };
          
          // Skip if missing required fields
          if (!neighborhoodData.name || !neighborhoodData.hoodCd) {
            console.warn('Skipping neighborhood import due to missing name or code:', item);
            continue;
          }
          
          // Check if neighborhood already exists
          const existingNeighborhood = await this.geographicService.getNeighborhoodByHoodCd(neighborhoodData.hoodCd);
          
          if (existingNeighborhood) {
            // Update existing neighborhood
            await this.geographicService.updateNeighborhood(existingNeighborhood.id, {
              name: neighborhoodData.name,
              municipalityId: neighborhoodData.municipalityId,
              description: neighborhoodData.description,
              isActive: true,
              metadata: neighborhoodData.metadata
            });
          } else {
            // Create new neighborhood
            await this.geographicService.createNeighborhood(neighborhoodData);
          }
          
          importCount++;
        }
      }
      
      console.log(`Imported ${importCount} neighborhoods`);
      return importCount;
    } catch (error) {
      console.error('Error processing neighborhood data:', error);
      return 0;
    }
  }
  
  /**
   * Process township/range mapping data from a GIS file
   * @param data Township/range mapping data from GIS file
   * @returns Number of mappings imported
   */
  private async processTownshipRangeData(data: any): Promise<number> {
    try {
      let importCount = 0;
      
      // Handle GeoJSON format
      if (data.type === 'FeatureCollection') {
        for (const feature of data.features) {
          if (feature.properties) {
            // Find associated region and municipality if provided
            let regionId: number | null = null;
            let municipalityId: number | null = null;
            
            if (feature.properties.region_code) {
              const region = await this.geographicService.getRegionByCode(feature.properties.region_code);
              if (region) {
                regionId = region.id;
              }
            }
            
            if (feature.properties.municipality_code) {
              const municipality = await this.geographicService.getMunicipalityByCode(feature.properties.municipality_code);
              if (municipality) {
                municipalityId = municipality.id;
              }
            }
            
            const townshipRangeData: InsertTownshipRangeMap = {
              townshipCode: feature.properties.township_code,
              rangeCode: feature.properties.range_code,
              regionId: regionId,
              municipalityId: municipalityId,
              hoodCd: feature.properties.hood_cd || null,
              description: feature.properties.description || 
                          `Township ${feature.properties.township_code} Range ${feature.properties.range_code}`,
              isActive: true,
              // Store geometry as JSON if present
              metadata: feature.geometry ? { geometry: feature.geometry } : null
            };
            
            // Skip if missing required fields
            if (!townshipRangeData.townshipCode || !townshipRangeData.rangeCode) {
              console.warn('Skipping township/range mapping import due to missing codes:', feature.properties);
              continue;
            }
            
            // Check if mapping already exists
            const [existingMapping] = await db
              .select()
              .from(schema.townshipRangeMapping)
              .where(
                and(
                  eq(schema.townshipRangeMapping.townshipCode, townshipRangeData.townshipCode),
                  eq(schema.townshipRangeMapping.rangeCode, townshipRangeData.rangeCode)
                )
              );
            
            if (existingMapping) {
              // Update existing mapping
              await db
                .update(schema.townshipRangeMapping)
                .set({
                  regionId: townshipRangeData.regionId,
                  municipalityId: townshipRangeData.municipalityId,
                  hoodCd: townshipRangeData.hoodCd,
                  description: townshipRangeData.description,
                  isActive: true,
                  updatedAt: new Date(),
                  metadata: townshipRangeData.metadata
                })
                .where(eq(schema.townshipRangeMapping.id, existingMapping.id));
            } else {
              // Create new mapping
              await this.geographicService.createTownshipRangeMapping(townshipRangeData);
            }
            
            importCount++;
          }
        }
      } 
      // Handle plain JSON array
      else if (Array.isArray(data)) {
        for (const item of data) {
          // Find associated region and municipality if provided
          let regionId: number | null = null;
          let municipalityId: number | null = null;
          
          if (item.region_code) {
            const region = await this.geographicService.getRegionByCode(item.region_code);
            if (region) {
              regionId = region.id;
            }
          }
          
          if (item.municipality_code) {
            const municipality = await this.geographicService.getMunicipalityByCode(item.municipality_code);
            if (municipality) {
              municipalityId = municipality.id;
            }
          }
          
          const townshipRangeData: InsertTownshipRangeMap = {
            townshipCode: item.township_code,
            rangeCode: item.range_code,
            regionId: regionId,
            municipalityId: municipalityId,
            hoodCd: item.hood_cd || null,
            description: item.description || 
                        `Township ${item.township_code} Range ${item.range_code}`,
            isActive: true,
            metadata: item.metadata || item.geometry ? { geometry: item.geometry } : null
          };
          
          // Skip if missing required fields
          if (!townshipRangeData.townshipCode || !townshipRangeData.rangeCode) {
            console.warn('Skipping township/range mapping import due to missing codes:', item);
            continue;
          }
          
          // Check if mapping already exists
          const [existingMapping] = await db
            .select()
            .from(schema.townshipRangeMapping)
            .where(
              and(
                eq(schema.townshipRangeMapping.townshipCode, townshipRangeData.townshipCode),
                eq(schema.townshipRangeMapping.rangeCode, townshipRangeData.rangeCode)
              )
            );
          
          if (existingMapping) {
            // Update existing mapping
            await db
              .update(schema.townshipRangeMapping)
              .set({
                regionId: townshipRangeData.regionId,
                municipalityId: townshipRangeData.municipalityId,
                hoodCd: townshipRangeData.hoodCd,
                description: townshipRangeData.description,
                isActive: true,
                updatedAt: new Date(),
                metadata: townshipRangeData.metadata
              })
              .where(eq(schema.townshipRangeMapping.id, existingMapping.id));
          } else {
            // Create new mapping
            await this.geographicService.createTownshipRangeMapping(townshipRangeData);
          }
          
          importCount++;
        }
      }
      
      console.log(`Imported ${importCount} township/range mappings`);
      return importCount;
    } catch (error) {
      console.error('Error processing township/range data:', error);
      return 0;
    }
  }
  
  /**
   * Process tax code area mapping data from a GIS file
   * @param data Tax code area mapping data from GIS file
   * @returns Number of mappings imported
   */
  private async processTaxCodeAreaData(data: any): Promise<number> {
    try {
      let importCount = 0;
      
      // Handle GeoJSON format
      if (data.type === 'FeatureCollection') {
        for (const feature of data.features) {
          if (feature.properties) {
            // Find associated region and municipality if provided
            let regionId: number | null = null;
            let municipalityId: number | null = null;
            
            if (feature.properties.region_code) {
              const region = await this.geographicService.getRegionByCode(feature.properties.region_code);
              if (region) {
                regionId = region.id;
              }
            }
            
            if (feature.properties.municipality_code) {
              const municipality = await this.geographicService.getMunicipalityByCode(feature.properties.municipality_code);
              if (municipality) {
                municipalityId = municipality.id;
              }
            }
            
            const taxCodeData: InsertTaxCodeAreaMap = {
              tca: feature.properties.tca,
              regionId: regionId,
              municipalityId: municipalityId,
              description: feature.properties.description || 
                          `Tax Code Area ${feature.properties.tca}`,
              taxRate: feature.properties.tax_rate || 0.0,
              isActive: true,
              // Store geometry as JSON if present
              metadata: feature.geometry ? { geometry: feature.geometry } : null
            };
            
            // Skip if missing required fields
            if (!taxCodeData.tca) {
              console.warn('Skipping tax code area mapping import due to missing TCA:', feature.properties);
              continue;
            }
            
            // Check if mapping already exists
            const [existingMapping] = await db
              .select()
              .from(schema.taxCodeAreaMapping)
              .where(eq(schema.taxCodeAreaMapping.tca, taxCodeData.tca));
            
            if (existingMapping) {
              // Update existing mapping
              await db
                .update(schema.taxCodeAreaMapping)
                .set({
                  regionId: taxCodeData.regionId,
                  municipalityId: taxCodeData.municipalityId,
                  description: taxCodeData.description,
                  taxRate: taxCodeData.taxRate,
                  isActive: true,
                  updatedAt: new Date(),
                  metadata: taxCodeData.metadata
                })
                .where(eq(schema.taxCodeAreaMapping.id, existingMapping.id));
            } else {
              // Create new mapping
              await this.geographicService.createTaxCodeAreaMapping(taxCodeData);
            }
            
            importCount++;
          }
        }
      } 
      // Handle plain JSON array
      else if (Array.isArray(data)) {
        for (const item of data) {
          // Find associated region and municipality if provided
          let regionId: number | null = null;
          let municipalityId: number | null = null;
          
          if (item.region_code) {
            const region = await this.geographicService.getRegionByCode(item.region_code);
            if (region) {
              regionId = region.id;
            }
          }
          
          if (item.municipality_code) {
            const municipality = await this.geographicService.getMunicipalityByCode(item.municipality_code);
            if (municipality) {
              municipalityId = municipality.id;
            }
          }
          
          const taxCodeData: InsertTaxCodeAreaMap = {
            tca: item.tca,
            regionId: regionId,
            municipalityId: municipalityId,
            description: item.description || 
                        `Tax Code Area ${item.tca}`,
            taxRate: item.tax_rate || 0.0,
            isActive: true,
            metadata: item.metadata || item.geometry ? { geometry: item.geometry } : null
          };
          
          // Skip if missing required fields
          if (!taxCodeData.tca) {
            console.warn('Skipping tax code area mapping import due to missing TCA:', item);
            continue;
          }
          
          // Check if mapping already exists
          const [existingMapping] = await db
            .select()
            .from(schema.taxCodeAreaMapping)
            .where(eq(schema.taxCodeAreaMapping.tca, taxCodeData.tca));
          
          if (existingMapping) {
            // Update existing mapping
            await db
              .update(schema.taxCodeAreaMapping)
              .set({
                regionId: taxCodeData.regionId,
                municipalityId: taxCodeData.municipalityId,
                description: taxCodeData.description,
                taxRate: taxCodeData.taxRate,
                isActive: true,
                updatedAt: new Date(),
                metadata: taxCodeData.metadata
              })
              .where(eq(schema.taxCodeAreaMapping.id, existingMapping.id));
          } else {
            // Create new mapping
            await this.geographicService.createTaxCodeAreaMapping(taxCodeData);
          }
          
          importCount++;
        }
      }
      
      console.log(`Imported ${importCount} tax code area mappings`);
      return importCount;
    } catch (error) {
      console.error('Error processing tax code area data:', error);
      return 0;
    }
  }
}

export const gisImportService = new GisImportService();