/**
 * Benton County Format Middleware
 * 
 * This middleware intercepts API responses and applies Benton County specific
 * formatting and terminology. It can be used globally or on specific routes.
 */
import { Request, Response, NextFunction } from 'express';
import { bentonConversionService } from '../services/bentonConversionService';

/**
 * Middleware to apply Benton County formatting to API responses
 */
export function bentonCountyFormatMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store the original res.json method
    const originalJson = res.json;
    
    // Override the res.json method to apply Benton County formatting
    res.json = function(body: any) {
      // Only process API responses
      if (req.path.startsWith('/api/')) {
        try {
          // Determine if this is a response that needs conversion
          if (shouldConvertResponse(req.path)) {
            const convertedData = convertResponseData(req.path, body);
            return originalJson.call(this, convertedData);
          }
        } catch (error) {
          console.error('Error in Benton County format middleware:', error);
          // Continue with original response if there's an error
        }
      }
      
      // Return original response if no conversion applied
      return originalJson.call(this, body);
    };
    
    next();
  };
}

/**
 * Middleware to add Benton County specific headers to responses
 */
export function bentonCountyHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add Benton County specific headers
    res.setHeader('X-Benton-County-BCBS', 'true');
    res.setHeader('X-BCBS-Version', '2025.1');
    
    next();
  };
}

/**
 * Determine if a response at a given path should be converted
 * 
 * @param path API path
 * @returns Whether response should be converted
 */
function shouldConvertResponse(path: string): boolean {
  // List of endpoints that should have Benton County formatting applied
  const convertibleEndpoints = [
    '/api/cost-matrix',
    '/api/building-types',
    '/api/regions',
    '/api/quality-levels',
    '/api/condition-levels',
    '/api/property',
    '/api/assessment',
    '/api/reports',
    '/api/what-if-scenarios'
  ];
  
  return convertibleEndpoints.some(endpoint => path.startsWith(endpoint));
}

/**
 * Apply conversion to response data based on the endpoint
 * 
 * @param path API path
 * @param data Response data
 * @returns Converted data
 */
function convertResponseData(path: string, data: any): any {
  // Special handling for different endpoints
  if (path.startsWith('/api/cost-matrix')) {
    return bentonConversionService.convertData(data, 'generic', 'costMatrix');
  } else if (path.startsWith('/api/property')) {
    return bentonConversionService.convertData(data, 'generic', 'propertyRecord');
  } else if (path.startsWith('/api/assessment')) {
    return bentonConversionService.convertData(data, 'generic', 'assessment');
  } else if (path.startsWith('/api/reports')) {
    // For reports, check if format is specified in query params
    const format = path.includes('format=summary') ? 'summary' :
                   path.includes('format=official') ? 'official' :
                   'detailed';
    
    const includeBranding = !path.includes('branding=false');
    
    return bentonConversionService.formatReport(data, format, includeBranding);
  } else if (path.startsWith('/api/building-types')) {
    return data.map((item: any) => ({
      ...item,
      name: bentonConversionService.convertBuildingType(item.name || item.code)
    }));
  } else if (path.startsWith('/api/regions')) {
    return data.map((item: any) => ({
      ...item,
      name: bentonConversionService.convertRegion(item.name || item.code)
    }));
  } else if (path.startsWith('/api/quality-levels')) {
    return data.map((item: any) => ({
      ...item,
      name: bentonConversionService.convertQuality(item.name || item.code)
    }));
  } else if (path.startsWith('/api/condition-levels')) {
    return data.map((item: any) => ({
      ...item,
      name: bentonConversionService.convertCondition(item.name || item.code)
    }));
  } else if (path.startsWith('/api/what-if-scenarios')) {
    // For what-if scenarios, we want to keep the original structure
    // but convert building types, regions, etc.
    if (Array.isArray(data)) {
      return data.map(scenario => convertScenario(scenario));
    } else {
      return convertScenario(data);
    }
  }
  
  // Default: return data unchanged
  return data;
}

/**
 * Convert a what-if scenario object
 * 
 * @param scenario The scenario to convert
 * @returns Converted scenario
 */
function convertScenario(scenario: any): any {
  if (!scenario) return scenario;
  
  const converted = { ...scenario };
  
  // Convert building type
  if (scenario.buildingType) {
    converted.buildingType = bentonConversionService.convertBuildingType(scenario.buildingType);
  }
  
  // Convert region
  if (scenario.region) {
    converted.region = bentonConversionService.convertRegion(scenario.region);
  }
  
  // Convert quality
  if (scenario.quality) {
    converted.quality = bentonConversionService.convertQuality(scenario.quality);
  }
  
  // Convert condition
  if (scenario.condition) {
    converted.condition = bentonConversionService.convertCondition(scenario.condition);
  }
  
  return converted;
}