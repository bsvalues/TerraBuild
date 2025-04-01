/**
 * Visualization Utilities for Building Cost Building System
 * 
 * This module provides helper functions for data processing, formatting,
 * and color calculations for visualizations.
 */

/**
 * Format currency values for display
 * @param value The numeric value to format
 * @param decimals Number of decimal places to include
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Calculate color based on value within a range
 * @param value The value to calculate color for
 * @param min Minimum value in the range
 * @param max Maximum value in the range
 * @returns HEX color code
 */
export function calculateColor(
  value: number | null | undefined, 
  min: number | null | undefined, 
  max: number | null | undefined
): string {
  // Default to medium color if we don't have proper values
  if (value === null || value === undefined || 
      min === null || min === undefined || 
      max === null || max === undefined || 
      min === max) {
    return '#8884d8'; // Default purple
  }
  
  // Calculate how far along the range we are (0-1)
  const ratio = (value - min) / (max - min);
  
  // Color ranges from blue (low) to red (high)
  const r = Math.floor(255 * ratio);
  const b = Math.floor(255 * (1 - ratio));
  const g = Math.floor(100 * (1 - Math.abs(ratio - 0.5) * 2));
  
  // Convert to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Format percentage values for display
 * @param value The numeric value to format
 * @param decimals Number of decimal places to include
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate correlation coefficient between two datasets
 * @param xValues Array of x values
 * @param yValues Array of y values
 * @returns Correlation coefficient or null if calculation fails
 */
export function calculateCorrelation(
  xValues: (number | null | undefined)[], 
  yValues: (number | null | undefined)[]
): number | null {
  // Filter out null/undefined values
  const validPairs = xValues.map((x, i) => [x, yValues[i]])
    .filter(([x, y]) => 
      x !== null && x !== undefined && 
      y !== null && y !== undefined
    ) as [number, number][];
  
  if (validPairs.length < 2) return null;
  
  // Extract valid x and y values
  const validX = validPairs.map(([x]) => x);
  const validY = validPairs.map(([_, y]) => y);
  
  // Calculate means
  const xMean = validX.reduce((sum, val) => sum + val, 0) / validX.length;
  const yMean = validY.reduce((sum, val) => sum + val, 0) / validY.length;
  
  // Calculate numerator and denominators for correlation
  let numerator = 0;
  let xDenom = 0;
  let yDenom = 0;
  
  for (let i = 0; i < validX.length; i++) {
    const xDiff = validX[i] - xMean;
    const yDiff = validY[i] - yMean;
    numerator += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }
  
  if (xDenom === 0 || yDenom === 0) return null;
  
  return numerator / Math.sqrt(xDenom * yDenom);
}

/**
 * Calculate linear regression for scatter plot trend line
 * @param xValues Array of x values
 * @param yValues Array of y values
 * @returns Object with slope, intercept, start and end points
 */
export function calculateTrendLine(
  xValues: (number | null | undefined)[], 
  yValues: (number | null | undefined)[]
): { slope: number; intercept: number; points: [number, number][]; } | null {
  // Filter out null/undefined values
  const validPairs = xValues.map((x, i) => [x, yValues[i]])
    .filter(([x, y]) => 
      x !== null && x !== undefined && 
      y !== null && y !== undefined
    ) as [number, number][];
  
  if (validPairs.length < 2) return null;
  
  // Extract valid x and y values
  const validX = validPairs.map(([x]) => x);
  const validY = validPairs.map(([_, y]) => y);
  
  // Calculate means
  const xMean = validX.reduce((sum, val) => sum + val, 0) / validX.length;
  const yMean = validY.reduce((sum, val) => sum + val, 0) / validY.length;
  
  // Calculate slope
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < validX.length; i++) {
    const xDiff = validX[i] - xMean;
    numerator += xDiff * (validY[i] - yMean);
    denominator += xDiff * xDiff;
  }
  
  if (denominator === 0) return null;
  
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // Find min and max x values for the line
  const minX = Math.min(...validX);
  const maxX = Math.max(...validX);
  
  return {
    slope,
    intercept,
    points: [
      [minX, minX * slope + intercept],
      [maxX, maxX * slope + intercept]
    ]
  };
}

/**
 * Detect outliers in a dataset using IQR method
 * @param values Array of numeric values
 * @param multiplier IQR multiplier for outlier threshold (default: 1.5)
 * @returns Array of indices of outlier values
 */
export function detectOutliers(
  values: (number | null | undefined)[],
  multiplier = 1.5
): number[] {
  // Filter out null/undefined values
  const validValues = values
    .map((v, i) => [v, i])
    .filter(([v]) => v !== null && v !== undefined) as [number, number][];
  
  if (validValues.length < 4) return [];
  
  // Sort the values
  validValues.sort(([a], [b]) => a - b);
  
  // Get Q1 and Q3
  const q1Index = Math.floor(validValues.length / 4);
  const q3Index = Math.floor(validValues.length * 3 / 4);
  
  const q1 = validValues[q1Index][0];
  const q3 = validValues[q3Index][0];
  
  // Calculate IQR and bounds
  const iqr = q3 - q1;
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;
  
  // Return indices of outliers
  return validValues
    .filter(([v]) => v < lowerBound || v > upperBound)
    .map(([_, i]) => i);
}