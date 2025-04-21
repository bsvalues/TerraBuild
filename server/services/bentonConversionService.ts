/**
 * Benton County Conversion Service
 * 
 * This service provides a simpler interface for components to interact with
 * the Benton County Conversion Agent without needing to understand the MCP
 * events architecture.
 */

import { bentonCountyConversionAgent } from '../mcp/agents/conversionAgent';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for building type info
 */
export interface BuildingTypeInfo {
  code: string;
  genericName: string;
  bentonName: string;
  description: string;
}

/**
 * Interface for region info
 */
export interface RegionInfo {
  code: string;
  genericName: string;
  bentonName: string;
  factor: number;
}

/**
 * Service for Benton County terminology and data conversion
 */
export class BentonConversionService {
  private static instance: BentonConversionService;
  
  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): BentonConversionService {
    if (!BentonConversionService.instance) {
      BentonConversionService.instance = new BentonConversionService();
    }
    return BentonConversionService.instance;
  }
  
  /**
   * Convert a building type code or name to Benton County format
   * 
   * @param buildingType Building type code or name
   * @returns Benton County building type name
   */
  public convertBuildingType(buildingType: string): string {
    return bentonCountyConversionAgent.convertBuildingType(buildingType);
  }
  
  /**
   * Convert a region code or name to Benton County format
   * 
   * @param region Region code or name
   * @returns Benton County region name
   */
  public convertRegion(region: string): string {
    return bentonCountyConversionAgent.convertRegion(region);
  }
  
  /**
   * Convert a quality level to Benton County format
   * 
   * @param quality Quality level
   * @returns Benton County quality description
   */
  public convertQuality(quality: string): string {
    return bentonCountyConversionAgent.convertQuality(quality);
  }
  
  /**
   * Convert a condition to Benton County format
   * 
   * @param condition Condition level
   * @returns Benton County condition description
   */
  public convertCondition(condition: string): string {
    return bentonCountyConversionAgent.convertCondition(condition);
  }
  
  /**
   * Get regional factors for a specific region
   * 
   * @param region Region name or code
   * @returns Regional factors info
   */
  public getRegionalFactors(region: string): { code: string; name: string; factor: number } {
    return bentonCountyConversionAgent.getRegionalFactors(region);
  }
  
  /**
   * Convert a term between generic and Benton County formats
   * 
   * @param term The term to convert
   * @param fromType The source format type ('generic' or 'benton')
   * @param category The term category
   * @returns The converted term
   */
  public convertTerminology(
    term: string, 
    fromType: 'generic' | 'benton', 
    category: 'buildingType' | 'region' | 'quality' | 'condition' | 'general'
  ): string {
    return bentonCountyConversionAgent.convertTerminology({
      term,
      fromType,
      category
    });
  }
  
  /**
   * Convert data between generic and Benton County formats
   * 
   * @param data The data to convert
   * @param fromFormat The source format ('generic' or 'benton')
   * @param dataType The type of data
   * @returns The converted data
   */
  public convertData(
    data: any,
    fromFormat: 'generic' | 'benton',
    dataType: 'costMatrix' | 'propertyRecord' | 'assessment' | 'report'
  ): any {
    return bentonCountyConversionAgent.convertData({
      data,
      fromFormat,
      dataType
    });
  }
  
  /**
   * Format a report according to Benton County standards
   * 
   * @param reportData The report data to format
   * @param format The desired format ('detailed', 'summary', or 'official')
   * @param includeBranding Whether to include Benton County branding
   * @returns The formatted report
   */
  public formatReport(
    reportData: any,
    format: 'detailed' | 'summary' | 'official',
    includeBranding: boolean = true
  ): any {
    return bentonCountyConversionAgent.formatReport({
      reportData,
      format,
      includeBranding
    });
  }
  
  /**
   * Get all building types
   * 
   * @returns Array of building type information
   */
  public getAllBuildingTypes(): BuildingTypeInfo[] {
    // This would be implemented by adding a method to the conversion agent
    // For now, we'll return a default set of building types
    return [
      { code: 'R1', genericName: 'RESIDENTIAL_SINGLE_FAMILY', bentonName: 'SINGLE FAMILY RESIDENTIAL', description: 'Single-family residential dwelling' },
      { code: 'R2', genericName: 'RESIDENTIAL_MULTI_FAMILY', bentonName: 'MULTI-FAMILY RESIDENTIAL', description: 'Multi-family residential dwelling' },
      { code: 'C1', genericName: 'COMMERCIAL_RETAIL', bentonName: 'RETAIL COMMERCIAL', description: 'Retail commercial building' },
      { code: 'C2', genericName: 'COMMERCIAL_OFFICE', bentonName: 'OFFICE COMMERCIAL', description: 'Office commercial building' },
      { code: 'C3', genericName: 'COMMERCIAL_MIXED', bentonName: 'MIXED-USE COMMERCIAL', description: 'Mixed-use commercial building' },
      { code: 'I1', genericName: 'INDUSTRIAL_LIGHT', bentonName: 'LIGHT INDUSTRIAL', description: 'Light industrial building' },
      { code: 'I2', genericName: 'INDUSTRIAL_HEAVY', bentonName: 'HEAVY INDUSTRIAL', description: 'Heavy industrial building' },
      { code: 'A1', genericName: 'AGRICULTURAL', bentonName: 'AGRICULTURAL', description: 'Agricultural building' },
      { code: 'S1', genericName: 'SPECIALTY', bentonName: 'SPECIALTY', description: 'Specialty building' }
    ];
  }
  
  /**
   * Get all regions
   * 
   * @returns Array of region information
   */
  public getAllRegions(): RegionInfo[] {
    // This would be implemented by adding a method to the conversion agent
    // For now, we'll return a default set of regions
    return [
      { code: 'EB', genericName: 'EASTERN', bentonName: 'EAST BENTON', factor: 0.95 },
      { code: 'CB', genericName: 'CENTRAL', bentonName: 'CENTRAL BENTON', factor: 1.0 },
      { code: 'WB', genericName: 'WESTERN', bentonName: 'WEST BENTON', factor: 1.05 }
    ];
  }
}

// Export singleton instance
export const bentonConversionService = BentonConversionService.getInstance();