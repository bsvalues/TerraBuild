/**
 * Benton County Format Middleware
 * 
 * This middleware intercepts API responses and transforms them to use
 * Benton County specific terminology and formats.
 */

import { Request, Response, NextFunction } from 'express';
import { bentonCountyConversionAgent } from '../mcp/agents/conversionAgent';

/**
 * Middleware to convert API responses to Benton County format
 */
export function bentonCountyFormatMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store the original response.json method
    const originalJson = res.json;
    
    // Override the json method
    res.json = function(body: any) {
      // Skip conversion for certain endpoints
      const skipPaths = [
        '/api/auth',
        '/api/system',
        '/mcp'
      ];
      
      if (skipPaths.some(path => req.path.startsWith(path))) {
        return originalJson.call(this, body);
      }
      
      try {
        // Determine the response type based on the endpoint
        let dataType: 'costMatrix' | 'propertyRecord' | 'assessment' | 'report' = 'propertyRecord';
        
        if (req.path.includes('/cost-matrix') || req.path.includes('/matrix')) {
          dataType = 'costMatrix';
        } else if (req.path.includes('/assessment')) {
          dataType = 'assessment';
        } else if (req.path.includes('/report')) {
          dataType = 'report';
        }
        
        // Convert the response to Benton County format
        const convertedData = bentonCountyConversionAgent.convertData({
          data: body,
          fromFormat: 'generic',
          dataType
        });
        
        // Call the original json method with the converted data
        return originalJson.call(this, convertedData);
      } catch (error) {
        console.error('Error converting response to Benton County format:', error);
        
        // If there's an error, just use the original data
        return originalJson.call(this, body);
      }
    };
    
    next();
  };
}

/**
 * Add Benton County specific headers to the response
 */
export function bentonCountyHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add Benton County specific headers
    res.setHeader('X-Benton-County-Assessor', 'BCBS-System');
    res.setHeader('X-Benton-County-App-Version', '1.0.0');
    
    next();
  };
}