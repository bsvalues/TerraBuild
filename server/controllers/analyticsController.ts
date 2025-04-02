/**
 * Analytics Controller
 * 
 * This controller handles all analytics-related endpoints including:
 * - Time series analysis for cost trends
 * - Regional cost comparisons
 * - Building type comparisons
 * - Cost breakdown analysis
 */

import { Request, Response } from 'express';
import { storage } from '../storage';
import { and, between, eq, sql } from 'drizzle-orm';

/**
 * Generate time series data for cost trends
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
    
    // Format the response
    const formattedData = data.map((item: any) => ({
      date: item.matrixYear.toString(),
      value: parseFloat(item.baseCost)
    }));
    
    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error generating time series data:', error);
    return res.status(500).json({ error: 'Error generating time series data' });
  }
}

/**
 * Generate regional comparison data
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
    
    // Get cost matrix data for regional comparison
    const allMatrixData = await storage.getAllCostMatrix();
    
    // Filter and process the data
    const yearInt = parseInt(year as string);
    const data = allMatrixData.filter((item: any) => {
      return (
        item.buildingType === buildingType &&
        item.matrixYear === yearInt &&
        item.isActive === true
      );
    })
    .sort((a, b) => a.region.localeCompare(b.region));
    
    // Calculate cost for each region based on square footage
    const regions = data.map((item: any) => item.region);
    const values = data.map((item: any) => {
      const cost = parseFloat(item.baseCost) * parseFloat(squareFootage as string);
      return Math.round(cost * 100) / 100; // Round to 2 decimal places
    });
    
    return res.status(200).json({ regions, values });
  } catch (error) {
    console.error('Error generating regional comparison:', error);
    return res.status(500).json({ error: 'Error generating regional comparison' });
  }
}

/**
 * Generate building type comparison data
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
    
    // Get cost matrix data for building type comparison
    const allMatrixData = await storage.getAllCostMatrix();
    
    // Filter and process the data
    const yearInt = parseInt(year as string);
    const data = allMatrixData.filter((item: any) => {
      return (
        item.region === region &&
        item.matrixYear === yearInt &&
        item.isActive === true
      );
    })
    .sort((a, b) => a.buildingType.localeCompare(b.buildingType));
    
    // Calculate cost for each building type based on square footage
    const buildingTypes = data.map((item: any) => item.buildingType);
    const buildingTypeLabels = data.map((item: any) => item.buildingTypeDescription);
    const values = data.map((item: any) => {
      const cost = parseFloat(item.baseCost) * parseFloat(squareFootage as string);
      return Math.round(cost * 100) / 100; // Round to 2 decimal places
    });
    
    return res.status(200).json({ 
      buildingTypes, 
      buildingTypeLabels,
      values 
    });
  } catch (error) {
    console.error('Error generating building type comparison:', error);
    return res.status(500).json({ error: 'Error generating building type comparison' });
  }
}

/**
 * Get cost breakdown for a specific calculation
 */
export async function getCostBreakdown(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing calculation ID' });
    }
    
    // Get the calculation from storage
    const calc = await storage.getBuildingCost(parseInt(id));
    
    if (!calc) {
      return res.status(404).json({ error: 'Calculation not found' });
    }
    const totalCost = parseFloat(calc.totalCost);
    
    // Calculate breakdown percentages based on industry standards
    // In a real application, this would come from the database or calculation engine
    const materials = totalCost * 0.65; // 65% materials
    const labor = totalCost * 0.25;     // 25% labor
    const permits = totalCost * 0.05;   // 5% permits
    const other = totalCost * 0.05;     // 5% other costs
    
    // Format response data
    const categories = ['materials', 'labor', 'permits', 'other'];
    const values = [
      Math.round(materials * 100) / 100,
      Math.round(labor * 100) / 100,
      Math.round(permits * 100) / 100,
      Math.round(other * 100) / 100
    ];
    
    return res.status(200).json({
      calculationId: calc.id,
      totalCost,
      categories,
      values,
      percentages: [65, 25, 5, 5] // Hardcoded for now, would be dynamic in real app
    });
  } catch (error) {
    console.error('Error generating cost breakdown:', error);
    return res.status(500).json({ error: 'Error generating cost breakdown' });
  }
}