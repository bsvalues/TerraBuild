/**
 * Property Data Quality Rules
 * 
 * This module provides data quality validation rules for property data
 * in the Benton County Building Cost System.
 */

import { 
  Rule, 
  RuleType, 
  Severity, 
  createRule, 
  ValidationContext,
  ValidationResult
} from './framework';

// Basic property validation rules
const requiredPropertyFieldsRule: Rule = createRule(
  'property-required-fields',
  'All required property fields must be present',
  RuleType.PROPERTY,
  Severity.ERROR,
  (data: any) => {
    const issues = [];
    
    // Check for required fields
    if (!data.parcel_id && !data.propId) {
      issues.push({
        ruleId: 'property-required-fields',
        field: 'parcel_id',
        message: 'Property ID/Parcel ID is required',
        severity: Severity.ERROR
      });
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
);

// Property value range validation rule
const propertyValueRangeRule: Rule = createRule(
  'property-value-range',
  'Property values must be within reasonable ranges',
  RuleType.PROPERTY,
  Severity.WARNING,
  (data: any) => {
    const issues = [];
    
    // Check land value range
    if (data.landValue !== undefined && data.landValue !== null) {
      const landValue = parseFloat(data.landValue);
      if (landValue < 0) {
        issues.push({
          ruleId: 'property-value-range',
          field: 'landValue',
          value: landValue,
          message: 'Land value cannot be negative',
          severity: Severity.ERROR
        });
      } else if (landValue > 10000000) {
        issues.push({
          ruleId: 'property-value-range',
          field: 'landValue',
          value: landValue,
          message: 'Land value exceeds expected range',
          severity: Severity.WARNING
        });
      }
    }
    
    // Check improvement value range
    if (data.improvementValue !== undefined && data.improvementValue !== null) {
      const improvementValue = parseFloat(data.improvementValue);
      if (improvementValue < 0) {
        issues.push({
          ruleId: 'property-value-range',
          field: 'improvementValue',
          value: improvementValue,
          message: 'Improvement value cannot be negative',
          severity: Severity.ERROR
        });
      } else if (improvementValue > 15000000) {
        issues.push({
          ruleId: 'property-value-range',
          field: 'improvementValue',
          value: improvementValue,
          message: 'Improvement value exceeds expected range',
          severity: Severity.WARNING
        });
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
);

// Basic improvement validation rules
const requiredImprovementFieldsRule: Rule = createRule(
  'improvement-required-fields',
  'All required improvement fields must be present',
  RuleType.IMPROVEMENT,
  Severity.ERROR,
  (data: any) => {
    const issues = [];
    
    // Check for required fields
    if (!data.propId && !data.property_id) {
      issues.push({
        ruleId: 'improvement-required-fields',
        field: 'property_id',
        message: 'Property ID is required for improvements',
        severity: Severity.ERROR
      });
    }
    
    if (!data.improvementId && !data.improvement_id && !data.id) {
      issues.push({
        ruleId: 'improvement-required-fields',
        field: 'improvement_id',
        message: 'Improvement ID is required',
        severity: Severity.ERROR
      });
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
);

// Collect all property-related rules
export const allPropertyRules: Rule[] = [
  requiredPropertyFieldsRule,
  propertyValueRangeRule,
  requiredImprovementFieldsRule
];

/**
 * Validate a property record
 * 
 * @param property Property record to validate
 * @param context Optional validation context
 * @returns Validation results
 */
export function validateProperty(
  property: Record<string, any>,
  context?: ValidationContext
): ValidationResult {
  const issues = [];
  
  // Apply each rule in sequence
  for (const rule of allPropertyRules) {
    if (rule.type === RuleType.PROPERTY) {
      const result = rule.validate(property, context);
      if (!result.valid) {
        issues.push(...result.issues);
      }
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Validate an improvement record
 * 
 * @param improvement Improvement record to validate
 * @param context Optional validation context
 * @returns Validation results
 */
export function validateImprovement(
  improvement: Record<string, any>,
  context?: ValidationContext
): ValidationResult {
  const issues = [];
  
  // Apply each rule in sequence
  for (const rule of allPropertyRules) {
    if (rule.type === RuleType.IMPROVEMENT) {
      const result = rule.validate(improvement, context);
      if (!result.valid) {
        issues.push(...result.issues);
      }
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}