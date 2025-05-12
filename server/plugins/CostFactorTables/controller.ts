/**
 * Cost Factor Tables Plugin Controller
 * 
 * Handles API requests for cost factor tables
 */

import { Request, Response } from 'express';
import * as CostFactorTables from '../../services/costEngine/CostFactorTables';
import { 
  getCostSource, 
  setCostSource, 
  getAvailableSources, 
  isCostSourceAvailable 
} from '../../services/costEngine/costFactorLoader';

/**
 * Get cost factors for the specified source
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getCostFactors = (req: Request, res: Response) => {
  try {
    // Get source from query params or use current source
    const source = req.query.source as string || getCostSource();
    
    // Get optional property type and region filters
    const propertyType = req.query.propertyType as string;
    const region = req.query.region as string;
    
    // Get cost factors with optional filters
    const factors = CostFactorTables.getCostFactors(source, propertyType, region);
    
    res.json({
      success: true,
      source,
      factors
    });
  } catch (error) {
    console.error('Error getting cost factors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cost factors'
    });
  }
};

/**
 * Get the current cost source
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getCurrentSource = (req: Request, res: Response) => {
  try {
    const source = getCostSource();
    
    res.json({
      success: true,
      source
    });
  } catch (error) {
    console.error('Error getting current cost source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current cost source'
    });
  }
};

/**
 * Get available cost sources
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getAvailableCostSources = (req: Request, res: Response) => {
  try {
    const sources = getAvailableSources();
    
    res.json({
      success: true,
      sources
    });
  } catch (error) {
    console.error('Error getting available cost sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available cost sources'
    });
  }
};

/**
 * Update the current cost source
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updateCostSource = (req: Request, res: Response) => {
  try {
    const { source } = req.body;
    
    // Validate source
    if (!source) {
      return res.status(400).json({
        success: false,
        error: 'Source is required'
      });
    }
    
    // Check if source is available
    if (!isCostSourceAvailable(source)) {
      return res.status(400).json({
        success: false,
        error: `Source "${source}" is not available`
      });
    }
    
    // Update the cost source
    const success = setCostSource(source);
    
    if (success) {
      res.json({
        success: true,
        source
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update cost source'
      });
    }
  } catch (error) {
    console.error('Error updating cost source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cost source'
    });
  }
};