/**
 * Data Quality Framework for Benton County Building Cost System
 * 
 * This module defines the core framework for data quality validation,
 * including the Rule interface, ValidationContext, and ValidationResult structures.
 */

import { z } from 'zod';

export enum RuleType {
  PROPERTY = 'property',
  IMPROVEMENT = 'improvement',
  LAND_DETAIL = 'land_detail',
  IMPROVEMENT_DETAIL = 'improvement_detail',
  IMPROVEMENT_ITEM = 'improvement_item',
  COST_MATRIX = 'cost_matrix',
  GENERAL = 'general'
}

export enum Severity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  severity: Severity;
  validate: (value: any, context: ValidationContext) => ValidationResult;
}

export interface ValidationContext {
  relatedData?: Record<string, any>;
  options?: Record<string, any>;
}

export interface ValidationResult {
  passed: boolean;
  message?: string;
  details?: any;
}

export class ValidationReport {
  rules: Rule[] = [];
  results: Map<string, ValidationResult> = new Map();
  timestamp: Date = new Date();
  
  constructor(public entityType: RuleType) {}
  
  addResult(rule: Rule, result: ValidationResult): void {
    this.rules.push(rule);
    this.results.set(rule.id, result);
  }
  
  get passed(): boolean {
    return Array.from(this.results.values()).every(result => result.passed);
  }
  
  get criticalErrorCount(): number {
    return this.rules.filter(rule => 
      rule.severity === Severity.CRITICAL && 
      !this.results.get(rule.id)?.passed
    ).length;
  }
  
  get errorCount(): number {
    return this.rules.filter(rule => 
      rule.severity === Severity.ERROR && 
      !this.results.get(rule.id)?.passed
    ).length;
  }
  
  get warningCount(): number {
    return this.rules.filter(rule => 
      rule.severity === Severity.WARNING && 
      !this.results.get(rule.id)?.passed
    ).length;
  }
  
  get infoCount(): number {
    return this.rules.filter(rule => 
      rule.severity === Severity.INFO && 
      !this.results.get(rule.id)?.passed
    ).length;
  }
  
  toJSON(): any {
    return {
      entityType: this.entityType,
      passed: this.passed,
      timestamp: this.timestamp,
      summary: {
        total: this.rules.length,
        passed: this.rules.filter(rule => this.results.get(rule.id)?.passed).length,
        failed: this.rules.filter(rule => !this.results.get(rule.id)?.passed).length,
        criticalErrors: this.criticalErrorCount,
        errors: this.errorCount,
        warnings: this.warningCount,
        info: this.infoCount
      },
      details: this.rules.map(rule => {
        const ruleResult = this.results.get(rule.id);
        return {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          severity: rule.severity,
          passed: ruleResult?.passed,
          message: ruleResult?.message,
          details: ruleResult?.details
        };
      })
    };
  }
}

export class DataQualityValidator {
  private rules: Map<RuleType, Rule[]> = new Map();
  
  constructor(rules: Rule[] = []) {
    this.registerRules(rules);
  }
  
  registerRule(rule: Rule): void {
    if (!this.rules.has(rule.type)) {
      this.rules.set(rule.type, []);
    }
    this.rules.get(rule.type)?.push(rule);
  }
  
  registerRules(rules: Rule[]): void {
    rules.forEach(rule => this.registerRule(rule));
  }
  
  validate(data: any, type: RuleType, context: ValidationContext = {}): ValidationReport {
    const report = new ValidationReport(type);
    const rules = this.rules.get(type) || [];
    
    for (const rule of rules) {
      try {
        const result = rule.validate(data, context);
        report.addResult(rule, result);
      } catch (error) {
        console.error(`Error validating rule ${rule.id} - ${rule.name}:`, error);
        report.addResult(rule, {
          passed: false,
          message: `Validation failed with error: ${(error as Error).message}`,
          details: error
        });
      }
    }
    
    return report;
  }
  
  validateBatch(dataArray: any[], type: RuleType, context: ValidationContext = {}): ValidationReport[] {
    return dataArray.map(data => this.validate(data, type, context));
  }
}

// Helper functions for creating rules
export function createRule(
  id: string,
  name: string,
  description: string,
  type: RuleType,
  severity: Severity,
  validateFn: (value: any, context: ValidationContext) => ValidationResult
): Rule {
  return {
    id,
    name,
    description,
    type,
    severity,
    validate: validateFn
  };
}

export function createZodRule(
  id: string,
  name: string,
  description: string,
  type: RuleType,
  severity: Severity,
  schema: z.ZodType<any>
): Rule {
  return createRule(
    id,
    name,
    description,
    type,
    severity,
    (value) => {
      const result = schema.safeParse(value);
      return {
        passed: result.success,
        message: result.success ? 'Validation passed' : 'Validation failed',
        details: result.success ? undefined : result.error.format()
      };
    }
  );
}

/**
 * Create a data quality report for a batch of records
 * 
 * @param records Array of records to validate
 * @param validator DataQualityValidator instance
 * @param type RuleType to apply
 * @param context Optional validation context
 * @returns Summary report with statistics
 */
export function createBatchQualityReport(
  records: any[],
  validator: DataQualityValidator,
  type: RuleType,
  context: ValidationContext = {}
): any {
  const reports = validator.validateBatch(records, type, context);
  
  const totalRecords = records.length;
  const passedRecords = reports.filter(r => r.passed).length;
  
  const criticalErrors = reports.reduce((sum, r) => sum + r.criticalErrorCount, 0);
  const errors = reports.reduce((sum, r) => sum + r.errorCount, 0);
  const warnings = reports.reduce((sum, r) => sum + r.warningCount, 0);
  const infoCount = reports.reduce((sum, r) => sum + r.infoCount, 0);
  
  // Aggregate results by rule ID
  const ruleStats: Record<string, { total: number, passed: number, failed: number }> = {};
  
  reports.forEach(report => {
    report.rules.forEach(rule => {
      if (!ruleStats[rule.id]) {
        ruleStats[rule.id] = { total: 0, passed: 0, failed: 0 };
      }
      
      ruleStats[rule.id].total++;
      
      if (report.results.get(rule.id)?.passed) {
        ruleStats[rule.id].passed++;
      } else {
        ruleStats[rule.id].failed++;
      }
    });
  });
  
  return {
    timestamp: new Date(),
    entityType: type,
    summary: {
      totalRecords,
      passedRecords,
      failedRecords: totalRecords - passedRecords,
      passRate: totalRecords > 0 ? (passedRecords / totalRecords) * 100 : 0,
      criticalErrors,
      errors,
      warnings,
      infoMessages: infoCount
    },
    ruleStats: Object.entries(ruleStats).map(([ruleId, stats]) => ({
      ruleId,
      total: stats.total,
      passed: stats.passed,
      failed: stats.failed,
      passRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0
    })),
    // Include only failed records in the detailed results to keep the report size manageable
    details: reports
      .filter(r => !r.passed)
      .map((r, i) => ({
        recordIndex: i,
        passed: r.passed,
        criticalErrors: r.criticalErrorCount,
        errors: r.errorCount,
        warnings: r.warningCount,
        infoMessages: r.infoCount,
        rules: r.rules
          .filter(rule => !r.results.get(rule.id)?.passed)
          .map(rule => ({
            id: rule.id,
            name: rule.name,
            severity: rule.severity,
            message: r.results.get(rule.id)?.message,
            details: r.results.get(rule.id)?.details
          }))
      }))
  };
}