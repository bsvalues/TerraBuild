/**
 * Data Quality Framework
 * 
 * This module provides the core data quality validation framework
 * for the Benton County Building Cost System.
 */

export enum RuleType {
  PROPERTY = 'property',
  IMPROVEMENT = 'improvement',
  IMPROVEMENT_DETAIL = 'improvementDetail',
  IMPROVEMENT_ITEM = 'improvementItem',
  LAND_DETAIL = 'landDetail',
  COST_MATRIX = 'costMatrix',
  REGION = 'region',
  BUILDING_TYPE = 'buildingType'
}

export enum Severity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface Rule {
  id: string;
  description: string;
  type: RuleType;
  severity: Severity;
  validate: (data: any, context?: ValidationContext) => ValidationResult;
}

export interface ValidationContext {
  userId?: number;
  batchId?: string;
  recordIndex?: number;
  parentRecordId?: string | number;
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  ruleId: string;
  message: string;
  severity: Severity;
  code?: string;
  field?: string;
  value?: any;
  context?: Record<string, any>;
}

export interface ValidationReport {
  timestamp: Date;
  entityType: RuleType;
  summary: {
    totalRecords: number;
    passedRecords: number;
    failedRecords: number;
    passRate: number;
  };
  issues: ValidationIssue[];
  recordResults?: Record<string, ValidationResult>;
}

export function createRule(
  id: string,
  description: string,
  type: RuleType,
  severity: Severity,
  validate: (data: any, context?: ValidationContext) => ValidationResult
): Rule {
  return {
    id,
    description,
    type,
    severity,
    validate
  };
}

export function createZodRule(
  id: string,
  description: string,
  type: RuleType,
  severity: Severity,
  schema: any,
  errorMap?: (issue: any) => ValidationIssue
): Rule {
  return createRule(
    id,
    description,
    type,
    severity,
    (data: any) => {
      try {
        schema.parse(data);
        return { valid: true, issues: [] };
      } catch (error: any) {
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
  private rules: Rule[] = [];
  
  constructor(rules: Rule[] = []) {
    this.rules = [...rules];
  }
  
  registerRule(rule: Rule): void {
    this.rules.push(rule);
  }
  
  registerRules(rules: Rule[]): void {
    this.rules.push(...rules);
  }
  
  validate(
    data: any,
    type: RuleType = RuleType.PROPERTY,
    context?: ValidationContext
  ): ValidationResult {
    const applicableRules = this.rules.filter(rule => rule.type === type);
    const issues: ValidationIssue[] = [];
    
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
  
  validateBatch(
    type: RuleType,
    records: any[],
    context?: ValidationContext
  ): ValidationReport {
    const startTime = Date.now();
    const results: Record<string, ValidationResult> = {};
    const allIssues: ValidationIssue[] = [];
    
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

export function createBatchQualityReport(
  records: any[],
  validator: DataQualityValidator,
  type: RuleType,
  context?: ValidationContext
): ValidationReport {
  return validator.validateBatch(type, records, context);
}