/**
 * MCP Data Validation and Sanitization Module
 * 
 * This module provides functions for validating, sanitizing, and normalizing
 * data used in the Model Content Protocol (MCP) functions.
 */

import { z } from 'zod';

// Valid building types
export const VALID_BUILDING_TYPES = [
  'residential',
  'commercial',
  'industrial',
  'agricultural',
  'institutional'
];

// Valid regions
export const VALID_REGIONS = [
  'north',
  'south',
  'east',
  'west',
  'central'
];

// Valid building conditions
export const VALID_CONDITIONS = [
  'excellent',
  'good',
  'average',
  'fair',
  'poor'
];

// Current year for validation
export const CURRENT_YEAR = new Date().getFullYear();

/**
 * Validate building type
 * 
 * @param buildingType Building type to validate
 * @returns Whether the building type is valid
 */
export function validateBuildingType(buildingType: any): boolean {
  if (!buildingType) return false;
  
  const normalizedType = String(buildingType).toLowerCase().trim();
  return VALID_BUILDING_TYPES.includes(normalizedType);
}

/**
 * Validate region
 * 
 * @param region Region to validate
 * @returns Whether the region is valid
 */
export function validateRegion(region: any): boolean {
  if (!region) return false;
  
  // Normalize region by removing "Region" suffix and whitespace
  const normalizedRegion = String(region)
    .toLowerCase()
    .replace(/\s+region$/i, '')
    .trim();
  
  return VALID_REGIONS.includes(normalizedRegion);
}

/**
 * Validate square footage
 * 
 * @param squareFootage Square footage to validate
 * @returns Whether the square footage is valid
 */
export function validateSquareFootage(squareFootage: any): boolean {
  // Convert to number if string
  const footage = typeof squareFootage === 'string' 
    ? parseFloat(squareFootage) 
    : squareFootage;
  
  // Check if it's a valid positive number and within reasonable bounds
  return !isNaN(footage) && 
         footage > 0 && 
         footage <= 1000000; // Max 1 million sq ft as a reasonable upper bound
}

/**
 * Validate year built
 * 
 * @param yearBuilt Year built to validate
 * @returns Whether the year built is valid
 */
export function validateYearBuilt(yearBuilt: any): boolean {
  // Convert to number if string
  const year = typeof yearBuilt === 'string' 
    ? parseInt(yearBuilt, 10) 
    : yearBuilt;
  
  // Check if it's a valid year in a reasonable range
  // (between 1850 and current year)
  return !isNaN(year) && 
         year >= 1850 && 
         year <= CURRENT_YEAR;
}

/**
 * Validate building condition
 * 
 * @param condition Building condition to validate
 * @returns Whether the condition is valid
 */
export function validateCondition(condition: any): boolean {
  if (!condition) return false;
  
  const normalizedCondition = String(condition).toLowerCase().trim();
  return VALID_CONDITIONS.includes(normalizedCondition);
}

/**
 * Normalize input data for cost prediction
 * 
 * @param inputData Raw input data
 * @returns Normalized input data
 */
export function normalizeInputData(inputData: any): any {
  const result: any = {};
  
  // Normalize building type
  if (inputData.buildingType) {
    result.buildingType = String(inputData.buildingType).toLowerCase().trim();
  }
  
  // Normalize region
  if (inputData.region) {
    result.region = String(inputData.region)
      .toLowerCase()
      .replace(/\s+region$/i, '')
      .trim();
  }
  
  // Normalize square footage
  if (inputData.squareFootage) {
    result.squareFootage = typeof inputData.squareFootage === 'string'
      ? parseFloat(inputData.squareFootage)
      : inputData.squareFootage;
  }
  
  // Normalize year built
  if (inputData.yearBuilt) {
    result.yearBuilt = typeof inputData.yearBuilt === 'string'
      ? parseInt(inputData.yearBuilt, 10)
      : inputData.yearBuilt;
  }
  
  // Normalize condition
  if (inputData.condition) {
    result.condition = String(inputData.condition).toLowerCase().trim();
  }
  
  // Pass through any other properties
  for (const key in inputData) {
    if (!result.hasOwnProperty(key)) {
      result[key] = inputData[key];
    }
  }
  
  return result;
}

/**
 * Detect anomalies in cost prediction inputs
 * 
 * @param inputData Normalized input data
 * @returns Anomaly detection result
 */
export function detectAnomalies(inputData: any): { 
  hasAnomalies: boolean;
  anomalies: string[];
} {
  const anomalies: string[] = [];
  
  // Check for unusually large square footage based on building type
  if (inputData.buildingType === 'residential' && inputData.squareFootage > 20000) {
    anomalies.push('Unusually large square footage for residential building');
  }
  
  // Check for very old buildings with excellent condition
  if (inputData.yearBuilt && inputData.yearBuilt < 1950 && inputData.condition === 'excellent') {
    anomalies.push('Unusual combination of old building with excellent condition');
  }
  
  // Add more anomaly checks as needed
  
  return {
    hasAnomalies: anomalies.length > 0,
    anomalies
  };
}

/**
 * Comprehensive data quality check for cost prediction inputs
 * 
 * @param inputData Raw input data
 * @returns Validation result
 */
export function validateCostPredictionData(inputData: any): {
  isValid: boolean;
  normalizedData?: any;
  validationErrors: string[];
  dataQualityWarnings: string[];
} {
  const validationErrors: string[] = [];
  const dataQualityWarnings: string[] = [];
  
  // Check required fields
  if (!validateBuildingType(inputData.buildingType)) {
    validationErrors.push('Invalid or missing building type');
  }
  
  if (!validateRegion(inputData.region)) {
    validationErrors.push('Invalid or missing region');
  }
  
  if (!validateSquareFootage(inputData.squareFootage)) {
    validationErrors.push('Invalid or missing square footage');
  }
  
  // Check optional fields
  if (inputData.yearBuilt && !validateYearBuilt(inputData.yearBuilt)) {
    validationErrors.push('Invalid year built');
  }
  
  if (inputData.condition && !validateCondition(inputData.condition)) {
    validationErrors.push('Invalid building condition');
  }
  
  // If there are validation errors, return early
  if (validationErrors.length > 0) {
    return {
      isValid: false,
      validationErrors,
      dataQualityWarnings
    };
  }
  
  // Normalize the data
  const normalizedData = normalizeInputData(inputData);
  
  // Check for anomalies
  const anomalyResult = detectAnomalies(normalizedData);
  if (anomalyResult.hasAnomalies) {
    dataQualityWarnings.push(...anomalyResult.anomalies);
  }
  
  return {
    isValid: true,
    normalizedData,
    validationErrors,
    dataQualityWarnings
  };
}

// Zod schema for cost prediction request
export const costPredictionSchema = z.object({
  buildingType: z.string()
    .min(1, "Building type is required")
    .refine(val => validateBuildingType(val), {
      message: "Invalid building type. Allowed types: " + VALID_BUILDING_TYPES.join(", ")
    }),
  
  region: z.string()
    .min(1, "Region is required")
    .refine(val => validateRegion(val), {
      message: "Invalid region. Allowed regions: " + VALID_REGIONS.join(", ")
    }),
  
  squareFootage: z.union([z.number(), z.string()])
    .refine(val => validateSquareFootage(val), {
      message: "Square footage must be a positive number less than 1,000,000"
    })
    .transform(val => typeof val === 'string' ? parseFloat(val) : val),
  
  yearBuilt: z.union([z.number(), z.string()]).optional()
    .refine(val => val === undefined || validateYearBuilt(val), {
      message: `Year built must be between 1850 and ${CURRENT_YEAR}`
    })
    .transform(val => val === undefined ? undefined : 
      (typeof val === 'string' ? parseInt(val, 10) : val)),
  
  condition: z.string().optional()
    .refine(val => val === undefined || validateCondition(val), {
      message: "Invalid condition. Allowed conditions: " + VALID_CONDITIONS.join(", ")
    })
    .transform(val => val === undefined ? undefined : val.toLowerCase().trim()),
  
  complexity: z.number().min(0.5).max(2).optional(),
  
  // Add features array
  features: z.array(z.string()).optional()
});

// Export types
export type CostPredictionInput = z.infer<typeof costPredictionSchema>;

// Export all validators as a module
export default {
  validateBuildingType,
  validateRegion,
  validateSquareFootage,
  validateYearBuilt,
  validateCondition,
  normalizeInputData,
  detectAnomalies,
  validateCostPredictionData,
  costPredictionSchema
};