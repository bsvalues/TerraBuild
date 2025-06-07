/**
 * Cost Matrix Data Quality Rules
 * 
 * Rules for validating cost matrix records for the Benton County Building Cost System.
 */

import { z } from 'zod';
import { RuleType, Severity, createRule, createZodRule } from './framework.js';

// Basic cost matrix schema
const costMatrixSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  building_type: z.string().min(1, "Building type is required"),
  building_type_description: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  matrix_year: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val) : val
  ),
  base_cost: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  matrix_description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  state: z.string().optional(),
  county: z.string().optional()
}).passthrough();

// Rules for cost matrix data
const costMatrixRules = [
  // Schema validation rule
  createZodRule(
    'cost-matrix-schema', 
    'Validates cost matrix data against the expected schema', 
    RuleType.COST_MATRIX, 
    Severity.ERROR, 
    costMatrixSchema
  ),
  
  // Rule for checking if the matrix year is valid
  createRule(
    'valid-matrix-year',
    'Matrix year must be between 2000 and current year',
    RuleType.COST_MATRIX,
    Severity.ERROR,
    (data) => {
      if (!data.matrix_year) return { valid: true }; // Skip if matrix_year not provided
      
      const matrixYear = parseInt(data.matrix_year);
      if (isNaN(matrixYear)) return { valid: true }; // Skip if not a number
      
      const currentYear = new Date().getFullYear();
      const isValid = matrixYear >= 2000 && matrixYear <= currentYear + 1; // Allow one year in future for upcoming matrices
      
      return {
        valid: isValid,
        issues: isValid ? [] : [{
          rule: 'valid-matrix-year',
          message: `Matrix year (${matrixYear}) is outside valid range (2000-${currentYear + 1})`,
          severity: Severity.ERROR,
          path: 'matrix_year'
        }]
      };
    }
  ),
  
  // Rule for checking if the base cost is positive
  createRule(
    'positive-base-cost',
    'Base cost must be a positive number',
    RuleType.COST_MATRIX,
    Severity.ERROR,
    (data) => {
      if (data.base_cost === undefined || data.base_cost === null) 
        return { valid: true }; // Skip if base_cost not provided
      
      const baseCost = parseFloat(data.base_cost);
      if (isNaN(baseCost)) return { valid: true }; // Skip if not a number
      
      const isValid = baseCost > 0;
      
      return {
        valid: isValid,
        issues: isValid ? [] : [{
          rule: 'positive-base-cost',
          message: `Base cost (${baseCost}) must be positive`,
          severity: Severity.ERROR,
          path: 'base_cost'
        }]
      };
    }
  ),
  
  // Rule for checking if the region is valid for Benton County
  createRule(
    'valid-benton-region',
    'Region must be a valid Benton County region code',
    RuleType.COST_MATRIX,
    Severity.WARNING,
    (data) => {
      if (!data.region) return { valid: true }; // Skip if region not provided
      
      // Common Benton County region identifiers 
      // (using a mix of township/range, hood codes, and tax areas)
      const validRegionPrefixes = [
        '8N', '9N', '10N', '11N', '12N', // Township prefixes
        '27E', '28E', '29E', '30E',      // Range prefixes
        '100', '110', '120', '130', '140', '150', // Hood code prefixes
        '52100', '52200', '52300',       // More specific hood codes
        'TCA-', 'BENTON-'                // Other prefixes
      ];
      
      // Check if region starts with one of the valid prefixes
      const region = String(data.region).trim();
      const isValid = validRegionPrefixes.some(prefix => 
        region.includes(prefix) || region.startsWith(prefix)
      );
      
      return {
        valid: isValid,
        issues: isValid ? [] : [{
          rule: 'valid-benton-region',
          message: `Region "${region}" does not match known Benton County region patterns`,
          severity: Severity.WARNING,
          path: 'region'
        }]
      };
    }
  ),
  
  // Rule for checking if the building type code is valid
  createRule(
    'valid-building-type',
    'Building type must be a valid code',
    RuleType.COST_MATRIX,
    Severity.ERROR,
    (data) => {
      if (!data.building_type) return { valid: true }; // Skip if building_type not provided
      
      // Common building type codes used in Benton County
      const validBuildingTypes = [
        'SFR', 'MFR', 'COM', 'IND', 'AGR', 'RET', 'OFF', 'WAR', 
        'RES', 'APT', 'DUP', 'CON', 'MHP', 'STG', 'GAR', 'SHD',
        // More specific codes
        'SFR-A', 'SFR-B', 'SFR-C', 'SFR-D', 'SFR-E',
        'COM-1', 'COM-2', 'COM-3', 'COM-4', 'COM-5',
        'IND-1', 'IND-2', 'IND-3',
        'AGR-1', 'AGR-2',
        // Include codes with lowercase too
        'sfr', 'mfr', 'com', 'ind', 'agr'
      ];
      
      const buildingType = String(data.building_type).trim();
      
      // Check exact match or if it starts with a valid prefix
      const isValid = validBuildingTypes.some(type => 
        buildingType === type || buildingType.startsWith(type + '-')
      );
      
      return {
        valid: isValid,
        issues: isValid ? [] : [{
          rule: 'valid-building-type',
          message: `Building type "${buildingType}" is not a recognized code`,
          severity: Severity.ERROR,
          path: 'building_type'
        }]
      };
    }
  ),
  
  // Rule for checking if the base cost is within a reasonable range
  createRule(
    'reasonable-base-cost',
    'Base cost should be within a reasonable range for the building type',
    RuleType.COST_MATRIX,
    Severity.WARNING,
    (data) => {
      if (data.base_cost === undefined || data.base_cost === null || !data.building_type) 
        return { valid: true }; // Skip if required fields not provided
      
      const baseCost = parseFloat(data.base_cost);
      if (isNaN(baseCost)) return { valid: true }; // Skip if not a number
      
      const buildingType = String(data.building_type).toLowerCase();
      
      // Define reasonable cost ranges for different building types (per square foot)
      let minCost = 50;
      let maxCost = 500;
      
      if (buildingType.includes('sfr') || buildingType.includes('res')) {
        // Single family residential
        minCost = 100;
        maxCost = 400;
      } else if (buildingType.includes('mfr') || buildingType.includes('apt')) {
        // Multi-family residential
        minCost = 80;
        maxCost = 350;
      } else if (buildingType.includes('com') || buildingType.includes('ret') || buildingType.includes('off')) {
        // Commercial, retail, office
        minCost = 120;
        maxCost = 500;
      } else if (buildingType.includes('ind') || buildingType.includes('war')) {
        // Industrial, warehouse
        minCost = 50;
        maxCost = 300;
      } else if (buildingType.includes('agr') || buildingType.includes('shd')) {
        // Agricultural, sheds
        minCost = 20;
        maxCost = 150;
      }
      
      const isValid = baseCost >= minCost && baseCost <= maxCost;
      
      return {
        valid: isValid,
        issues: isValid ? [] : [{
          rule: 'reasonable-base-cost',
          message: `Base cost $${baseCost}/sqft for ${data.building_type} is outside typical range ($${minCost}-$${maxCost}/sqft)`,
          severity: Severity.WARNING,
          path: 'base_cost'
        }]
      };
    }
  ),
  
  // Add more matrix validation rules as needed
];

export default costMatrixRules;