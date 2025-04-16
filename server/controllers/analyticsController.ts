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
import storage from '../storage';

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
    const allMatrixData = await storage.getCostMatrices();
    
    // Filter matrix data based on parameters
    const data = allMatrixData.filter((item: any) => {
      return (
        item.buildingType === buildingType &&
        item.region === region &&
        item.year >= start &&
        item.year <= end &&
        (item.isActive === true || item.isActive === null)
      );
    })
    .sort((a: any, b: any) => a.year - b.year);
    
    // If no data is found, return empty result
    if (data.length === 0) {
      console.log(`No time series data found for ${buildingType} in ${region} from ${start} to ${end}`);
      
      // Return empty series for the chart
      return res.status(200).json({
        series: [],
        metadata: {
          buildingType,
          region,
          startYear: start,
          endYear: end
        }
      });
    }
    
    // Format the response
    const formattedData = data.map((item: any) => ({
      date: item.matrix_year.toString(),
      value: parseFloat(item.base_rate)
    }));
    
    // Ensure we have data for each year in the range by filling gaps
    const filledData = fillTimeSeriesGaps(formattedData, start, end);
    
    // Generate a key format that the frontend expects: {region}_{buildingType}
    const key = `${region}_${buildingType}`;
    
    // Format the response as expected by the frontend
    const processedData = filledData.map(item => ({
      year: parseInt(item.date),
      costByRegionAndType: {
        [key]: item.value
      }
    }));
    
    return res.status(200).json({
      series: processedData,
      metadata: {
        buildingType: buildingType,
        region: region,
        startYear: start,
        endYear: end
      }
    });
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
    const allMatrixData = await storage.getCostMatrices();
    
    // Filter and process the data
    const data = allMatrixData.filter((item: any) => {
      return (
        item.buildingType === buildingType &&
        item.matrix_year === yearInt &&
        (item.is_active === true || item.is_active === null)
      );
    })
    .sort((a: any, b: any) => a.region.localeCompare(b.region));
    
    // If no data is found, return empty result
    if (data.length === 0) {
      console.log(`No regional comparison data found for ${buildingType} in ${yearInt}`);
      return res.status(200).json({ 
        regions: [], 
        values: [], 
        regionDescriptions: [],
        metadata: {
          buildingType,
          year: yearInt,
          squareFootage: sqftFloat
        }
      });
    }
    
    // Calculate cost for each region based on square footage
    const regions = data.map((item: any) => item.region);
    const regionDescriptions = data.map((item: any) => item.description || item.region);
    const baseCosts = data.map((item: any) => parseFloat(item.baseRate));
    const values = data.map((item: any) => {
      const cost = parseFloat(item.baseRate) * sqftFloat;
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
        buildingTypeDescription: data[0]?.description || buildingType,
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
    const allMatrixData = await storage.getCostMatrices();
    
    // Filter and process the data
    const data = allMatrixData.filter((item: any) => {
      return (
        item.region === region &&
        item.matrix_year === yearInt &&
        (item.is_active === true || item.is_active === null)
      );
    })
    .sort((a: any, b: any) => a.building_type.localeCompare(b.building_type));
    
    // If no data is found, return empty result
    if (data.length === 0) {
      console.log(`No building type comparison data found for ${region} in ${yearInt}`);
      return res.status(200).json({ 
        buildingTypes: [], 
        buildingTypeLabels: [], 
        values: [],
        metadata: {
          region,
          year: yearInt,
          squareFootage: sqftFloat
        }
      });
    }
    
    // Calculate cost for each building type based on square footage
    const buildingTypes = data.map((item: any) => item.building_type);
    const buildingTypeLabels = data.map((item: any) => 
      item.description || `Building Type ${item.building_type}`
    );
    const baseCosts = data.map((item: any) => parseFloat(item.base_rate));
    const values = data.map((item: any) => {
      const cost = parseFloat(item.base_rate) * sqftFloat;
      return Math.round(cost * 100) / 100; // Round to 2 decimal places
    });
    
    // Calculate cost per square foot for each building type
    const costPerSqft = data.map((item: any) => parseFloat(item.baseRate));
    
    return res.status(200).json({ 
      buildingTypes, 
      buildingTypeLabels,
      values,
      baseCosts,
      costPerSqft,
      metadata: {
        region,
        regionDescription: data[0]?.description || region,
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
    const calc = await storage.getCalculationById(calcId);
    
    if (!calc) {
      return res.status(404).json({ error: 'Calculation not found' });
    }
    
    // Ensure totalCost is a valid number
    const totalCost = parseFloat(calc.totalCost || calc.baseCost || '0');
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
    const complexityField = calc.complexity || 'average';
    if (complexityField === 'complex') {
      // Complex buildings have higher labor costs
      materialsPct -= 0.05;
      laborPct += 0.05;
    } else if (complexityField === 'simple') {
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
      name: calc.name || `Calculation #${calc.id}`,
      buildingType: calc.buildingType,
      region: calc.region,
      squareFootage: calc.squareFootage || 0,
      complexityFactor: calc.complexity || 'average',
      conditionFactor: calc.condition || 'average',
      createdDate: new Date(calc.createdAt || Date.now())
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