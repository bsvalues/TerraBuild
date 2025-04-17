/**
 * Benton County Conversion Agent for Building Cost Standards System
 * 
 * This specialized agent handles the conversion of generic terms and data structures
 * to Benton County-specific terminology, formats, and presentation standards.
 * It ensures consistent terminology and data representation throughout the application.
 */

import { CustomAgentBase } from './customAgentBase';
import { agentEventBus } from './eventBus';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for conversion requests
interface TerminologyConversionRequest {
  term: string;
  context?: string;
  domain?: 'building' | 'property' | 'assessment' | 'general';
  direction: 'toCounty' | 'fromCounty';
}

interface DataConversionRequest {
  data: any;
  dataType: 'costMatrix' | 'buildingCost' | 'propertyData' | 'report' | 'scenario';
  direction: 'toCounty' | 'fromCounty';
  options?: {
    includeMetadata?: boolean;
    formatVersion?: string;
    includeRegionalContext?: boolean;
  };
}

interface ReportFormatRequest {
  reportData: any;
  reportType: 'assessment' | 'costAnalysis' | 'whatIfScenario' | 'propertyValuation';
  includeHeaderFooter?: boolean;
  includeSignatureBlock?: boolean;
  includeCountyBranding?: boolean;
}

/**
 * Benton County Conversion Agent Class
 */
export class BentonCountyConversionAgent extends CustomAgentBase {
  // Terminology mappings
  private buildingTerminology: Map<string, string> = new Map();
  private propertyTerminology: Map<string, string> = new Map();
  private assessmentTerminology: Map<string, string> = new Map();
  
  // Region mappings and context
  private regionMappings: Map<string, string> = new Map();
  
  // Building type mappings
  private buildingTypeMappings: Map<string, string> = new Map();
  
  // Quality and condition standard mappings
  private qualityMappings: Map<string, string> = new Map();
  private conditionMappings: Map<string, string> = new Map();
  
  /**
   * Create a new Benton County Conversion Agent
   */
  constructor() {
    super('Benton County Conversion Agent', 'benton-conversion-agent');
    
    this.capabilities = [
      'terminology-conversion',
      'data-format-conversion',
      'report-formatting',
      'county-specific-context',
      'assessment-language-adaptation'
    ];
    
    this.initializeTerminologyMappings();
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<boolean> {
    await super.initialize();
    
    // Register event handlers
    this.registerEventHandler('conversion:terminology', this.handleTerminologyConversion.bind(this));
    this.registerEventHandler('conversion:data', this.handleDataConversion.bind(this));
    this.registerEventHandler('conversion:report', this.handleReportFormatting.bind(this));
    
    console.log(`Benton County Conversion Agent initialized`);
    return true;
  }
  
  /**
   * Initialize terminology mappings for Benton County
   */
  private initializeTerminologyMappings(): void {
    // Building terminology (generic -> Benton County specific)
    this.buildingTerminology.set('residential', 'Residential Dwelling');
    this.buildingTerminology.set('commercial', 'Commercial Structure');
    this.buildingTerminology.set('industrial', 'Industrial Complex');
    this.buildingTerminology.set('agricultural', 'Agricultural Facility');
    this.buildingTerminology.set('apartment', 'Multi-Family Housing');
    this.buildingTerminology.set('warehouse', 'Storage Facility');
    
    // Building type code mappings
    this.buildingTypeMappings.set('R1', 'Single Family Residence');
    this.buildingTypeMappings.set('R2', 'Multi-Family Residence');
    this.buildingTypeMappings.set('C1', 'Retail Commercial');
    this.buildingTypeMappings.set('C4', 'Office Commercial');
    this.buildingTypeMappings.set('I1', 'Light Industrial');
    this.buildingTypeMappings.set('A1', 'Agricultural Structure');
    this.buildingTypeMappings.set('S1', 'Special Purpose Structure');
    
    // Region mappings
    this.regionMappings.set('East Benton', 'East Benton County');
    this.regionMappings.set('Central Benton', 'Central Benton County');
    this.regionMappings.set('West Benton', 'West Benton County');
    
    // Quality mappings 
    this.qualityMappings.set('LOW', 'Economy Class');
    this.qualityMappings.set('MEDIUM_LOW', 'Standard Class');
    this.qualityMappings.set('MEDIUM', 'Average Class');
    this.qualityMappings.set('MEDIUM_HIGH', 'Good Class');
    this.qualityMappings.set('HIGH', 'Excellent Class');
    this.qualityMappings.set('PREMIUM', 'Premium Class');
    
    // Condition mappings
    this.conditionMappings.set('POOR', 'Below Average');
    this.conditionMappings.set('FAIR', 'Fair');
    this.conditionMappings.set('AVERAGE', 'Average');
    this.conditionMappings.set('GOOD', 'Good');
    this.conditionMappings.set('EXCELLENT', 'Excellent');
    
    // Property terminology
    this.propertyTerminology.set('lot', 'Parcel');
    this.propertyTerminology.set('land', 'Land');
    this.propertyTerminology.set('site', 'Site');
    this.propertyTerminology.set('property', 'Property');
    
    // Assessment terminology
    this.assessmentTerminology.set('valuation', 'Assessment');
    this.assessmentTerminology.set('appraisal', 'Valuation');
    this.assessmentTerminology.set('tax', 'Property Tax');
    this.assessmentTerminology.set('market value', 'Fair Market Value');
  }
  
  /**
   * Convert terminology to/from Benton County specific terms
   * 
   * @param request The terminology conversion request
   * @returns The converted term
   */
  public convertTerminology(request: TerminologyConversionRequest): string {
    const { term, context, domain, direction } = request;
    
    // Select the appropriate mapping based on domain
    let mappingSource: Map<string, string>;
    switch(domain) {
      case 'building':
        mappingSource = this.buildingTerminology;
        break;
      case 'property':
        mappingSource = this.propertyTerminology;
        break;
      case 'assessment':
        mappingSource = this.assessmentTerminology;
        break;
      default:
        // For general, try all mappings
        const buildingTerm = this.buildingTerminology.get(term.toLowerCase());
        if (buildingTerm) return direction === 'toCounty' ? buildingTerm : term;
        
        const propertyTerm = this.propertyTerminology.get(term.toLowerCase());
        if (propertyTerm) return direction === 'toCounty' ? propertyTerm : term;
        
        const assessmentTerm = this.assessmentTerminology.get(term.toLowerCase());
        if (assessmentTerm) return direction === 'toCounty' ? assessmentTerm : term;
        
        // If no match found, return the original term
        return term;
    }
    
    // Convert based on direction
    if (direction === 'toCounty') {
      return mappingSource.get(term.toLowerCase()) || term;
    } else {
      // Reverse lookup
      for (const [key, value] of mappingSource.entries()) {
        if (value.toLowerCase() === term.toLowerCase()) {
          return key;
        }
      }
      return term;
    }
  }
  
  /**
   * Convert building type codes to their full descriptions
   * 
   * @param buildingType The building type code (R1, C1, etc.)
   * @returns The full building description
   */
  public convertBuildingType(buildingType: string): string {
    return this.buildingTypeMappings.get(buildingType) || buildingType;
  }
  
  /**
   * Convert region code to full Benton County region name
   * 
   * @param region The region code or short name
   * @returns The full region name
   */
  public convertRegion(region: string): string {
    return this.regionMappings.get(region) || region;
  }
  
  /**
   * Convert quality level to Benton County terminology
   * 
   * @param quality The quality level
   * @returns The Benton County quality description
   */
  public convertQuality(quality: string): string {
    return this.qualityMappings.get(quality) || quality;
  }
  
  /**
   * Convert condition to Benton County terminology
   * 
   * @param condition The condition level
   * @returns The Benton County condition description
   */
  public convertCondition(condition: string): string {
    return this.conditionMappings.get(condition) || condition;
  }
  
  /**
   * Handle terminology conversion requests
   * 
   * @param event The terminology conversion event
   */
  private async handleTerminologyConversion(event: any): Promise<void> {
    const { data, correlationId } = event;
    const result = this.convertTerminology(data.request);
    
    // Emit the conversion result
    await this.emitEvent('conversion:terminology:result', {
      result,
      originalRequest: data.request,
      correlationId
    });
  }
  
  /**
   * Convert data structure to/from Benton County format
   * 
   * @param request The data conversion request
   * @returns The converted data
   */
  public convertData(request: DataConversionRequest): any {
    const { data, dataType, direction, options } = request;
    
    // Deep clone the data to avoid modifying the original
    const convertedData = JSON.parse(JSON.stringify(data));
    
    switch(dataType) {
      case 'costMatrix':
        return this.convertCostMatrixData(convertedData, direction, options);
      case 'buildingCost':
        return this.convertBuildingCostData(convertedData, direction, options);
      case 'propertyData':
        return this.convertPropertyData(convertedData, direction, options);
      case 'report':
        return this.convertReportData(convertedData, direction, options);
      case 'scenario':
        return this.convertScenarioData(convertedData, direction, options);
      default:
        // If no specific conversion, return the original data
        return data;
    }
  }
  
  /**
   * Convert cost matrix data to/from Benton County format
   */
  private convertCostMatrixData(data: any, direction: string, options?: any): any {
    if (direction === 'toCounty') {
      // Add Benton County specific metadata and formatting
      const result = { ...data };
      
      // Convert building type codes to full descriptions
      if (result.buildingType) {
        result.buildingTypeDescription = this.convertBuildingType(result.buildingType);
      }
      
      // Convert region codes to full region names
      if (result.region) {
        result.regionName = this.convertRegion(result.region);
      }
      
      // Add Benton County specific metadata
      if (options?.includeMetadata) {
        result.metadata = {
          county: 'Benton',
          state: 'WA',
          assessorStandard: true,
          officialSource: true,
          ...result.metadata
        };
      }
      
      // Add regional context if requested
      if (options?.includeRegionalContext) {
        result.regionalContext = this.getRegionalContext(result.region);
      }
      
      return result;
    } else {
      // Convert from Benton County format to standard format
      const result = { ...data };
      
      // Remove Benton County specific fields
      delete result.regionName;
      delete result.buildingTypeDescription;
      delete result.metadata;
      delete result.regionalContext;
      
      return result;
    }
  }
  
  /**
   * Convert building cost data to/from Benton County format
   */
  private convertBuildingCostData(data: any, direction: string, options?: any): any {
    if (direction === 'toCounty') {
      const result = { ...data };
      
      // Convert quality and condition terms
      if (result.quality) {
        result.qualityDescription = this.convertQuality(result.quality);
      }
      
      if (result.condition) {
        result.conditionDescription = this.convertCondition(result.condition);
      }
      
      // Convert building type
      if (result.buildingType) {
        result.buildingTypeDescription = this.convertBuildingType(result.buildingType);
      }
      
      // Convert region
      if (result.region) {
        result.regionName = this.convertRegion(result.region);
      }
      
      // Add Benton County assessment terminology
      result.assessedValue = result.totalCost;
      result.taxableValue = result.totalCost * 0.9; // Example calculation
      
      return result;
    } else {
      // Convert from Benton County format to standard format
      const result = { ...data };
      
      // Remove Benton County specific fields
      delete result.qualityDescription;
      delete result.conditionDescription;
      delete result.buildingTypeDescription;
      delete result.regionName;
      delete result.assessedValue;
      delete result.taxableValue;
      
      return result;
    }
  }
  
  /**
   * Convert property data to/from Benton County format
   */
  private convertPropertyData(data: any, direction: string, options?: any): any {
    // Implementation follows similar pattern to building cost data
    return data; // Placeholder
  }
  
  /**
   * Convert report data to/from Benton County format
   */
  private convertReportData(data: any, direction: string, options?: any): any {
    // Implementation follows similar pattern
    return data; // Placeholder
  }
  
  /**
   * Convert scenario data to/from Benton County format
   */
  private convertScenarioData(data: any, direction: string, options?: any): any {
    if (direction === 'toCounty') {
      const result = { ...data };
      
      // Ensure results object exists
      if (!result.results) {
        result.results = {};
      }
      
      // Convert fields in parameters
      if (result.parameters) {
        if (result.parameters.buildingType) {
          result.parameters.buildingTypeDescription = this.convertBuildingType(result.parameters.buildingType);
        }
        
        if (result.parameters.region) {
          result.parameters.regionName = this.convertRegion(result.parameters.region);
        }
        
        if (result.parameters.quality) {
          result.parameters.qualityDescription = this.convertQuality(result.parameters.quality);
        }
        
        if (result.parameters.condition) {
          result.parameters.conditionDescription = this.convertCondition(result.parameters.condition);
        }
      }
      
      // Add Benton County specific fields to results
      if (result.results.baseCost) {
        result.results.assessedValue = result.results.baseCost;
        result.results.countyEstimation = true;
        result.results.assessmentYear = new Date().getFullYear();
      }
      
      return result;
    } else {
      // Convert from Benton County format to standard format
      const result = { ...data };
      
      // Remove Benton County specific fields from parameters
      if (result.parameters) {
        delete result.parameters.buildingTypeDescription;
        delete result.parameters.regionName;
        delete result.parameters.qualityDescription;
        delete result.parameters.conditionDescription;
      }
      
      // Remove Benton County specific fields from results
      if (result.results) {
        delete result.results.assessedValue;
        delete result.results.countyEstimation;
        delete result.results.assessmentYear;
      }
      
      return result;
    }
  }
  
  /**
   * Handle data conversion requests
   * 
   * @param event The data conversion event
   */
  private async handleDataConversion(event: any): Promise<void> {
    const { data, correlationId } = event;
    const result = this.convertData(data.request);
    
    // Emit the conversion result
    await this.emitEvent('conversion:data:result', {
      result,
      originalRequest: data.request,
      correlationId
    });
  }
  
  /**
   * Format a report according to Benton County standards
   * 
   * @param request The report format request
   * @returns The formatted report
   */
  public formatReport(request: ReportFormatRequest): any {
    const { reportData, reportType, includeHeaderFooter, includeSignatureBlock, includeCountyBranding } = request;
    
    // Deep clone the report data
    const formattedReport = JSON.parse(JSON.stringify(reportData));
    
    // Add Benton County header if requested
    if (includeHeaderFooter) {
      formattedReport.header = this.getBentonCountyHeader(reportType);
      formattedReport.footer = this.getBentonCountyFooter();
    }
    
    // Add signature block if requested
    if (includeSignatureBlock) {
      formattedReport.signatureBlock = this.getSignatureBlock(reportType);
    }
    
    // Add county branding if requested
    if (includeCountyBranding) {
      formattedReport.branding = {
        logo: 'benton_county_logo.png',
        colors: {
          primary: '#003366',
          secondary: '#8A9045',
          accent: '#E6E6E6'
        },
        tagline: 'Benton County, Washington - Building Cost Assessment'
      };
    }
    
    // Convert terminology in report content
    if (formattedReport.content) {
      // Convert building types
      if (formattedReport.content.buildingType) {
        formattedReport.content.buildingTypeDescription = this.convertBuildingType(formattedReport.content.buildingType);
      }
      
      // Convert region
      if (formattedReport.content.region) {
        formattedReport.content.regionName = this.convertRegion(formattedReport.content.region);
      }
    }
    
    return formattedReport;
  }
  
  /**
   * Get Benton County header for reports
   */
  private getBentonCountyHeader(reportType: string): any {
    return {
      title: `Benton County ${this.getReportTypeTitle(reportType)}`,
      subtitle: `Washington State Building Cost Assessment`,
      date: new Date().toLocaleDateString(),
      department: 'Benton County Assessor\'s Office',
      reportId: `BC-${Date.now().toString().substring(6)}`,
      officialDocument: true
    };
  }
  
  /**
   * Get Benton County footer for reports
   */
  private getBentonCountyFooter(): any {
    return {
      address: '5600 W. Canal Drive, Kennewick, WA 99336',
      phone: '(509) 786-5600',
      website: 'www.co.benton.wa.us',
      disclaimer: 'This document is for assessment purposes only. Values are subject to verification.'
    };
  }
  
  /**
   * Get signature block for reports
   */
  private getSignatureBlock(reportType: string): any {
    return {
      title: 'Certified by Benton County Assessor\'s Office',
      signatureDate: new Date().toLocaleDateString(),
      certification: 'This assessment complies with Washington State RCW 84.40 standards.'
    };
  }
  
  /**
   * Get report type title based on report type
   */
  private getReportTypeTitle(reportType: string): string {
    switch(reportType) {
      case 'assessment':
        return 'Property Assessment Report';
      case 'costAnalysis':
        return 'Building Cost Analysis';
      case 'whatIfScenario':
        return 'Building Cost Scenario Analysis';
      case 'propertyValuation':
        return 'Property Valuation Certificate';
      default:
        return 'Report';
    }
  }
  
  /**
   * Get regional context for a region
   */
  private getRegionalContext(region: string): any {
    const contexts = {
      'East Benton': {
        economicFactors: ['Agricultural focus', 'Rural character', 'Lower density'],
        constructionConsiderations: ['Higher transportation costs', 'Specialized labor considerations'],
        localOrdinances: ['East Benton zoning regulations apply']
      },
      'Central Benton': {
        economicFactors: ['Urban core', 'Mixed commercial/residential', 'Higher density'],
        constructionConsiderations: ['Standard urban access', 'Complete utility infrastructure'],
        localOrdinances: ['Central Benton urban planning guidelines apply']
      },
      'West Benton': {
        economicFactors: ['Suburban development', 'Growing residential areas', 'Medium density'],
        constructionConsiderations: ['Developing infrastructure', 'Modern construction requirements'],
        localOrdinances: ['West Benton development codes apply']
      }
    };
    
    return contexts[region] || {
      note: 'Regional context not available for this region'
    };
  }
  
  /**
   * Handle report formatting requests
   * 
   * @param event The report formatting event
   */
  private async handleReportFormatting(event: any): Promise<void> {
    const { data, correlationId } = event;
    const result = this.formatReport(data.request);
    
    // Emit the formatting result
    await this.emitEvent('conversion:report:result', {
      result,
      originalRequest: data.request,
      correlationId
    });
  }
}

// Create and export the singleton instance
export const bentonCountyConversionAgent = new BentonCountyConversionAgent();