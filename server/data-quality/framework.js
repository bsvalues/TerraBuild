/**
 * Data Quality Framework
 * 
 * This module provides the core data quality validation framework
 * for the Benton County Building Cost System.
 */

// Rule types supported by the framework
// Rule types supported by the framework
const RuleType = {
  PROPERTY: 'property',
  COST_MATRIX: 'cost_matrix',
  BATCH: 'batch',
  USER: 'user',
  IMPROVEMENT: 'improvement',
  SYSTEM: 'system'
};

// Severity levels for validation issues
const Severity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

// Export the constants
export { RuleType, Severity };

/**
 * Validation context containing additional information for validation rules
 */
// Validation context class that contains additional information for validation rules
class ValidationContext {
  constructor(userId, batchId, recordIndex, parentRecordId) {
    this.userId = userId;
    this.batchId = batchId;
    this.recordIndex = recordIndex;
    this.parentRecordId = parentRecordId;
    this.additionalContext = {};
    this.timestamp = new Date();
  }
  
  addContext(key, value) {
    this.additionalContext[key] = value;
    return this;
  }
  
  getContext(key) {
    return this.additionalContext[key];
  }
}

// Export ValidationContext class
export { ValidationContext };

/**
 * Create a validation rule
 * @param {string} id - Unique identifier for the rule
 * @param {string} description - Human-readable description
 * @param {string} type - Rule type from RuleType enum
 * @param {string} severity - Severity level from Severity enum
 * @param {Function} validateFn - Function that performs validation
 * @returns {Object} Rule object
 */
/**
 * Create a validation rule
 * @param {string} id - Unique identifier for the rule
 * @param {string} description - Human-readable description
 * @param {string} type - Rule type from RuleType enum
 * @param {string} severity - Severity level from Severity enum
 * @param {Function} validateFn - Function that performs validation
 * @returns {Object} Rule object
 */
function createRule(id, description, type, severity, validateFn) {
  return {
    id,
    description,
    type,
    severity,
    validate: validateFn
  };
}

/**
 * Create a validation rule using Zod schema
 * @param {string} id - Unique identifier for the rule
 * @param {string} description - Human-readable description
 * @param {string} type - Rule type from RuleType enum
 * @param {string} severity - Severity level from Severity enum
 * @param {Object} schema - Zod schema for validation
 * @param {Function} errorMap - Optional error mapping function
 * @returns {Object} Rule object
 */
function createZodRule(id, description, type, severity, schema, errorMap) {
  return createRule(id, description, type, severity, (data) => {
    try {
      schema.parse(data);
      return { valid: true, issues: [] };
    } catch (error) {
      const issues = error.errors.map(err => ({
        rule: id,
        message: err.message,
        severity: severity,
        path: err.path.join('.')
      }));
      
      return {
        valid: false,
        issues
      };
    }
  });
}

/**
 * Data quality validator class for applying rules
 */
class DataQualityValidator {
  constructor(rules = []) {
    this.rules = new Map();
    
    // Register initial rules
    rules.forEach(rule => {
      this.registerRule(rule);
    });
  }
  
  /**
   * Register a single validation rule
   * @param {Object} rule - Validation rule to register
   */
  registerRule(rule) {
    const key = `${rule.type}:${rule.id}`;
    this.rules.set(key, rule);
  }
  
  /**
   * Register multiple validation rules
   * @param {Array} rules - Array of validation rules
   */
  registerRules(rules) {
    rules.forEach(rule => this.registerRule(rule));
  }
  
  /**
   * Validate a single data record
   * @param {Object} data - Data record to validate
   * @param {string} type - Record type from RuleType enum
   * @param {ValidationContext} context - Optional validation context
   * @returns {Object} Validation result
   */
  validate(data, type = RuleType.PROPERTY, context) {
    // Get applicable rules for the given type
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.type === type);
    
    if (applicableRules.length === 0) {
      return { valid: true, issues: [] };
    }
    
    // Apply each rule
    const issues = [];
    
    for (const rule of applicableRules) {
      try {
        const result = rule.validate(data, context);
        
        if (!result.valid && result.issues && result.issues.length > 0) {
          issues.push(...result.issues);
        }
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error);
        issues.push({
          rule: rule.id,
          message: `Rule application error: ${error.message}`,
          severity: Severity.ERROR,
          path: 'rule_execution'
        });
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Validate a batch of records
   * @param {string} type - Record type from RuleType enum
   * @param {Array} records - Array of records to validate
   * @param {ValidationContext} context - Optional validation context
   * @returns {Object} Batch validation report
   */
  validateBatch(type, records, context) {
    return createBatchQualityReport(records, this, type, context);
  }
}

/**
 * Create a batch quality report
 * @param {Array} records - Array of records to validate
 * @param {DataQualityValidator} validator - Validator to use
 * @param {string} type - Record type from RuleType enum
 * @param {ValidationContext} context - Validation context
 * @returns {Object} Batch validation report
 */
function createBatchQualityReport(records, validator, type, context) {
  if (!Array.isArray(records)) {
    throw new Error('Records must be an array');
  }
  
  const recordResults = {};
  const allIssues = [];
  let passedCount = 0;
  let failedCount = 0;
  
  // Validate each record
  records.forEach((record, index) => {
    // Create a new context with the current record index
    const recordContext = context ? 
      new ValidationContext(
        context.userId, 
        context.batchId, 
        index, 
        context.parentRecordId
      ) : 
      new ValidationContext(null, null, index, null);
    
    // Add any additional context
    if (context && context.additionalContext) {
      Object.entries(context.additionalContext).forEach(([key, value]) => {
        recordContext.addContext(key, value);
      });
    }
    
    // Validate the record
    const result = validator.validate(record, type, recordContext);
    
    // Store the result
    const recordId = record.id || `record_${index}`;
    recordResults[recordId] = result;
    
    // Update counters
    if (result.valid) {
      passedCount++;
    } else {
      failedCount++;
      allIssues.push(...result.issues.map(issue => ({
        ...issue,
        recordId,
        recordIndex: index
      })));
    }
  });
  
  // Create the report
  return {
    timestamp: new Date(),
    entityType: type,
    batchId: context ? context.batchId : null,
    userId: context ? context.userId : null,
    summary: {
      totalRecords: records.length,
      passedRecords: passedCount,
      failedRecords: failedCount,
      passRate: records.length > 0 ? (passedCount / records.length) : 1
    },
    issues: allIssues,
    recordResults
  };
}