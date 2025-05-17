/**
 * Data Quality Module Entry Point
 * 
 * This module exports all data quality related functionality 
 * for the Benton County Building Cost System.
 */

import { 
  DataQualityValidator, 
  ValidationContext,
  RuleType, 
  Severity,
  createRule,
  createZodRule,
  createBatchQualityReport
} from './framework.js';

// Import rule sets
import propertyRules from './property-rules.js';
import costMatrixRules from './cost-matrix-rules.js';

// Create a global validator with all rules
const allPropertyRules = propertyRules;
const allCostMatrixRules = costMatrixRules;

// Define validation result and report structure
const ValidationResult = {
  valid: false,
  issues: []
};

const ValidationReport = {
  timestamp: new Date(),
  entityType: '',
  summary: {
    totalRecords: 0,
    passedRecords: 0,
    failedRecords: 0,
    passRate: 0
  },
  issues: [],
  recordResults: {}
};

// Create global validator with all rules
const globalValidator = new DataQualityValidator([...allPropertyRules, ...allCostMatrixRules]);

// Data quality framework API
const dataQualityFramework = {
  validateBatch: (type, records, context) => {
    return globalValidator.validateBatch(type, records, context || new ValidationContext(1, 'batch_' + Date.now(), 0, null));
  },
  
  validate: (data, type, context) => {
    return globalValidator.validate(data, type, context || new ValidationContext(1, 'single_' + Date.now(), 0, null));
  },
  
  generateStatisticalProfile: (type, records) => {
    // Implementation for statistical profiling of data
    const profile = {
      recordCount: records.length,
      fieldsAnalyzed: {},
      nullRates: {},
      valueDistributions: {},
      outliers: [],
      summary: {
        dataQuality: 'Unknown',
        completeness: 0,
        consistency: 0,
        uniqueness: 0
      }
    };
    
    // Simple profiling implementation
    if (records.length > 0) {
      const sampleRecord = records[0];
      const fields = Object.keys(sampleRecord);
      
      // Analyze each field
      fields.forEach(field => {
        let nullCount = 0;
        const values = new Set();
        
        records.forEach(record => {
          const value = record[field];
          if (value === null || value === undefined || value === '') {
            nullCount++;
          } else {
            values.add(String(value));
          }
        });
        
        const nullRate = nullCount / records.length;
        profile.nullRates[field] = nullRate;
        profile.fieldsAnalyzed[field] = {
          uniqueValues: values.size,
          nullRate: nullRate,
          fillRate: 1 - nullRate
        };
      });
      
      // Calculate overall quality metrics
      const avgCompleteness = Object.values(profile.nullRates).reduce((sum, rate) => sum + (1 - rate), 0) / fields.length;
      profile.summary.completeness = avgCompleteness;
      profile.summary.dataQuality = avgCompleteness > 0.9 ? 'Good' : (avgCompleteness > 0.7 ? 'Fair' : 'Poor');
    }
    
    return profile;
  }
};

// Export all components
export {
  ValidationContext,
  RuleType,
  Severity,
  createRule,
  createZodRule,
  createBatchQualityReport,
  dataQualityFramework,
  globalValidator,
  ValidationResult,
  ValidationReport
};