/**
 * Data Quality Framework
 * 
 * This module provides the core data quality validation framework
 * for the Benton County Building Cost System.
 */

export const RuleType = {
  PROPERTY: 'property',
  IMPROVEMENT: 'improvement',
  IMPROVEMENT_DETAIL: 'improvementDetail',
  IMPROVEMENT_ITEM: 'improvementItem',
  LAND_DETAIL: 'landDetail',
  COST_MATRIX: 'costMatrix',
  REGION: 'region',
  BUILDING_TYPE: 'buildingType'
};

export const Severity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Validation context containing additional information for validation rules
 */
export class ValidationContext {
  constructor(userId, batchId, recordIndex, parentRecordId) {
    this.userId = userId;
    this.batchId = batchId;
    this.recordIndex = recordIndex;
    this.parentRecordId = parentRecordId;
    this.additionalContext = {};
  }
  
  addContext(key, value) {
    this.additionalContext[key] = value;
    return this;
  }
  
  getContext(key) {
    return this.additionalContext[key];
  }
}

export function createRule(id, description, type, severity, validateFn) {
  return {
    id,
    description,
    type,
    severity,
    validate: validateFn
  };
}

export function createZodRule(id, description, type, severity, schema, errorMap) {
  return createRule(
    id,
    description,
    type,
    severity,
    (data, context) => {
      try {
        schema.parse(data);
        return { valid: true, issues: [] };
      } catch (error) {
        if (errorMap) {
          const issues = error.errors.map(errorMap);
          return { valid: false, issues };
        }
        
        return {
          valid: false,
          issues: [{
            ruleId: id,
            message: error.message || 'Validation failed',
            severity,
            code: 'SCHEMA_VALIDATION_FAILED'
          }]
        };
      }
    }
  );
}

export class DataQualityValidator {
  constructor(rules = []) {
    this.rules = [...rules];
  }
  
  registerRule(rule) {
    this.rules.push(rule);
  }
  
  registerRules(rules) {
    this.rules.push(...rules);
  }
  
  validate(data, type = RuleType.PROPERTY, context) {
    const applicableRules = this.rules.filter(rule => rule.type === type);
    const issues = [];
    
    for (const rule of applicableRules) {
      const result = rule.validate(data, context);
      if (!result.valid) {
        issues.push(...result.issues);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  validateBatch(type, records, context) {
    const startTime = Date.now();
    const results = {};
    const allIssues = [];
    
    let passedCount = 0;
    let failedCount = 0;
    
    records.forEach((record, index) => {
      const recordContext = {
        ...context,
        recordIndex: index,
        recordId: record.id || index
      };
      
      const result = this.validate(record, type, recordContext);
      const recordId = record.id || `record_${index}`;
      
      results[recordId] = result;
      
      if (result.valid) {
        passedCount++;
      } else {
        failedCount++;
        allIssues.push(...result.issues);
      }
    });
    
    return {
      timestamp: new Date(),
      entityType: type,
      summary: {
        totalRecords: records.length,
        passedRecords: passedCount,
        failedRecords: failedCount,
        passRate: records.length > 0 ? (passedCount / records.length) * 100 : 0
      },
      issues: allIssues,
      recordResults: results
    };
  }
}

export function createBatchQualityReport(records, validator, type, context) {
  return validator.validateBatch(type, records, context);
}