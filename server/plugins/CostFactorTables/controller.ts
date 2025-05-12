/**
 * Cost Factor Tables Plugin Controller
 * 
 * This file implements the controller functions for the Cost Factor Tables plugin
 */

import { Request, Response } from 'express';
import {
  getCostFactors as getFactors,
  getCostFactorValue as getFactorValue,
  getCostSource,
  setCostSource,
  getAvailableSources,
  COST_SOURCES
} from '../../services/costEngine/CostFactorTables';

/**
 * Get all cost factors with optional filtering
 */
export function getCostFactors(req: Request, res: Response) {
  const { source, propertyType, region } = req.query;
  
  try {
    const factors = getFactors(
      source as string, 
      propertyType as string, 
      region as string
    );
    
    res.json({
      success: true,
      source: source || getCostSource(),
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
  const { source } = req.query;
  
  try {
    const factors = getFactors(source as string || getCostSource());
    
    // Filter factors by type
    const filteredFactors = factors.filter(factor => 
      factor.factorType === factorType
    );
    
    res.json({
      success: true,
      source: source || getCostSource(),
      factorType,
      data: filteredFactors
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
    const sources = getAvailableSources();
    
    res.json({
      success: true,
      data: sources,
      current: getCostSource()
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
    const source = getCostSource();
    
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
    const success = setCostSource(source);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: `Invalid or unavailable source: ${source}`
      });
    }
    
    res.json({
      success: true,
      message: `Cost factor source set to ${source}`,
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
  const { source, factorType, code } = req.params;
  
  try {
    const factors = getFactors(source);
    
    // Find the specific factor
    const factor = factors.find(f => 
      f.factorType === factorType && f.code === code
    );
    
    if (!factor) {
      return res.status(404).json({
        success: false,
        message: `Factor not found for source=${source}, type=${factorType}, code=${code}`
      });
    }
    
    res.json({
      success: true,
      source,
      factorType,
      code,
      data: factor
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