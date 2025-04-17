/**
 * Benton County Conversion Agent
 * 
 * This agent is responsible for converting terminology and data formats
 * according to Benton County standards. It handles conversion in both directions:
 * 1. Generic/standard terms → Benton County specific terms
 * 2. Benton County specific terms → Generic/standard terms
 */

import { CustomAgentBase } from './customAgentBase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Represents building type mappings between generic and Benton County terms
 */
interface BuildingTypeMapping {
  code: string;
  genericName: string;
  bentonName: string;
  description: string;
}

/**
 * Represents region mappings between generic and Benton County terms
 */
interface RegionMapping {
  code: string;
  genericName: string;
  bentonName: string;
  factor: number;
}

/**
 * Represents quality level mappings between generic and Benton County terms
 */
interface QualityMapping {
  code: string;
  genericName: string;
  bentonName: string;
  factor: number;
}

/**
 * Represents condition mappings between generic and Benton County terms
 */
interface ConditionMapping {
  code: string;
  genericName: string;
  bentonName: string;
  factor: number;
}

/**
 * Interface for terminology conversion parameters
 */
interface TerminologyConversionParams {
  term: string;
  fromType: 'generic' | 'benton';
  category: 'buildingType' | 'region' | 'quality' | 'condition' | 'general';
}

/**
 * Interface for data conversion parameters
 */
interface DataConversionParams {
  data: any;
  fromFormat: 'generic' | 'benton';
  dataType: 'costMatrix' | 'propertyRecord' | 'assessment' | 'report';
}

/**
 * Interface for report formatting parameters
 */
interface ReportFormattingParams {
  reportData: any;
  format: 'detailed' | 'summary' | 'official';
  includeBranding: boolean;
}

/**
 * Benton County Conversion Agent implementation
 */
class BentonCountyConversionAgent extends CustomAgentBase {
  // Mapping tables for terminology conversion
  private readonly buildingTypeMappings: BuildingTypeMapping[] = [
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
  
  private readonly regionMappings: RegionMapping[] = [
    { code: 'EB', genericName: 'EASTERN', bentonName: 'EAST BENTON', factor: 0.95 },
    { code: 'CB', genericName: 'CENTRAL', bentonName: 'CENTRAL BENTON', factor: 1.0 },
    { code: 'WB', genericName: 'WESTERN', bentonName: 'WEST BENTON', factor: 1.05 }
  ];
  
  private readonly qualityMappings: QualityMapping[] = [
    { code: 'L', genericName: 'LOW', bentonName: 'LOW QUALITY', factor: 0.8 },
    { code: 'ML', genericName: 'MEDIUM_LOW', bentonName: 'FAIR QUALITY', factor: 0.9 },
    { code: 'M', genericName: 'MEDIUM', bentonName: 'AVERAGE QUALITY', factor: 1.0 },
    { code: 'MH', genericName: 'MEDIUM_HIGH', bentonName: 'GOOD QUALITY', factor: 1.1 },
    { code: 'H', genericName: 'HIGH', bentonName: 'HIGH QUALITY', factor: 1.2 },
    { code: 'P', genericName: 'PREMIUM', bentonName: 'PREMIUM QUALITY', factor: 1.3 }
  ];
  
  private readonly conditionMappings: ConditionMapping[] = [
    { code: 'P', genericName: 'POOR', bentonName: 'POOR CONDITION', factor: 0.7 },
    { code: 'F', genericName: 'FAIR', bentonName: 'FAIR CONDITION', factor: 0.85 },
    { code: 'A', genericName: 'AVERAGE', bentonName: 'AVERAGE CONDITION', factor: 1.0 },
    { code: 'G', genericName: 'GOOD', bentonName: 'GOOD CONDITION', factor: 1.1 },
    { code: 'E', genericName: 'EXCELLENT', bentonName: 'EXCELLENT CONDITION', factor: 1.2 }
  ];

  constructor() {
    super({
      agentId: 'benton-county-conversion-agent',
      agentName: 'Benton County Conversion Agent',
      description: 'Converts terminology and data formats according to Benton County standards'
    });
    
    // Register event handlers
    this.registerEventHandler('terminology:convert', this.handleTerminologyConversion.bind(this));
    this.registerEventHandler('data:convert', this.handleDataConversion.bind(this));
    this.registerEventHandler('report:format', this.handleReportFormatting.bind(this));
  }
  
  /**
   * Handle terminology conversion request
   */
  private async handleTerminologyConversion(event: any, context: any): Promise<void> {
    console.log(`Handling terminology conversion request: ${event.correlationId}`);
    
    try {
      const params: TerminologyConversionParams = event.payload?.params || event.data?.params;
      
      if (!params || !params.term || !params.fromType || !params.category) {
        throw new Error('Invalid terminology conversion request. Missing required parameters.');
      }
      
      // Convert the terminology
      const convertedTerm = this.convertTerminology(params);
      
      // Emit the result
      this.emitEvent('terminology:converted', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          originalTerm: params.term,
          convertedTerm,
          success: true,
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
      
      console.log(`Terminology conversion completed for: ${params.term}`);
    } catch (error) {
      console.error('Error in terminology conversion:', error instanceof Error ? error.message : String(error));
      
      // Emit error event
      this.emitEvent('terminology:conversion:error', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          errorMessage: error instanceof Error ? error.message : String(error),
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
    }
  }
  
  /**
   * Handle data conversion request
   */
  private async handleDataConversion(event: any, context: any): Promise<void> {
    console.log(`Handling data conversion request: ${event.correlationId}`);
    
    try {
      const params: DataConversionParams = event.payload?.params || event.data?.params;
      
      if (!params || !params.data || !params.fromFormat || !params.dataType) {
        throw new Error('Invalid data conversion request. Missing required parameters.');
      }
      
      // Convert the data
      const convertedData = this.convertData(params);
      
      // Emit the result
      this.emitEvent('data:converted', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          convertedData,
          success: true,
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
      
      console.log(`Data conversion completed for type: ${params.dataType}`);
    } catch (error) {
      console.error('Error in data conversion:', error instanceof Error ? error.message : String(error));
      
      // Emit error event
      this.emitEvent('data:conversion:error', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          errorMessage: error instanceof Error ? error.message : String(error),
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
    }
  }
  
  /**
   * Handle report formatting request
   */
  private async handleReportFormatting(event: any, context: any): Promise<void> {
    console.log(`Handling report formatting request: ${event.correlationId}`);
    
    try {
      const params: ReportFormattingParams = event.payload?.params || event.data?.params;
      
      if (!params || !params.reportData || !params.format) {
        throw new Error('Invalid report formatting request. Missing required parameters.');
      }
      
      // Format the report
      const formattedReport = this.formatReport(params);
      
      // Emit the result
      this.emitEvent('report:formatted', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          formattedReport,
          success: true,
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
      
      console.log(`Report formatting completed for format: ${params.format}`);
    } catch (error) {
      console.error('Error in report formatting:', error instanceof Error ? error.message : String(error));
      
      // Emit error event
      this.emitEvent('report:formatting:error', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          errorMessage: error instanceof Error ? error.message : String(error),
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
    }
  }

  /**
   * Convert building type code to full description
   * 
   * @param buildingType Building type code (R1, C1, etc.)
   * @returns Full description of building type
   */
  convertBuildingType(buildingType: string): string {
    const mapping = this.buildingTypeMappings.find(m => 
      m.code === buildingType || 
      m.genericName === buildingType || 
      m.bentonName === buildingType
    );
    
    return mapping ? mapping.bentonName : 'Unknown Building Type';
  }

  /**
   * Convert region to full Benton County region name
   * 
   * @param region Region code or short name
   * @returns Full region name for Benton County
   */
  convertRegion(region: string): string {
    const mapping = this.regionMappings.find(m => 
      m.code === region || 
      m.genericName === region || 
      m.bentonName === region
    );
    
    return mapping ? mapping.bentonName : 'Unknown Region';
  }

  /**
   * Convert quality level to Benton County quality description
   * 
   * @param quality Quality level (LOW, MEDIUM, HIGH, etc.)
   * @returns Benton County quality description
   */
  convertQuality(quality: string): string {
    const mapping = this.qualityMappings.find(m => 
      m.code === quality || 
      m.genericName === quality || 
      m.bentonName === quality
    );
    
    return mapping ? mapping.bentonName : 'Unknown Quality';
  }

  /**
   * Convert condition to Benton County condition description
   * 
   * @param condition Condition level (POOR, FAIR, GOOD, etc.)
   * @returns Benton County condition description
   */
  convertCondition(condition: string): string {
    const mapping = this.conditionMappings.find(m => 
      m.code === condition || 
      m.genericName === condition || 
      m.bentonName === condition
    );
    
    return mapping ? mapping.bentonName : 'Unknown Condition';
  }

  /**
   * Convert terminology between generic and Benton County specific
   * 
   * @param params Parameters for conversion
   * @returns Converted term
   */
  convertTerminology(params: TerminologyConversionParams): string {
    const { term, fromType, category } = params;
    
    // Convert based on category
    switch (category) {
      case 'buildingType': {
        const mapping = this.buildingTypeMappings.find(m => 
          fromType === 'generic' 
            ? m.genericName === term
            : (m.bentonName === term || m.code === term)
        );
        
        return mapping 
          ? (fromType === 'generic' ? mapping.bentonName : mapping.genericName)
          : `Unknown Building Type: ${term}`;
      }
      
      case 'region': {
        const mapping = this.regionMappings.find(m => 
          fromType === 'generic' 
            ? m.genericName === term
            : (m.bentonName === term || m.code === term)
        );
        
        return mapping 
          ? (fromType === 'generic' ? mapping.bentonName : mapping.genericName)
          : `Unknown Region: ${term}`;
      }
      
      case 'quality': {
        const mapping = this.qualityMappings.find(m => 
          fromType === 'generic' 
            ? m.genericName === term
            : (m.bentonName === term || m.code === term)
        );
        
        return mapping 
          ? (fromType === 'generic' ? mapping.bentonName : mapping.genericName)
          : `Unknown Quality: ${term}`;
      }
      
      case 'condition': {
        const mapping = this.conditionMappings.find(m => 
          fromType === 'generic' 
            ? m.genericName === term
            : (m.bentonName === term || m.code === term)
        );
        
        return mapping 
          ? (fromType === 'generic' ? mapping.bentonName : mapping.genericName)
          : `Unknown Condition: ${term}`;
      }
      
      case 'general': {
        // General terminology mapping (could be expanded)
        const generalMappings: Record<string, string> = {
          // Generic to Benton
          'PROPERTY_ASSESSMENT': 'BENTON COUNTY PROPERTY VALUATION',
          'TAX_YEAR': 'ASSESSMENT YEAR',
          'PROPERTY_VALUE': 'ASSESSED VALUE',
          'IMPROVEMENT_VALUE': 'IMPROVEMENT ASSESSMENT',
          'LAND_VALUE': 'LAND ASSESSMENT',
          'TOTAL_VALUE': 'TOTAL ASSESSMENT',
          
          // Benton to Generic (reversed)
          'BENTON COUNTY PROPERTY VALUATION': 'PROPERTY_ASSESSMENT',
          'ASSESSMENT YEAR': 'TAX_YEAR',
          'ASSESSED VALUE': 'PROPERTY_VALUE',
          'IMPROVEMENT ASSESSMENT': 'IMPROVEMENT_VALUE',
          'LAND ASSESSMENT': 'LAND_VALUE',
          'TOTAL ASSESSMENT': 'TOTAL_VALUE'
        };
        
        return generalMappings[term] || `Unknown Term: ${term}`;
      }
      
      default:
        return `Unknown Category: ${category}`;
    }
  }

  /**
   * Get regional factors for a specific Benton County region
   * 
   * @param region The region name
   * @returns Regional factors for the specified region
   */
  getRegionalFactors(region: string): { code: string; name: string; factor: number } {
    const mapping = this.regionMappings.find(m => 
      m.code === region || 
      m.genericName === region || 
      m.bentonName === region
    );
    
    return mapping 
      ? { code: mapping.code, name: mapping.bentonName, factor: mapping.factor }
      : { code: 'UNK', name: 'Unknown Region', factor: 1.0 };
  }

  /**
   * Convert data between generic and Benton County formats
   * 
   * @param params Parameters for data conversion
   * @returns Converted data
   */
  convertData(params: DataConversionParams): any {
    const { data, fromFormat, dataType } = params;
    
    switch (dataType) {
      case 'costMatrix': {
        // Process cost matrix data
        return this.convertCostMatrixData(data, fromFormat);
      }
      
      case 'propertyRecord': {
        // Process property record data
        return this.convertPropertyRecordData(data, fromFormat);
      }
      
      case 'assessment': {
        // Process assessment data
        return this.convertAssessmentData(data, fromFormat);
      }
      
      case 'report': {
        // Process report data
        return this.convertReportData(data, fromFormat);
      }
      
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }

  /**
   * Convert cost matrix data
   */
  private convertCostMatrixData(data: any, fromFormat: 'generic' | 'benton'): any {
    // Clone the data to avoid modifying the original
    const result = JSON.parse(JSON.stringify(data));
    
    if (fromFormat === 'generic') {
      // Convert from generic to Benton County format
      if (result.buildingTypes) {
        result.buildingTypes = result.buildingTypes.map((bt: any) => ({
          ...bt,
          name: this.convertTerminology({
            term: bt.type,
            fromType: 'generic',
            category: 'buildingType'
          }),
          code: this.buildingTypeMappings.find(m => m.genericName === bt.type)?.code || 'UNK'
        }));
      }
      
      if (result.regions) {
        result.regions = result.regions.map((r: any) => ({
          ...r,
          name: this.convertTerminology({
            term: r.name,
            fromType: 'generic',
            category: 'region'
          }),
          code: this.regionMappings.find(m => m.genericName === r.name)?.code || 'UNK'
        }));
      }
      
      // Add Benton County-specific metadata
      result.metadata = {
        ...(result.metadata || {}),
        county: 'Benton',
        state: 'Washington',
        assessorOffice: 'Benton County Assessor\'s Office',
        format: 'Benton County Standard'
      };
    } else {
      // Convert from Benton County to generic format
      if (result.buildingTypes) {
        result.buildingTypes = result.buildingTypes.map((bt: any) => ({
          ...bt,
          type: this.convertTerminology({
            term: bt.name,
            fromType: 'benton',
            category: 'buildingType'
          })
        }));
      }
      
      if (result.regions) {
        result.regions = result.regions.map((r: any) => ({
          ...r,
          name: this.convertTerminology({
            term: r.name,
            fromType: 'benton',
            category: 'region'
          })
        }));
      }
      
      // Remove Benton County-specific metadata
      if (result.metadata) {
        const { county, state, assessorOffice, format, ...restMetadata } = result.metadata;
        result.metadata = restMetadata;
      }
    }
    
    return result;
  }

  /**
   * Convert property record data
   */
  private convertPropertyRecordData(data: any, fromFormat: 'generic' | 'benton'): any {
    // Clone the data to avoid modifying the original
    const result = JSON.parse(JSON.stringify(data));
    
    if (fromFormat === 'generic') {
      // Convert from generic to Benton County format
      if (result.buildingInfo) {
        result.buildingInfo.typeDescription = this.convertTerminology({
          term: result.buildingInfo.type,
          fromType: 'generic',
          category: 'buildingType'
        });
        
        result.buildingInfo.qualityDescription = this.convertTerminology({
          term: result.buildingInfo.quality,
          fromType: 'generic',
          category: 'quality'
        });
        
        result.buildingInfo.conditionDescription = this.convertTerminology({
          term: result.buildingInfo.condition,
          fromType: 'generic',
          category: 'condition'
        });
        
        result.buildingInfo.regionDescription = this.convertTerminology({
          term: result.buildingInfo.region,
          fromType: 'generic',
          category: 'region'
        });
      }
      
      // Transform property values to Benton County format
      if (result.values) {
        result.assessedValues = {
          land: result.values.land,
          improvement: result.values.improvement,
          total: result.values.total,
          assessmentYear: result.values.taxYear,
          notes: `Valuation by Benton County Assessor's Office`
        };
        delete result.values;
      }
    } else {
      // Convert from Benton County to generic format
      if (result.buildingInfo) {
        if (result.buildingInfo.typeDescription) {
          result.buildingInfo.type = this.convertTerminology({
            term: result.buildingInfo.typeDescription,
            fromType: 'benton',
            category: 'buildingType'
          });
        }
        
        if (result.buildingInfo.qualityDescription) {
          result.buildingInfo.quality = this.convertTerminology({
            term: result.buildingInfo.qualityDescription,
            fromType: 'benton',
            category: 'quality'
          });
        }
        
        if (result.buildingInfo.conditionDescription) {
          result.buildingInfo.condition = this.convertTerminology({
            term: result.buildingInfo.conditionDescription,
            fromType: 'benton',
            category: 'condition'
          });
        }
        
        if (result.buildingInfo.regionDescription) {
          result.buildingInfo.region = this.convertTerminology({
            term: result.buildingInfo.regionDescription,
            fromType: 'benton',
            category: 'region'
          });
        }
      }
      
      // Transform Benton County values to generic format
      if (result.assessedValues) {
        result.values = {
          land: result.assessedValues.land,
          improvement: result.assessedValues.improvement,
          total: result.assessedValues.total,
          taxYear: result.assessedValues.assessmentYear
        };
        delete result.assessedValues;
      }
    }
    
    return result;
  }

  /**
   * Convert assessment data
   */
  private convertAssessmentData(data: any, fromFormat: 'generic' | 'benton'): any {
    // Similar structure to property record conversion
    return this.convertPropertyRecordData(data, fromFormat);
  }

  /**
   * Convert report data
   */
  private convertReportData(data: any, fromFormat: 'generic' | 'benton'): any {
    // Clone the data to avoid modifying the original
    const result = JSON.parse(JSON.stringify(data));
    
    if (fromFormat === 'generic') {
      // Convert from generic to Benton County format
      
      // Add Benton County headers/footers
      result.headers = {
        ...(result.headers || {}),
        title: `Benton County Property Assessment Report`,
        office: `Benton County Assessor's Office`,
        date: result.headers?.date || new Date().toISOString().split('T')[0],
        county: 'Benton',
        state: 'Washington'
      };
      
      // Customize sections with Benton County terminology
      if (result.sections) {
        result.sections = result.sections.map((section: any) => {
          const newSection = { ...section };
          
          // Convert section title if needed
          if (section.title) {
            const titles: Record<string, string> = {
              'Property Values': 'Assessed Values',
              'Building Information': 'Improvement Details',
              'Location Data': 'Property Location Information',
              'Owner Information': 'Property Ownership Record'
            };
            
            newSection.title = titles[section.title] || section.title;
          }
          
          return newSection;
        });
      }
      
      // Add Benton County certification section
      result.certification = {
        text: 'This document is an official assessment report of the Benton County Assessor\'s Office.',
        assessor: 'Benton County Assessor',
        date: new Date().toISOString().split('T')[0]
      };
    } else {
      // Convert from Benton County to generic format
      
      // Simplify headers
      if (result.headers) {
        const { office, county, state, ...restHeaders } = result.headers;
        result.headers = {
          ...restHeaders,
          title: 'Property Assessment Report'
        };
      }
      
      // Standardize sections with generic terminology
      if (result.sections) {
        result.sections = result.sections.map((section: any) => {
          const newSection = { ...section };
          
          // Convert section title if needed
          if (section.title) {
            const titles: Record<string, string> = {
              'Assessed Values': 'Property Values',
              'Improvement Details': 'Building Information',
              'Property Location Information': 'Location Data',
              'Property Ownership Record': 'Owner Information'
            };
            
            newSection.title = titles[section.title] || section.title;
          }
          
          return newSection;
        });
      }
      
      // Remove Benton County-specific certification
      delete result.certification;
    }
    
    return result;
  }

  /**
   * Format a report according to Benton County standards
   * 
   * @param params Parameters for report formatting
   * @returns Formatted report data
   */
  formatReport(params: ReportFormattingParams): any {
    const { reportData, format, includeBranding } = params;
    
    // Clone the report data to avoid modifying the original
    const result = JSON.parse(JSON.stringify(reportData));
    
    // Add Benton County branding if requested
    if (includeBranding) {
      result.branding = {
        logo: '/assets/benton-county-logo.png',
        name: 'Benton County Assessor\'s Office',
        address: '5600 W. Canal Drive, Kennewick, WA 99336',
        phone: '(509) 735-2380',
        website: 'https://www.co.benton.wa.us/pview.aspx?id=1568&catid=45',
        colors: {
          primary: '#00263A',
          secondary: '#7C9B2B',
          accent: '#546E7A'
        }
      };
    }
    
    // Format based on requested type
    switch (format) {
      case 'detailed': {
        // Full detailed report with all information
        result.format = 'detailed';
        result.title = 'Detailed Property Assessment Report';
        result.subtitle = 'Benton County Assessor\'s Office';
        
        // Ensure detailed sections are included
        if (!result.sections) {
          result.sections = [];
        }
        
        // Add standard detailed sections if not present
        const requiredSections = ['Property Information', 'Assessment Values', 'Building Details', 'Land Details'];
        requiredSections.forEach(sectionTitle => {
          if (!result.sections.some((s: any) => s.title === sectionTitle)) {
            result.sections.push({
              title: sectionTitle,
              content: `[${sectionTitle} to be completed]`
            });
          }
        });
        
        break;
      }
      
      case 'summary': {
        // Simplified summary report
        result.format = 'summary';
        result.title = 'Property Assessment Summary';
        result.subtitle = 'Benton County Assessor\'s Office';
        
        // Reduce to just summary sections
        if (result.sections && result.sections.length > 0) {
          result.sections = result.sections.filter((s: any) => 
            ['Property Information', 'Assessment Values'].includes(s.title)
          );
        }
        
        break;
      }
      
      case 'official': {
        // Official format for legal/regulatory purposes
        result.format = 'official';
        result.title = 'Official Property Assessment Notification';
        result.subtitle = 'Benton County Assessor\'s Office';
        
        // Add legal disclaimers
        result.legalNotice = 'This is an official assessment document issued by the Benton County Assessor\'s Office. The assessed values contained herein are subject to appeal as provided by law.';
        
        // Add certification
        result.certification = {
          text: 'I hereby certify that this is an accurate and official assessment report of the Benton County Assessor\'s Office.',
          assessor: 'Benton County Assessor',
          date: new Date().toISOString().split('T')[0],
          seal: '/assets/benton-county-seal.png'
        };
        
        break;
      }
    }
    
    return result;
  }
}

// Export singleton instance
export const bentonCountyConversionAgent = new BentonCountyConversionAgent();