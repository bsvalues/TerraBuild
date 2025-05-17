/**
 * Cost Matrix Data Quality Rules
 * 
 * This module provides data quality validation rules for cost matrix data
 * in the Benton County Building Cost System.
 */

import { 
  Rule, 
  RuleType, 
  Severity, 
  createRule 
} from './framework';

// Basic required fields validation rule
const requiredFieldsRule: Rule = createRule(
  'cost-matrix-required-fields',
  'All required cost matrix fields must be present',
  RuleType.COST_MATRIX,
  Severity.ERROR,
  (data: any) => {
    const issues = [];
    
    // Check for required fields
    if (!data.building_type && !data.buildingType) {
      issues.push({
        ruleId: 'cost-matrix-required-fields',
        field: 'building_type',
        message: 'Building type is required',
        severity: Severity.ERROR
      });
    }
    
    if (!data.region) {
      issues.push({
        ruleId: 'cost-matrix-required-fields',
        field: 'region',
        message: 'Region is required',
        severity: Severity.ERROR
      });
    }
    
    if (!data.base_cost && !data.baseCost && !data.baseRate) {
      issues.push({
        ruleId: 'cost-matrix-required-fields',
        field: 'base_cost',
        message: 'Base cost/rate is required',
        severity: Severity.ERROR
      });
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
);

// Value range validation rule
const valueRangeRule: Rule = createRule(
  'cost-matrix-value-range',
  'Cost matrix values must be within reasonable ranges',
  RuleType.COST_MATRIX,
  Severity.WARNING,
  (data: any) => {
    const issues = [];
    
    // Check base cost range
    const baseCost = data.base_cost || data.baseCost || data.baseRate || 0;
    if (baseCost < 0) {
      issues.push({
        ruleId: 'cost-matrix-value-range',
        field: 'base_cost',
        value: baseCost,
        message: 'Base cost cannot be negative',
        severity: Severity.ERROR
      });
    } else if (baseCost > 1000) {
      issues.push({
        ruleId: 'cost-matrix-value-range',
        field: 'base_cost',
        value: baseCost,
        message: 'Base cost exceeds expected range',
        severity: Severity.WARNING
      });
    }
    
    // Check matrix year (if present)
    const year = data.matrix_year || data.year || null;
    if (year !== null) {
      if (year < 1970 || year > new Date().getFullYear() + 5) {
        issues.push({
          ruleId: 'cost-matrix-value-range',
          field: 'matrix_year',
          value: year,
          message: 'Matrix year outside expected range',
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

// Collect all cost matrix rules
const costMatrixRules: Rule[] = [
  requiredFieldsRule,
  valueRangeRule
];

export default costMatrixRules;