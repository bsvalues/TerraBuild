import { Request, Response } from 'express';
import { CostFactorTables } from '../../services/costEngine/CostFactorTables';

// Create a singleton instance of CostFactorTables service
const costFactorTablesService = new CostFactorTables();

/**
 * Initialize the CostFactorTables service
 * This should be called during application startup
 */
export const initialize = () => {
  try {
    // CostFactorTables is already initialized in the constructor
    return true;
  } catch (error) {
    console.error('Error initializing CostFactorTables service:', error);
    return false;
  }
};

/**
 * Get all available cost factor sources
 * @param req - Express request object
 * @param res - Express response object
 */
export const getCostFactorSources = (req: Request, res: Response) => {
  try {
    const sources = costFactorTablesService.getAvailableSources();
    
    // Format the sources as objects with id and name properties
    const formattedSources = sources.map(source => ({
      id: source,
      name: source.charAt(0).toUpperCase() + source.slice(1),
      year: 2025,
      description: `Cost factors from ${source.charAt(0).toUpperCase() + source.slice(1)} source`
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedSources
    });
  } catch (error) {
    console.error('Error fetching cost factor sources:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching cost factor sources',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get all cost factors for a specific source
 * @param req - Express request object with sourceId parameter
 * @param res - Express response object
 */
export const getCostFactorsBySource = (req: Request, res: Response) => {
  try {
    const { sourceId } = req.params;
    
    // Try to get all factors from this source
    const allFactors = costFactorTablesService.getAllFactors(sourceId);
    
    // Transform the data format to match what the client expects
    const factors: Array<{
      id: number;
      source: string;
      year: number;
      category: string;
      name: string;
      code: string;
      qualityGrade: string;
      region: string;
      buildingType: string;
      value: number;
      description?: string;
    }> = [];
    
    // Add region factors
    Object.entries(allFactors.regionFactors).forEach(([code, value]) => {
      factors.push({
        id: factors.length + 1,
        source: sourceId,
        year: allFactors.year,
        category: 'region',
        name: `Region ${code}`,
        code,
        qualityGrade: 'N/A',
        region: code,
        buildingType: 'ALL',
        value,
        description: `Regional cost factor for ${code}`
      });
    });
    
    // Add quality factors
    Object.entries(allFactors.qualityFactors).forEach(([code, value]) => {
      factors.push({
        id: factors.length + 1,
        source: sourceId,
        year: allFactors.year,
        category: 'quality',
        name: `Quality ${code}`,
        code,
        qualityGrade: code,
        region: 'ALL',
        buildingType: 'ALL',
        value,
        description: `Quality grade factor for ${code}`
      });
    });
    
    // Add condition factors
    Object.entries(allFactors.conditionFactors).forEach(([code, value]) => {
      factors.push({
        id: factors.length + 1,
        source: sourceId,
        year: allFactors.year,
        category: 'condition',
        name: `Condition ${code}`,
        code,
        qualityGrade: 'N/A',
        region: 'ALL',
        buildingType: 'ALL',
        value,
        description: `Condition factor for ${code}`
      });
    });
    
    // Add base rates
    Object.entries(allFactors.baseRates).forEach(([code, value]) => {
      factors.push({
        id: factors.length + 1,
        source: sourceId,
        year: allFactors.year,
        category: 'baseRate',
        name: `Base Rate ${code}`,
        code,
        qualityGrade: 'N/A',
        region: 'ALL',
        buildingType: code,
        value,
        description: `Base rate for building type ${code}`
      });
    });
    
    return res.status(200).json({
      success: true,
      data: factors
    });
  } catch (error) {
    console.error(`Error fetching cost factors for source ${req.params.sourceId}:`, error);
    return res.status(500).json({
      success: false,
      message: `Error fetching cost factors for source ${req.params.sourceId}`,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get all cost factors for a specific building type
 * @param req - Express request object with buildingType parameter
 * @param res - Express response object
 */
export const getCostFactorsByType = (req: Request, res: Response) => {
  try {
    const { buildingType } = req.params;
    const sourceParam = req.query.source as string || 'bentonCounty'; // Default to bentonCounty if not specified
    
    // Get all factors from the source
    const allFactors = costFactorTablesService.getAllFactors(sourceParam);
    
    // Extract base rate for this building type
    const baseRate = allFactors.baseRates[buildingType] || null;
    
    // Create a standardized response format
    const factors: Array<{
      id: number;
      source: string;
      year: number;
      category: string;
      name: string;
      code: string;
      qualityGrade: string;
      region: string;
      buildingType: string;
      value: number;
      description?: string;
    }> = [];
    
    // Add the base rate if it exists
    if (baseRate !== null) {
      factors.push({
        id: 1,
        source: sourceParam,
        year: allFactors.year,
        category: 'baseRate',
        name: `Base Rate ${buildingType}`,
        code: buildingType,
        qualityGrade: 'N/A',
        region: 'ALL',
        buildingType,
        value: baseRate,
        description: `Base rate for building type ${buildingType}`
      });
    }
    
    // Add quality factors that apply to all building types
    Object.entries(allFactors.qualityFactors).forEach(([code, value], index) => {
      factors.push({
        id: factors.length + 1,
        source: sourceParam,
        year: allFactors.year,
        category: 'quality',
        name: `Quality ${code}`,
        code,
        qualityGrade: code,
        region: 'ALL',
        buildingType,
        value,
        description: `Quality grade factor for ${code}`
      });
    });
    
    // Add condition factors that apply to all building types
    Object.entries(allFactors.conditionFactors).forEach(([code, value]) => {
      factors.push({
        id: factors.length + 1,
        source: sourceParam,
        year: allFactors.year,
        category: 'condition',
        name: `Condition ${code}`,
        code,
        qualityGrade: 'N/A',
        region: 'ALL',
        buildingType,
        value,
        description: `Condition factor for ${code}`
      });
    });
    
    return res.status(200).json({
      success: true,
      data: factors
    });
  } catch (error) {
    console.error(`Error fetching cost factors for building type ${req.params.buildingType}:`, error);
    return res.status(500).json({
      success: false,
      message: `Error fetching cost factors for building type ${req.params.buildingType}`,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get a specific cost factor value
 * @param req - Express request object with category, name, and qualityGrade parameters
 * @param res - Express response object
 */
export const getCostFactorValue = (req: Request, res: Response) => {
  try {
    const { category, name } = req.params;
    const source = req.query.source as string || 'bentonCounty'; // Default source
    
    // Determine the code based on the name or use the name directly if it's a code
    const code = name;
    
    // Get the factor value using the service
    const value = costFactorTablesService.getFactorValue(source, category, code);
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        message: `Cost factor not found for category: ${category}, name: ${name}, source: ${source}`
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        category,
        name,
        code,
        source,
        value
      }
    });
  } catch (error) {
    console.error('Error fetching cost factor value:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching cost factor value',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get rating table (quality, condition, etc.)
 * @param req - Express request object with tableType parameter
 * @param res - Express response object
 */
export const getRatingTable = (req: Request, res: Response) => {
  try {
    const { tableType } = req.params;
    const source = req.query.source as string || 'bentonCounty'; // Default source
    
    // Get factors by type from the service
    const factorsByType = costFactorTablesService.getFactorsByType(source, tableType.toLowerCase());
    
    // Format the table data
    let formattedTable: {
      id: string;
      name: string;
      description: string;
      values: Record<string, number>;
    } = {
      id: `${source}-${tableType}`,
      name: `${tableType.charAt(0).toUpperCase() + tableType.slice(1)} Factors`,
      description: `Rating table for ${tableType}`,
      values: {}
    };
    
    // Handle complex table formats like complexity factors
    if (tableType.toLowerCase() === 'complexity') {
      // For complexity factors, we need to format each category
      // Complexity factors are nested by category
      const complexityFactors = factorsByType as Record<string, Record<string, number>>;
      
      Object.entries(complexityFactors).forEach(([category, values]) => {
        Object.entries(values).forEach(([key, value]) => {
          formattedTable.values[`${category}.${key}`] = value;
        });
      });
    } else {
      // For simple factor types (quality, condition, etc.)
      formattedTable.values = factorsByType as Record<string, number>;
    }
    
    return res.status(200).json({
      success: true,
      data: formattedTable
    });
  } catch (error) {
    console.error(`Error fetching rating table ${req.params.tableType}:`, error);
    return res.status(500).json({
      success: false,
      message: `Error fetching rating table ${req.params.tableType}`,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};