/**
 * Benton County Conversion Service
 * 
 * This service provides an interface to the Benton County Conversion Agent,
 * allowing API routes to easily convert terminology and data formats.
 */

import { bentonCountyConversionAgent } from '../mcp/agents/conversionAgent';

export class BentonConversionService {
  /**
   * Convert a generic term to Benton County specific terminology
   * 
   * @param term The term to convert
   * @param context Optional context to help with conversion
   * @param domain Optional domain (building, property, assessment, general)
   * @returns The Benton County specific term
   */
  convertToCountyTerm(term: string, context?: string, domain?: 'building' | 'property' | 'assessment' | 'general'): string {
    return bentonCountyConversionAgent.convertTerminology({
      term,
      context,
      domain,
      direction: 'toCounty'
    });
  }
  
  /**
   * Convert a Benton County specific term to a generic term
   * 
   * @param term The Benton County term to convert
   * @param context Optional context to help with conversion
   * @param domain Optional domain (building, property, assessment, general)
   * @returns The generic term
   */
  convertFromCountyTerm(term: string, context?: string, domain?: 'building' | 'property' | 'assessment' | 'general'): string {
    return bentonCountyConversionAgent.convertTerminology({
      term,
      context,
      domain,
      direction: 'fromCounty'
    });
  }
  
  /**
   * Convert building type code to full Benton County description
   * 
   * @param buildingType The building type code (R1, C1, etc.)
   * @returns The full description
   */
  getBuildingTypeDescription(buildingType: string): string {
    return bentonCountyConversionAgent.convertBuildingType(buildingType);
  }
  
  /**
   * Convert region to full Benton County region name
   * 
   * @param region The region code or short name
   * @returns The full region name
   */
  getRegionName(region: string): string {
    return bentonCountyConversionAgent.convertRegion(region);
  }
  
  /**
   * Convert quality level to Benton County quality description
   * 
   * @param quality The quality level
   * @returns The Benton County quality description
   */
  getQualityDescription(quality: string): string {
    return bentonCountyConversionAgent.convertQuality(quality);
  }
  
  /**
   * Convert condition to Benton County condition description
   * 
   * @param condition The condition level
   * @returns The Benton County condition description
   */
  getConditionDescription(condition: string): string {
    return bentonCountyConversionAgent.convertCondition(condition);
  }
  
  /**
   * Convert data to Benton County format
   * 
   * @param data The data to convert
   * @param dataType The type of data (costMatrix, buildingCost, etc.)
   * @param options Additional conversion options
   * @returns The converted data in Benton County format
   */
  convertToCountyFormat(
    data: any, 
    dataType: 'costMatrix' | 'buildingCost' | 'propertyData' | 'report' | 'scenario',
    options?: {
      includeMetadata?: boolean;
      formatVersion?: string;
      includeRegionalContext?: boolean;
    }
  ): any {
    return bentonCountyConversionAgent.convertData({
      data,
      dataType,
      direction: 'toCounty',
      options
    });
  }
  
  /**
   * Convert data from Benton County format to standard format
   * 
   * @param data The Benton County formatted data
   * @param dataType The type of data (costMatrix, buildingCost, etc.)
   * @returns The converted data in standard format
   */
  convertFromCountyFormat(
    data: any,
    dataType: 'costMatrix' | 'buildingCost' | 'propertyData' | 'report' | 'scenario'
  ): any {
    return bentonCountyConversionAgent.convertData({
      data,
      dataType,
      direction: 'fromCounty'
    });
  }
  
  /**
   * Format a report according to Benton County standards
   * 
   * @param reportData The report data to format
   * @param reportType The type of report
   * @param options Formatting options
   * @returns The formatted report in Benton County format
   */
  formatCountyReport(
    reportData: any,
    reportType: 'assessment' | 'costAnalysis' | 'whatIfScenario' | 'propertyValuation',
    options?: {
      includeHeaderFooter?: boolean;
      includeSignatureBlock?: boolean;
      includeCountyBranding?: boolean;
    }
  ): any {
    return bentonCountyConversionAgent.formatReport({
      reportData,
      reportType,
      ...options
    });
  }
  
  /**
   * Enhance API response with Benton County terminology and formatting
   * 
   * @param response The API response object
   * @param responseType The type of response data
   * @returns The enhanced response with Benton County terminology
   */
  enhanceApiResponse(response: any, responseType: 'costMatrix' | 'buildingCost' | 'scenario' | 'report'): any {
    // Handle array responses
    if (Array.isArray(response)) {
      return response.map(item => this.convertToCountyFormat(item, responseType, {
        includeMetadata: true,
        includeRegionalContext: true
      }));
    }
    
    // Handle single object responses
    return this.convertToCountyFormat(response, responseType, {
      includeMetadata: true,
      includeRegionalContext: true
    });
  }
}

// Export singleton instance
export const bentonConversionService = new BentonConversionService();