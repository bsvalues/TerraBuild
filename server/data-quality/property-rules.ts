/**
 * Property Data Quality Rules for Benton County Building Cost System
 * 
 * This module defines validation rules for property data to ensure
 * accuracy, completeness, and consistency during the import process.
 */

import { z } from 'zod';
import { 
  Rule, 
  RuleType, 
  Severity, 
  createRule, 
  createZodRule 
} from './framework';

// Basic property schema for validation
const propertySchema = z.object({
  propId: z.union([
    z.string().min(1),
    z.number().transform(n => n.toString()).pipe(z.string().min(1))
  ]),
  block: z.string().optional().nullable(),
  tractOr: z.string().optional().nullable(),
  lot: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  acres: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).optional().nullable(),
  landValue: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).optional().nullable(),
  improvementValue: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).optional().nullable(),
  totalValue: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).optional().nullable()
});

// Basic improvement schema for validation
const improvementSchema = z.object({
  propId: z.union([
    z.string().min(1),
    z.number().transform(n => n.toString()).pipe(z.string().min(1))
  ]),
  improvementId: z.union([
    z.string().min(1),
    z.number().transform(n => n.toString()).pipe(z.string().min(1))
  ]),
  buildingType: z.string().optional().nullable(),
  yearBuilt: z.union([
    z.number(),
    z.string().transform(val => parseInt(val))
  ]).optional().nullable(),
  quality: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  squareFeet: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).optional().nullable(),
  value: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).optional().nullable()
});

// Property data validation rules
const propertyRules: Rule[] = [
  // Required fields
  createZodRule(
    'prop-required-fields',
    'Required Property Fields Validation',
    'Validates that all required property fields are present',
    RuleType.PROPERTY,
    Severity.ERROR,
    propertySchema
  ),
  
  // Property ID validation
  createRule(
    'prop-id-format',
    'Property ID Format Validation',
    'Validates that the property ID has the correct format (numeric and minimum length)',
    RuleType.PROPERTY,
    Severity.ERROR,
    (property) => {
      const propId = property.propId?.toString();
      
      if (!propId) {
        return {
          passed: false,
          message: 'Property ID is required'
        };
      }
      
      // Check if the property ID is numeric
      const isNumeric = /^\d+$/.test(propId);
      if (!isNumeric) {
        return {
          passed: false,
          message: `Property ID must be numeric, received: ${propId}`
        };
      }
      
      // Check if the property ID has a minimum length
      if (propId.length < 5) {
        return {
          passed: false,
          message: `Property ID must be at least 5 digits, received: ${propId} with length ${propId.length}`
        };
      }
      
      return {
        passed: true,
        message: 'Property ID is valid'
      };
    }
  ),
  
  // Address validation
  createRule(
    'prop-address-format',
    'Property Address Format Validation',
    'Validates that the property address has a reasonable format',
    RuleType.PROPERTY,
    Severity.WARNING,
    (property) => {
      if (!property.address) {
        return {
          passed: true, // Not required, so pass if not present
          message: 'Address is not provided'
        };
      }
      
      // Check if the address has a reasonable minimum length
      // and contains expected characters (numbers, letters, common punctuation)
      const address = property.address.toString();
      if (address.length < 5) {
        return {
          passed: false,
          message: `Address is suspiciously short: ${address}`
        };
      }
      
      // Check for a reasonable address format (has numbers and letters)
      const hasNumbers = /\d/.test(address);
      const hasLetters = /[a-zA-Z]/.test(address);
      
      if (!hasNumbers || !hasLetters) {
        return {
          passed: false,
          message: `Address should contain both numbers and letters: ${address}`
        };
      }
      
      return {
        passed: true,
        message: 'Address format is valid'
      };
    }
  ),
  
  // State validation
  createRule(
    'prop-state-format',
    'Property State Validation',
    'Validates that the state is a valid US state code',
    RuleType.PROPERTY,
    Severity.WARNING,
    (property) => {
      if (!property.state) {
        return {
          passed: true, // Not required, so pass if not present
          message: 'State is not provided'
        };
      }
      
      const state = property.state.toString().toUpperCase();
      const validStates = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
        'DC', 'PR', 'VI', 'AS', 'GU', 'MP'
      ];
      
      if (!validStates.includes(state)) {
        return {
          passed: false,
          message: `Invalid state code: ${state}`
        };
      }
      
      return {
        passed: true,
        message: 'State code is valid'
      };
    }
  ),
  
  // ZIP code validation
  createRule(
    'prop-zip-format',
    'ZIP Code Format Validation',
    'Validates that the ZIP code has a valid format (5 digits or ZIP+4)',
    RuleType.PROPERTY,
    Severity.WARNING,
    (property) => {
      if (!property.zip) {
        return {
          passed: true, // Not required, so pass if not present
          message: 'ZIP code is not provided'
        };
      }
      
      const zip = property.zip.toString();
      // 5-digit ZIP or ZIP+4 format
      const zipRegex = /^\d{5}(-\d{4})?$/;
      
      if (!zipRegex.test(zip)) {
        return {
          passed: false,
          message: `Invalid ZIP code format: ${zip}`
        };
      }
      
      return {
        passed: true,
        message: 'ZIP code format is valid'
      };
    }
  ),
  
  // Numeric value validation (acres, land value, etc.)
  createRule(
    'prop-numeric-values',
    'Property Numeric Values Validation',
    'Validates that numeric fields have reasonable values',
    RuleType.PROPERTY,
    Severity.WARNING,
    (property) => {
      const issues = [];
      
      // Validate acres (if provided)
      if (property.acres !== undefined && property.acres !== null) {
        const acres = parseFloat(property.acres as any);
        if (isNaN(acres)) {
          issues.push(`Acres is not a valid number: ${property.acres}`);
        } else if (acres < 0) {
          issues.push(`Acres cannot be negative: ${acres}`);
        } else if (acres > 100000) { // An arbitrary large value
          issues.push(`Acres value is suspiciously large: ${acres}`);
        }
      }
      
      // Validate land value (if provided)
      if (property.landValue !== undefined && property.landValue !== null) {
        const landValue = parseFloat(property.landValue as any);
        if (isNaN(landValue)) {
          issues.push(`Land value is not a valid number: ${property.landValue}`);
        } else if (landValue < 0) {
          issues.push(`Land value cannot be negative: ${landValue}`);
        }
      }
      
      // Validate improvement value (if provided)
      if (property.improvementValue !== undefined && property.improvementValue !== null) {
        const improvementValue = parseFloat(property.improvementValue as any);
        if (isNaN(improvementValue)) {
          issues.push(`Improvement value is not a valid number: ${property.improvementValue}`);
        } else if (improvementValue < 0) {
          issues.push(`Improvement value cannot be negative: ${improvementValue}`);
        }
      }
      
      // Validate total value (if provided)
      if (property.totalValue !== undefined && property.totalValue !== null) {
        const totalValue = parseFloat(property.totalValue as any);
        if (isNaN(totalValue)) {
          issues.push(`Total value is not a valid number: ${property.totalValue}`);
        } else if (totalValue < 0) {
          issues.push(`Total value cannot be negative: ${totalValue}`);
        }
      }
      
      // Validate consistency between land value, improvement value, and total value
      if (
        property.landValue !== undefined && property.landValue !== null &&
        property.improvementValue !== undefined && property.improvementValue !== null &&
        property.totalValue !== undefined && property.totalValue !== null
      ) {
        const landValue = parseFloat(property.landValue as any);
        const improvementValue = parseFloat(property.improvementValue as any);
        const totalValue = parseFloat(property.totalValue as any);
        
        if (!isNaN(landValue) && !isNaN(improvementValue) && !isNaN(totalValue)) {
          const calculatedTotal = landValue + improvementValue;
          const difference = Math.abs(calculatedTotal - totalValue);
          
          // Allow for small rounding differences
          if (difference > 1) {
            issues.push(
              `Total value (${totalValue}) does not match sum of land value ` +
              `(${landValue}) and improvement value (${improvementValue}): ` +
              `expected ${calculatedTotal}`
            );
          }
        }
      }
      
      if (issues.length > 0) {
        return {
          passed: false,
          message: 'Numeric value validation failed',
          details: issues
        };
      }
      
      return {
        passed: true,
        message: 'All numeric values are valid'
      };
    }
  )
];

// Improvement data validation rules
const improvementRules: Rule[] = [
  // Required fields
  createZodRule(
    'imp-required-fields',
    'Required Improvement Fields Validation',
    'Validates that all required improvement fields are present',
    RuleType.IMPROVEMENT,
    Severity.ERROR,
    improvementSchema
  ),
  
  // Improvement ID validation
  createRule(
    'imp-id-format',
    'Improvement ID Format Validation',
    'Validates that the improvement ID has the correct format',
    RuleType.IMPROVEMENT,
    Severity.ERROR,
    (improvement) => {
      const improvementId = improvement.improvementId?.toString();
      
      if (!improvementId) {
        return {
          passed: false,
          message: 'Improvement ID is required'
        };
      }
      
      // Check if the improvement ID is numeric
      const isNumeric = /^\d+$/.test(improvementId);
      if (!isNumeric) {
        return {
          passed: false,
          message: `Improvement ID must be numeric, received: ${improvementId}`
        };
      }
      
      return {
        passed: true,
        message: 'Improvement ID is valid'
      };
    }
  ),
  
  // Year built validation
  createRule(
    'imp-year-built',
    'Year Built Validation',
    'Validates that the year built is within a reasonable range',
    RuleType.IMPROVEMENT,
    Severity.WARNING,
    (improvement) => {
      if (improvement.yearBuilt === undefined || improvement.yearBuilt === null) {
        return {
          passed: true, // Not required, so pass if not present
          message: 'Year built is not provided'
        };
      }
      
      const yearBuilt = parseInt(improvement.yearBuilt as any);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(yearBuilt)) {
        return {
          passed: false,
          message: `Year built is not a valid number: ${improvement.yearBuilt}`
        };
      }
      
      if (yearBuilt < 1800) {
        return {
          passed: false,
          message: `Year built is suspiciously early: ${yearBuilt}`
        };
      }
      
      if (yearBuilt > currentYear) {
        return {
          passed: false,
          message: `Year built cannot be in the future: ${yearBuilt} (current year: ${currentYear})`
        };
      }
      
      return {
        passed: true,
        message: 'Year built is valid'
      };
    }
  ),
  
  // Building type validation
  createRule(
    'imp-building-type',
    'Building Type Validation',
    'Validates that the building type is a recognized code',
    RuleType.IMPROVEMENT,
    Severity.WARNING,
    (improvement, context) => {
      if (!improvement.buildingType) {
        return {
          passed: true, // Not required, so pass if not present
          message: 'Building type is not provided'
        };
      }
      
      const buildingType = improvement.buildingType.toString().toUpperCase();
      
      // Get valid building types from context if available
      const validBuildingTypes = context.relatedData?.validBuildingTypes as string[] || [
        // Common building types from Benton County
        'A1', 'A2', 'A3', // Apartments
        'B1', 'B2', 'B3', // Business
        'C1', 'C2', 'C3', 'C4', // Commercial
        'D1', 'D2', // Industrial
        'E1', 'E2', // Educational
        'F1', 'F2', // Factory
        'G1', 'G2', // Garage
        'H1', 'H2', // Hospital
        'I1', 'I2', // Industrial
        'J1', 'J2', // Storage
        'R1', 'R2', 'R3', 'R4', // Residential
        'S1', 'S2', // Storage
        'W1', 'W2', // Warehouse
        // Allow some flexibility in the validation if building codes are different
        'SFR', 'MFR', 'COM', 'IND', 'AGR', 'EXEMPT', 'UNKNOWN'
      ];
      
      if (!validBuildingTypes.includes(buildingType)) {
        return {
          passed: false,
          message: `Unknown building type: ${buildingType}`,
          details: {
            providedType: buildingType,
            validTypes: validBuildingTypes
          }
        };
      }
      
      return {
        passed: true,
        message: 'Building type is valid'
      };
    }
  ),
  
  // Quality and condition validation
  createRule(
    'imp-quality-condition',
    'Quality and Condition Validation',
    'Validates that quality and condition fields have valid values',
    RuleType.IMPROVEMENT,
    Severity.WARNING,
    (improvement) => {
      const issues = [];
      
      // Validate quality (if provided)
      if (improvement.quality !== undefined && improvement.quality !== null) {
        const quality = improvement.quality.toString().toUpperCase();
        const validQualities = ['EXCELLENT', 'GOOD', 'AVERAGE', 'FAIR', 'POOR', 'VERY POOR',
                               'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
        
        if (!validQualities.some(q => quality.includes(q))) {
          issues.push(`Unknown quality value: ${quality}`);
        }
      }
      
      // Validate condition (if provided)
      if (improvement.condition !== undefined && improvement.condition !== null) {
        const condition = improvement.condition.toString().toUpperCase();
        const validConditions = ['EXCELLENT', 'GOOD', 'AVERAGE', 'FAIR', 'POOR', 'VERY POOR',
                                'NEW', 'LIKE NEW', 'WELL MAINTAINED', 'AVERAGE WEAR', 'WORN', 'DAMAGED'];
        
        if (!validConditions.some(c => condition.includes(c))) {
          issues.push(`Unknown condition value: ${condition}`);
        }
      }
      
      if (issues.length > 0) {
        return {
          passed: false,
          message: 'Quality or condition validation failed',
          details: issues
        };
      }
      
      return {
        passed: true,
        message: 'Quality and condition values are valid'
      };
    }
  ),
  
  // Square feet and value validation
  createRule(
    'imp-numeric-values',
    'Improvement Numeric Values Validation',
    'Validates that square feet and value fields have reasonable values',
    RuleType.IMPROVEMENT,
    Severity.WARNING,
    (improvement) => {
      const issues = [];
      
      // Validate square feet (if provided)
      if (improvement.squareFeet !== undefined && improvement.squareFeet !== null) {
        const squareFeet = parseFloat(improvement.squareFeet as any);
        if (isNaN(squareFeet)) {
          issues.push(`Square feet is not a valid number: ${improvement.squareFeet}`);
        } else if (squareFeet <= 0) {
          issues.push(`Square feet must be positive: ${squareFeet}`);
        } else if (squareFeet > 1000000) { // An arbitrary large value
          issues.push(`Square feet value is suspiciously large: ${squareFeet}`);
        }
      }
      
      // Validate value (if provided)
      if (improvement.value !== undefined && improvement.value !== null) {
        const value = parseFloat(improvement.value as any);
        if (isNaN(value)) {
          issues.push(`Value is not a valid number: ${improvement.value}`);
        } else if (value < 0) {
          issues.push(`Value cannot be negative: ${value}`);
        }
      }
      
      if (issues.length > 0) {
        return {
          passed: false,
          message: 'Numeric value validation failed',
          details: issues
        };
      }
      
      return {
        passed: true,
        message: 'All numeric values are valid'
      };
    }
  )
];

// Export all property validation rules
export const allPropertyRules = [...propertyRules, ...improvementRules];

// Create specific rule sets for different entity types
export const validateProperty = propertyRules;
export const validateImprovement = improvementRules;