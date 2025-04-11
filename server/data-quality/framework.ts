/**
 * Data Quality Framework - Core Implementation
 * 
 * This module implements the data quality framework for property assessment data,
 * including validation rules, statistical profiling, and outlier detection.
 */

import { 
  ValidationRule, 
  ValidationResult, 
  RuleValidationResult,
  BatchValidationResult, 
  EntityValidationIssue,
  DataProfile,
  NumericFieldProfile,
  CategoricalFieldProfile,
  HistogramBin,
  OutlierRecord
} from './types';

/**
 * Core data quality framework service
 */
export class DataQualityFramework {
  private rules: Map<string, ValidationRule[]> = new Map();
  private statisticalProfiles: Map<string, DataProfile> = new Map();
  
  constructor() {
    // Initialize with default rules if needed
  }
  
  /**
   * Register a validation rule for a specific entity type
   */
  registerRule(entityType: string, rule: ValidationRule): void {
    if (!this.rules.has(entityType)) {
      this.rules.set(entityType, []);
    }
    
    // Check if rule with same ID already exists
    const existingRuleIndex = this.rules.get(entityType)!.findIndex(r => r.id === rule.id);
    if (existingRuleIndex >= 0) {
      // Replace existing rule
      this.rules.get(entityType)![existingRuleIndex] = rule;
    } else {
      // Add new rule
      this.rules.get(entityType)!.push(rule);
    }
  }
  
  /**
   * Validate a single entity against all registered rules for its type
   */
  async validateEntity(entityType: string, entity: any): Promise<ValidationResult> {
    const rules = this.rules.get(entityType) || [];
    
    // Apply all rules
    const ruleResults: RuleValidationResult[] = [];
    
    for (const rule of rules) {
      try {
        const result = rule.validate(entity);
        ruleResults.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ...result
        });
      } catch (error) {
        console.error(`Error in rule ${rule.id}:`, error);
        ruleResults.push({
          ruleId: rule.id,
          ruleName: rule.name,
          valid: false,
          score: 0,
          issues: [{
            code: 'rule-execution-error',
            message: `Error executing rule: ${error instanceof Error ? error.message : String(error)}`,
            severity: 'error'
          }]
        });
      }
    }
    
    // Aggregate results
    const isValid = ruleResults.every(r => r.valid);
    const avgScore = ruleResults.length > 0
      ? ruleResults.reduce((sum, r) => sum + r.score, 0) / ruleResults.length
      : 1.0;
    const allIssues = ruleResults.flatMap(r => r.issues);
    
    return {
      valid: isValid,
      qualityScore: avgScore,
      issues: allIssues,
      ruleResults
    };
  }
  
  /**
   * Validate a batch of entities
   */
  async validateBatch(entityType: string, entities: any[]): Promise<BatchValidationResult> {
    if (!entities || entities.length === 0) {
      return {
        totalProcessed: 0,
        valid: 0,
        invalid: 0,
        qualityScore: 1.0,
        issues: []
      };
    }
    
    // Validate each entity
    const results = await Promise.all(
      entities.map(entity => this.validateEntity(entityType, entity))
    );
    
    // Count valid/invalid
    const valid = results.filter(r => r.valid).length;
    const invalid = results.length - valid;
    
    // Calculate overall quality score
    const avgQualityScore = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
    
    // Extract all issues
    const allIssues: EntityValidationIssue[] = [];
    
    for (let idx = 0; idx < results.length; idx++) {
      const result = results[idx];
      const entity = entities[idx];
      
      if (result.issues.length > 0) {
        const entityIssues = result.issues.map(issue => ({
          ...issue,
          entityIndex: idx,
          entity
        }));
        
        allIssues.push(...entityIssues);
      }
    }
    
    return {
      totalProcessed: entities.length,
      valid,
      invalid,
      qualityScore: avgQualityScore,
      issues: allIssues
    };
  }
  
  /**
   * Generate statistical profile for a dataset
   */
  async generateStatisticalProfile(entityType: string, entities: any[]): Promise<DataProfile> {
    if (!entities || entities.length === 0) {
      throw new Error("Cannot generate profile for empty dataset");
    }
    
    // Identify field types
    const firstEntity = entities[0];
    const fields = Object.keys(firstEntity);
    
    const numericFields: string[] = [];
    const categoricalFields: string[] = [];
    
    // Categorize fields
    for (const field of fields) {
      const value = firstEntity[field];
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        numericFields.push(field);
      } else {
        categoricalFields.push(field);
      }
    }
    
    // Generate profiles for each field type
    const numericProfiles: Record<string, NumericFieldProfile> = {};
    for (const field of numericFields) {
      numericProfiles[field] = this.generateNumericProfile(entities, field);
    }
    
    const categoricalProfiles: Record<string, CategoricalFieldProfile> = {};
    for (const field of categoricalFields) {
      categoricalProfiles[field] = this.generateCategoricalProfile(entities, field);
    }
    
    // Detect outliers in numeric fields
    const outliers = this.detectOutliers(entities, numericProfiles);
    
    // Create profile
    const profile: DataProfile = {
      entityType,
      timestamp: new Date().toISOString(),
      recordCount: entities.length,
      numericProfiles,
      categoricalProfiles,
      outliers
    };
    
    // Store profile
    this.statisticalProfiles.set(entityType, profile);
    
    return profile;
  }
  
  /**
   * Generate statistical profile for a numeric field
   */
  private generateNumericProfile(entities: any[], fieldName: string): NumericFieldProfile {
    // Extract values, filtering out nulls and converting strings to numbers
    const values = entities
      .map(entity => {
        const val = entity[fieldName];
        if (val === null || val === undefined) return null;
        return typeof val === 'number' ? val : parseFloat(val);
      })
      .filter((val): val is number => val !== null && !isNaN(val));
    
    const nullCount = entities.length - values.length;
    
    if (values.length === 0) {
      return {
        fieldName,
        count: 0,
        nullCount,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        percentiles: {}
      };
    }
    
    // Sort values for percentile calculations
    const sortedValues = [...values].sort((a, b) => a - b);
    
    // Calculate basic statistics
    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = this.calculateMedian(sortedValues);
    
    // Calculate standard deviation
    const sumSquaredDiffs = values.reduce((sum, val) => {
      const diff = val - mean;
      return sum + (diff * diff);
    }, 0);
    const stdDev = Math.sqrt(sumSquaredDiffs / values.length);
    
    // Calculate percentiles
    const percentiles: Record<string, number> = {
      "25": this.calculatePercentile(sortedValues, 25),
      "50": median,
      "75": this.calculatePercentile(sortedValues, 75),
      "90": this.calculatePercentile(sortedValues, 90),
      "95": this.calculatePercentile(sortedValues, 95),
      "99": this.calculatePercentile(sortedValues, 99)
    };
    
    // Create histogram (10 bins)
    const histogram = this.createHistogram(values, min, max, 10);
    
    return {
      fieldName,
      count: values.length,
      nullCount,
      min,
      max,
      mean,
      median,
      stdDev,
      percentiles,
      histogram
    };
  }
  
  /**
   * Calculate median of a sorted array
   */
  private calculateMedian(sortedValues: number[]): number {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }
  
  /**
   * Calculate percentile of a sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (upper >= sortedValues.length) return sortedValues[sortedValues.length - 1];
    if (lower === upper) return sortedValues[lower];
    
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }
  
  /**
   * Create histogram with fixed number of bins
   */
  private createHistogram(values: number[], min: number, max: number, binCount: number): HistogramBin[] {
    const range = max - min;
    const binWidth = range / binCount;
    
    if (range === 0 || binWidth === 0) {
      return [{
        min,
        max,
        count: values.length
      }];
    }
    
    // Initialize bins
    const bins: HistogramBin[] = [];
    for (let i = 0; i < binCount; i++) {
      bins.push({
        min: min + (i * binWidth),
        max: min + ((i + 1) * binWidth),
        count: 0
      });
    }
    
    // Count values in each bin
    for (const value of values) {
      // Handle edge case for max value
      if (value === max) {
        bins[bins.length - 1].count++;
        continue;
      }
      
      // Find bin index
      const binIndex = Math.floor((value - min) / binWidth);
      bins[binIndex].count++;
    }
    
    return bins;
  }
  
  /**
   * Generate statistical profile for a categorical field
   */
  private generateCategoricalProfile(entities: any[], fieldName: string): CategoricalFieldProfile {
    // Extract values, filtering out nulls
    const values = entities
      .map(entity => entity[fieldName])
      .filter(val => val !== null && val !== undefined)
      .map(val => String(val));
    
    const nullCount = entities.length - values.length;
    
    // Count frequencies
    const frequencies: Record<string, number> = {};
    for (const value of values) {
      frequencies[value] = (frequencies[value] || 0) + 1;
    }
    
    // Get unique count
    const uniqueCount = Object.keys(frequencies).length;
    
    // Get top values
    const topValues = Object.entries(frequencies)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      fieldName,
      count: values.length,
      nullCount,
      uniqueCount,
      frequencies,
      topValues
    };
  }
  
  /**
   * Detect outliers in numeric fields using z-score method
   */
  private detectOutliers(entities: any[], numericProfiles: Record<string, NumericFieldProfile>): OutlierRecord[] {
    const outliers: OutlierRecord[] = [];
    const zScoreThreshold = 3.0; // Standard threshold for z-score outliers
    
    for (const [fieldName, profile] of Object.entries(numericProfiles)) {
      // Skip fields with too few values or no variation
      if (profile.count < 5 || profile.stdDev === 0) continue;
      
      // Check each entity for outliers
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const value = entity[fieldName];
        
        // Skip nulls
        if (value === null || value === undefined) continue;
        
        // Convert to number if needed
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numValue)) continue;
        
        // Calculate z-score
        const zScore = Math.abs((numValue - profile.mean) / profile.stdDev);
        
        // Check if it's an outlier
        if (zScore > zScoreThreshold) {
          outliers.push({
            entityIndex: i,
            fieldName,
            value: numValue,
            method: 'zscore',
            score: zScore
          });
        }
      }
    }
    
    return outliers;
  }
}

// Export singleton instance
export const dataQualityFramework = new DataQualityFramework();