/**
 * Property Data Quality Rules
 * 
 * Rules for validating property records for the Benton County Building Cost System.
 */

import { z } from 'zod';
import { RuleType, Severity, createRule, createZodRule } from './framework.js';

// Basic property schema
const propertySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  parcel_id: z.string().min(1, "Parcel ID is required"),
  address: z.string().min(1, "Address is required").optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  county: z.string().optional(),
  lat: z.union([z.string(), z.number()]).optional().transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  lng: z.union([z.string(), z.number()]).optional().transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  property_type: z.string().optional(),
  year_built: z.union([z.string(), z.number()]).optional()
    .transform(val => typeof val === 'string' ? parseInt(val) : val),
  tax_year: z.union([z.string(), z.number()]).optional()
    .transform(val => typeof val === 'string' ? parseInt(val) : val),
  assessed_value: z.union([z.string(), z.number()]).optional()
    .transform(val => typeof val === 'string' ? parseFloat(val) : val),
  market_value: z.union([z.string(), z.number()]).optional()
    .transform(val => typeof val === 'string' ? parseFloat(val) : val),
  land_value: z.union([z.string(), z.number()]).optional()
    .transform(val => typeof val === 'string' ? parseFloat(val) : val),
  improvement_value: z.union([z.string(), z.number()]).optional()
    .transform(val => typeof val === 'string' ? parseFloat(val) : val),
  // Add any additional fields needed
}).passthrough();

// Rules for property data
const propertyRules = [
  // Schema validation rule
  createZodRule(
    'property-schema', 
    'Validates property data against the expected schema', 
    RuleType.PROPERTY, 
    Severity.ERROR, 
    propertySchema
  ),
  
  // Rule for checking if the property is in Benton County
  createRule(
    'property-in-benton-county',
    'Property must be located in Benton County',
    RuleType.PROPERTY,
    Severity.ERROR,
    (data) => {
      if (!data.county) return { valid: true }; // Skip if county not provided
      
      const county = String(data.county).toLowerCase().trim();
      const isValid = county === 'benton' || county.includes('benton');
      
      return {
        valid: isValid,
        issues: isValid ? [] : [{
          rule: 'property-in-benton-county',
          message: `Property county "${data.county}" is not Benton County`,
          severity: Severity.ERROR,
          path: 'county'
        }]
      };
    }
  ),
  
  // Rule for checking if year built is realistic
  createRule(
    'realistic-year-built',
    'Year built should be between 1850 and current year',
    RuleType.PROPERTY,
    Severity.WARNING,
    (data) => {
      if (!data.year_built) return { valid: true }; // Skip if year_built not provided
      
      const yearBuilt = parseInt(data.year_built);
      if (isNaN(yearBuilt)) return { valid: true }; // Skip if not a number
      
      const currentYear = new Date().getFullYear();
      const isValid = yearBuilt >= 1850 && yearBuilt <= currentYear;
      
      return {
        valid: isValid,
        issues: isValid ? [] : [{
          rule: 'realistic-year-built',
          message: `Year built (${yearBuilt}) is outside realistic range (1850-${currentYear})`,
          severity: Severity.WARNING,
          path: 'year_built'
        }]
      };
    }
  ),
  
  // Rule for checking if assessed value is positive
  createRule(
    'positive-assessed-value',
    'Assessed value should be a positive number',
    RuleType.PROPERTY,
    Severity.ERROR,
    (data) => {
      if (data.assessed_value === undefined || data.assessed_value === null) 
        return { valid: true }; // Skip if assessed_value not provided
      
      const assessedValue = parseFloat(data.assessed_value);
      if (isNaN(assessedValue)) return { valid: true }; // Skip if not a number
      
      const isValid = assessedValue >= 0;
      
      return {
        valid: isValid,
        issues: isValid ? [] : [{
          rule: 'positive-assessed-value',
          message: `Assessed value (${assessedValue}) must be positive`,
          severity: Severity.ERROR,
          path: 'assessed_value'
        }]
      };
    }
  ),
  
  // Rule for checking if coordinates are in Washington state range
  createRule(
    'coordinates-in-washington',
    'Coordinates should be within Washington state boundaries',
    RuleType.PROPERTY,
    Severity.WARNING,
    (data) => {
      if (data.lat === undefined || data.lng === undefined) 
        return { valid: true }; // Skip if coordinates not provided
      
      const lat = parseFloat(data.lat);
      const lng = parseFloat(data.lng);
      
      if (isNaN(lat) || isNaN(lng)) return { valid: true }; // Skip if not numbers
      
      // Washington state bounding box (approximate)
      const isValid = 
        lat >= 45.5 && lat <= 49.0 && // Washington latitude range
        lng >= -124.8 && lng <= -116.9; // Washington longitude range
      
      return {
        valid: isValid,
        issues: isValid ? [] : [{
          rule: 'coordinates-in-washington',
          message: `Coordinates (${lat}, ${lng}) are outside Washington state boundaries`,
          severity: Severity.WARNING,
          path: 'lat,lng'
        }]
      };
    }
  ),
  
  // Add more property validation rules as needed
];

// Combined export of all property rules
export const allPropertyRules = propertyRules;

// Function to validate a property using all property rules
export function validateProperty(property) {
  const validator = new DataQualityValidator(propertyRules);
  return validator.validate(property, RuleType.PROPERTY);
}

// Function to validate an improvement using property rules
export function validateImprovement(improvement) {
  const validator = new DataQualityValidator(propertyRules);
  return validator.validate(improvement, RuleType.IMPROVEMENT);
}