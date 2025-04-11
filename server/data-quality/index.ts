/**
 * Data Quality Module Entry Point
 * 
 * This module exports all data quality related functionality 
 * for the Benton County Building Cost System.
 */

import { 
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
} from './framework';

import { 
  allPropertyRules,
  validateProperty,
  validateImprovement 
} from './property-rules';

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

// Create a global validator instance with all rules
export const globalValidator = new DataQualityValidator(allPropertyRules);

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
  
  console.log(`Data quality framework initialized with ${allPropertyRules.length} rules`);
  
  return validator;
}