import { Request, Response } from 'express';
import { CostFactorTables } from '../../services/costEngine/CostFactorTables';

// Create a singleton instance of CostFactorTables service
const costFactorTablesService = new CostFactorTables();

/**
 * Initialize the CostFactorTables service
 * This should be called during application startup
 */
export const initialize = async () => {
  try {
    await costFactorTablesService.initialize();
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
export const getCostFactorSources = async (req: Request, res: Response) => {
  try {
    const sources = await costFactorTablesService.getSources();
    return res.status(200).json({
      success: true,
      data: sources
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
export const getCostFactorsBySource = async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.params;
    const factors = await costFactorTablesService.getFactorsBySource(sourceId);
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
export const getCostFactorsByType = async (req: Request, res: Response) => {
  try {
    const { buildingType } = req.params;
    const factors = await costFactorTablesService.getFactorsByType(buildingType);
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
export const getCostFactorValue = async (req: Request, res: Response) => {
  try {
    const { category, name, qualityGrade } = req.params;
    const region = req.query.region as string || 'default';
    const buildingType = req.query.buildingType as string || 'default';
    
    const value = await costFactorTablesService.getCostFactorValue(
      category, 
      name, 
      qualityGrade, 
      region, 
      buildingType
    );
    
    return res.status(200).json({
      success: true,
      data: {
        category,
        name,
        qualityGrade,
        region,
        buildingType,
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
export const getRatingTable = async (req: Request, res: Response) => {
  try {
    const { tableType } = req.params;
    const table = await costFactorTablesService.getRatingTable(tableType);
    return res.status(200).json({
      success: true,
      data: table
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