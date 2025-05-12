/**
 * Cost Factor Tables Plugin Controller
 * 
 * This file implements the controller functions for the Cost Factor Tables plugin
 */

import { Request, Response } from 'express';
import { costFactorTables } from '../../services/costEngine/CostFactorTables';
import { costFactorLoader } from '../../services/costEngine/costFactorLoader';

/**
 * Get all cost factors with optional filtering
 */
export function getCostFactors(req: Request, res: Response) {
  try {
    const factors = costFactorTables.getAllFactors();
    
    res.json({
      success: true,
      source: costFactorTables.getSource(),
      year: costFactorTables.getYear(),
      data: factors
    });
  } catch (error) {
    console.error('Error getting cost factors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cost factors',
      error: (error as Error).message
    });
  }
}

/**
 * Get cost factors for a specific type
 */
export function getCostFactorsByType(req: Request, res: Response) {
  const { factorType } = req.params;
  
  try {
    const factors = costFactorTables.getAllFactors();
    
    if (!factors) {
      return res.status(500).json({
        success: false,
        message: 'Cost factors not initialized'
      });
    }
    
    // Get the specific factor type data based on the parameter
    let specificFactors: Record<string, number> = {};
    
    switch(factorType.toLowerCase()) {
      case 'region':
      case 'regions':
        specificFactors = factors.regionFactors;
        break;
      case 'quality':
        specificFactors = factors.qualityFactors;
        break;
      case 'condition':
        specificFactors = factors.conditionFactors;
        break;
      case 'baserate':
      case 'baserates':
        specificFactors = factors.baseRates;
        break;
      case 'age':
      case 'aging':
        specificFactors = factors.agingFactors;
        break;
      case 'complexity':
        // Return the entire complexity structure
        return res.json({
          success: true,
          source: costFactorTables.getSource(),
          factorType,
          data: factors.complexityFactors
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown factor type: ${factorType}`
        });
    }
    
    res.json({
      success: true,
      source: costFactorTables.getSource(),
      factorType,
      data: specificFactors
    });
  } catch (error) {
    console.error(`Error getting ${factorType} factors:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to get ${factorType} factors`,
      error: (error as Error).message
    });
  }
}

/**
 * Get available cost factor sources
 */
export function getCostFactorSources(req: Request, res: Response) {
  try {
    // In the current implementation, we only have one source
    // When we add more, we can enhance this function
    const sources = [costFactorTables.getSource()];
    
    res.json({
      success: true,
      data: sources,
      current: costFactorTables.getSource()
    });
  } catch (error) {
    console.error('Error getting cost factor sources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cost factor sources',
      error: (error as Error).message
    });
  }
}

/**
 * Get the current cost factor source
 */
export function getCurrentSource(req: Request, res: Response) {
  try {
    const source = costFactorTables.getSource();
    
    res.json({
      success: true,
      data: source
    });
  } catch (error) {
    console.error('Error getting current cost factor source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current cost factor source',
      error: (error as Error).message
    });
  }
}

/**
 * Set the current cost factor source
 */
export function setCurrentSource(req: Request, res: Response) {
  const { source } = req.body;
  
  if (!source) {
    return res.status(400).json({
      success: false,
      message: 'Source is required'
    });
  }
  
  try {
    // In the current implementation, we don't support changing sources at runtime
    // This is a placeholder for future enhancement
    const currentSource = costFactorTables.getSource();
    
    if (source !== currentSource) {
      return res.status(400).json({
        success: false,
        message: `Cannot change source at runtime. Current source: ${currentSource}`
      });
    }
    
    res.json({
      success: true,
      message: `Cost factor source is ${source}`,
      data: source
    });
  } catch (error) {
    console.error('Error setting cost factor source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set cost factor source',
      error: (error as Error).message
    });
  }
}

/**
 * Get a specific cost factor value
 */
export function getCostFactorValue(req: Request, res: Response) {
  const { factorType, code } = req.params;
  
  try {
    const factors = costFactorTables.getAllFactors();
    
    if (!factors) {
      return res.status(500).json({
        success: false,
        message: 'Cost factors not initialized'
      });
    }
    
    let value: number | null = null;
    
    // Get the specific factor value based on the type and code
    switch(factorType.toLowerCase()) {
      case 'region':
      case 'regions':
        value = factors.regionFactors[code] || null;
        break;
      case 'quality':
        value = factors.qualityFactors[code] || null;
        break;
      case 'condition':
        value = factors.conditionFactors[code] || null;
        break;
      case 'baserate':
      case 'baserates':
        value = factors.baseRates[code] || null;
        break;
      case 'age':
      case 'aging':
        value = factors.agingFactors[code] || null;
        break;
      case 'complexity':
        // For complexity, we need to determine the subcategory
        const [subcategory, subcode] = code.split(':');
        if (subcategory && subcode) {
          // Check if it's a valid complexity factor category
          switch(subcategory.toUpperCase()) {
            case 'STORIES':
              value = factors.complexityFactors.STORIES[subcode] || null;
              break;
            case 'FOUNDATION':
              value = factors.complexityFactors.FOUNDATION[subcode] || null;
              break;
            case 'ROOF':
              value = factors.complexityFactors.ROOF[subcode] || null;
              break;
            case 'HVAC':
              value = factors.complexityFactors.HVAC[subcode] || null;
              break;
          }
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown factor type: ${factorType}`
        });
    }
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        message: `Factor not found for type=${factorType}, code=${code}`
      });
    }
    
    res.json({
      success: true,
      source: costFactorTables.getSource(),
      factorType,
      code,
      value
    });
  } catch (error) {
    console.error('Error getting cost factor value:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cost factor value',
      error: (error as Error).message
    });
  }
}