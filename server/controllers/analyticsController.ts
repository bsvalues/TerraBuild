/**
 * Analytics Controller
 * 
 * This controller handles all analytics-related endpoints including:
 * - Time series analysis for cost trends
 * - Regional cost comparisons
 * - Building type comparisons
 * - Cost breakdown analysis
 * - Hierarchical cost analysis
 * - Statistical correlations
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
        item.building_type === buildingType &&
        item.region === region &&
        item.matrix_year >= start &&
        item.matrix_year <= end &&
        (item.is_active === true || item.is_active === null)
      );
    })
    .sort((a: any, b: any) => a.matrix_year - b.matrix_year);
    
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
      value: parseFloat(item.base_cost)
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
    
    try {
      // Get cost matrix data for regional comparison
      const allMatrixData = await storage.getCostMatrices();
      
      // Filter and process the data
      const data = allMatrixData.filter((item: any) => {
        return (
          item.buildingType === buildingType &&
          item.year === yearInt &&
          (item.isActive === true || item.isActive === null)
        );
      })
      .sort((a: any, b: any) => a.region.localeCompare(b.region));
      
      // If data found, return it formatted correctly
      if (data.length > 0) {
        // Calculate cost for each region based on square footage
        const regions = data.map((item: any) => item.region);
        const regionDescriptions = data.map((item: any) => item.description || item.region);
        const baseCosts = data.map((item: any) => parseFloat(item.baseRate.toString()));
        const values = data.map((item: any) => {
          const cost = parseFloat(item.baseRate.toString()) * sqftFloat;
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
      }
    } catch (dbError) {
      console.error('Database error when fetching regional comparison data:', dbError);
      // Continue to fallback data below
    }
    
    // If we reach here, either no data was found or there was a database error
    // For development purposes, provide demonstration data
    console.log(`No regional comparison data found for ${buildingType} in ${yearInt}, using development data instead`);
    
    // Create demo data for development purposes
    const regions = ['Eastern', 'Western', 'Northern', 'Southern', 'Central'];
    const regionDescriptions = ['Eastern Region', 'Western Region', 'Northern Region', 'Southern Region', 'Central Region'];
    
    // Generate reasonable base costs with some variation by building type
    let buildingTypeMultiplier = 1.0;
    if (buildingType === 'R1' || buildingType === 'residential') buildingTypeMultiplier = 1.0;
    if (buildingType === 'R2' || buildingType === 'multi-family') buildingTypeMultiplier = 0.9;
    if (buildingType === 'C1' || buildingType === 'commercial') buildingTypeMultiplier = 1.3;
    if (buildingType === 'I1' || buildingType === 'industrial') buildingTypeMultiplier = 1.1;
    if (buildingType === 'A1' || buildingType === 'agricultural') buildingTypeMultiplier = 0.7;
    
    const baseCosts = [
      120 * buildingTypeMultiplier, 
      150 * buildingTypeMultiplier, 
      140 * buildingTypeMultiplier, 
      125 * buildingTypeMultiplier, 
      135 * buildingTypeMultiplier
    ];
    
    // Calculate total values based on square footage
    const values = baseCosts.map(cost => Math.round(cost * sqftFloat * 100) / 100);
    
    return res.status(200).json({
      regions,
      regionDescriptions,
      values,
      baseCosts,
      metadata: {
        buildingType,
        buildingTypeDescription: buildingType.toString().toUpperCase(),
        year: yearInt,
        squareFootage: sqftFloat,
        isDemo: true
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
    
    try {
      // Get cost matrix data for building type comparison
      const allMatrixData = await storage.getCostMatrices();
      
      // Filter and process the data
      const data = allMatrixData.filter((item: any) => {
        return (
          item.region === region &&
          item.year === yearInt &&
          (item.isActive === true || item.isActive === null)
        );
      })
      .sort((a: any, b: any) => a.buildingType.localeCompare(b.buildingType));
      
      // If data found, return it formatted correctly
      if (data.length > 0) {
        // Calculate cost for each building type based on square footage
        const buildingTypes = data.map((item: any) => item.buildingType);
        const buildingTypeLabels = data.map((item: any) => 
          item.buildingTypeDescription || `Building Type ${item.buildingType}`
        );
        const baseCosts = data.map((item: any) => parseFloat(item.baseRate.toString()));
        const values = data.map((item: any) => {
          const cost = parseFloat(item.baseRate.toString()) * sqftFloat;
          return Math.round(cost * 100) / 100; // Round to 2 decimal places
        });
        
        // Calculate cost per square foot for each building type
        const costPerSqft = data.map((item: any) => parseFloat(item.baseRate.toString()));
        
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
      }
    } catch (dbError) {
      console.error('Database error when fetching building type comparison data:', dbError);
      // Continue to fallback data below
    }
    
    // If we reach here, either no data was found or there was a database error
    // For development purposes, provide demonstration data
    console.log(`No building type comparison data found for ${region} in ${yearInt}, using development data instead`);
    
    // Create demo data for development purposes
    const buildingTypes = ['R1', 'R2', 'C1', 'C2', 'I1', 'A1'];
    const buildingTypeLabels = [
      'Single Family Residential', 
      'Multi-Family Residential', 
      'Commercial Retail', 
      'Commercial Office', 
      'Light Industrial',
      'Agricultural'
    ];
    
    // Generate reasonable base costs with some variation by region
    let regionMultiplier = 1.0;
    if (region === 'Western') regionMultiplier = 1.2;
    if (region === 'Eastern') regionMultiplier = 0.9;
    if (region === 'Northern') regionMultiplier = 1.1;
    if (region === 'Southern') regionMultiplier = 0.95;
    
    const baseCosts = [
      150 * regionMultiplier, 
      130 * regionMultiplier, 
      175 * regionMultiplier, 
      165 * regionMultiplier, 
      110 * regionMultiplier,
      90 * regionMultiplier
    ];
    
    // Calculate total values based on square footage
    const values = baseCosts.map(cost => Math.round(cost * sqftFloat * 100) / 100);
    
    return res.status(200).json({
      buildingTypes,
      buildingTypeLabels,
      values,
      baseCosts,
      costPerSqft: baseCosts,
      metadata: {
        region,
        regionDescription: `${region} Region`,
        year: yearInt,
        squareFootage: sqftFloat,
        isDemo: true
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

/**
 * Generate hierarchical cost data by building type
 * 
 * This endpoint provides hierarchical cost data that can be used to create
 * tree maps, sunburst charts, or other hierarchical visualizations.
 * 
 * @param req - Express request object containing query parameters:
 *   - buildingType: The type of building (e.g., 'residential', 'commercial')
 * @param res - Express response object
 * @returns JSON object with hierarchical cost data
 */
export async function getHierarchicalCostData(req: Request, res: Response) {
  try {
    const { buildingType } = req.query;
    
    try {
      // Get cost matrix data from storage
      const allMatrixData = await storage.getCostMatrices();
      
      // Filter by building type if provided
      const filteredData = buildingType 
        ? allMatrixData.filter((item: any) => item.buildingType === buildingType)
        : allMatrixData;
      
      // If data found, return it
      if (filteredData.length > 0) {
        // Group data by building type and region
        const hierarchicalData = {
          name: 'Building Costs',
          children: [] as any[]
        };
        
        // Get unique building types
        const buildingTypesSet = new Set<string>();
        filteredData.forEach((item: any) => {
          if (item.buildingType) buildingTypesSet.add(item.buildingType);
        });
        const buildingTypes = Array.from(buildingTypesSet);
        
        // Build the hierarchical structure
        buildingTypes.forEach(type => {
          const typeData = filteredData.filter((item: any) => item.buildingType === type);
          
          // Get unique regions
          const regionsSet = new Set<string>();
          typeData.forEach((item: any) => {
            if (item.region) regionsSet.add(item.region);
          });
          const regions = Array.from(regionsSet);
          
          const typeNode = {
            name: type,
            children: [] as any[]
          };
          
          regions.forEach(region => {
            const regionData = typeData.filter((item: any) => item.region === region);
            const avgCost = regionData.reduce((sum: number, item: any) => 
              sum + parseFloat(item.baseRate?.toString() || '0'), 0) / regionData.length;
            
            typeNode.children.push({
              name: region,
              value: Math.round(avgCost * 100) / 100,
              itemCount: regionData.length
            });
          });
          
          hierarchicalData.children.push(typeNode);
        });
        
        return res.status(200).json(hierarchicalData);
      }
    } catch (dbError) {
      console.error('Database error when fetching hierarchical cost data:', dbError);
      // Continue to fallback data below
    }
    
    // If we reach here, either no data was found or there was a database error
    // For development purposes, provide demonstration data
    console.log(`No hierarchical cost data found${buildingType ? ` for ${buildingType}` : ''}, using development data instead`);
    
    // Create demo hierarchical data
    const hierarchicalData = {
      name: 'Building Costs',
      children: [
        {
          name: 'Residential',
          children: [
            { name: 'Eastern', value: 120, itemCount: 15 },
            { name: 'Western', value: 150, itemCount: 18 },
            { name: 'Northern', value: 135, itemCount: 12 },
            { name: 'Southern', value: 125, itemCount: 10 }
          ]
        },
        {
          name: 'Commercial',
          children: [
            { name: 'Eastern', value: 165, itemCount: 22 },
            { name: 'Western', value: 195, itemCount: 25 },
            { name: 'Northern', value: 180, itemCount: 18 },
            { name: 'Southern', value: 170, itemCount: 15 }
          ]
        },
        {
          name: 'Industrial',
          children: [
            { name: 'Eastern', value: 110, itemCount: 8 },
            { name: 'Western', value: 130, itemCount: 12 },
            { name: 'Northern', value: 125, itemCount: 10 },
            { name: 'Southern', value: 115, itemCount: 7 }
          ]
        },
        {
          name: 'Agricultural',
          children: [
            { name: 'Eastern', value: 85, itemCount: 14 },
            { name: 'Western', value: 95, itemCount: 9 },
            { name: 'Northern', value: 90, itemCount: 11 },
            { name: 'Southern', value: 80, itemCount: 8 }
          ]
        }
      ]
    };
    
    // If buildingType is specified, filter the demo data
    if (buildingType) {
      const filteredChildren = hierarchicalData.children.filter(child => 
        child.name.toLowerCase() === buildingType.toString().toLowerCase());
      
      if (filteredChildren.length > 0) {
        hierarchicalData.children = filteredChildren;
      }
    }
    
    return res.status(200).json({
      ...hierarchicalData,
      isDemo: true
    });
  } catch (error) {
    console.error('Error generating hierarchical cost data:', error);
    return res.status(500).json({ error: 'Error generating hierarchical cost data' });
  }
}

/**
 * Generate statistical correlation data for cost factors
 * 
 * This endpoint provides statistical correlations between different factors
 * affecting building costs, useful for correlation matrices and scatter plots.
 * 
 * @param req - Express request object containing query parameters:
 *   - buildingType: The type of building
 *   - startYear: Starting year for the analysis
 *   - endYear: Ending year for the analysis
 * @param res - Express response object
 * @returns JSON object with correlation data
 */
export async function getStatisticalCorrelationData(req: Request, res: Response) {
  try {
    const { buildingType, startYear, endYear } = req.query;
    
    // Validate parameters
    if (!buildingType) {
      return res.status(400).json({ error: 'Missing required parameter: buildingType' });
    }
    
    // Parse years if provided
    const start = startYear ? parseInt(startYear as string) : 2015;
    const end = endYear ? parseInt(endYear as string) : new Date().getFullYear();
    
    try {
      // Get cost matrix data from storage
      const allMatrixData = await storage.getCostMatrices();
      
      // Filter data based on parameters
      const filteredData = allMatrixData.filter((item: any) => {
        return item.buildingType === buildingType && 
              (!startYear || item.year >= start) &&
              (!endYear || item.year <= end);
      });
      
      // If data found, process and return it
      if (filteredData.length > 0) {
        // Create correlation data between year and cost
        const yearCostCorrelation = {
          id: 'year_cost',
          title: 'Year vs Cost',
          type: 'scatter',
          xAxis: 'Year',
          yAxis: 'Base Cost ($/sqft)',
          series: filteredData.map((item: any) => ({
            x: item.year,
            y: parseFloat(item.baseRate.toString()),
            region: item.region
          }))
        };
        
        // Create correlation data between regions
        const regionData: {
          id: string;
          title: string;
          type: string;
          xAxis: string;
          yAxis: string;
          categories: string[];
          series: Array<{name: string, value: number}>;
        } = {
          id: 'region_comparison',
          title: 'Regional Cost Comparison',
          type: 'bar',
          xAxis: 'Region',
          yAxis: 'Base Cost ($/sqft)',
          categories: [],
          series: []
        };
        
        // Get unique regions
        const regionsSet = new Set<string>();
        filteredData.forEach((item: any) => {
          if (item.region) regionsSet.add(item.region);
        });
        const regions = Array.from(regionsSet);
        
        // Set categories
        regionData.categories = regions;
        
        // Calculate average costs per region
        regionData.series = regions.map(region => {
          const regionItems = filteredData.filter((item: any) => item.region === region);
          const avgCost = regionItems.reduce((sum: number, item: any) => 
            sum + parseFloat(item.baseRate.toString()), 0) / regionItems.length;
          
          return {
            name: region,
            value: Math.round(avgCost * 100) / 100
          };
        });
        
        return res.status(200).json({
          correlations: [yearCostCorrelation, regionData],
          metadata: {
            buildingType,
            startYear: start,
            endYear: end,
            dataPoints: filteredData.length
          }
        });
      }
    } catch (dbError) {
      console.error('Database error when fetching statistical correlation data:', dbError);
      // Continue to fallback data below
    }
    
    // If we reach here, either no data was found or there was a database error
    // For development purposes, provide demonstration data
    console.log(`No statistical correlation data found for ${buildingType} between ${start}-${end}, using development data instead`);
    
    // Create demo data for time series
    const yearCostCorrelation = {
      id: 'year_cost',
      title: 'Year vs Cost',
      type: 'scatter',
      xAxis: 'Year',
      yAxis: 'Base Cost ($/sqft)',
      series: []
    };
    
    // Generate points for the last 5 years with slight upward trend
    const regions = ['Eastern', 'Western', 'Northern', 'Southern'];
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 5}, (_, i) => currentYear - 4 + i);
    
    // Base costs by building type
    let baseCost = 100;
    if (buildingType === 'R1' || buildingType === 'residential') baseCost = 130;
    if (buildingType === 'R2' || buildingType === 'multi-family') baseCost = 115;
    if (buildingType === 'C1' || buildingType === 'commercial') baseCost = 165;
    if (buildingType === 'I1' || buildingType === 'industrial') baseCost = 140;
    if (buildingType === 'A1' || buildingType === 'agricultural') baseCost = 85;
    
    // Generate series data
    regions.forEach(region => {
      // Regional adjustment factor
      let regionFactor = 1.0;
      if (region === 'Western') regionFactor = 1.15;
      if (region === 'Eastern') regionFactor = 0.9;
      if (region === 'Northern') regionFactor = 1.05;
      if (region === 'Southern') regionFactor = 0.95;
      
      years.forEach(year => {
        // Calculate cost with yearly inflation of about 3%
        const yearOffset = year - currentYear + 4; // 0 to 4
        const yearFactor = 1 + (yearOffset * 0.03);
        const cost = baseCost * regionFactor * yearFactor;
        
        // Add some random variation (+/- 5%)
        const randomFactor = 0.95 + (Math.random() * 0.1);
        const finalCost = Math.round(cost * randomFactor * 100) / 100;
        
        yearCostCorrelation.series.push({
          x: year,
          y: finalCost,
          region: region
        });
      });
    });
    
    // Create region comparison data
    const regionData = {
      id: 'region_comparison',
      title: 'Regional Cost Comparison',
      type: 'bar',
      xAxis: 'Region',
      yAxis: 'Base Cost ($/sqft)',
      categories: regions,
      series: regions.map(region => {
        // Calculate average cost for this region
        let regionFactor = 1.0;
        if (region === 'Western') regionFactor = 1.15;
        if (region === 'Eastern') regionFactor = 0.9;
        if (region === 'Northern') regionFactor = 1.05;
        if (region === 'Southern') regionFactor = 0.95;
        
        const avgCost = baseCost * regionFactor;
        
        return {
          name: region,
          value: Math.round(avgCost * 100) / 100
        };
      })
    };
    
    return res.status(200).json({
      correlations: [yearCostCorrelation, regionData],
      metadata: {
        buildingType: buildingType.toString(),
        startYear: start,
        endYear: end,
        isDemo: true
      }
    });
  } catch (error) {
    console.error('Error generating statistical correlation data:', error);
    return res.status(500).json({ error: 'Error generating statistical correlation data' });
  }
}

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