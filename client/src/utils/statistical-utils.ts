/**
 * Statistical Utility Functions
 * 
 * This module provides utility functions for statistical calculations
 * used in the Building Cost Building System (BCBS).
 */

/**
 * Summary statistics for a numerical dataset
 */
export interface SummaryStatistics {
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  standardDeviation: number;
  variance: number;
  count: number;
  sum: number;
  q1: number; // First quartile
  q3: number; // Third quartile
  iqr: number; // Interquartile range
}

/**
 * Calculate summary statistics for an array of numbers
 * @param data Array of numerical values
 * @returns Object containing summary statistics
 */
export function calculateSummaryStatistics(data: number[]): SummaryStatistics {
  if (!data || data.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      range: 0,
      standardDeviation: 0,
      variance: 0,
      count: 0,
      sum: 0,
      q1: 0,
      q3: 0,
      iqr: 0
    };
  }

  // Sort data for quantile calculations
  const sortedData = [...data].sort((a, b) => a - b);
  const n = data.length;
  
  // Basic statistics
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;
  const min = sortedData[0];
  const max = sortedData[n - 1];
  const range = max - min;
  
  // Median and quartiles
  const median = n % 2 === 0 
    ? (sortedData[n/2 - 1] + sortedData[n/2]) / 2 
    : sortedData[Math.floor(n/2)];
  
  // Calculate quartiles
  const q1Index = Math.floor(n / 4);
  const q3Index = Math.floor(3 * n / 4);
  const q1 = n % 4 === 0 
    ? (sortedData[q1Index - 1] + sortedData[q1Index]) / 2 
    : sortedData[q1Index];
  const q3 = n % 4 === 0 
    ? (sortedData[q3Index - 1] + sortedData[q3Index]) / 2 
    : sortedData[q3Index];
  const iqr = q3 - q1;
  
  // Calculate variance and standard deviation
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / n;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    mean,
    median,
    min,
    max,
    range,
    standardDeviation,
    variance,
    count: n,
    sum,
    q1,
    q3,
    iqr
  };
}

/**
 * Detect outliers in a numerical dataset using the IQR method
 * Outliers are defined as values that fall below Q1 - 1.5*IQR or above Q3 + 1.5*IQR
 * 
 * @param data Array of numerical values
 * @returns Array of outlier values
 */
export function detectOutliers(data: number[]): number[] {
  if (!data || data.length < 4) {
    return [];
  }
  
  const { q1, q3, iqr } = calculateSummaryStatistics(data);
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return data.filter(val => val < lowerBound || val > upperBound);
}

/**
 * Correlation coefficient interface
 */
export interface CorrelationMatrix {
  [key: string]: {
    [key: string]: number;
  };
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 * @param x First array of values
 * @param y Second array of values
 * @returns Correlation coefficient between -1 and 1
 */
function calculateCorrelationCoefficient(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }
  
  const n = x.length;
  
  // Calculate means
  const meanX = x.reduce((acc, val) => acc + val, 0) / n;
  const meanY = y.reduce((acc, val) => acc + val, 0) / n;
  
  // Calculate covariance and standard deviations
  let covariance = 0;
  let varX = 0;
  let varY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    covariance += diffX * diffY;
    varX += diffX * diffX;
    varY += diffY * diffY;
  }
  
  covariance /= n;
  varX /= n;
  varY /= n;
  
  const stdX = Math.sqrt(varX);
  const stdY = Math.sqrt(varY);
  
  // Handle division by zero
  if (stdX === 0 || stdY === 0) {
    return 0;
  }
  
  return covariance / (stdX * stdY);
}

/**
 * Calculate correlation matrix for an array of objects
 * @param data Array of objects with numerical properties
 * @param properties Optional array of property names to include in correlation matrix
 * @returns Correlation matrix
 */
export function calculateCorrelations(
  data: Record<string, any>[],
  properties?: string[]
): CorrelationMatrix {
  if (!data || data.length === 0) {
    return {};
  }
  
  // Extract numerical properties if not specified
  if (!properties) {
    const sampleObj = data[0];
    properties = Object.keys(sampleObj).filter(key => {
      const value = sampleObj[key];
      return typeof value === 'number' && !isNaN(value);
    });
  }
  
  const correlationMatrix: CorrelationMatrix = {};
  
  // Initialize correlation matrix
  properties.forEach(prop1 => {
    correlationMatrix[prop1] = {};
    
    properties.forEach(prop2 => {
      if (prop1 === prop2) {
        correlationMatrix[prop1][prop2] = 1; // Self-correlation is always 1
      } else {
        const values1 = data.map(item => item[prop1]).filter(val => !isNaN(val) && val !== null);
        const values2 = data.map(item => item[prop2]).filter(val => !isNaN(val) && val !== null);
        
        // Only calculate if we have sufficient data points
        if (values1.length === values2.length && values1.length > 1) {
          correlationMatrix[prop1][prop2] = calculateCorrelationCoefficient(values1, values2);
        } else {
          correlationMatrix[prop1][prop2] = 0;
        }
      }
    });
  });
  
  return correlationMatrix;
}

/**
 * Calculate frequency distribution for visualization
 * @param data Array of numerical values
 * @param binCount Optional number of bins (default: 10)
 * @returns Array of bin objects with x (bin center) and y (frequency) values
 */
export function calculateDistribution(data: number[], binCount = 10): { x: number, y: number }[] {
  if (!data || data.length === 0) {
    return [];
  }
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  // Handle case where all values are the same
  if (range === 0) {
    return [{ x: min, y: data.length }];
  }
  
  const binWidth = range / binCount;
  const bins = Array(binCount).fill(0);
  
  // Count values in each bin
  data.forEach(val => {
    const binIndex = Math.min(Math.floor((val - min) / binWidth), binCount - 1);
    bins[binIndex]++;
  });
  
  // Create bin objects with x (bin center) and y (frequency) values
  return bins.map((count, index) => ({
    x: min + (index + 0.5) * binWidth,
    y: count
  }));
}

/**
 * Find z-score for a value in a dataset
 * @param value The value to calculate z-score for
 * @param mean Mean of the dataset
 * @param stdDev Standard deviation of the dataset
 * @returns Z-score
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate percentile for a value in a sorted dataset
 * @param value The value to find percentile for
 * @param sortedData Sorted array of values
 * @returns Percentile (0-100)
 */
export function calculatePercentile(value: number, sortedData: number[]): number {
  if (!sortedData || sortedData.length === 0) return 0;
  
  // Count values less than or equal to the given value
  const countLessOrEqual = sortedData.filter(val => val <= value).length;
  
  return (countLessOrEqual / sortedData.length) * 100;
}

/**
 * Filter data based on statistical properties (e.g., only show outliers)
 * @param data Array of objects with numerical properties
 * @param property Property name to filter on
 * @param filterType Type of filter to apply
 * @returns Filtered data array
 */
export function filterDataStatistically(
  data: Record<string, any>[],
  property: string,
  filterType: 'outliers' | 'above-mean' | 'below-mean' | 'normal-range'
): Record<string, any>[] {
  if (!data || data.length === 0) return [];
  
  const values = data.map(item => item[property]).filter(val => !isNaN(val) && val !== null);
  const stats = calculateSummaryStatistics(values);
  
  switch (filterType) {
    case 'outliers':
      const outliers = detectOutliers(values);
      return data.filter(item => outliers.includes(item[property]));
      
    case 'above-mean':
      return data.filter(item => item[property] > stats.mean);
      
    case 'below-mean':
      return data.filter(item => item[property] < stats.mean);
      
    case 'normal-range':
      const lowerBound = stats.q1 - 1.5 * stats.iqr;
      const upperBound = stats.q3 + 1.5 * stats.iqr;
      return data.filter(item => item[property] >= lowerBound && item[property] <= upperBound);
      
    default:
      return data;
  }
}