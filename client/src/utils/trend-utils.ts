/**
 * Trend Analysis Utility Functions
 * 
 * This module provides utility functions for analyzing trends in time series
 * cost data, including trend detection, seasonality analysis, forecasting, and
 * growth rate calculations.
 */

/**
 * Result of trend detection operation
 */
export interface TrendResult {
  trend: 'upward' | 'downward' | 'neutral';
  confidence: number;
  strength: number;
  metadata: {
    slopeValue: number;
    rSquared: number;
    pValue: number;
  };
}

/**
 * Result of seasonality detection operation
 */
export interface SeasonalityResult {
  hasSeasonal: boolean;
  period: number;
  seasonalStrength: number;
  seasonalIndices: number[];
  metadata: {
    acfValues: number[];
    significanceThreshold: number;
  };
}

/**
 * Forecast result including prediction intervals
 */
export interface ForecastResult {
  values: number[];
  upperBound: number[];
  lowerBound: number[];
  confidence: number;
  method: string;
}

/**
 * Detect trends in a time series of numerical values
 * 
 * Uses linear regression to detect upward, downward, or neutral trends
 * 
 * @param data Array of numerical values in time order
 * @param options Optional configuration parameters
 * @returns Trend detection result with direction and confidence level
 */
export function detectTrends(
  data: number[],
  options: { 
    significanceThreshold?: number; 
    minSlope?: number;
  } = {}
): TrendResult {
  if (!data || data.length < 3) {
    return {
      trend: 'neutral',
      confidence: 0,
      strength: 0,
      metadata: { slopeValue: 0, rSquared: 0, pValue: 1 }
    };
  }

  const { significanceThreshold = 0.05, minSlope = 0.01 } = options;
  
  // Create x values (time indices)
  const x = Array.from({ length: data.length }, (_, i) => i);
  
  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = data.reduce((sum, val) => sum + val, 0) / data.length;
  
  // Calculate slope using least squares regression
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < data.length; i++) {
    numerator += (x[i] - meanX) * (data[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  
  // Calculate intercept
  const intercept = meanY - slope * meanX;
  
  // Calculate R-squared (coefficient of determination)
  let ssTotal = 0;
  let ssResidual = 0;
  
  for (let i = 0; i < data.length; i++) {
    const predicted = intercept + slope * x[i];
    ssTotal += Math.pow(data[i] - meanY, 2);
    ssResidual += Math.pow(data[i] - predicted, 2);
  }
  
  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;
  
  // Calculate p-value using a t-test
  const n = data.length;
  const df = n - 2; // Degrees of freedom
  
  // Standard error of the slope
  let sumSquaredError = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * x[i];
    sumSquaredError += Math.pow(data[i] - predicted, 2);
  }
  
  const standardError = Math.sqrt(sumSquaredError / df) / 
                        Math.sqrt(denominator);
  
  // T-statistic
  const tStat = slope / standardError;
  
  // Simplified p-value approximation using normal distribution
  // (This is a simplification; in a real application, use a proper t-distribution)
  const pValue = 2 * (1 - Math.min(1, Math.abs(tStat) / 10)); // Rough approximation
  
  // Determine trend direction and confidence
  let trend: 'upward' | 'downward' | 'neutral';
  let confidence: number;
  
  if (pValue > significanceThreshold || Math.abs(slope) < minSlope) {
    trend = 'neutral';
    confidence = 1 - pValue;
  } else if (slope > 0) {
    trend = 'upward';
    confidence = 1 - pValue;
  } else {
    trend = 'downward';
    confidence = 1 - pValue;
  }
  
  // Calculate trend strength based on R-squared
  const strength = rSquared;
  
  return {
    trend,
    confidence,
    strength,
    metadata: {
      slopeValue: slope,
      rSquared,
      pValue
    }
  };
}

/**
 * Detect seasonal patterns in time series data
 * 
 * @param data Array of numerical values in time order
 * @param periodLength Expected length of seasonal cycle (e.g., 4 for quarterly, 12 for monthly)
 * @param options Optional configuration parameters
 * @returns Seasonality detection result
 */
export function detectSeasonality(
  data: number[],
  periodLength: number,
  options: { 
    significanceThreshold?: number;
    maxLag?: number;
  } = {}
): SeasonalityResult {
  if (!data || data.length < periodLength * 2) {
    return {
      hasSeasonal: false,
      period: 0,
      seasonalStrength: 0,
      seasonalIndices: [],
      metadata: {
        acfValues: [],
        significanceThreshold: 0
      }
    };
  }

  const { significanceThreshold = 0.1, maxLag = Math.min(data.length - 1, periodLength * 3) } = options;
  
  // Detrend the data by subtracting the linear trend
  const x = Array.from({ length: data.length }, (_, i) => i);
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = data.reduce((sum, val) => sum + val, 0) / data.length;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < data.length; i++) {
    numerator += (x[i] - meanX) * (data[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;
  
  const detrended = data.map((y, i) => y - (intercept + slope * i));
  
  // Calculate autocorrelation function (ACF)
  const acf: number[] = [];
  
  for (let lag = 1; lag <= maxLag; lag++) {
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < detrended.length - lag; i++) {
      numerator += detrended[i] * detrended[i + lag];
      denominator += Math.pow(detrended[i], 2);
    }
    
    // Normalize the correlation
    const correlation = denominator !== 0 ? numerator / denominator : 0;
    acf.push(correlation);
  }
  
  // Determine significance threshold for ACF values
  // This is a simplified approach; in practice, use proper statistical methods
  const sigThreshold = 1.96 / Math.sqrt(data.length);
  
  // Find significant peaks in ACF at or near the specified period length
  let hasSeasonal = false;
  let seasonalStrength = 0;
  
  for (let i = Math.max(periodLength - 1, 0); i < Math.min(acf.length, periodLength + 1); i++) {
    if (Math.abs(acf[i]) > sigThreshold && Math.abs(acf[i]) > seasonalStrength) {
      hasSeasonal = true;
      seasonalStrength = Math.abs(acf[i]);
    }
  }
  
  // Calculate seasonal indices if seasonality is detected
  let seasonalIndices: number[] = [];
  
  if (hasSeasonal) {
    // Calculate average values for each position in the seasonal cycle
    const seasonalPositions = Array(periodLength).fill(0).map(() => ({ sum: 0, count: 0 }));
    
    for (let i = 0; i < data.length; i++) {
      const position = i % periodLength;
      seasonalPositions[position].sum += detrended[i];
      seasonalPositions[position].count++;
    }
    
    // Calculate average for each position
    seasonalIndices = seasonalPositions.map(pos => pos.count > 0 ? pos.sum / pos.count : 0);
    
    // Normalize indices to sum to zero
    const meanIndex = seasonalIndices.reduce((sum, val) => sum + val, 0) / seasonalIndices.length;
    seasonalIndices = seasonalIndices.map(val => val - meanIndex);
  }
  
  return {
    hasSeasonal,
    period: hasSeasonal ? periodLength : 0,
    seasonalStrength,
    seasonalIndices,
    metadata: {
      acfValues: acf,
      significanceThreshold: sigThreshold
    }
  };
}

/**
 * Simple forecast of future values based on historical data
 * 
 * This uses a combination of trend and seasonal components to forecast
 * 
 * @param data Historical time series data
 * @param periodsToForecast Number of future periods to forecast
 * @param options Optional forecast configuration
 * @returns Array of forecasted values
 */
export function forecastValues(
  data: number[],
  periodsToForecast: number,
  options: {
    periodLength?: number;
    confidenceLevel?: number;
    includeConfidenceIntervals?: boolean;
  } = {}
): number[] | ForecastResult {
  if (!data || data.length < 2 || periodsToForecast < 1) {
    return [];
  }

  const { 
    periodLength = 0,
    confidenceLevel = 0.95,
    includeConfidenceIntervals = false
  } = options;
  
  // Detect trend
  const trendResult = detectTrends(data);
  
  // Detect seasonality if period length is provided
  let seasonalityResult: SeasonalityResult | null = null;
  
  if (periodLength > 1 && data.length >= periodLength * 2) {
    seasonalityResult = detectSeasonality(data, periodLength);
  }
  
  // Calculate trend component
  const x = Array.from({ length: data.length }, (_, i) => i);
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = data.reduce((sum, val) => sum + val, 0) / data.length;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < data.length; i++) {
    numerator += (x[i] - meanX) * (data[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;
  
  // Generate forecast values
  const forecast: number[] = [];
  const upperBound: number[] = [];
  const lowerBound: number[] = [];
  
  // Calculate standard error for prediction intervals
  let sumSquaredError = 0;
  for (let i = 0; i < data.length; i++) {
    const trendValue = intercept + slope * i;
    let predicted = trendValue;
    
    // Add seasonal component if available
    if (seasonalityResult && seasonalityResult.hasSeasonal) {
      const seasonalIndex = i % seasonalityResult.period;
      predicted += seasonalityResult.seasonalIndices[seasonalIndex];
    }
    
    sumSquaredError += Math.pow(data[i] - predicted, 2);
  }
  
  const standardError = Math.sqrt(sumSquaredError / (data.length - 2));
  
  // Z-score for the confidence level (approximation)
  const zScore = confidenceLevel === 0.95 ? 1.96 : 
                 confidenceLevel === 0.99 ? 2.576 : 
                 confidenceLevel === 0.90 ? 1.645 : 1.96;
  
  // Generate forecasts
  for (let i = 0; i < periodsToForecast; i++) {
    const forecastIndex = data.length + i;
    
    // Trend component
    let forecastValue = intercept + slope * forecastIndex;
    
    // Add seasonal component if available
    if (seasonalityResult && seasonalityResult.hasSeasonal) {
      const seasonalIndex = forecastIndex % seasonalityResult.period;
      forecastValue += seasonalityResult.seasonalIndices[seasonalIndex];
    }
    
    forecast.push(forecastValue);
    
    // Calculate prediction intervals
    if (includeConfidenceIntervals) {
      // Standard error increases with distance from the data
      const distanceFactor = 1 + (1/data.length) + 
                           Math.pow(forecastIndex - meanX, 2) / 
                           denominator;
      
      const marginOfError = zScore * standardError * Math.sqrt(distanceFactor);
      
      upperBound.push(forecastValue + marginOfError);
      lowerBound.push(forecastValue - marginOfError);
    }
  }
  
  if (includeConfidenceIntervals) {
    return {
      values: forecast,
      upperBound,
      lowerBound,
      confidence: confidenceLevel,
      method: seasonalityResult && seasonalityResult.hasSeasonal ? 
              'Trend with seasonality' : 'Linear trend'
    };
  }
  
  return forecast;
}

/**
 * Calculate compound annual growth rate (CAGR) from a time series
 * 
 * @param data Time series of values
 * @param options Optional configuration parameters
 * @returns Growth rate as a decimal (e.g., 0.05 for 5% growth)
 */
export function calculateGrowthRate(
  data: number[],
  options: {
    periodsPerYear?: number;
    startPeriod?: number;
    endPeriod?: number;
  } = {}
): number {
  if (!data || data.length < 2) {
    return 0;
  }

  const { 
    periodsPerYear = 1,
    startPeriod = 0,
    endPeriod = data.length - 1
  } = options;
  
  const startValue = data[startPeriod];
  const endValue = data[endPeriod];
  
  if (startValue <= 0 || endValue <= 0) {
    return 0; // Cannot calculate growth rate with zero or negative values
  }
  
  const numberOfPeriods = endPeriod - startPeriod;
  
  if (numberOfPeriods <= 0) {
    return 0;
  }
  
  // Convert periods to years for CAGR calculation
  const numberOfYears = numberOfPeriods / periodsPerYear;
  
  // CAGR = (End Value / Start Value) ^ (1 / number of years) - 1
  const growthRate = Math.pow(endValue / startValue, 1 / numberOfYears) - 1;
  
  return growthRate;
}

/**
 * Format a growth rate as a percentage string with appropriate sign
 * 
 * @param growthRate Growth rate as a decimal (e.g., 0.05 for 5%)
 * @param options Optional formatting options
 * @returns Formatted growth rate string (e.g., "+5.0%")
 */
export function formatGrowthRate(
  growthRate: number,
  options: {
    decimals?: number;
    includeSign?: boolean;
  } = {}
): string {
  const { decimals = 1, includeSign = true } = options;
  
  const percentage = (growthRate * 100).toFixed(decimals);
  
  if (includeSign && growthRate > 0) {
    return `+${percentage}%`;
  } else if (includeSign && growthRate < 0) {
    return `${percentage}%`; // Negative sign is already included
  }
  
  return `${percentage}%`;
}

/**
 * Group time series data by time periods (year, quarter, month, etc.)
 * 
 * @param data Array of objects with date properties
 * @param dateProperty Name of the date property
 * @param valueProperty Name of the value property
 * @param groupBy Grouping period ('year', 'quarter', 'month')
 * @returns Grouped and aggregated data
 */
export function groupTimeSeriesByPeriod<T>(
  data: T[],
  dateProperty: keyof T,
  valueProperty: keyof T,
  groupBy: 'year' | 'quarter' | 'month' = 'year'
): { period: string; value: number }[] {
  if (!data || data.length === 0) {
    return [];
  }
  
  // Group data
  const groups: Record<string, { sum: number; count: number }> = {};
  
  data.forEach(item => {
    const dateValue = item[dateProperty];
    const value = Number(item[valueProperty]);
    
    if (dateValue && !isNaN(value)) {
      let date: Date;
      
      if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return; // Skip if not a valid date
      }
      
      let period: string;
      
      switch (groupBy) {
        case 'year':
          period = date.getFullYear().toString();
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          period = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'month':
          // Ensure month is 2 digits (e.g., "01" for January)
          const month = String(date.getMonth() + 1).padStart(2, '0');
          period = `${date.getFullYear()}-${month}`;
          break;
        default:
          period = date.getFullYear().toString();
      }
      
      if (!groups[period]) {
        groups[period] = { sum: 0, count: 0 };
      }
      
      groups[period].sum += value;
      groups[period].count++;
    }
  });
  
  // Convert to array and calculate averages
  const result = Object.entries(groups).map(([period, { sum, count }]) => ({
    period,
    value: count > 0 ? sum / count : 0
  }));
  
  // Sort by period
  return result.sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Calculate moving average of a time series
 * 
 * @param data Array of numerical values
 * @param windowSize Size of the moving average window
 * @returns Array of moving average values
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number = 3
): number[] {
  if (!data || data.length === 0 || windowSize < 1) {
    return [];
  }
  
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      // Not enough data for a full window yet
      result.push(NaN);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      sum += data[i - j];
    }
    
    result.push(sum / windowSize);
  }
  
  return result;
}