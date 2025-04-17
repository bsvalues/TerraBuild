/**
 * Benton County Format Middleware
 * 
 * This middleware intercepts API responses and applies Benton County specific
 * terminology and formatting to ensure consistency across the application.
 */

import { Request, Response, NextFunction } from 'express';
import { bentonConversionService } from '../services/bentonConversionService';

/**
 * Map API endpoints to their response data types
 */
const endpointDataTypeMap: Record<string, 'costMatrix' | 'buildingCost' | 'propertyData' | 'report' | 'scenario'> = {
  // Cost Matrix endpoints
  '/api/cost-matrix': 'costMatrix',
  '/api/cost-matrix/:id': 'costMatrix',
  
  // Building Cost endpoints
  '/api/building-costs': 'buildingCost',
  '/api/building-costs/:id': 'buildingCost',
  '/api/calculate-cost': 'buildingCost',
  
  // What-if Scenario endpoints
  '/api/what-if-scenarios': 'scenario',
  '/api/what-if-scenarios/:id': 'scenario',
  '/api/what-if-scenarios/:id/variations': 'scenario',
  '/api/what-if-scenarios/:id/impact': 'scenario',
  
  // Report endpoints
  '/api/reports': 'report',
  '/api/reports/:id': 'report',
  '/api/reports/generate': 'report'
};

/**
 * Check if endpoint should be processed by this middleware
 * 
 * @param path API path
 * @returns True if endpoint should be processed
 */
function shouldProcessEndpoint(path: string): boolean {
  // Check for exact match
  if (endpointDataTypeMap[path]) return true;
  
  // Check for parameterized routes
  const pathSegments = path.split('/');
  
  for (const endpoint of Object.keys(endpointDataTypeMap)) {
    const endpointSegments = endpoint.split('/');
    
    // Skip if segment count doesn't match
    if (pathSegments.length !== endpointSegments.length) continue;
    
    let matches = true;
    
    for (let i = 0; i < endpointSegments.length; i++) {
      // If segment is a parameter (starts with :), it matches anything
      if (endpointSegments[i].startsWith(':')) continue;
      
      // Otherwise, segments must match exactly
      if (endpointSegments[i] !== pathSegments[i]) {
        matches = false;
        break;
      }
    }
    
    if (matches) return true;
  }
  
  return false;
}

/**
 * Get data type for endpoint
 * 
 * @param path API path
 * @returns Data type for the endpoint
 */
function getDataTypeForEndpoint(path: string): 'costMatrix' | 'buildingCost' | 'propertyData' | 'report' | 'scenario' | null {
  // Check for exact match
  if (endpointDataTypeMap[path]) return endpointDataTypeMap[path];
  
  // Check for parameterized routes
  const pathSegments = path.split('/');
  
  for (const endpoint of Object.keys(endpointDataTypeMap)) {
    const endpointSegments = endpoint.split('/');
    
    // Skip if segment count doesn't match
    if (pathSegments.length !== endpointSegments.length) continue;
    
    let matches = true;
    
    for (let i = 0; i < endpointSegments.length; i++) {
      // If segment is a parameter (starts with :), it matches anything
      if (endpointSegments[i].startsWith(':')) continue;
      
      // Otherwise, segments must match exactly
      if (endpointSegments[i] !== pathSegments[i]) {
        matches = false;
        break;
      }
    }
    
    if (matches) return endpointDataTypeMap[endpoint];
  }
  
  return null;
}

/**
 * Middleware to convert API responses to Benton County format
 * 
 * @param req Express request
 * @param res Express response
 * @param next Next middleware function
 */
export function bentonCountyFormatMiddleware(req: Request, res: Response, next: NextFunction) {
  // Store the original send function
  const originalSend = res.send;
  
  // Skip processing if not an API endpoint
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  // Skip if not a GET or POST request (to avoid processing non-data responses)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return next();
  }
  
  // Skip if not an endpoint we should process
  if (!shouldProcessEndpoint(req.path)) {
    return next();
  }
  
  // Override the send function
  res.send = function(body: any): Response {
    try {
      // Only process JSON responses
      if (typeof body === 'string' && (body.startsWith('{') || body.startsWith('['))) {
        const jsonData = JSON.parse(body);
        
        // Get the data type for this endpoint
        const dataType = getDataTypeForEndpoint(req.path);
        
        if (dataType) {
          // Convert to Benton County format
          const convertedData = bentonConversionService.enhanceApiResponse(jsonData, dataType);
          
          // Replace with the converted data
          arguments[0] = JSON.stringify(convertedData);
        }
      }
    } catch (error) {
      console.error('Error in Benton County Format Middleware:', error);
      // In case of error, continue with original response
    }
    
    // Call the original send function
    return originalSend.apply(res, arguments as any);
  };
  
  next();
}

/**
 * Factory function to create middleware with options
 * 
 * @param options Middleware options
 * @returns Configured middleware function
 */
export function createBentonCountyMiddleware(options: {
  enableConversion?: boolean,
  enableHeaders?: boolean
} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip if conversion is disabled
    if (options.enableConversion === false) {
      return next();
    }
    
    // Add Benton County specific headers if enabled
    if (options.enableHeaders !== false) {
      res.setHeader('X-Benton-County-Format', 'true');
      res.setHeader('X-Benton-County-Version', '2025');
    }
    
    // Apply the middleware
    bentonCountyFormatMiddleware(req, res, next);
  };
}