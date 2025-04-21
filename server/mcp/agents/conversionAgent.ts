/**
 * Benton County Conversion Agent
 * 
 * This agent is responsible for converting standard terminology and data
 * into Benton County specific formats. It handles terminology mapping,
 * regional adjustments, and data format transformations.
 */
import { CustomAgentBase } from './customAgentBase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for terminology conversion requests
 */
interface TerminologyConversionRequest {
  term: string;
  fromType: 'generic' | 'benton';
  category: 'buildingType' | 'region' | 'quality' | 'condition' | 'general';
}

/**
 * Interface for data conversion requests
 */
interface DataConversionRequest {
  data: any;
  fromFormat: 'generic' | 'benton';
  dataType: 'costMatrix' | 'propertyRecord' | 'assessment' | 'report';
}

/**
 * Interface for report formatting requests
 */
interface ReportFormattingRequest {
  reportData: any;
  format: 'detailed' | 'summary' | 'official';
  includeBranding: boolean;
}

/**
 * Benton County Conversion Agent implementation
 */
class BentonCountyConversionAgent extends CustomAgentBase {
  private buildingTypeMap: Map<string, string> = new Map();
  private regionMap: Map<string, string> = new Map();
  private qualityMap: Map<string, string> = new Map();
  private conditionMap: Map<string, string> = new Map();
  private generalTermMap: Map<string, string> = new Map();
  private regionFactors: Map<string, number> = new Map();

  /**
   * Constructor
   */
  constructor() {
    super('benton-county-conversion-agent', 'Benton County Conversion Agent');
    this.initMappings();
    
    // Register event handlers
    this.registerEventHandler('terminology:convert', this.handleTerminologyConversion.bind(this));
    this.registerEventHandler('data:convert', this.handleDataConversion.bind(this));
    this.registerEventHandler('report:format', this.handleReportFormatting.bind(this));
    
    console.log('Registering Benton County Conversion Agent with MCP framework');
  }

  /**
   * Initialize terminology and data mappings
   */
  private initMappings(): void {
    // Building Type Mappings (Generic <-> Benton)
    this.buildingTypeMap.set('RESIDENTIAL_SINGLE_FAMILY', 'SINGLE FAMILY RESIDENTIAL');
    this.buildingTypeMap.set('RESIDENTIAL_MULTI_FAMILY', 'MULTI-FAMILY RESIDENTIAL');
    this.buildingTypeMap.set('COMMERCIAL_RETAIL', 'RETAIL COMMERCIAL');
    this.buildingTypeMap.set('COMMERCIAL_OFFICE', 'OFFICE COMMERCIAL');
    this.buildingTypeMap.set('COMMERCIAL_MIXED', 'MIXED-USE COMMERCIAL');
    this.buildingTypeMap.set('INDUSTRIAL_LIGHT', 'LIGHT INDUSTRIAL');
    this.buildingTypeMap.set('INDUSTRIAL_HEAVY', 'HEAVY INDUSTRIAL');
    this.buildingTypeMap.set('AGRICULTURAL', 'AGRICULTURAL');
    this.buildingTypeMap.set('SPECIALTY', 'SPECIALTY');
    
    // Also add code-based mappings
    this.buildingTypeMap.set('R1', 'SINGLE FAMILY RESIDENTIAL');
    this.buildingTypeMap.set('R2', 'MULTI-FAMILY RESIDENTIAL');
    this.buildingTypeMap.set('C1', 'RETAIL COMMERCIAL');
    this.buildingTypeMap.set('C2', 'OFFICE COMMERCIAL');
    this.buildingTypeMap.set('C3', 'MIXED-USE COMMERCIAL');
    this.buildingTypeMap.set('I1', 'LIGHT INDUSTRIAL');
    this.buildingTypeMap.set('I2', 'HEAVY INDUSTRIAL');
    this.buildingTypeMap.set('A1', 'AGRICULTURAL');
    this.buildingTypeMap.set('S1', 'SPECIALTY');
    
    // Region Mappings (Generic <-> Benton)
    this.regionMap.set('EASTERN', 'EAST BENTON');
    this.regionMap.set('CENTRAL', 'CENTRAL BENTON');
    this.regionMap.set('WESTERN', 'WEST BENTON');
    
    // Also add code-based mappings
    this.regionMap.set('EB', 'EAST BENTON');
    this.regionMap.set('CB', 'CENTRAL BENTON');
    this.regionMap.set('WB', 'WEST BENTON');
    
    // Quality Mappings (Generic <-> Benton)
    this.qualityMap.set('LOW', 'MINIMUM QUALITY');
    this.qualityMap.set('MEDIUM_LOW', 'FAIR QUALITY');
    this.qualityMap.set('MEDIUM', 'AVERAGE QUALITY');
    this.qualityMap.set('MEDIUM_HIGH', 'GOOD QUALITY');
    this.qualityMap.set('HIGH', 'EXCELLENT QUALITY');
    this.qualityMap.set('VERY_HIGH', 'SUPERIOR QUALITY');
    
    // Condition Mappings (Generic <-> Benton)
    this.conditionMap.set('POOR', 'POOR CONDITION');
    this.conditionMap.set('FAIR', 'FAIR CONDITION');
    this.conditionMap.set('AVERAGE', 'AVERAGE CONDITION');
    this.conditionMap.set('GOOD', 'GOOD CONDITION');
    this.conditionMap.set('EXCELLENT', 'EXCELLENT CONDITION');
    
    // General Term Mappings (Generic <-> Benton)
    this.generalTermMap.set('COST_MATRIX', 'BENTON COST STANDARDS');
    this.generalTermMap.set('PROPERTY_ASSESSMENT', 'BENTON PROPERTY VALUATION');
    this.generalTermMap.set('BUILDING_COST', 'CONSTRUCTION VALUE');
    this.generalTermMap.set('LAND_VALUE', 'BENTON LAND ASSESSMENT');
    this.generalTermMap.set('TOTAL_VALUE', 'TOTAL ASSESSED VALUE');
    
    // Region Factors
    this.regionFactors.set('EAST BENTON', 0.95);
    this.regionFactors.set('CENTRAL BENTON', 1.0);
    this.regionFactors.set('WEST BENTON', 1.05);
  }

  /**
   * Handle terminology conversion requests
   */
  private async handleTerminologyConversion(request: TerminologyConversionRequest): Promise<string> {
    const { term, fromType, category } = request;
    
    // Convert based on category
    switch (category) {
      case 'buildingType':
        return this.convertTerminologyWithMap(term, fromType, this.buildingTypeMap);
      case 'region':
        return this.convertTerminologyWithMap(term, fromType, this.regionMap);
      case 'quality':
        return this.convertTerminologyWithMap(term, fromType, this.qualityMap);
      case 'condition':
        return this.convertTerminologyWithMap(term, fromType, this.conditionMap);
      case 'general':
        return this.convertTerminologyWithMap(term, fromType, this.generalTermMap);
      default:
        return term; // Return original if no mapping found
    }
  }

  /**
   * Convert terminology using a mapping
   */
  private convertTerminologyWithMap(
    term: string, 
    fromType: 'generic' | 'benton', 
    map: Map<string, string>
  ): string {
    const normalizedTerm = term.toUpperCase();
    
    if (fromType === 'generic') {
      return map.get(normalizedTerm) || term;
    } else {
      // Reverse lookup using Array.from to avoid iteration issues
      const entries = Array.from(map.entries());
      for (let i = 0; i < entries.length; i++) {
        const [generic, benton] = entries[i];
        if (benton === normalizedTerm) {
          return generic;
        }
      }
      return term; // Return original if no mapping found
    }
  }

  /**
   * Handle data conversion requests
   */
  private async handleDataConversion(request: DataConversionRequest): Promise<any> {
    const { data, fromFormat, dataType } = request;
    
    switch (dataType) {
      case 'costMatrix':
        return this.convertCostMatrix(data, fromFormat);
      case 'propertyRecord':
        return this.convertPropertyRecord(data, fromFormat);
      case 'assessment':
        return this.convertAssessment(data, fromFormat);
      case 'report':
        return this.convertReport(data, fromFormat);
      default:
        return data; // Return original if no conversion
    }
  }

  /**
   * Convert cost matrix data
   */
  private convertCostMatrix(data: any, fromFormat: 'generic' | 'benton'): any {
    if (!data) return data;
    
    // Handle array of matrices
    if (Array.isArray(data)) {
      return data.map(matrix => this.convertCostMatrix(matrix, fromFormat));
    }
    
    const converted = { ...data };
    
    if (fromFormat === 'generic') {
      // Convert building type
      if (data.buildingType) {
        converted.buildingType = this.convertBuildingType(data.buildingType);
      }
      
      // Convert region
      if (data.region) {
        converted.region = this.convertRegion(data.region);
      }
      
      // Convert description if present
      if (data.description) {
        converted.description = `Benton County ${data.description}`;
      }
      
      // Add Benton County specific fields
      converted.bentonCountySpecific = true;
      converted.countyCode = 'BN';
      
      // Adjust values based on regional factors if needed
      if (data.baseCost && data.region) {
        const regionFactor = this.getRegionalFactorByName(this.convertRegion(data.region));
        if (regionFactor) {
          converted.adjustedCost = parseFloat((data.baseCost * regionFactor).toFixed(2));
        }
      }
    } else {
      // Convert from Benton to generic
      
      // Convert building type
      if (data.buildingType) {
        // Reverse lookup
        converted.buildingType = this.convertTerminologyWithMap(
          data.buildingType,
          'benton',
          this.buildingTypeMap
        );
      }
      
      // Convert region
      if (data.region) {
        // Reverse lookup
        converted.region = this.convertTerminologyWithMap(
          data.region,
          'benton',
          this.regionMap
        );
      }
      
      // Strip Benton County specific fields
      delete converted.bentonCountySpecific;
      delete converted.countyCode;
      
      // Description adjustment
      if (data.description && data.description.startsWith('Benton County ')) {
        converted.description = data.description.replace('Benton County ', '');
      }
    }
    
    return converted;
  }

  /**
   * Convert property record data
   */
  private convertPropertyRecord(data: any, fromFormat: 'generic' | 'benton'): any {
    if (!data) return data;
    
    // Handle array of records
    if (Array.isArray(data)) {
      return data.map(record => this.convertPropertyRecord(record, fromFormat));
    }
    
    const converted = { ...data };
    
    if (fromFormat === 'generic') {
      // Convert building type
      if (data.buildingType) {
        converted.buildingType = this.convertBuildingType(data.buildingType);
      }
      
      // Convert region/location
      if (data.region) {
        converted.region = this.convertRegion(data.region);
      }
      
      // Convert quality
      if (data.quality) {
        converted.quality = this.convertQuality(data.quality);
      }
      
      // Convert condition
      if (data.condition) {
        converted.condition = this.convertCondition(data.condition);
      }
      
      // Add Benton County specific fields
      converted.bentonCountyParcel = data.parcelId || '';
      converted.countyCode = 'BN';
    } else {
      // Convert from Benton to generic
      
      // Convert building type
      if (data.buildingType) {
        converted.buildingType = this.convertTerminologyWithMap(
          data.buildingType,
          'benton',
          this.buildingTypeMap
        );
      }
      
      // Convert region/location
      if (data.region) {
        converted.region = this.convertTerminologyWithMap(
          data.region,
          'benton',
          this.regionMap
        );
      }
      
      // Convert quality
      if (data.quality) {
        converted.quality = this.convertTerminologyWithMap(
          data.quality,
          'benton',
          this.qualityMap
        );
      }
      
      // Convert condition
      if (data.condition) {
        converted.condition = this.convertTerminologyWithMap(
          data.condition,
          'benton',
          this.conditionMap
        );
      }
      
      // Remove Benton County specific fields
      delete converted.bentonCountyParcel;
      delete converted.countyCode;
    }
    
    return converted;
  }

  /**
   * Convert assessment data
   */
  private convertAssessment(data: any, fromFormat: 'generic' | 'benton'): any {
    if (!data) return data;
    
    // Handle array of assessments
    if (Array.isArray(data)) {
      return data.map(assessment => this.convertAssessment(assessment, fromFormat));
    }
    
    const converted = { ...data };
    
    if (fromFormat === 'generic') {
      // Convert property record if present
      if (data.property) {
        converted.property = this.convertPropertyRecord(data.property, fromFormat);
      }
      
      // Convert terminology in values
      if (data.description) {
        converted.description = data.description.replace(
          /cost matrix/i,
          'Benton Cost Standards'
        );
      }
      
      // Add Benton County specific headers
      converted.assessmentAuthority = 'Benton County Assessor\'s Office';
      converted.assessmentYear = new Date().getFullYear();
      converted.assessmentType = 'Official Benton County Assessment';
    } else {
      // Convert from Benton to generic
      
      // Convert property record if present
      if (data.property) {
        converted.property = this.convertPropertyRecord(data.property, 'benton');
      }
      
      // Convert terminology in values
      if (data.description) {
        converted.description = data.description.replace(
          /Benton Cost Standards/i,
          'cost matrix'
        );
      }
      
      // Remove Benton County specific headers
      delete converted.assessmentAuthority;
      delete converted.assessmentYear;
      delete converted.assessmentType;
    }
    
    return converted;
  }

  /**
   * Convert report data
   */
  private convertReport(data: any, fromFormat: 'generic' | 'benton'): any {
    if (!data) return data;
    
    // Handle array of reports
    if (Array.isArray(data)) {
      return data.map(report => this.convertReport(report, fromFormat));
    }
    
    const converted = { ...data };
    
    if (fromFormat === 'generic') {
      // Convert assessment data if present
      if (data.assessment) {
        converted.assessment = this.convertAssessment(data.assessment, fromFormat);
      }
      
      // Convert property data if present
      if (data.property) {
        converted.property = this.convertPropertyRecord(data.property, fromFormat);
      }
      
      // Add Benton County specific headers
      converted.reportingAuthority = 'Benton County Assessor\'s Office';
      converted.reportGenerated = new Date().toISOString();
      converted.reportType = 'Benton County Building Cost Assessment';
    } else {
      // Convert from Benton to generic
      
      // Convert assessment data if present
      if (data.assessment) {
        converted.assessment = this.convertAssessment(data.assessment, 'benton');
      }
      
      // Convert property data if present
      if (data.property) {
        converted.property = this.convertPropertyRecord(data.property, 'benton');
      }
      
      // Remove Benton County specific headers
      delete converted.reportingAuthority;
      delete converted.reportGenerated;
      delete converted.reportType;
    }
    
    return converted;
  }

  /**
   * Handle report formatting requests
   */
  private async handleReportFormatting(request: ReportFormattingRequest): Promise<any> {
    const { reportData, format, includeBranding } = request;
    
    if (!reportData) return reportData;
    
    // First, ensure data is in Benton County format
    const bentonData = this.convertReport(reportData, 'generic');
    
    // Apply specific formatting based on requested format
    switch (format) {
      case 'detailed':
        return this.formatDetailedReport(bentonData, includeBranding);
      case 'summary':
        return this.formatSummaryReport(bentonData, includeBranding);
      case 'official':
        return this.formatOfficialReport(bentonData, includeBranding);
      default:
        return bentonData;
    }
  }

  /**
   * Format a detailed report
   */
  private formatDetailedReport(data: any, includeBranding: boolean): any {
    const formattedReport = { ...data };
    
    // Add detailed report specific fields
    formattedReport.format = 'detailed';
    formattedReport.title = 'Detailed Building Cost Assessment';
    
    // Include full property and assessment details
    
    // Add branding if requested
    if (includeBranding) {
      formattedReport.branding = {
        logo: 'benton_county_logo.png',
        header: 'Benton County Assessor\'s Office',
        footer: 'Official Benton County Document',
        watermark: false
      };
    }
    
    return formattedReport;
  }

  /**
   * Format a summary report
   */
  private formatSummaryReport(data: any, includeBranding: boolean): any {
    // Start with a deep copy but exclude raw data fields
    const { rawData, calculations, ...rest } = data;
    const formattedReport = { ...rest };
    
    // Add summary report specific fields
    formattedReport.format = 'summary';
    formattedReport.title = 'Building Cost Assessment Summary';
    
    // Include only summary values from calculations
    if (data.calculations) {
      formattedReport.summary = {
        totalValue: data.calculations.totalValue,
        landValue: data.calculations.landValue,
        improvementValue: data.calculations.improvementValue,
        costPerSqFt: data.calculations.costPerSqFt
      };
    }
    
    // Add branding if requested
    if (includeBranding) {
      formattedReport.branding = {
        logo: 'benton_county_logo.png',
        header: 'Benton County Assessor\'s Office',
        footer: 'Summary Document',
        watermark: false
      };
    }
    
    return formattedReport;
  }

  /**
   * Format an official report
   */
  private formatOfficialReport(data: any, includeBranding: boolean): any {
    const formattedReport = this.formatDetailedReport(data, false);
    
    // Override with official report specific fields
    formattedReport.format = 'official';
    formattedReport.title = 'Official Benton County Building Cost Assessment';
    formattedReport.officialDocument = true;
    formattedReport.officialId = uuidv4();
    formattedReport.validUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();
    
    // Always include branding for official reports
    formattedReport.branding = {
      logo: 'benton_county_seal.png',
      header: 'OFFICIAL: Benton County Assessor\'s Office',
      footer: 'Official Benton County Assessment Document',
      watermark: true
    };
    
    return formattedReport;
  }

  /**
   * Get regional factor by name
   */
  private getRegionalFactorByName(regionName: string): number | null {
    return this.regionFactors.get(regionName) || null;
  }

  /**
   * Utility methods exposed for direct use by the service
   */
  
  /**
   * Convert a building type code or name to Benton County format
   */
  public convertBuildingType(buildingType: string): string {
    return this.convertTerminologyWithMap(buildingType, 'generic', this.buildingTypeMap);
  }
  
  /**
   * Convert a region code or name to Benton County format
   */
  public convertRegion(region: string): string {
    return this.convertTerminologyWithMap(region, 'generic', this.regionMap);
  }
  
  /**
   * Convert a quality level to Benton County format
   */
  public convertQuality(quality: string): string {
    return this.convertTerminologyWithMap(quality, 'generic', this.qualityMap);
  }
  
  /**
   * Convert a condition to Benton County format
   */
  public convertCondition(condition: string): string {
    return this.convertTerminologyWithMap(condition, 'generic', this.conditionMap);
  }
  
  /**
   * Convert terminology between formats
   */
  public convertTerminology(request: TerminologyConversionRequest): string {
    // Since handleTerminologyConversion is async, we'll use the synchronous version directly
    const { term, fromType, category } = request;
    
    // Convert based on category
    switch (category) {
      case 'buildingType':
        return this.convertTerminologyWithMap(term, fromType, this.buildingTypeMap);
      case 'region':
        return this.convertTerminologyWithMap(term, fromType, this.regionMap);
      case 'quality':
        return this.convertTerminologyWithMap(term, fromType, this.qualityMap);
      case 'condition':
        return this.convertTerminologyWithMap(term, fromType, this.conditionMap);
      case 'general':
        return this.convertTerminologyWithMap(term, fromType, this.generalTermMap);
      default:
        return term; // Return original if no mapping found
    }
  }
  
  /**
   * Convert data between formats - synchronous version
   */
  public convertData(request: DataConversionRequest): any {
    const { data, fromFormat, dataType } = request;
    
    switch (dataType) {
      case 'costMatrix':
        return this.convertCostMatrix(data, fromFormat);
      case 'propertyRecord':
        return this.convertPropertyRecord(data, fromFormat);
      case 'assessment':
        return this.convertAssessment(data, fromFormat);
      case 'report':
        return this.convertReport(data, fromFormat);
      default:
        return data;
    }
  }
  
  /**
   * Format a report according to Benton County standards - synchronous version
   */
  public formatReport(request: ReportFormattingRequest): any {
    const { reportData, format, includeBranding } = request;
    
    if (!reportData) return reportData;
    
    // First, ensure data is in Benton County format
    const bentonData = this.convertReport(reportData, 'generic');
    
    // Apply specific formatting based on requested format
    switch (format) {
      case 'detailed':
        return this.formatDetailedReport(bentonData, includeBranding);
      case 'summary':
        return this.formatSummaryReport(bentonData, includeBranding);
      case 'official':
        return this.formatOfficialReport(bentonData, includeBranding);
      default:
        return bentonData;
    }
  }
  
  /**
   * Get regional factors for a specific region
   */
  public getRegionalFactors(region: string): { code: string; name: string; factor: number } {
    const bentonRegion = this.convertRegion(region);
    const factor = this.getRegionalFactorByName(bentonRegion) || 1.0;
    
    // Determine code based on name
    let code = 'CB'; // Default
    if (bentonRegion === 'EAST BENTON') code = 'EB';
    if (bentonRegion === 'WEST BENTON') code = 'WB';
    
    return {
      code,
      name: bentonRegion,
      factor
    };
  }
}

// Create and export a singleton instance
export const bentonCountyConversionAgent = new BentonCountyConversionAgent();