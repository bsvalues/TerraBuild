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
      repoName: 'bcbspacsmapping',
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
      
      // Find relevant GIS data files
      const gisFiles = response.data.filter((file: any) => {
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
    // Implementation similar to processRegionData but for municipalities
    // Would handle linking to the parent regions
    return 0; // Placeholder
  }
  
  /**
   * Process neighborhood data from a GIS file
   * @param data Neighborhood data from GIS file
   * @returns Number of neighborhoods imported
   */
  private async processNeighborhoodData(data: any): Promise<number> {
    // Implementation similar to processRegionData but for neighborhoods
    // Would handle linking to the parent municipalities
    return 0; // Placeholder
  }
  
  /**
   * Process township/range mapping data from a GIS file
   * @param data Township/range mapping data from GIS file
   * @returns Number of mappings imported
   */
  private async processTownshipRangeData(data: any): Promise<number> {
    // Implementation for township/range mappings
    return 0; // Placeholder
  }
  
  /**
   * Process tax code area mapping data from a GIS file
   * @param data Tax code area mapping data from GIS file
   * @returns Number of mappings imported
   */
  private async processTaxCodeAreaData(data: any): Promise<number> {
    // Implementation for tax code area mappings
    return 0; // Placeholder
  }
}

export const gisImportService = new GisImportService();