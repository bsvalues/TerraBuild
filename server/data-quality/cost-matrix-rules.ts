/**
 * Cost Matrix Data Quality Rules for Benton County Building Cost System
 * 
 * This module defines validation rules for cost matrix data to ensure
 * accuracy, completeness, and consistency during the import and usage process.
 */

import { z } from 'zod';
import { 
  Rule, 
  RuleType, 
  Severity, 
  ValidationContext, 
  ValidationResult,
  createRule,
  createZodRule
} from './framework';

// Basic cost matrix entry schema for validation
const costMatrixSchema = z.object({
  region: z.string().min(1),
  buildingType: z.string().min(1),
  quality: z.string().optional().nullable(),
  baseRate: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]),
  adjustmentFactor: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).optional().nullable(),
  materialCosts: z.record(z.any()).optional().nullable(),
  applicableYear: z.union([
    z.number(),
    z.string().transform(val => parseInt(val))
  ]).optional().nullable(),
  notes: z.string().optional().nullable()
});

// Cost matrix data validation rules
const costMatrixRules: Rule[] = [
  // Required fields
  createZodRule(
    'cost-matrix-required-fields',
    'Required Cost Matrix Fields Validation',
    'Validates that all required cost matrix fields are present',
    RuleType.COST_MATRIX,
    Severity.ERROR,
    costMatrixSchema
  ),
  
  // Region validation
  createRule(
    'cost-matrix-region-format',
    'Cost Matrix Region Format Validation',
    'Validates that the region is a recognized format',
    RuleType.COST_MATRIX,
    Severity.ERROR,
    (matrix) => {
      if (!matrix.region) {
        return {
          passed: false,
          message: 'Region is required'
        };
      }
      
      const region = matrix.region.toString().toUpperCase();
      
      // Check region is in the expected format (common Benton County regions)
      const validRegions = [
        'EASTERN', 'WESTERN', 'CENTRAL', 
        'NORTH', 'SOUTH', 'DOWNTOWN',
        'RURAL', 'URBAN', 'SUBURBAN',
        'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL',
        // Add any other valid regions or allow a more flexible pattern
        'DISTRICT_1', 'DISTRICT_2', 'DISTRICT_3', 'DISTRICT_4', 'DISTRICT_5'
      ];
      
      // Check either exact match or pattern match for regions
      const isValidRegion = validRegions.includes(region) || 
                          /^(ZONE|DISTRICT|AREA|REGION)_[A-Z0-9]+$/i.test(region);
      
      if (!isValidRegion) {
        return {
          passed: false,
          message: `Invalid region format: ${region}`,
          details: {
            providedRegion: region,
            validRegions: validRegions,
            note: 'Regions can also follow patterns like ZONE_123, DISTRICT_A, etc.'
          }
        };
      }
      
      return {
        passed: true,
        message: 'Region format is valid'
      };
    }
  ),
  
  // Building type validation
  createRule(
    'cost-matrix-building-type',
    'Cost Matrix Building Type Validation',
    'Validates that the building type is a recognized code',
    RuleType.COST_MATRIX,
    Severity.ERROR,
    (matrix, context) => {
      if (!matrix.buildingType) {
        return {
          passed: false,
          message: 'Building type is required'
        };
      }
      
      const buildingType = matrix.buildingType.toString().toUpperCase();
      
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
  
  // Base rate validation
  createRule(
    'cost-matrix-base-rate',
    'Cost Matrix Base Rate Validation',
    'Validates that the base rate has a reasonable value',
    RuleType.COST_MATRIX,
    Severity.ERROR,
    (matrix) => {
      if (matrix.baseRate === undefined || matrix.baseRate === null) {
        return {
          passed: false,
          message: 'Base rate is required'
        };
      }
      
      const baseRate = parseFloat(matrix.baseRate as any);
      
      if (isNaN(baseRate)) {
        return {
          passed: false,
          message: `Base rate is not a valid number: ${matrix.baseRate}`
        };
      }
      
      if (baseRate <= 0) {
        return {
          passed: false,
          message: `Base rate must be positive, received: ${baseRate}`
        };
      }
      
      // Check for unusually high or low base rates (can be adjusted based on actual data)
      if (baseRate < 10) {
        return {
          passed: false,
          message: `Base rate seems unusually low: ${baseRate}`
        };
      }
      
      if (baseRate > 1000) {
        return {
          passed: false,
          message: `Base rate seems unusually high: ${baseRate}`
        };
      }
      
      return {
        passed: true,
        message: 'Base rate is valid'
      };
    }
  ),
  
  // Adjustment factor validation
  createRule(
    'cost-matrix-adjustment-factor',
    'Cost Matrix Adjustment Factor Validation',
    'Validates that the adjustment factor has a reasonable value',
    RuleType.COST_MATRIX,
    Severity.WARNING,
    (matrix) => {
      if (matrix.adjustmentFactor === undefined || matrix.adjustmentFactor === null) {
        return {
          passed: true, // Not required, so pass if not present
          message: 'Adjustment factor is not provided'
        };
      }
      
      const factor = parseFloat(matrix.adjustmentFactor as any);
      
      if (isNaN(factor)) {
        return {
          passed: false,
          message: `Adjustment factor is not a valid number: ${matrix.adjustmentFactor}`
        };
      }
      
      // Typically adjustment factors should be close to 1.0
      if (factor <= 0) {
        return {
          passed: false,
          message: `Adjustment factor must be positive, received: ${factor}`
        };
      }
      
      // Check for unusually high or low adjustment factors (can be adjusted based on actual data)
      if (factor < 0.5 || factor > 2.0) {
        return {
          passed: false,
          message: `Adjustment factor seems out of normal range (0.5-2.0): ${factor}`
        };
      }
      
      return {
        passed: true,
        message: 'Adjustment factor is valid'
      };
    }
  ),
  
  // Applicable year validation
  createRule(
    'cost-matrix-applicable-year',
    'Cost Matrix Applicable Year Validation',
    'Validates that the applicable year is within a reasonable range',
    RuleType.COST_MATRIX,
    Severity.WARNING,
    (matrix) => {
      if (matrix.applicableYear === undefined || matrix.applicableYear === null) {
        return {
          passed: true, // Not required, so pass if not present
          message: 'Applicable year is not provided'
        };
      }
      
      const year = parseInt(matrix.applicableYear as any);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(year)) {
        return {
          passed: false,
          message: `Applicable year is not a valid number: ${matrix.applicableYear}`
        };
      }
      
      // Check for years too far in the past or future
      if (year < currentYear - 10) {
        return {
          passed: false,
          message: `Applicable year seems too far in the past: ${year} (current year: ${currentYear})`
        };
      }
      
      if (year > currentYear + 5) {
        return {
          passed: false,
          message: `Applicable year cannot be too far in the future: ${year} (current year: ${currentYear})`
        };
      }
      
      return {
        passed: true,
        message: 'Applicable year is valid'
      };
    }
  ),
  
  // Material costs validation
  createRule(
    'cost-matrix-material-costs',
    'Cost Matrix Material Costs Validation',
    'Validates that the material costs have reasonable values if provided',
    RuleType.COST_MATRIX,
    Severity.WARNING,
    (matrix) => {
      if (!matrix.materialCosts || Object.keys(matrix.materialCosts).length === 0) {
        return {
          passed: true, // Not required, so pass if not present
          message: 'Material costs are not provided'
        };
      }
      
      const issues = [];
      
      // Check each material cost
      for (const [material, cost] of Object.entries(matrix.materialCosts)) {
        const materialCost = parseFloat(cost as any);
        
        if (isNaN(materialCost)) {
          issues.push(`Cost for material '${material}' is not a valid number: ${cost}`);
          continue;
        }
        
        if (materialCost < 0) {
          issues.push(`Cost for material '${material}' cannot be negative: ${materialCost}`);
        }
        
        // Check for unusually high costs (adjust based on actual data)
        if (materialCost > 1000) {
          issues.push(`Cost for material '${material}' seems unusually high: ${materialCost}`);
        }
      }
      
      if (issues.length > 0) {
        return {
          passed: false,
          message: 'Material costs validation failed',
          details: issues
        };
      }
      
      return {
        passed: true,
        message: 'Material costs are valid'
      };
    }
  )
];

export default costMatrixRules;