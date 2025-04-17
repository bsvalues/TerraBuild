/**
 * Benton County Conversion Service
 * 
 * This service provides an interface to the Benton County Conversion Agent,
 * allowing API routes to easily convert terminology and data formats.
 */

// Building Type Descriptions
const BUILDING_TYPE_MAP: Record<string, string> = {
  'R1': 'Residential Single-Family',
  'R2': 'Residential Multi-Family',
  'C1': 'Commercial Retail',
  'C4': 'Commercial Office',
  'I1': 'Industrial Warehouse',
  'A1': 'Agricultural',
  'S1': 'Specialty Structure'
};

// Region Descriptions
const REGION_MAP: Record<string, string> = {
  'East Benton': 'East Benton County Assessment District',
  'Central Benton': 'Central Benton County Assessment District',
  'West Benton': 'West Benton County Assessment District'
};

// Quality Descriptions
const QUALITY_MAP: Record<string, string> = {
  'LOW': 'Standard Construction (Class D)',
  'MEDIUM_LOW': 'Improved Construction (Class C)',
  'MEDIUM': 'Good Construction (Class C+)',
  'MEDIUM_HIGH': 'Very Good Construction (Class B)',
  'HIGH': 'Excellent Construction (Class A)',
  'PREMIUM': 'Superior Construction (Class A+)'
};

// Condition Descriptions
const CONDITION_MAP: Record<string, string> = {
  'POOR': 'Below Average (80% Condition Factor)',
  'FAIR': 'Fair (90% Condition Factor)',
  'AVERAGE': 'Average (100% Condition Factor)',
  'GOOD': 'Good (105% Condition Factor)',
  'EXCELLENT': 'Excellent (110% Condition Factor)'
};

// Terminology Map - Generic to Benton County
const TERM_TO_COUNTY_MAP: Record<string, string> = {
  'residential': 'Residential Class Property',
  'commercial': 'Commercial Class Property',
  'industrial': 'Industrial Class Property',
  'agricultural': 'Agricultural Class Property',
  'lot': 'Tax Parcel',
  'property': 'Real Property',
  'tax': 'Property Tax Assessment',
  'valuation': 'Market Value Determination',
  'building': 'Improvement',
  'cost': 'Market Value Indicator',
  'square footage': 'Improvement Area',
  'sq ft': 'sq. ft. (RCN Basis)',
  'base cost': 'Base Rate',
  'year built': 'Year of Construction',
  'quality': 'Quality Classification',
  'condition': 'Physical Condition',
  'region': 'Assessment District',
  'assessment': 'Official Value Determination',
  'report': 'Property Record Card',
  'factor': 'Multiplier',
  'adjustment': 'Equalization Factor',
  'scenario': 'Valuation Model'
};

// Terminology Map - Benton County to Generic
const COUNTY_TO_TERM_MAP: Record<string, string> = {
  'Residential Class Property': 'residential',
  'Commercial Class Property': 'commercial',
  'Industrial Class Property': 'industrial',
  'Agricultural Class Property': 'agricultural',
  'Tax Parcel': 'lot',
  'Real Property': 'property',
  'Property Tax Assessment': 'tax',
  'Market Value Determination': 'valuation',
  'Improvement': 'building',
  'Market Value Indicator': 'cost',
  'Improvement Area': 'square footage',
  'sq. ft. (RCN Basis)': 'sq ft',
  'Base Rate': 'base cost',
  'Year of Construction': 'year built',
  'Quality Classification': 'quality',
  'Physical Condition': 'condition',
  'Assessment District': 'region',
  'Official Value Determination': 'assessment',
  'Property Record Card': 'report',
  'Multiplier': 'factor',
  'Equalization Factor': 'adjustment',
  'Valuation Model': 'scenario'
};

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
    if (!term) return term;
    
    const lowercaseTerm = term.toLowerCase();
    
    // Check exact match
    if (TERM_TO_COUNTY_MAP[lowercaseTerm]) {
      return TERM_TO_COUNTY_MAP[lowercaseTerm];
    }
    
    // Check if it's already a county term
    const countyTerms = Object.values(TERM_TO_COUNTY_MAP);
    if (countyTerms.includes(term)) {
      return term;
    }
    
    // Check building types
    if (BUILDING_TYPE_MAP[term]) {
      return BUILDING_TYPE_MAP[term];
    }
    
    // Check regions
    if (REGION_MAP[term]) {
      return REGION_MAP[term];
    }
    
    // Return original if no match
    return term;
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
    if (!term) return term;
    
    // Check exact match
    if (COUNTY_TO_TERM_MAP[term]) {
      return COUNTY_TO_TERM_MAP[term];
    }
    
    // Search for building type descriptions
    for (const [code, description] of Object.entries(BUILDING_TYPE_MAP)) {
      if (description === term) {
        return code;
      }
    }
    
    // Search for region descriptions
    for (const [code, description] of Object.entries(REGION_MAP)) {
      if (description === term) {
        return code;
      }
    }
    
    // Return original if no match
    return term;
  }

  /**
   * Convert building type code to full Benton County description
   * 
   * @param buildingType The building type code (R1, C1, etc.)
   * @returns The full description
   */
  getBuildingTypeDescription(buildingType: string): string {
    return BUILDING_TYPE_MAP[buildingType] || buildingType;
  }

  /**
   * Convert region to full Benton County region name
   * 
   * @param region The region code or short name
   * @returns The full region name
   */
  getRegionName(region: string): string {
    return REGION_MAP[region] || region;
  }

  /**
   * Convert quality level to Benton County quality description
   * 
   * @param quality The quality level
   * @returns The Benton County quality description
   */
  getQualityDescription(quality: string): string {
    return QUALITY_MAP[quality] || quality;
  }

  /**
   * Convert condition to Benton County condition description
   * 
   * @param condition The condition level
   * @returns The Benton County condition description
   */
  getConditionDescription(condition: string): string {
    return CONDITION_MAP[condition] || condition;
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
    dataType: 'costMatrix' | 'buildingCost' | 'report' | 'scenario',
    options: { includeMetadata?: boolean } = {}
  ): any {
    if (!data) return data;

    // Handle array data
    if (Array.isArray(data)) {
      return data.map(item => this.convertToCountyFormat(item, dataType, options));
    }

    // Create a deep copy to avoid modifying original
    const result = { ...data };
    
    // Add metadata if requested
    if (options.includeMetadata) {
      result.countyFormat = true;
      result.countyVersion = '2025';
      result.assessmentYear = new Date().getFullYear();
    }
    
    // Transform based on data type
    switch (dataType) {
      case 'buildingCost':
        if (result.buildingType) {
          result.buildingTypeDescription = this.getBuildingTypeDescription(result.buildingType);
        }
        if (result.region) {
          result.regionName = this.getRegionName(result.region);
        }
        if (result.quality) {
          result.qualityDescription = this.getQualityDescription(result.quality);
        }
        if (result.condition) {
          result.conditionDescription = this.getConditionDescription(result.condition);
        }
        if (result.baseCost) {
          result.baseRate = result.baseCost;
        }
        if (result.squareFootage) {
          result.improvementArea = result.squareFootage;
        }
        if (result.costPerSqft) {
          result.ratePerSqFt = result.costPerSqft;
          result.marketValuePerSqFt = result.costPerSqft;
        }
        break;
        
      case 'costMatrix':
        if (result.buildingType) {
          result.buildingTypeDescription = this.getBuildingTypeDescription(result.buildingType);
        }
        if (result.region) {
          result.regionName = this.getRegionName(result.region);
        }
        if (result.baseCost) {
          result.baseRate = result.baseCost;
        }
        if (result.matrixYear) {
          result.assessmentYear = result.matrixYear;
        }
        break;
        
      case 'scenario':
        if (result.name) {
          result.modelName = result.name;
        }
        if (result.description) {
          result.modelDescription = result.description;
        }
        
        // Convert parameters
        if (result.parameters) {
          const parameters = { ...result.parameters };
          
          if (parameters.buildingType) {
            parameters.buildingTypeDescription = this.getBuildingTypeDescription(parameters.buildingType);
          }
          if (parameters.region) {
            parameters.regionName = this.getRegionName(parameters.region);
          }
          if (parameters.quality) {
            parameters.qualityDescription = this.getQualityDescription(parameters.quality);
          }
          if (parameters.condition) {
            parameters.conditionDescription = this.getConditionDescription(parameters.condition);
          }
          if (parameters.baseCost) {
            parameters.baseRate = parameters.baseCost;
          }
          if (parameters.squareFootage) {
            parameters.improvementArea = parameters.squareFootage;
          }
          
          result.parameters = parameters;
        }
        
        // Convert results
        if (result.results) {
          const results = { ...result.results };
          
          if (results.baseCost) {
            results.baseRate = results.baseCost;
          }
          if (results.adjustedCost) {
            results.marketValueEstimate = results.adjustedCost;
          }
          if (results.costPerSqft) {
            results.ratePerSqFt = results.costPerSqft;
          }
          
          result.results = results;
        }
        break;
        
      case 'report':
        if (result.title) {
          result.reportTitle = `Benton County ${result.title}`;
        }
        if (result.createdAt) {
          result.generatedDate = result.createdAt;
        }
        
        // Add county branding elements
        result.countyBranding = {
          name: 'Benton County, Washington',
          department: 'Assessor\'s Office',
          address: '5600 W. Canal Drive, Kennewick, WA 99336',
          phone: '(509) 736-2440',
          website: 'www.co.benton.wa.us/assessor'
        };
        break;
    }
    
    return result;
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
    dataType: 'costMatrix' | 'buildingCost' | 'report' | 'scenario'
  ): any {
    if (!data) return data;
    
    // Handle array data
    if (Array.isArray(data)) {
      return data.map(item => this.convertFromCountyFormat(item, dataType));
    }
    
    // Create a deep copy to avoid modifying original
    const result = { ...data };
    
    // Remove county-specific metadata
    delete result.countyFormat;
    delete result.countyVersion;
    delete result.countyBranding;
    
    // Transform based on data type
    switch (dataType) {
      case 'buildingCost':
        delete result.buildingTypeDescription;
        delete result.regionName;
        delete result.qualityDescription;
        delete result.conditionDescription;
        if (result.baseRate && !result.baseCost) {
          result.baseCost = result.baseRate;
          delete result.baseRate;
        }
        if (result.improvementArea && !result.squareFootage) {
          result.squareFootage = result.improvementArea;
          delete result.improvementArea;
        }
        if (result.ratePerSqFt && !result.costPerSqft) {
          result.costPerSqft = result.ratePerSqFt;
          delete result.ratePerSqFt;
        }
        delete result.marketValuePerSqFt;
        break;
        
      case 'costMatrix':
        delete result.buildingTypeDescription;
        delete result.regionName;
        if (result.baseRate && !result.baseCost) {
          result.baseCost = result.baseRate;
          delete result.baseRate;
        }
        if (result.assessmentYear && !result.matrixYear) {
          result.matrixYear = result.assessmentYear;
          delete result.assessmentYear;
        }
        break;
        
      case 'scenario':
        if (result.modelName && !result.name) {
          result.name = result.modelName;
          delete result.modelName;
        }
        if (result.modelDescription && !result.description) {
          result.description = result.modelDescription;
          delete result.modelDescription;
        }
        
        // Convert parameters
        if (result.parameters) {
          const parameters = { ...result.parameters };
          
          delete parameters.buildingTypeDescription;
          delete parameters.regionName;
          delete parameters.qualityDescription;
          delete parameters.conditionDescription;
          
          if (parameters.baseRate && !parameters.baseCost) {
            parameters.baseCost = parameters.baseRate;
            delete parameters.baseRate;
          }
          if (parameters.improvementArea && !parameters.squareFootage) {
            parameters.squareFootage = parameters.improvementArea;
            delete parameters.improvementArea;
          }
          
          result.parameters = parameters;
        }
        
        // Convert results
        if (result.results) {
          const results = { ...result.results };
          
          if (results.baseRate && !results.baseCost) {
            results.baseCost = results.baseRate;
            delete results.baseRate;
          }
          if (results.marketValueEstimate && !results.adjustedCost) {
            results.adjustedCost = results.marketValueEstimate;
            delete results.marketValueEstimate;
          }
          if (results.ratePerSqFt && !results.costPerSqft) {
            results.costPerSqft = results.ratePerSqFt;
            delete results.ratePerSqFt;
          }
          
          result.results = results;
        }
        break;
        
      case 'report':
        if (result.reportTitle) {
          // Remove "Benton County" prefix if present
          result.title = result.reportTitle.replace(/^Benton County /i, '');
          delete result.reportTitle;
        }
        if (result.generatedDate && !result.createdAt) {
          result.createdAt = result.generatedDate;
          delete result.generatedDate;
        }
        break;
    }
    
    return result;
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
    reportType: 'costAnalysis' | 'propertyAssessment' | 'marketTrends',
    options: {
      includeHeaderFooter?: boolean,
      includeSignatureBlock?: boolean,
      includeCountyBranding?: boolean
    } = {}
  ): any {
    // Create a deep copy to avoid modifying original
    const formattedReport = this.convertToCountyFormat(reportData, 'report', {
      includeMetadata: true
    });
    
    // Add report metadata
    formattedReport.reportType = reportType;
    formattedReport.reportVersion = '2.0';
    formattedReport.generatedDate = formattedReport.generatedDate || new Date().toISOString();
    
    // Add header and footer if requested
    if (options.includeHeaderFooter) {
      formattedReport.header = {
        title: formattedReport.reportTitle || `Benton County ${reportType} Report`,
        subtitle: 'Official Property Assessment Document',
        logo: 'benton_county_logo.png'
      };
      
      formattedReport.footer = {
        text: 'This report was generated by the Benton County Assessor\'s Office',
        page: 'Page ${page} of ${total}',
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    }
    
    // Add signature block if requested
    if (options.includeSignatureBlock) {
      formattedReport.signatureBlock = {
        title: 'Certification',
        text: 'This document is certified as an official record of the Benton County Assessor\'s Office.',
        signature: 'Benton County Assessor',
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    }
    
    // Add county branding if requested
    if (options.includeCountyBranding) {
      formattedReport.countyBranding = {
        name: 'Benton County, Washington',
        department: 'Assessor\'s Office',
        address: '5600 W. Canal Drive, Kennewick, WA 99336',
        phone: '(509) 736-2440',
        website: 'www.co.benton.wa.us/assessor',
        colors: {
          primary: '#003366',
          secondary: '#8A9045'
        },
        fonts: {
          heading: 'Georgia, serif',
          body: 'Arial, sans-serif'
        }
      };
    }
    
    return formattedReport;
  }

  /**
   * Enhance API response with Benton County terminology and formatting
   * 
   * @param response The API response object
   * @param responseType The type of response data
   * @returns The enhanced response with Benton County terminology
   */
  enhanceApiResponse(response: any, responseType: 'costMatrix' | 'buildingCost' | 'report' | 'scenario'): any {
    if (!response) return response;
    
    // Handle different response structures
    if (response.results) {
      // Response with results array
      return {
        ...response,
        results: this.convertToCountyFormat(response.results, responseType, {
          includeMetadata: true
        })
      };
    } else if (Array.isArray(response)) {
      // Direct array response
      return this.convertToCountyFormat(response, responseType, {
        includeMetadata: true
      });
    } else if (response.data) {
      // Response with data field
      return {
        ...response,
        data: this.convertToCountyFormat(response.data, responseType, {
          includeMetadata: true
        })
      };
    } else {
      // Direct object response
      return this.convertToCountyFormat(response, responseType, {
        includeMetadata: true
      });
    }
  }
}

export const bentonConversionService = new BentonConversionService();