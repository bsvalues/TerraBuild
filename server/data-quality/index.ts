/**
 * Data Quality Module Entry Point
 * 
 * This module exports all data quality related functionality 
 * for the Benton County Building Cost System.
 */

import { 
  RuleType, 
  Severity, 
  DataQualityValidator,
  createRule,
  createZodRule,
  createBatchQualityReport,
  ValidationReport
} from './framework';
import type { Rule, ValidationContext, ValidationResult } from './framework';

import { 
  allPropertyRules,
  validateProperty,
  validateImprovement 
} from './property-rules';

import costMatrixRules from './cost-matrix-rules';

// Export the framework components
export {
  Rule,
  RuleType,
  Severity,
  ValidationContext,
  ValidationResult,
  ValidationReport,
  DataQualityValidator,
  createRule,
  createZodRule,
  createBatchQualityReport
};

// Export rule sets
export {
  allPropertyRules,
  validateProperty,
  validateImprovement
};

// Export cost matrix rules
export { costMatrixRules };

// Create a global validator instance with all rules
const allRules = [...allPropertyRules, ...costMatrixRules];
export const globalValidator = new DataQualityValidator(allRules);

/**
 * Validate a cost matrix entry
 * 
 * @param matrix Cost matrix entry to validate
 * @param context Optional validation context 
 * @returns Validation results
 */
export function validateCostMatrix(
  matrix: Record<string, any>,
  context?: ValidationContext
): ValidationResult {
  return globalValidator.validate(matrix, RuleType.COST_MATRIX, context);
}

/**
 * Initialize the data quality framework
 * 
 * @returns Initialized data quality validator
 */
export function initializeDataQualityFramework(): DataQualityValidator {
  console.log('Initializing data quality framework...');
  
  const validator = new DataQualityValidator();
  
  // Register all property rules
  validator.registerRules(allPropertyRules);
  
  // Register all cost matrix rules
  validator.registerRules(costMatrixRules);
  
  const totalRules = allPropertyRules.length + costMatrixRules.length;
  console.log(`Data quality framework initialized with ${totalRules} rules`);
  console.log(`- Property rules: ${allPropertyRules.length}`);
  console.log(`- Cost matrix rules: ${costMatrixRules.length}`);
  
  return validator;
}