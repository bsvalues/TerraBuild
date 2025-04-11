/**
 * Data Quality Framework - Property Assessment Rules
 * 
 * This module implements specific validation rules for property assessment data
 * in compliance with Washington State requirements and Benton County standards.
 */

import { ValidationRule, ValidationIssue, RuleValidationResult } from './types';
import { Property, Improvement, ImprovementDetail } from '@shared/property-schema';

/**
 * Generate a validation result with no issues
 */
function validResult(ruleId: string, ruleName: string): RuleValidationResult {
  return {
    ruleId,
    ruleName,
    valid: true,
    score: 1.0,
    issues: []
  };
}

/**
 * Generate a validation result with issues
 */
function invalidResult(
  ruleId: string, 
  ruleName: string, 
  issues: ValidationIssue[], 
  score: number = 0
): RuleValidationResult {
  return {
    ruleId,
    ruleName,
    valid: false,
    score: Math.max(0, Math.min(1, score)), // Ensure score is between 0 and 1
    issues
  };
}

/**
 * Collection of validation rules for Property entities
 */
export const propertyValidationRules: ValidationRule[] = [
  // RCW 84.40.020 - Required Information
  {
    id: 'prop-required-fields',
    name: 'Required Property Fields',
    description: 'Ensures all required property fields are present',
    validate: (property: Property): RuleValidationResult => {
      const requiredFields = [
        { field: 'propId', label: 'Property ID' },
        { field: 'legalDesc', label: 'Legal Description' },
        { field: 'propertyUseCd', label: 'Property Use Code' }
      ];
      
      const missingFields = requiredFields.filter(rf => !property[rf.field as keyof Property]);
      
      if (missingFields.length === 0) {
        return validResult('prop-required-fields', 'Required Property Fields');
      }
      
      return invalidResult(
        'prop-required-fields', 
        'Required Property Fields',
        [{
          code: 'missing-required-fields',
          message: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}`,
          severity: 'error',
          fields: missingFields.map(f => f.field)
        }],
        0 // Zero score for missing required fields
      );
    }
  },
  
  // RCW 84.40.030 - Valid Valuation
  {
    id: 'prop-valuation-ranges',
    name: 'Property Valuation Ranges',
    description: 'Validates that property valuation is within reasonable ranges',
    validate: (property: Property): RuleValidationResult => {
      // Skip if no market value provided
      if (property.market === null || property.market === undefined) {
        return validResult('prop-valuation-ranges', 'Property Valuation Ranges');
      }
      
      const issues: ValidationIssue[] = [];
      let score = 1.0;
      
      // Check for negative values (always invalid)
      if (property.market < 0) {
        issues.push({
          code: 'negative-valuation',
          message: `Property has negative market value: ${property.market}`,
          severity: 'critical',
          fields: ['market']
        });
        score = 0;
      }
      
      // Check for zero values (warning only)
      if (property.market === 0) {
        issues.push({
          code: 'zero-valuation',
          message: 'Property has zero market value',
          severity: 'warning',
          fields: ['market']
        });
        score = 0.5;
      }
      
      // Check for extremely high values (based on typical residential property values)
      // This would need to be adjusted based on the specific region's value ranges
      const extremelyHighThreshold = 10000000; // $10M is very high for typical residential
      if (property.market > extremelyHighThreshold) {
        issues.push({
          code: 'extremely-high-valuation',
          message: `Property has extremely high market value: $${property.market.toLocaleString()}`,
          severity: 'warning',
          fields: ['market'],
          context: { threshold: extremelyHighThreshold }
        });
        score = 0.7; // Reduce score but don't invalidate completely
      }
      
      if (issues.length === 0) {
        return validResult('prop-valuation-ranges', 'Property Valuation Ranges');
      }
      
      return invalidResult(
        'prop-valuation-ranges', 
        'Property Valuation Ranges',
        issues,
        score
      );
    }
  },
  
  // Benton County Specific - Legal Description Format
  {
    id: 'prop-legal-desc-format',
    name: 'Legal Description Format',
    description: 'Validates that legal descriptions follow Benton County format standards',
    validate: (property: Property): RuleValidationResult => {
      // Skip if no legal description
      if (!property.legalDesc) {
        return validResult('prop-legal-desc-format', 'Legal Description Format');
      }
      
      const issues: ValidationIssue[] = [];
      let score = 1.0;
      
      // Check minimum length (too short means likely incomplete)
      if (property.legalDesc.length < 10) {
        issues.push({
          code: 'legal-desc-too-short',
          message: 'Legal description is too short and likely incomplete',
          severity: 'warning',
          fields: ['legalDesc']
        });
        score = 0.7;
      }
      
      // Check for common markers in legal descriptions (simplified example)
      const hasExpectedMarkers = /lot|block|section|township|range/i.test(property.legalDesc);
      if (!hasExpectedMarkers) {
        issues.push({
          code: 'legal-desc-missing-markers',
          message: 'Legal description is missing expected terminology (lot, block, section, etc.)',
          severity: 'warning',
          fields: ['legalDesc']
        });
        score = score * 0.8; // Compound score reduction
      }
      
      if (issues.length === 0) {
        return validResult('prop-legal-desc-format', 'Legal Description Format');
      }
      
      return invalidResult(
        'prop-legal-desc-format', 
        'Legal Description Format',
        issues,
        score
      );
    }
  },
  
  // Property Land and Improvement Consistency
  {
    id: 'prop-land-improvement-consistency',
    name: 'Land and Improvement Value Consistency',
    description: 'Validates that land and improvement values sum to total',
    validate: (property: Property): RuleValidationResult => {
      // Skip if we don't have both assessed value and component values
      if (property.assessedVal === null || property.assessedVal === undefined) {
        return validResult('prop-land-improvement-consistency', 'Land and Improvement Value Consistency');
      }
      
      let landValues = 0;
      if (property.landHstdVal) landValues += property.landHstdVal;
      if (property.landNonHstdVal) landValues += property.landNonHstdVal;
      
      let improvementValues = 0;
      if (property.imprvHstdVal) improvementValues += property.imprvHstdVal;
      if (property.imprvNonHstdVal) improvementValues += property.imprvNonHstdVal;
      
      // Skip if we don't have component breakdowns
      if (landValues === 0 && improvementValues === 0) {
        return validResult('prop-land-improvement-consistency', 'Land and Improvement Value Consistency');
      }
      
      const totalComponentValues = landValues + improvementValues;
      const difference = Math.abs(property.assessedVal - totalComponentValues);
      
      // Allow for small rounding differences (less than $1)
      if (difference < 1) {
        return validResult('prop-land-improvement-consistency', 'Land and Improvement Value Consistency');
      }
      
      // Calculate difference as percentage of total value for scoring
      const diffPercentage = difference / property.assessedVal;
      let score = 1 - diffPercentage;
      if (score < 0) score = 0;
      
      return invalidResult(
        'prop-land-improvement-consistency', 
        'Land and Improvement Value Consistency',
        [{
          code: 'value-components-mismatch',
          message: `Total assessed value ($${property.assessedVal.toLocaleString()}) doesn't match sum of land and improvement values ($${totalComponentValues.toLocaleString()})`,
          severity: diffPercentage > 0.1 ? 'error' : 'warning',
          fields: ['assessedVal', 'landHstdVal', 'landNonHstdVal', 'imprvHstdVal', 'imprvNonHstdVal'],
          context: { difference, diffPercentage }
        }],
        score
      );
    }
  }
];

/**
 * Collection of validation rules for Improvement entities
 */
export const improvementValidationRules: ValidationRule[] = [
  // Required Improvement Fields
  {
    id: 'imprv-required-fields',
    name: 'Required Improvement Fields',
    description: 'Ensures all required improvement fields are present',
    validate: (improvement: Improvement): RuleValidationResult => {
      const requiredFields = [
        { field: 'propId', label: 'Property ID' },
        { field: 'imprvId', label: 'Improvement ID' },
        { field: 'imprvDesc', label: 'Description' }
      ];
      
      const missingFields = requiredFields.filter(rf => !improvement[rf.field as keyof Improvement]);
      
      if (missingFields.length === 0) {
        return validResult('imprv-required-fields', 'Required Improvement Fields');
      }
      
      return invalidResult(
        'imprv-required-fields', 
        'Required Improvement Fields',
        [{
          code: 'missing-required-fields',
          message: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}`,
          severity: 'error',
          fields: missingFields.map(f => f.field)
        }],
        0 // Zero score for missing required fields
      );
    }
  },
  
  // Valid Year Built
  {
    id: 'imprv-year-built',
    name: 'Valid Year Built',
    description: 'Validates that year built is within reasonable range',
    validate: (improvement: Improvement): RuleValidationResult => {
      // Skip if no year built provided
      if (!improvement.actualYearBuilt) {
        return validResult('imprv-year-built', 'Valid Year Built');
      }
      
      const currentYear = new Date().getFullYear();
      const issues: ValidationIssue[] = [];
      let score = 1.0;
      
      // Check for future dates
      if (improvement.actualYearBuilt > currentYear) {
        issues.push({
          code: 'future-year-built',
          message: `Year built (${improvement.actualYearBuilt}) is in the future`,
          severity: 'error',
          fields: ['actualYearBuilt']
        });
        score = 0;
      }
      
      // Check for very old buildings (adjust threshold as needed)
      // Oldest buildings in Washington State are from ~1850s
      const oldestReasonableYear = 1850;
      if (improvement.actualYearBuilt < oldestReasonableYear) {
        issues.push({
          code: 'unreasonably-old-year-built',
          message: `Year built (${improvement.actualYearBuilt}) is unreasonably old`,
          severity: 'warning',
          fields: ['actualYearBuilt']
        });
        score = 0.5;
      }
      
      if (issues.length === 0) {
        return validResult('imprv-year-built', 'Valid Year Built');
      }
      
      return invalidResult(
        'imprv-year-built', 
        'Valid Year Built',
        issues,
        score
      );
    }
  },
  
  // Valid Living Area
  {
    id: 'imprv-living-area',
    name: 'Valid Living Area',
    description: 'Validates that living area is within reasonable range',
    validate: (improvement: Improvement): RuleValidationResult => {
      // Skip if no living area provided
      if (improvement.livingArea === null || improvement.livingArea === undefined) {
        return validResult('imprv-living-area', 'Valid Living Area');
      }
      
      const issues: ValidationIssue[] = [];
      let score = 1.0;
      
      // Check for negative or zero area
      if (improvement.livingArea <= 0) {
        issues.push({
          code: 'non-positive-living-area',
          message: `Living area (${improvement.livingArea}) must be positive`,
          severity: 'error',
          fields: ['livingArea']
        });
        score = 0;
      }
      
      // Check for unreasonably small areas
      const minReasonableArea = 100; // 100 sq ft is very small
      if (improvement.livingArea > 0 && improvement.livingArea < minReasonableArea) {
        issues.push({
          code: 'unusually-small-living-area',
          message: `Living area (${improvement.livingArea} sq ft) is unusually small`,
          severity: 'warning',
          fields: ['livingArea']
        });
        score = 0.7;
      }
      
      // Check for unreasonably large areas
      const maxReasonableArea = 50000; // 50,000 sq ft is very large
      if (improvement.livingArea > maxReasonableArea) {
        issues.push({
          code: 'unusually-large-living-area',
          message: `Living area (${improvement.livingArea} sq ft) is unusually large`,
          severity: 'warning',
          fields: ['livingArea']
        });
        score = 0.7;
      }
      
      if (issues.length === 0) {
        return validResult('imprv-living-area', 'Valid Living Area');
      }
      
      return invalidResult(
        'imprv-living-area', 
        'Valid Living Area',
        issues,
        score
      );
    }
  }
];

/**
 * Register all property-related validation rules with the data quality framework
 */
export function registerPropertyRules(framework: any): void {
  // Register property rules
  for (const rule of propertyValidationRules) {
    framework.registerRule('property', rule);
  }
  
  // Register improvement rules
  for (const rule of improvementValidationRules) {
    framework.registerRule('improvement', rule);
  }
}