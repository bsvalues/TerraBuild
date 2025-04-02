/**
 * Benchmarking Utilities
 * 
 * This module provides utility functions for benchmarking building costs
 * against various statistical metrics including percentiles, averages,
 * and industry standards.
 */

interface BenchmarkResult {
  value: number;
  percentile: number;
  description: string;
  label: string;
}

interface CostStatistics {
  min: number;
  max: number;
  average: number;
  median: number;
}

interface BenchmarkThresholds {
  excellent: number;
  good: number;
  average: number;
  high: number;
}

/**
 * Calculate where a given cost falls within a percentile distribution
 * 
 * @param cost The cost to benchmark
 * @param comparableCosts Array of costs to compare against
 * @param metric The type of metric to calculate ("cost_per_sqft" or "total_cost")
 * @returns Benchmark result with percentile and description
 */
export function calculatePercentileBenchmark(
  cost: number,
  comparableCosts: number[],
  metric: 'cost_per_sqft' | 'total_cost' = 'cost_per_sqft'
): BenchmarkResult {
  // Handle empty array case
  if (comparableCosts.length === 0) {
    return {
      value: cost,
      percentile: 50,
      description: 'No comparable data available for benchmarking',
      label: 'N/A'
    };
  }
  
  // Sort the costs in ascending order
  const sortedCosts = [...comparableCosts].sort((a, b) => a - b);
  
  // Find where the given cost falls in the distribution
  let position = sortedCosts.findIndex(c => c >= cost);
  
  // If not found (cost is higher than all comparables), position is at the end
  if (position === -1) {
    position = sortedCosts.length;
  }
  
  // Calculate percentile (0-100)
  const percentile = Math.round((position / sortedCosts.length) * 100);
  
  // Generate description based on percentile
  let description, label;
  
  if (percentile < 25) {
    description = `This ${metric === 'cost_per_sqft' ? 'cost per square foot' : 'total cost'} is in the lowest 25% of comparable buildings, representing excellent value.`;
    label = 'Excellent';
  } else if (percentile < 50) {
    description = `This ${metric === 'cost_per_sqft' ? 'cost per square foot' : 'total cost'} is in the lower half but above the lowest quartile, representing good value.`;
    label = 'Good';
  } else if (percentile < 75) {
    description = `This ${metric === 'cost_per_sqft' ? 'cost per square foot' : 'total cost'} is in the upper half but below the highest quartile, representing average value.`;
    label = 'Average';
  } else {
    description = `This ${metric === 'cost_per_sqft' ? 'cost per square foot' : 'total cost'} is in the highest 25% of comparable buildings, representing premium or potentially above-market pricing.`;
    label = 'Premium';
  }
  
  return {
    value: cost,
    percentile,
    description,
    label
  };
}

/**
 * Calculate statistical metrics for a set of costs
 * 
 * @param costs Array of costs to analyze
 * @returns Statistical metrics including min, max, average, median
 */
export function calculateCostStatistics(costs: number[]): CostStatistics {
  // Handle empty array case
  if (costs.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0
    };
  }
  
  // Sort costs for percentile calculations
  const sortedCosts = [...costs].sort((a, b) => a - b);
  
  // Calculate min, max
  const min = sortedCosts[0];
  const max = sortedCosts[sortedCosts.length - 1];
  
  // Calculate average
  const sum = sortedCosts.reduce((acc, curr) => acc + curr, 0);
  const average = sum / sortedCosts.length;
  
  // Calculate median
  let median: number;
  const midPoint = Math.floor(sortedCosts.length / 2);
  
  if (sortedCosts.length % 2 === 0) {
    // Even number of items, average the two middle values
    median = (sortedCosts[midPoint - 1] + sortedCosts[midPoint]) / 2;
  } else {
    // Odd number of items, take the middle value
    median = sortedCosts[midPoint];
  }
  
  return {
    min,
    max,
    average,
    median
  };
}

/**
 * Format a cost value with dollar sign and thousands separators
 * 
 * @param value The numeric value to format
 * @returns Formatted cost string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Generate benchmarking thresholds for color coding and visualization
 * 
 * @param median The median value to use as a baseline
 * @returns Threshold values for cost ranges
 */
export function generateBenchmarkThresholds(median: number): BenchmarkThresholds {
  return {
    excellent: median * 0.8,  // 20% below median
    good: median * 0.95,      // 5% below median
    average: median * 1.1,    // 10% above median
    high: median * 1.25       // 25% above median
  };
}