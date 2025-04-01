/**
 * Statistics Utilities
 * 
 * This module contains statistical analysis functions for cost data
 * including outlier detection, correlation analysis, and data quality checks.
 */

/**
 * Interface for outlier detection results
 */
interface OutlierResult {
  outliers: number[];
  zScores: number[];
  threshold: number;
  error?: string;
}

/**
 * Detects outliers in a dataset using z-score method
 * 
 * @param data Array of numeric values
 * @param threshold Z-score threshold (default: 3.0)
 * @returns Object containing outliers and related information
 */
export function detectOutliers(data: number[], threshold: number = 3.0): OutlierResult {
  // Handle empty dataset
  if (!data.length) {
    return {
      outliers: [],
      zScores: [],
      threshold,
      error: 'Insufficient data'
    };
  }

  // Calculate mean
  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
  
  // Calculate standard deviation
  const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  // Handle cases where standard deviation is zero (all values are the same)
  if (stdDev === 0) {
    return {
      outliers: [],
      zScores: data.map(() => 0),
      threshold
    };
  }
  
  // Calculate z-scores and identify outliers
  const zScores = data.map(value => Math.abs((value - mean) / stdDev));
  const outliers = data.filter((value, index) => zScores[index] > threshold);
  
  return {
    outliers,
    zScores,
    threshold
  };
}

/**
 * Calculates Pearson correlation coefficient between two arrays of values
 * 
 * @param x First array of values
 * @param y Second array of values
 * @returns Correlation coefficient between -1 and 1
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  // Check array lengths match
  if (x.length !== y.length) {
    throw new Error('Arrays must have the same length');
  }
  
  // Need at least 2 data points
  if (x.length < 2) {
    throw new Error('At least 2 data points are required');
  }
  
  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
  
  // Calculate sums for correlation formula
  let numerator = 0;
  let denomXSquared = 0;
  let denomYSquared = 0;
  
  for (let i = 0; i < x.length; i++) {
    const xDiff = x[i] - meanX;
    const yDiff = y[i] - meanY;
    
    numerator += xDiff * yDiff;
    denomXSquared += xDiff * xDiff;
    denomYSquared += yDiff * yDiff;
  }
  
  // Handle cases where there's no variance in one or both variables
  if (denomXSquared === 0 || denomYSquared === 0) {
    return 0;
  }
  
  // Calculate correlation coefficient
  const denominator = Math.sqrt(denomXSquared * denomYSquared);
  return numerator / denominator;
}

/**
 * Interface for data completeness validation results
 */
interface CompletenessResult {
  isComplete: boolean;
  completenessScore: number;
  missingFields: Array<{ id: any, field: string }>;
}

/**
 * Validates data completeness for a dataset
 * 
 * @param data Array of data objects
 * @param requiredFields Array of field names that should be present and non-null
 * @returns Object with completeness information
 */
export function validateDataCompleteness(
  data: Array<Record<string, any>>, 
  requiredFields: string[]
): CompletenessResult {
  const missingFields: Array<{ id: any, field: string }> = [];
  
  // Check each data item for required fields
  data.forEach(item => {
    requiredFields.forEach(field => {
      if (item[field] === undefined || item[field] === null) {
        missingFields.push({
          id: item.id || 'unknown',
          field
        });
      }
    });
  });
  
  // Calculate completeness score
  const totalFields = data.length * requiredFields.length;
  const missingCount = missingFields.length;
  const completenessScore = totalFields > 0 ? (totalFields - missingCount) / totalFields : 1;
  
  return {
    isComplete: missingFields.length === 0,
    completenessScore,
    missingFields
  };
}

/**
 * Interface for confidence interval calculation results
 */
interface ConfidenceIntervalResult {
  mean: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
}

/**
 * Calculates confidence interval for a dataset
 * 
 * @param data Array of numeric values
 * @param confidenceLevel Confidence level between 0 and 1 (default: 0.95)
 * @returns Object with confidence interval information
 */
export function calculateConfidenceInterval(
  data: number[], 
  confidenceLevel: number = 0.95
): ConfidenceIntervalResult {
  // Handle empty dataset
  if (!data.length) {
    throw new Error('Cannot calculate confidence interval with empty dataset');
  }
  
  // Calculate mean
  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
  
  // Calculate standard deviation
  const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate standard error
  const standardError = stdDev / Math.sqrt(data.length);
  
  // Z-value for the given confidence level
  // This is a simplification - strictly speaking we should use t-distribution for small samples
  const alpha = 1 - confidenceLevel;
  let zScore: number;
  
  // Common z-scores for standard confidence levels
  if (confidenceLevel === 0.90) zScore = 1.645;
  else if (confidenceLevel === 0.95) zScore = 1.96;
  else if (confidenceLevel === 0.99) zScore = 2.576;
  else zScore = 1.96; // Default to 95% confidence level
  
  // Calculate margin of error
  const marginOfError = zScore * standardError;
  
  return {
    mean,
    lowerBound: mean - marginOfError,
    upperBound: mean + marginOfError,
    confidenceLevel
  };
}