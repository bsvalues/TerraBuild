/**
 * Analytics Controller
 * 
 * This controller handles all analytics-related endpoints including:
 * - Time series analysis for cost trends
 * - Regional cost comparisons
 * - Building type comparisons
 * - Cost breakdown analysis
 * 
 * These endpoints power the interactive data visualizations in the application,
 * allowing users to explore building cost data through various perspectives.
 */

import { Request, Response } from 'express';
import { storage } from '../storage';
import { and, between, eq, sql } from 'drizzle-orm';
import { 
  calculatePercentileBenchmark, 
  calculateCostStatistics, 
  generateBenchmarkThresholds,
  formatCurrency
} from '../utils/benchmarkingUtils';

/**
 * Generate time series data for cost trends
 * 
 * @param req - Express request object containing query parameters:
 *   - buildingType: The type of building (e.g., 'residential', 'commercial')
 *   - startYear: The beginning year for the time series
 *   - endYear: The ending year for the time series
 *   - region: The geographical region to analyze
 * @param res - Express response object
 * @returns JSON array of data points with date and value properties
 */
export async function getTimeSeriesData(req: Request, res: Response) {
  try {
    const { buildingType, startYear, endYear, region } = req.query;
    
    // Validate parameters
    if (!buildingType || !startYear || !endYear || !region) {
      return res.status(400).json({ 
        error: 'Missing required parameters: buildingType, startYear, endYear, region' 
      });
    }
    
    // Validate year range
    const start = parseInt(startYear as string);
    const end = parseInt(endYear as string);
    
    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).json({ 
        error: 'Invalid year range: startYear must be less than or equal to endYear' 
      });
    }
    
    // Get cost matrix data from storage
    const allMatrixData = await storage.getAllCostMatrix();
    
    // Filter matrix data based on parameters
    const data = allMatrixData.filter((item: any) => {
      return (
        item.buildingType === buildingType &&
        item.region === region &&
        item.matrixYear >= start &&
        item.matrixYear <= end &&
        item.isActive === true
      );
    })
    .sort((a, b) => a.matrixYear - b.matrixYear);
    
    // If no data is found, generate sample years to ensure smooth visualization
    if (data.length === 0) {
      console.log(`No time series data found for ${buildingType} in ${region} from ${start} to ${end}`);
      return res.status(200).json([]);
    }
    
    // Format the response
    const formattedData = data.map((item: any) => ({
      date: item.matrixYear.toString(),
      value: parseFloat(item.baseCost)
    }));
    
    // Ensure we have data for each year in the range by filling gaps
    const filledData = fillTimeSeriesGaps(formattedData, start, end);
    
    return res.status(200).json(filledData);
  } catch (error) {
    console.error('Error generating time series data:', error);
    return res.status(500).json({ error: 'Error generating time series data' });
  }
}

/**
 * Helper function to fill gaps in time series data
 * Uses linear interpolation for missing years
 * 
 * @param data - Array of data points with date and value properties
 * @param startYear - The beginning year for the time series
 * @param endYear - The ending year for the time series
 * @returns Complete array of data points with no gaps
 */
function fillTimeSeriesGaps(data: { date: string; value: number }[], startYear: number, endYear: number): { date: string; value: number }[] {
  if (data.length === 0) return [];
  
  const result: { date: string; value: number }[] = [];
  const dataMap = new Map<string, number>();
  
  // Create a map of existing data
  data.forEach(item => {
    dataMap.set(item.date, item.value);
  });
  
  // Identify known years and values for interpolation
  const knownYears = data.map(item => parseInt(item.date)).sort((a, b) => a - b);
  
  // Fill in each year in the range
  for (let year = startYear; year <= endYear; year++) {
    const yearStr = year.toString();
    
    if (dataMap.has(yearStr)) {
      // We have actual data for this year
      result.push({ date: yearStr, value: dataMap.get(yearStr)! });
    } else if (knownYears.length >= 2) {
      // Find surrounding known years for interpolation
      let prevYear = null;
      let nextYear = null;
      
      for (const known of knownYears) {
        if (known < year) prevYear = known;
        if (known > year && nextYear === null) nextYear = known;
      }
      
      if (prevYear !== null && nextYear !== null) {
        // We can interpolate
        const prevValue = dataMap.get(prevYear.toString())!;
        const nextValue = dataMap.get(nextYear.toString())!;
        const ratio = (year - prevYear) / (nextYear - prevYear);
        const interpolatedValue = prevValue + (nextValue - prevValue) * ratio;
        
        result.push({ 
          date: yearStr, 
          value: Math.round(interpolatedValue * 100) / 100 
        });
      } else {
        // We're outside the range of known values - use nearest known value
        const nearestYear = prevYear !== null ? prevYear : nextYear;
        const nearestValue = dataMap.get(nearestYear!.toString())!;
        
        result.push({ date: yearStr, value: nearestValue });
      }
    } else if (knownYears.length === 1) {
      // Only one data point - use that value for all years
      result.push({ 
        date: yearStr, 
        value: dataMap.get(knownYears[0].toString())! 
      });
    }
  }
  
  return result.sort((a, b) => parseInt(a.date) - parseInt(b.date));
}

/**
 * Generate regional comparison data
 * 
 * @param req - Express request object containing query parameters:
 *   - buildingType: The type of building (e.g., 'residential', 'commercial')
 *   - year: The year for the cost data
 *   - squareFootage: The size of the building in square feet
 * @param res - Express response object
 * @returns JSON object with regions and values arrays
 */
export async function getRegionalComparison(req: Request, res: Response) {
  try {
    const { buildingType, year, squareFootage } = req.query;
    
    // Validate parameters
    if (!buildingType || !year || !squareFootage) {
      return res.status(400).json({ 
        error: 'Missing required parameters: buildingType, year, squareFootage' 
      });
    }
    
    // Validate numeric inputs
    const yearInt = parseInt(year as string);
    const sqftFloat = parseFloat(squareFootage as string);
    
    if (isNaN(yearInt) || isNaN(sqftFloat) || sqftFloat <= 0) {
      return res.status(400).json({ 
        error: 'Invalid numeric parameters: year must be a valid year, squareFootage must be a positive number' 
      });
    }
    
    // Get cost matrix data for regional comparison
    const allMatrixData = await storage.getAllCostMatrix();
    
    // Filter and process the data
    const data = allMatrixData.filter((item: any) => {
      return (
        item.buildingType === buildingType &&
        item.matrixYear === yearInt &&
        item.isActive === true
      );
    })
    .sort((a, b) => a.region.localeCompare(b.region));
    
    // If no data is found, return empty result
    if (data.length === 0) {
      console.log(`No regional comparison data found for ${buildingType} in ${yearInt}`);
      return res.status(200).json({ regions: [], values: [], regionDescriptions: [] });
    }
    
    // Calculate cost for each region based on square footage
    const regions = data.map((item: any) => item.region);
    const regionDescriptions = data.map((item: any) => item.regionDescription || item.region);
    const baseCosts = data.map((item: any) => parseFloat(item.baseCost));
    const values = data.map((item: any) => {
      const cost = parseFloat(item.baseCost) * sqftFloat;
      return Math.round(cost * 100) / 100; // Round to 2 decimal places
    });
    
    // Add region descriptions and base costs to provide more context
    return res.status(200).json({ 
      regions, 
      values,
      regionDescriptions,
      baseCosts,
      metadata: {
        buildingType,
        buildingTypeDescription: data[0]?.buildingTypeDescription || buildingType,
        year: yearInt,
        squareFootage: sqftFloat
      }
    });
  } catch (error) {
    console.error('Error generating regional comparison:', error);
    return res.status(500).json({ error: 'Error generating regional comparison' });
  }
}

/**
 * Generate building type comparison data
 * 
 * @param req - Express request object containing query parameters:
 *   - region: The geographical region to analyze
 *   - year: The year for the cost data
 *   - squareFootage: The size of the building in square feet
 * @param res - Express response object
 * @returns JSON object with buildingTypes, buildingTypeLabels, values arrays
 */
export async function getBuildingTypeComparison(req: Request, res: Response) {
  try {
    const { region, year, squareFootage } = req.query;
    
    // Validate parameters
    if (!region || !year || !squareFootage) {
      return res.status(400).json({ 
        error: 'Missing required parameters: region, year, squareFootage' 
      });
    }
    
    // Validate numeric inputs
    const yearInt = parseInt(year as string);
    const sqftFloat = parseFloat(squareFootage as string);
    
    if (isNaN(yearInt) || isNaN(sqftFloat) || sqftFloat <= 0) {
      return res.status(400).json({ 
        error: 'Invalid numeric parameters: year must be a valid year, squareFootage must be a positive number' 
      });
    }
    
    // Get cost matrix data for building type comparison
    const allMatrixData = await storage.getAllCostMatrix();
    
    // Filter and process the data
    const data = allMatrixData.filter((item: any) => {
      return (
        item.region === region &&
        item.matrixYear === yearInt &&
        item.isActive === true
      );
    })
    .sort((a, b) => a.buildingType.localeCompare(b.buildingType));
    
    // If no data is found, return empty result
    if (data.length === 0) {
      console.log(`No building type comparison data found for ${region} in ${yearInt}`);
      return res.status(200).json({ 
        buildingTypes: [], 
        buildingTypeLabels: [], 
        values: [] 
      });
    }
    
    // Calculate cost for each building type based on square footage
    const buildingTypes = data.map((item: any) => item.buildingType);
    const buildingTypeLabels = data.map((item: any) => 
      item.buildingTypeDescription || `Building Type ${item.buildingType}`
    );
    const baseCosts = data.map((item: any) => parseFloat(item.baseCost));
    const values = data.map((item: any) => {
      const cost = parseFloat(item.baseCost) * sqftFloat;
      return Math.round(cost * 100) / 100; // Round to 2 decimal places
    });
    
    // Calculate cost per square foot for each building type
    const costPerSqft = data.map((item: any) => parseFloat(item.baseCost));
    
    return res.status(200).json({ 
      buildingTypes, 
      buildingTypeLabels,
      values,
      baseCosts,
      costPerSqft,
      metadata: {
        region,
        regionDescription: data[0]?.regionDescription || region,
        year: yearInt,
        squareFootage: sqftFloat
      }
    });
  } catch (error) {
    console.error('Error generating building type comparison:', error);
    return res.status(500).json({ error: 'Error generating building type comparison' });
  }
}

/**
 * Get cost breakdown for a specific calculation
 * 
 * @param req - Express request object containing route parameters:
 *   - id: The ID of the calculation to analyze
 * @param res - Express response object
 * @returns JSON object with cost breakdown details
 */
export async function getCostBreakdown(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing calculation ID' });
    }
    
    // Parse ID to ensure it's a valid number
    const calcId = parseInt(id);
    if (isNaN(calcId)) {
      return res.status(400).json({ error: 'Invalid calculation ID format' });
    }
    
    // Get the calculation from storage
    const calc = await storage.getBuildingCost(calcId);
    
    if (!calc) {
      return res.status(404).json({ error: 'Calculation not found' });
    }
    
    // Ensure totalCost is a valid number
    const totalCost = parseFloat(calc.totalCost);
    if (isNaN(totalCost)) {
      return res.status(500).json({ error: 'Invalid total cost value in calculation' });
    }
    
    // Use an enhanced breakdown based on building type and complexity
    // This would normally come from a more sophisticated calculation engine
    let materialsPct = 0.65; // Default 65% materials
    let laborPct = 0.25;     // Default 25% labor
    let permitsPct = 0.05;   // Default 5% permits
    let otherPct = 0.05;     // Default 5% other costs
    
    // Adjust percentages based on building type (simple example adjustment)
    if (calc.buildingType === 'commercial') {
      materialsPct = 0.60;
      laborPct = 0.25;
      permitsPct = 0.08;
      otherPct = 0.07;
    } else if (calc.buildingType === 'industrial') {
      materialsPct = 0.70;
      laborPct = 0.20;
      permitsPct = 0.05;
      otherPct = 0.05;
    }
    
    // Further adjust based on complexity factor
    if (calc.complexityFactor === 'complex') {
      // Complex buildings have higher labor costs
      materialsPct -= 0.05;
      laborPct += 0.05;
    } else if (calc.complexityFactor === 'simple') {
      // Simple buildings have lower labor costs
      materialsPct += 0.05;
      laborPct -= 0.05;
    }
    
    // Calculate the actual cost values
    const materials = totalCost * materialsPct;
    const labor = totalCost * laborPct;
    const permits = totalCost * permitsPct;
    const other = totalCost * otherPct;
    
    // Format response data with more detail
    const categories = ['materials', 'labor', 'permits', 'other'];
    const values = [
      Math.round(materials * 100) / 100,
      Math.round(labor * 100) / 100,
      Math.round(permits * 100) / 100,
      Math.round(other * 100) / 100
    ];
    
    // Format percentages for display (e.g., 65.0 instead of 0.65)
    const percentages = [
      Math.round(materialsPct * 100),
      Math.round(laborPct * 100),
      Math.round(permitsPct * 100),
      Math.round(otherPct * 100)
    ];
    
    // Add calculation details for reference
    const calculationDetails = {
      id: calc.id,
      name: calc.name,
      buildingType: calc.buildingType,
      region: calc.region,
      squareFootage: calc.squareFootage,
      complexityFactor: calc.complexityFactor,
      conditionFactor: calc.conditionFactor || 'average',
      createdAt: calc.createdAt
    };
    
    return res.status(200).json({
      calculationId: calc.id,
      totalCost,
      categories,
      values,
      percentages,
      calculationDetails
    });
  } catch (error) {
    console.error('Error generating cost breakdown:', error);
    return res.status(500).json({ error: 'Error generating cost breakdown' });
  }
}

/**
 * Generate benchmarking data to compare a calculation against similar buildings
 * 
 * @param req - Express request object containing route or query parameters:
 *   - id: (optional) The ID of the calculation to benchmark
 *   - buildingType: (optional) The type of building to benchmark
 *   - region: (optional) The region to benchmark against
 *   - year: (optional) The year for the benchmark data
 *   - squareFootage: (optional) The size of the building in square feet
 * @param res - Express response object
 * @returns JSON object with benchmarking statistics and comparisons
 */
export async function getBenchmarkData(req: Request, res: Response) {
  try {
    // Get parameters either from route params or query string
    const { id } = req.params;
    let { buildingType, region, year, squareFootage } = req.query;
    let calculation = null;
    
    // If ID is provided, get the calculation
    if (id) {
      const calcId = parseInt(id);
      if (isNaN(calcId)) {
        return res.status(400).json({ error: 'Invalid calculation ID format' });
      }
      
      calculation = await storage.getBuildingCost(calcId);
      
      if (!calculation) {
        return res.status(404).json({ error: 'Calculation not found' });
      }
      
      // Use calculation properties as defaults if not provided in query
      buildingType = buildingType || calculation.buildingType;
      region = region || calculation.region;
      squareFootage = squareFootage || calculation.squareFootage.toString();
      // For year, we'll use the current year if not specified
      if (!year) {
        const currentYear = new Date().getFullYear();
        year = currentYear.toString();
      }
    } else {
      // If no ID provided, validate that required parameters are sent
      if (!buildingType || !region || !squareFootage) {
        return res.status(400).json({ 
          error: 'Missing required parameters: either calculationId or (buildingType, region, squareFootage)' 
        });
      }
    }
    
    // Validate numeric inputs
    const yearInt = parseInt(year as string);
    const sqftFloat = parseFloat(squareFootage as string);
    
    if (isNaN(yearInt) || isNaN(sqftFloat) || sqftFloat <= 0) {
      return res.status(400).json({ 
        error: 'Invalid numeric parameters: year must be a valid year, squareFootage must be a positive number' 
      });
    }
    
    // Get cost matrix data for benchmarking
    const allMatrixData = await storage.getAllCostMatrix();
    
    // Filter for active matrix entries matching the building type
    const matchingEntries = allMatrixData.filter((item: any) => {
      return (
        item.buildingType === buildingType &&
        item.isActive === true
      );
    });
    
    // If no matching data, return empty result
    if (matchingEntries.length === 0) {
      return res.status(200).json({
        buildingType,
        region,
        squareFootage: sqftFloat,
        message: `No benchmark data available for building type: ${buildingType}`,
        regionalComparison: null,
        statewideComparison: null,
        statistics: {
          regional: null,
          statewide: null
        }
      });
    }
    
    // Get regional and statewide data
    const regionalEntries = matchingEntries.filter((item: any) => item.region === region);
    
    // Get costs per square foot for comparison
    const regionalCostsPerSqft = regionalEntries.map((item: any) => parseFloat(item.baseCost));
    const allCostsPerSqft = matchingEntries.map((item: any) => parseFloat(item.baseCost));
    
    // Calculate statistics using imported utility functions
    
    const regionalStats = calculateCostStatistics(regionalCostsPerSqft);
    const statewideStats = calculateCostStatistics(allCostsPerSqft);
    
    // Calculate total costs based on square footage
    const totalCost = calculation 
      ? parseFloat(calculation.totalCost)
      : sqftFloat * (regionalStats.average || statewideStats.average);
    
    const costPerSqft = calculation
      ? parseFloat(calculation.costPerSqft)
      : regionalStats.average || statewideStats.average;
    
    // Compare our building's cost per square foot against the regional and statewide data
    const regionalBenchmark = calculatePercentileBenchmark(
      costPerSqft,
      regionalCostsPerSqft,
      'cost_per_sqft'
    );
    
    const statewideBenchmark = calculatePercentileBenchmark(
      costPerSqft,
      allCostsPerSqft,
      'cost_per_sqft'
    );
    
    // Generate threshold values for visualization
    const regionalThresholds = generateBenchmarkThresholds(regionalStats.median);
    const statewideThresholds = generateBenchmarkThresholds(statewideStats.median);
    
    // Calculate regional and statewide total costs
    const regionalTotalCosts = regionalCostsPerSqft.map(cost => cost * sqftFloat);
    const statewideTotalCosts = allCostsPerSqft.map(cost => cost * sqftFloat);
    
    // Benchmark the total cost
    const regionalTotalBenchmark = calculatePercentileBenchmark(
      totalCost,
      regionalTotalCosts,
      'total_cost'
    );
    
    const statewideTotalBenchmark = calculatePercentileBenchmark(
      totalCost,
      statewideTotalCosts,
      'total_cost'
    );
    
    // Build comprehensive benchmarking response
    return res.status(200).json({
      buildingType,
      buildingTypeDescription: matchingEntries[0]?.buildingTypeDescription || buildingType,
      region,
      regionDescription: regionalEntries[0]?.regionDescription || region,
      year: yearInt,
      squareFootage: sqftFloat,
      calculationId: calculation?.id || null,
      totalCost,
      costPerSqft,
      
      // Benchmarking by cost per square foot
      costPerSqftBenchmarks: {
        regional: regionalBenchmark,
        statewide: statewideBenchmark,
        thresholds: {
          regional: regionalThresholds,
          statewide: statewideThresholds
        }
      },
      
      // Benchmarking by total cost
      totalCostBenchmarks: {
        regional: regionalTotalBenchmark,
        statewide: statewideTotalBenchmark
      },
      
      // Statistics for building narratives
      statistics: {
        regional: regionalStats,
        statewide: statewideStats,
        regionalSampleSize: regionalCostsPerSqft.length,
        statewideSampleSize: allCostsPerSqft.length
      }
    });
  } catch (error) {
    console.error('Error generating benchmark data:', error);
    return res.status(500).json({ error: 'Error generating benchmark data' });
  }
}