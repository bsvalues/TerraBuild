/**
 * Cost Factor Loader
 * Loads cost factors from JSON file based on configured source
 */

import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Get application config
let config: any;
try {
  const configPath = path.resolve('./terra.json');
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configFile);
  } else {
    console.warn('terra.json not found, using default configuration');
    config = { 
      costEngine: { 
        costSource: 'marshallSwift',
        dataFile: 'data/costFactors.json'
      } 
    };
  }
} catch (error) {
  console.error('Error loading configuration:', error);
  config = { 
    costEngine: { 
      costSource: 'marshallSwift',
      dataFile: 'data/costFactors.json'
    } 
  };
}

// Cost source validation schema
const CostSourceSchema = z.enum(['marshallSwift', 'rsmeans']);
type CostSource = z.infer<typeof CostSourceSchema>;

// Cost factors schema
const CostFactorsSchema = z.object({
  version: z.string(),
  lastUpdated: z.string(),
  description: z.string(),
  marshallSwift: z.record(z.string(), z.any()),
  rsmeans: z.record(z.string(), z.any())
});

/**
 * Get the cost source from config
 */
export function getCostSource(): CostSource {
  try {
    const source = config?.costEngine?.costSource || 'marshallSwift';
    return CostSourceSchema.parse(source);
  } catch (error) {
    console.warn(`Invalid cost source in config, using fallback: marshallSwift`);
    return 'marshallSwift';
  }
}

/**
 * Load cost factors from the configured JSON file
 */
export function loadCostFactors(source?: CostSource): Record<string, any> {
  // Use provided source or get from config
  const costSource = source || getCostSource();
  
  try {
    // Resolve path to data file
    const dataFilePath = path.resolve(config?.costEngine?.dataFile || 'data/costFactors.json');
    
    // Check if file exists
    if (!fs.existsSync(dataFilePath)) {
      console.error(`Cost factors data file not found: ${dataFilePath}`);
      return {};
    }
    
    // Load and parse the JSON data
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const factorsData = JSON.parse(data);
    
    // Validate data format
    const validatedData = CostFactorsSchema.parse(factorsData);
    
    // Return factors for the specified source
    return validatedData[costSource] || {};
  } catch (error) {
    console.error(`Error loading cost factors for ${costSource}:`, error);
    return {};
  }
}

/**
 * Check if a cost source is available
 */
export function isCostSourceAvailable(source: CostSource): boolean {
  try {
    const factors = loadCostFactors(source);
    // Check if there's at least some data in the source
    return Object.keys(factors).length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get available cost sources
 */
export function getAvailableSources(): CostSource[] {
  const availableSources: CostSource[] = [];
  
  if (isCostSourceAvailable('marshallSwift')) {
    availableSources.push('marshallSwift');
  }
  
  if (isCostSourceAvailable('rsmeans')) {
    availableSources.push('rsmeans');
  }
  
  return availableSources;
}