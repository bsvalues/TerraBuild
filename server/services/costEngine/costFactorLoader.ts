/**
 * Cost Factor Loader Service
 * 
 * This service handles loading cost factor data from different sources
 * and provides a unified API for accessing cost factors.
 */

import * as fs from 'fs';
import * as path from 'path';

// Define supported cost sources
export const COST_SOURCES = {
  MARSHALL_SWIFT: 'marshallSwift',
  RS_MEANS: 'rsMeans',
  COST_FACTO: 'costFacto',
  BENTON_COUNTY: 'bentonCounty'
};

// Current selected cost source
let currentCostSource = COST_SOURCES.MARSHALL_SWIFT;

// Cache for loaded cost factor data
const costFactorCache: Record<string, any> = {};

/**
 * Load cost factor data from a source
 * @param {string} source - The cost data source
 * @returns {any} The cost factor data
 */
export function loadCostFactorData(source: string): any {
  // Check if the data is already in the cache
  if (costFactorCache[source]) {
    return costFactorCache[source];
  }

  try {
    // Determine file path based on source
    let filePath;
    switch (source) {
      case COST_SOURCES.MARSHALL_SWIFT:
        filePath = path.resolve('./data/marshallSwift.json');
        break;
      case COST_SOURCES.RS_MEANS:
        filePath = path.resolve('./data/rsMeans.json');
        break;
      case COST_SOURCES.COST_FACTO:
        filePath = path.resolve('./data/costFacto.json');
        break;
      case COST_SOURCES.BENTON_COUNTY:
        filePath = path.resolve('./data/bentonCounty.json');
        break;
      default:
        throw new Error(`Unsupported cost source: ${source}`);
    }

    // If file doesn't exist, try to load from terra.json
    if (!fs.existsSync(filePath)) {
      const terraFilePath = path.resolve('./terra.json');
      if (fs.existsSync(terraFilePath)) {
        const terraData = JSON.parse(fs.readFileSync(terraFilePath, 'utf-8'));
        if (terraData.costFactors && terraData.costFactors[source]) {
          // Cache the data and return it
          costFactorCache[source] = terraData.costFactors[source];
          return terraData.costFactors[source];
        }
      }
      
      // If source is not found in terra.json, create a fallback data structure
      if (source === COST_SOURCES.MARSHALL_SWIFT) {
        // Create directory if it doesn't exist
        const dataDir = path.resolve('./data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Create default data for Marshall Swift
        const defaultData = {
          baseRates: [
            { code: 'R1', description: 'Single Family Residence', value: 125.50 },
            { code: 'C1', description: 'Commercial Office Building', value: 185.75 },
            { code: 'I1', description: 'Light Industrial', value: 95.25 }
          ],
          regionalFactors: [
            { code: 'BING', description: 'Bingham County', value: 1.15 },
            { code: 'BENN', description: 'Benton County', value: 1.25 },
            { code: 'FRAN', description: 'Franklin County', value: 1.05 }
          ],
          qualityFactors: [
            { code: 'LOW', description: 'Low Quality', value: 0.85 },
            { code: 'AVG', description: 'Average Quality', value: 1.0 },
            { code: 'HIGH', description: 'High Quality', value: 1.2 },
            { code: 'PREMIUM', description: 'Premium Quality', value: 1.35 }
          ],
          conditionFactors: [
            { code: 'POOR', description: 'Poor Condition', value: 0.7 },
            { code: 'FAIR', description: 'Fair Condition', value: 0.85 },
            { code: 'GOOD', description: 'Good Condition', value: 1.0 },
            { code: 'EXC', description: 'Excellent Condition', value: 1.15 }
          ]
        };
        
        // Save the default data
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        
        // Cache the data and return it
        costFactorCache[source] = defaultData;
        return defaultData;
      }
      
      // For other sources, return empty data structure
      const emptyData = {
        baseRates: [],
        regionalFactors: [],
        qualityFactors: [],
        conditionFactors: []
      };
      
      // Cache the empty data
      costFactorCache[source] = emptyData;
      return emptyData;
    }

    // Read the file and parse the JSON
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Cache the data
    costFactorCache[source] = data;
    
    return data;
  } catch (error) {
    console.error(`Error loading cost factor data for source ${source}:`, error);
    
    // Return empty data structure on error
    const emptyData = {
      baseRates: [],
      regionalFactors: [],
      qualityFactors: [],
      conditionFactors: []
    };
    
    return emptyData;
  }
}

/**
 * Get the current cost source
 * @returns {string} The current cost source
 */
export function getCostSource(): string {
  return currentCostSource;
}

/**
 * Set the current cost source
 * @param {string} source - The cost source to set
 * @returns {boolean} Success status
 */
export function setCostSource(source: string): boolean {
  try {
    // Validate source
    if (!Object.values(COST_SOURCES).includes(source)) {
      return false;
    }
    
    // Update current source
    currentCostSource = source;
    
    // Return success
    return true;
  } catch (error) {
    console.error('Error setting cost source:', error);
    return false;
  }
}

/**
 * Check if a cost source is available
 * @param {string} source - The cost source to check
 * @returns {boolean} Whether the source is available
 */
export function isCostSourceAvailable(source: string): boolean {
  // Check if source is valid
  if (!Object.values(COST_SOURCES).includes(source)) {
    return false;
  }
  
  try {
    // Try to load the cost factor data for the source
    const data = loadCostFactorData(source);
    
    // If data is empty, return false
    if (!data || 
        !data.baseRates || 
        !data.regionalFactors || 
        !data.qualityFactors || 
        !data.conditionFactors) {
      return false;
    }
    
    // If data is available, return true
    return true;
  } catch (error) {
    console.error(`Error checking if cost source ${source} is available:`, error);
    return false;
  }
}

/**
 * Get all available cost sources
 * @returns {string[]} Array of available cost sources
 */
export function getAvailableSources(): string[] {
  try {
    // Filter sources to only include available ones
    const availableSources = Object.values(COST_SOURCES).filter(source => 
      isCostSourceAvailable(source)
    );
    
    return availableSources;
  } catch (error) {
    console.error('Error getting available cost sources:', error);
    return [COST_SOURCES.MARSHALL_SWIFT]; // Default to Marshall Swift on error
  }
}

/**
 * Clear the cost factor cache
 * @param {string} source - Optional source to clear from cache
 */
export function clearCostFactorCache(source?: string): void {
  if (source) {
    // Clear cache for specific source
    delete costFactorCache[source];
  } else {
    // Clear entire cache
    Object.keys(costFactorCache).forEach(key => {
      delete costFactorCache[key];
    });
  }
}