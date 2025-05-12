/**
 * Cost Factor Loader Service
 * 
 * This service handles loading cost factor data from different sources
 * and provides a unified API for accessing cost factors.
 */

import fs from 'fs';
import path from 'path';
import { getStorage } from '../../storage';

// Cache for cost factor data to avoid repeated disk reads
let costFactorCache: Record<string, any> = {};
let currentSource = 'costFacto'; // Default to the new CostFacto system

// Available cost data sources
export const COST_SOURCES = {
  MARSHALL_SWIFT: 'marshallSwift',
  RS_MEANS: 'rsMeans',
  COST_FACTO: 'costFacto',
  BENTON_COUNTY: 'bentonCounty'
};

/**
 * Load cost factor data from a source
 * @param {string} source - The cost data source
 * @returns {any} The cost factor data
 */
export function loadCostFactorData(source: string): any {
  // Check cache first
  if (costFactorCache[source]) {
    return costFactorCache[source];
  }

  try {
    // Load from JSON file
    const filePath = path.join(process.cwd(), 'data', 'costFactors.json');
    
    if (!fs.existsSync(filePath)) {
      console.error(`Cost factor data file not found: ${filePath}`);
      return null;
    }
    
    const costFactorsJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!costFactorsJson[source]) {
      console.error(`Source "${source}" not found in cost factors data`);
      return null;
    }
    
    // Cache the data for future use
    costFactorCache[source] = costFactorsJson[source];
    return costFactorCache[source];
  } catch (error) {
    console.error(`Error loading cost factor data for source "${source}":`, error);
    return null;
  }
}

/**
 * Get the current cost source
 * @returns {string} The current cost source
 */
export function getCostSource(): string {
  // Try to get from settings if available
  const storage = getStorage();
  try {
    const setting = storage.getSetting('costFactorSource');
    if (setting) {
      return setting.value as string;
    }
  } catch (error) {
    console.warn('Error retrieving cost factor source from settings:', error);
  }
  
  return currentSource;
}

/**
 * Set the current cost source
 * @param {string} source - The cost source to set
 * @returns {boolean} Success status
 */
export function setCostSource(source: string): boolean {
  if (!isCostSourceAvailable(source)) {
    return false;
  }
  
  // Try to save to settings if available
  const storage = getStorage();
  try {
    if (!storage.getSetting('costFactorSource')) {
      storage.createSetting({
        key: 'costFactorSource',
        value: source,
        type: 'string',
        description: 'Current cost factor data source'
      });
    } else {
      storage.updateSetting('costFactorSource', { value: source });
    }
  } catch (error) {
    console.warn('Error saving cost factor source to settings:', error);
  }
  
  currentSource = source;
  return true;
}

/**
 * Check if a cost source is available
 * @param {string} source - The cost source to check
 * @returns {boolean} Whether the source is available
 */
export function isCostSourceAvailable(source: string): boolean {
  const data = loadCostFactorData(source);
  return !!data;
}

/**
 * Get all available cost sources
 * @returns {string[]} Array of available cost sources
 */
export function getAvailableSources(): string[] {
  const availableSources: string[] = [];
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'costFactors.json');
    
    if (!fs.existsSync(filePath)) {
      console.error(`Cost factor data file not found: ${filePath}`);
      return availableSources;
    }
    
    const costFactorsJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    return Object.keys(costFactorsJson);
  } catch (error) {
    console.error('Error getting available cost sources:', error);
    return availableSources;
  }
}

/**
 * Clear the cost factor cache
 * @param {string} source - Optional source to clear from cache
 */
export function clearCostFactorCache(source?: string): void {
  if (source) {
    delete costFactorCache[source];
  } else {
    costFactorCache = {};
  }
}