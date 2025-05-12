/**
 * Cost Factor Tables Controller
 * 
 * This controller handles the business logic for the cost factor tables plugin.
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import costFactorTablesService from '../../services/costEngine/CostFactorTables';
import { getCostSource, loadCostFactors, getAvailableSources } from '../../services/costEngine/costFactorLoader';

/**
 * Get cost factors based on current source
 */
export async function getCostFactors(req: Request, res: Response) {
  try {
    const source = req.query.source as string || getCostSource();
    const propertyType = req.query.propertyType as string;
    const region = req.query.region as string;
    
    // If property type and region are provided, get specific factors
    if (propertyType && region) {
      const factors = await costFactorTablesService.getFactors(propertyType, region);
      return res.json({ success: true, source, factors });
    }
    
    // Otherwise get all factors
    const factors = await costFactorTablesService.getAllFactors();
    return res.json({ success: true, source, factors });
  } catch (error) {
    console.error('Error retrieving cost factors:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve cost factors',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get current cost source
 */
export function getCurrentSource(req: Request, res: Response) {
  try {
    const source = getCostSource();
    res.json({ success: true, source });
  } catch (error) {
    console.error('Error retrieving current cost source:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve current cost source',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get available cost sources
 */
export function getAvailableCostSources(req: Request, res: Response) {
  try {
    const sources = getAvailableSources();
    res.json({ success: true, sources });
  } catch (error) {
    console.error('Error retrieving available cost sources:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve available cost sources',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Update current cost source
 */
export function updateCostSource(req: Request, res: Response) {
  try {
    const { source } = req.body;
    
    if (!source) {
      return res.status(400).json({ 
        success: false, 
        error: 'Source parameter is required' 
      });
    }
    
    // Validate source is available
    const availableSources = getAvailableSources();
    if (!availableSources.includes(source)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid source: ${source}. Available sources: ${availableSources.join(', ')}` 
      });
    }
    
    // Update terra.json
    const configPath = path.resolve('./terra.json');
    let config;
    
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configFile);
      
      // Update costSource
      if (!config.costEngine) {
        config.costEngine = {};
      }
      
      config.costEngine.costSource = source;
      
      // Write updated config
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      return res.json({ success: true, source });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Configuration file not found' 
      });
    }
  } catch (error) {
    console.error('Error updating cost source:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update cost source',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}