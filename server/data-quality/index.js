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
  ValidationContext
} from './framework.js';

import { 
  allPropertyRules,
  validateProperty,
  validateImprovement 
} from './property-rules.js';

import costMatrixRules from './cost-matrix-rules.js';

// Export the framework components
export {
  RuleType,
  Severity,
  ValidationContext,
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
export const globalValidator = new DataQualityValidator([...allPropertyRules, ...costMatrixRules]);

// Main data quality framework export
export const dataQualityFramework = {
  validateBatch: (type, records, context) => {
    return globalValidator.validateBatch(type, records, context);
  },
  
  validate: (data, type, context) => {
    return globalValidator.validate(data, type, context);
  },
  
  generateStatisticalProfile: (type, records) => {
    // Simple statistical profile implementation
    const numericProfiles = {};
    const categoricalProfiles = {};
    const outliers = [];
    
    // Get a sample record to determine fields
    if (records.length === 0) {
      return { numericProfiles, categoricalProfiles, outliers };
    }
    
    const sampleRecord = records[0];
    
    // Identify numeric and categorical fields
    for (const field in sampleRecord) {
      const value = sampleRecord[field];
      
      if (typeof value === 'number' || !isNaN(parseFloat(value))) {
        // Initialize numeric profile
        numericProfiles[field] = {
          min: Infinity,
          max: -Infinity,
          sum: 0,
          count: 0,
          nullCount: 0,
          values: []
        };
      } else if (typeof value === 'string') {
        // Initialize categorical profile
        categoricalProfiles[field] = {
          valueCount: {},
          uniqueCount: 0,
          nullCount: 0,
          topValues: []
        };
      }
    }
    
    // Process all records
    for (const record of records) {
      for (const field in record) {
        const value = record[field];
        
        // Process numeric fields
        if (numericProfiles[field]) {
          if (value === null || value === undefined || value === '') {
            numericProfiles[field].nullCount++;
          } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              numericProfiles[field].min = Math.min(numericProfiles[field].min, numValue);
              numericProfiles[field].max = Math.max(numericProfiles[field].max, numValue);
              numericProfiles[field].sum += numValue;
              numericProfiles[field].count++;
              numericProfiles[field].values.push(numValue);
            }
          }
        }
        
        // Process categorical fields
        if (categoricalProfiles[field]) {
          if (value === null || value === undefined || value === '') {
            categoricalProfiles[field].nullCount++;
          } else {
            const strValue = String(value);
            if (!categoricalProfiles[field].valueCount[strValue]) {
              categoricalProfiles[field].valueCount[strValue] = 0;
              categoricalProfiles[field].uniqueCount++;
            }
            categoricalProfiles[field].valueCount[strValue]++;
          }
        }
      }
    }
    
    // Calculate statistics for numeric fields
    for (const field in numericProfiles) {
      const profile = numericProfiles[field];
      
      if (profile.count > 0) {
        // Calculate mean
        profile.mean = profile.sum / profile.count;
        
        // Calculate median
        const sortedValues = [...profile.values].sort((a, b) => a - b);
        const mid = Math.floor(sortedValues.length / 2);
        profile.median = sortedValues.length % 2 === 0
          ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
          : sortedValues[mid];
        
        // Calculate standard deviation
        let sumSquaredDiff = 0;
        for (const value of profile.values) {
          sumSquaredDiff += Math.pow(value - profile.mean, 2);
        }
        profile.stdDev = Math.sqrt(sumSquaredDiff / profile.count);
        
        // Identify outliers
        const threshold = profile.stdDev * 3;
        for (let i = 0; i < records.length; i++) {
          const record = records[i];
          const value = parseFloat(record[field]);
          
          if (!isNaN(value) && Math.abs(value - profile.mean) > threshold) {
            outliers.push({
              recordId: record.id || i,
              field,
              value,
              expected: `${profile.mean - threshold} to ${profile.mean + threshold}`,
              stdDevs: Math.abs(value - profile.mean) / profile.stdDev
            });
          }
        }
        
        // Clean up - remove the values array
        delete profile.values;
      }
    }
    
    // Calculate top values for categorical fields
    for (const field in categoricalProfiles) {
      const profile = categoricalProfiles[field];
      
      profile.topValues = Object.entries(profile.valueCount)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Clean up - remove the full value count object
      delete profile.valueCount;
    }
    
    return {
      numericProfiles,
      categoricalProfiles,
      outliers
    };
  }
};

// Additional exports for compatibility
export const ValidationResult = {
  valid: true,
  issues: []
};

export const ValidationReport = {
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