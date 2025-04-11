/**
 * Data Quality Framework - Type Definitions
 * 
 * This file defines the core types used by the data quality framework
 * for validating property assessment data in compliance with Washington State requirements.
 */

// Severity levels for validation issues
export type SeverityLevel = 'info' | 'warning' | 'error' | 'critical';

// A validation issue identified during data quality checks
export interface ValidationIssue {
  code: string;          // Unique issue code (e.g., 'missing-required-field')
  message: string;       // Human-readable description
  severity: SeverityLevel; // Severity level
  fields?: string[];     // Affected fields (if applicable)
  context?: any;         // Additional context information
}

// Result of validating a single entity
export interface ValidationResult {
  valid: boolean;        // Whether the entity passed all validation rules
  qualityScore: number;  // Quality score between 0.0 and 1.0
  issues: ValidationIssue[]; // List of issues found
  ruleResults: RuleValidationResult[]; // Results from individual rules
}

// Result from a single validation rule
export interface RuleValidationResult {
  ruleId: string;        // ID of the rule
  ruleName: string;      // Name of the rule
  valid: boolean;        // Whether this rule passed
  score: number;         // Score between 0.0 and 1.0
  issues: ValidationIssue[]; // Issues identified by this rule
}

// Result of validating a batch of entities
export interface BatchValidationResult {
  totalProcessed: number; // Total number of records processed
  valid: number;         // Number of valid records
  invalid: number;       // Number of invalid records
  qualityScore: number;  // Overall quality score
  issues: EntityValidationIssue[]; // All issues found
}

// Extension of ValidationIssue with entity information
export interface EntityValidationIssue extends ValidationIssue {
  entityIndex: number;   // Index of entity in the batch
  entity: any;           // Reference to the entity with the issue
}

// A validation rule definition
export interface ValidationRule {
  id: string;            // Unique rule ID
  name: string;          // Human-readable name
  description: string;   // Description of what this rule validates
  validate: (entity: any) => RuleValidationResult; // Validation function
}

// Statistical profile of a dataset
export interface DataProfile {
  entityType: string;    // Type of entity profiled
  timestamp: string;     // When profile was generated
  recordCount: number;   // Number of records profiled
  numericProfiles: Record<string, NumericFieldProfile>; // Stats for numeric fields
  categoricalProfiles: Record<string, CategoricalFieldProfile>; // Stats for categorical fields
  correlationMatrix?: Record<string, Record<string, number>>; // Correlations between fields
  outliers: OutlierRecord[]; // Detected outliers
}

// Statistical profile for a numeric field
export interface NumericFieldProfile {
  fieldName: string;     // Name of the field
  count: number;         // Number of non-null values
  nullCount: number;     // Number of null values
  min: number;           // Minimum value
  max: number;           // Maximum value
  mean: number;          // Average value
  median: number;        // Median value
  stdDev: number;        // Standard deviation
  percentiles: Record<string, number>; // Percentile values (e.g., "25": 100, "75": 300)
  histogram?: HistogramBin[]; // Value distribution histogram
}

// Statistical profile for a categorical field
export interface CategoricalFieldProfile {
  fieldName: string;     // Name of the field
  count: number;         // Number of non-null values
  nullCount: number;     // Number of null values
  uniqueCount: number;   // Number of unique values
  frequencies: Record<string, number>; // Value frequencies
  topValues: {value: string, count: number}[]; // Most common values
}

// Histogram bin for numeric field distributions
export interface HistogramBin {
  min: number;           // Minimum value in bin
  max: number;           // Maximum value in bin
  count: number;         // Number of values in bin
}

// Record of an outlier detected in the data
export interface OutlierRecord {
  entityIndex: number;   // Index of entity in dataset
  fieldName: string;     // Field with outlier value
  value: any;            // The outlier value
  method: string;        // Method used to detect (e.g., "zscore", "iqr")
  score: number;         // Outlier score or distance
}