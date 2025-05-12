/**
 * Cost Factor Loader
 * 
 * Service for loading cost factors from configuration files
 * Supports dynamic loading of different cost sources (marshallSwift, rsMeans)
 */

import fs from 'fs';
import path from 'path';

// Default configuration values
const DEFAULT_CONFIG = {
  costEngine: {
    costSource: 'marshallSwift', // Default cost source
    dataFile: 'data/costFactors.json' // Default data file location
  }
};

/**
 * Get the current cost source from configuration
 * @returns {string} The current cost source (marshallSwift, rsMeans)
 */
export function getCostSource(): string {
  try {
    // Get the configuration file path
    const configPath = path.resolve('terra.json');
    
    // Check if the configuration file exists
    if (!fs.existsSync(configPath)) {
      console.warn('Configuration file not found, using default cost source');
      return DEFAULT_CONFIG.costEngine.costSource;
    }
    
    // Read and parse the configuration file
    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);
    
    // Return the cost source from configuration or default
    return config.costEngine?.costSource || DEFAULT_CONFIG.costEngine.costSource;
  } catch (error) {
    console.error('Error reading cost source configuration:', error);
    return DEFAULT_CONFIG.costEngine.costSource;
  }
}

/**
 * Update the current cost source in configuration
 * @param {string} source - The cost source to set (marshallSwift, rsMeans)
 * @returns {boolean} True if successful, false otherwise
 */
export function setCostSource(source: string): boolean {
  try {
    // Get the configuration file path
    const configPath = path.resolve('terra.json');
    
    // Initialize the configuration object
    let config = DEFAULT_CONFIG;
    
    // Check if the configuration file exists and read it
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configFile);
    }
    
    // Ensure costEngine section exists
    if (!config.costEngine) {
      config.costEngine = DEFAULT_CONFIG.costEngine;
    }
    
    // Update the cost source
    config.costEngine.costSource = source;
    
    // Write the updated configuration back to the file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    
    return true;
  } catch (error) {
    console.error('Error updating cost source configuration:', error);
    return false;
  }
}

/**
 * Load cost factors from the data file for the specified source
 * @param {string} source - The cost source to load (marshallSwift, rsMeans)
 * @returns {object} The cost factors for the specified source
 */
export function loadCostFactors(source?: string): any {
  try {
    // Get the current cost source if not specified
    const costSource = source || getCostSource();
    
    // Get the configuration file path
    const configPath = path.resolve('terra.json');
    
    // Initialize the configuration object
    let config = DEFAULT_CONFIG;
    
    // Check if the configuration file exists and read it
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configFile);
    }
    
    // Get the data file path from configuration
    const dataFilePath = path.resolve(config.costEngine?.dataFile || DEFAULT_CONFIG.costEngine.dataFile);
    
    // Check if the data file exists
    if (!fs.existsSync(dataFilePath)) {
      console.warn(`Cost factor data file not found: ${dataFilePath}`);
      return {};
    }
    
    // Read and parse the data file
    const dataFile = fs.readFileSync(dataFilePath, 'utf8');
    const factorData = JSON.parse(dataFile);
    
    // Return the cost factors for the specified source
    return factorData[costSource] || {};
  } catch (error) {
    console.error('Error loading cost factors:', error);
    return {};
  }
}

/**
 * Check if a cost source is available in the data file
 * @param {string} source - The cost source to check (marshallSwift, rsMeans)
 * @returns {boolean} True if source is available, false otherwise
 */
export function isCostSourceAvailable(source: string): boolean {
  try {
    // Get the configuration file path
    const configPath = path.resolve('terra.json');
    
    // Initialize the configuration object
    let config = DEFAULT_CONFIG;
    
    // Check if the configuration file exists and read it
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configFile);
    }
    
    // Get the data file path from configuration
    const dataFilePath = path.resolve(config.costEngine?.dataFile || DEFAULT_CONFIG.costEngine.dataFile);
    
    // Check if the data file exists
    if (!fs.existsSync(dataFilePath)) {
      return false;
    }
    
    // Read and parse the data file
    const dataFile = fs.readFileSync(dataFilePath, 'utf8');
    const factorData = JSON.parse(dataFile);
    
    // Check if the source exists and has data
    return Boolean(
      factorData[source] && 
      Object.keys(factorData[source]).length > 0
    );
  } catch (error) {
    console.error('Error checking cost source availability:', error);
    return false;
  }
}

/**
 * Get available cost sources from the data file
 * @returns {string[]} Array of available cost sources
 */
export function getAvailableSources(): string[] {
  try {
    // Get the configuration file path
    const configPath = path.resolve('terra.json');
    
    // Initialize the configuration object
    let config = DEFAULT_CONFIG;
    
    // Check if the configuration file exists and read it
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configFile);
    }
    
    // Get the data file path from configuration
    const dataFilePath = path.resolve(config.costEngine?.dataFile || DEFAULT_CONFIG.costEngine.dataFile);
    
    // Check if the data file exists
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    
    // Read and parse the data file
    const dataFile = fs.readFileSync(dataFilePath, 'utf8');
    const factorData = JSON.parse(dataFile);
    
    // Return an array of available sources with data
    return Object.keys(factorData).filter(source => 
      factorData[source] && Object.keys(factorData[source]).length > 0
    );
  } catch (error) {
    console.error('Error getting available cost sources:', error);
    return [];
  }
}