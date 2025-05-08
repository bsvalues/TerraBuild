/**
 * Statistics Utility Functions
 * 
 * This module provides IAAO-compliant statistical functions for property valuation
 * including confidence intervals, coefficients of dispersion, and other metrics
 * required for professional appraisal standards.
 */

/**
 * Calculate mean (average) of an array of numbers
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation of an array of numbers
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  
  const mean = calculateMean(values);
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const variance = calculateMean(squaredDifferences);
  
  return Math.sqrt(variance);
}

/**
 * Calculate confidence interval for a set of values
 * @param values Array of numeric values
 * @param confidenceLevel Confidence level (0.95 for 95% confidence)
 * @returns Object containing lower and upper bounds of confidence interval
 */
export function calculateConfidenceInterval(
  values: number[], 
  confidenceLevel: number = 0.95
): { lower: number; upper: number; mean: number } {
  if (values.length === 0) {
    return { lower: 0, upper: 0, mean: 0 };
  }
  
  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values);
  
  // z-score for confidence level (1.96 for 95% confidence)
  const zScore = confidenceLevel === 0.95 ? 1.96 : 
                confidenceLevel === 0.99 ? 2.576 : 
                confidenceLevel === 0.90 ? 1.645 : 1.96;
  
  const marginOfError = zScore * (stdDev / Math.sqrt(values.length));
  
  return {
    lower: mean - marginOfError,
    upper: mean + marginOfError,
    mean
  };
}

/**
 * Calculate Coefficient of Dispersion (COD)
 * IAAO standard measure of horizontal equity in assessments
 * @param ratios Array of assessment-to-sales ratios or similar ratios
 * @returns COD value (percentage)
 */
export function calculateCOD(ratios: number[]): number {
  if (ratios.length === 0) return 0;
  
  const median = calculateMedian(ratios);
  if (median === 0) return 0;
  
  const absoluteDeviations = ratios.map(ratio => Math.abs(ratio - median));
  const averageAbsoluteDeviation = calculateMean(absoluteDeviations);
  
  // COD is the average absolute deviation divided by the median, expressed as a percentage
  return (averageAbsoluteDeviation / median) * 100;
}

/**
 * Calculate median of an array of numbers
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sortedValues = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(sortedValues.length / 2);
  
  if (sortedValues.length % 2 === 0) {
    // Average of the two middle values for even-length arrays
    return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
  } else {
    // Middle value for odd-length arrays
    return sortedValues[middleIndex];
  }
}

/**
 * Calculate Price-Related Differential (PRD)
 * IAAO standard measure of vertical equity in assessments
 * @param assessmentValues Array of assessment values
 * @param salesValues Array of corresponding sales values
 * @returns PRD value
 */
export function calculatePRD(assessmentValues: number[], salesValues: number[]): number {
  if (assessmentValues.length === 0 || salesValues.length === 0 || 
      assessmentValues.length !== salesValues.length) {
    return 0;
  }
  
  const ratios = assessmentValues.map((assessment, i) => 
    salesValues[i] === 0 ? 0 : assessment / salesValues[i]
  );
  
  const meanRatio = calculateMean(ratios);
  if (meanRatio === 0) return 0;
  
  const weightedRatios = ratios.map((ratio, i) => 
    ratio * (salesValues[i] / salesValues.reduce((sum, val) => sum + val, 0))
  );
  
  const weightedMeanRatio = weightedRatios.reduce((sum, val) => sum + val, 0);
  if (weightedMeanRatio === 0) return 0;
  
  return meanRatio / weightedMeanRatio;
}

/**
 * Check if sample size is sufficient for statistical validity
 * Based on IAAO standards for ratio studies
 * @param sampleSize Number of samples
 * @param populationSize Total population size (optional)
 * @param confidenceLevel Desired confidence level (default 0.95)
 * @returns Object with validity status and confidence information
 */
export function checkSampleSizeValidity(
  sampleSize: number,
  populationSize?: number,
  confidenceLevel: number = 0.95
): { 
  isValid: boolean; 
  confidenceLevel: number; 
  recommendedSize?: number;
  status: 'high' | 'medium' | 'low';
} {
  // IAAO recommends minimum sample sizes based on submarket size
  // These are simplified guidelines
  let recommendedSize = 0;
  
  if (populationSize) {
    if (populationSize < 100) {
      recommendedSize = Math.max(10, Math.ceil(populationSize * 0.3));
    } else if (populationSize < 500) {
      recommendedSize = Math.max(15, Math.ceil(populationSize * 0.1));
    } else if (populationSize < 2000) {
      recommendedSize = Math.max(20, Math.ceil(populationSize * 0.05));
    } else {
      recommendedSize = Math.max(30, Math.ceil(populationSize * 0.02));
    }
  } else {
    // Default recommendations without knowing population size
    recommendedSize = 30; // Generally accepted minimum for statistical significance
  }
  
  // Determine confidence status
  let status: 'high' | 'medium' | 'low' = 'low';
  
  if (sampleSize >= recommendedSize) {
    status = 'high';
  } else if (sampleSize >= recommendedSize * 0.7) {
    status = 'medium';
  }
  
  return {
    isValid: sampleSize >= recommendedSize,
    confidenceLevel,
    recommendedSize,
    status
  };
}

/**
 * Format a statistical value with appropriate precision
 * @param value Numeric value to format
 * @param type Type of statistic to format
 * @returns Formatted string
 */
export function formatStatistic(
  value: number, 
  type: 'currency' | 'percentage' | 'ratio' | 'count' | 'factor'
): string {
  if (isNaN(value) || value === null || value === undefined) {
    return 'N/A';
  }
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
      
    case 'percentage':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
      }).format(value / 100);
      
    case 'ratio':
      return value.toFixed(3);
      
    case 'count':
      return value.toLocaleString('en-US');
      
    case 'factor':
      return value.toFixed(4);
      
    default:
      return value.toString();
  }
}