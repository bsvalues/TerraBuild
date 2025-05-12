/**
 * Cost Factor Tables Service
 * 
 * This service provides methods for working with cost factor tables,
 * which are used for building cost calculations. It supports multiple
 * data sources like Marshall & Swift and RS Means.
 */

import { loadCostFactorData, getCostSource } from './costFactorLoader';

interface CostFactor {
  factorClass: string;
  factorType: string;
  code: string;
  description: string;
  value: number;
  source?: string;
}

/**
 * Transform raw cost factor data into a standardized format
 * @param {string} source - The cost data source (marshallSwift, rsMeans)
 * @param {any} rawData - The raw cost factor data
 * @returns {CostFactor[]} Standardized cost factors
 */
function transformCostFactors(source: string, rawData: any): CostFactor[] {
  if (!rawData) return [];
  
  const factors: CostFactor[] = [];
  
  // Process building types as base rates
  if (rawData.buildingTypes) {
    rawData.buildingTypes.forEach((type: any) => {
      factors.push({
        factorClass: 'building',
        factorType: 'baseRate',
        code: type.code,
        description: type.name || type.description || `Building Type ${type.code}`,
        value: parseFloat(type.baseCost) || 0,
        source
      });
    });
  }
  
  // Process regions as regional factors
  if (rawData.regions) {
    rawData.regions.forEach((region: any) => {
      factors.push({
        factorClass: 'location',
        factorType: 'region',
        code: region.code,
        description: region.name || `Region ${region.code}`,
        value: parseFloat(region.factor) || 1.0,
        source
      });
    });
  }
  
  // Process quality levels
  if (rawData.quality) {
    rawData.quality.forEach((quality: any) => {
      factors.push({
        factorClass: 'building',
        factorType: 'quality',
        code: quality.level,
        description: quality.description || `Quality Level ${quality.level}`,
        value: parseFloat(quality.factor) || 1.0,
        source
      });
    });
  }
  
  // Process condition factors
  if (rawData.condition) {
    rawData.condition.forEach((condition: any) => {
      factors.push({
        factorClass: 'building',
        factorType: 'condition',
        code: condition.level,
        description: condition.description || `Condition ${condition.level}`,
        value: parseFloat(condition.factor) || 1.0,
        source
      });
    });
  }
  
  // Process age factors
  if (rawData.ageBrackets) {
    rawData.ageBrackets.forEach((age: any) => {
      factors.push({
        factorClass: 'building',
        factorType: 'age',
        code: age.bracket,
        description: age.description || `Age ${age.bracket}`,
        value: parseFloat(age.factor) || 1.0,
        source
      });
    });
  }
  
  // Process any other factor types
  const processedTypes = ['buildingTypes', 'regions', 'quality', 'condition', 'ageBrackets'];
  Object.keys(rawData).forEach(key => {
    if (processedTypes.includes(key) || !Array.isArray(rawData[key])) return;
    
    rawData[key].forEach((factor: any) => {
      factors.push({
        factorClass: 'other',
        factorType: key,
        code: factor.code || factor.id || factor.name || key,
        description: factor.description || factor.name || `${key} Factor`,
        value: parseFloat(factor.value || factor.factor) || 1.0,
        source
      });
    });
  });
  
  return factors;
}

/**
 * Get cost factors for the specified source and optional filters
 * @param {string} source - The cost data source (marshallSwift, rsMeans)
 * @param {string} propertyType - Optional property type filter
 * @param {string} region - Optional region filter
 * @returns {CostFactor[]} Cost factors matching the criteria
 */
export function getCostFactors(source: string, propertyType?: string, region?: string): CostFactor[] {
  // If no source is provided, use the current source
  if (!source) {
    source = getCostSource();
  }
  
  // Load raw data from the source
  const rawFactors = loadCostFactorData(source);
  
  // Transform raw data to standardized format
  const factors = transformCostFactors(source, rawFactors);
  
  // Apply filters if provided
  let filteredFactors = factors;
  
  if (propertyType) {
    // For property type, we want exact match on code for base rates
    // but we want all other factor types regardless of code
    filteredFactors = filteredFactors.filter(factor => 
      (factor.factorType === 'baseRate' && factor.code === propertyType) ||
      (factor.factorType !== 'baseRate')
    );
  }
  
  if (region) {
    // For region, we want exact match on code for regional factors
    // but we want all other factor types regardless of code
    filteredFactors = filteredFactors.filter(factor => 
      (factor.factorType === 'region' && factor.code === region) ||
      (factor.factorType !== 'region')
    );
  }
  
  return filteredFactors;
}

/**
 * Get a specific cost factor value
 * @param {string} source - The cost data source (marshallSwift, rsMeans)
 * @param {string} factorType - The factor type
 * @param {string} code - The factor code
 * @returns {number} The factor value (or 1.0 for not found)
 */
export function getCostFactorValue(source: string, factorType: string, code: string): number {
  const factors = getCostFactors(source);
  const factor = factors.find(f => f.factorType === factorType && f.code === code);
  return factor ? factor.value : 1.0;
}

/**
 * Get the base rate for a building type
 * @param {string} source - The cost data source (marshallSwift, rsMeans)
 * @param {string} buildingType - The building type code
 * @returns {number} The base rate (or 0 for not found)
 */
export function getBaseRate(source: string, buildingType: string): number {
  return getCostFactorValue(source, 'baseRate', buildingType) || 0;
}

/**
 * Get the regional factor for a region
 * @param {string} source - The cost data source (marshallSwift, rsMeans)
 * @param {string} region - The region code
 * @returns {number} The regional factor (or 1.0 for not found)
 */
export function getRegionalFactor(source: string, region: string): number {
  return getCostFactorValue(source, 'region', region) || 1.0;
}