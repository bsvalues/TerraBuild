/**
 * Cost Factor Tables Service
 * 
 * This service provides methods for working with cost factor tables,
 * which are used for building cost calculations. It supports multiple
 * data sources like Marshall & Swift and RS Means.
 */

import { 
  loadCostFactorData, 
  getCostSource, 
  setCostSource,
  isCostSourceAvailable,
  getAvailableSources,
  COST_SOURCES
} from './costFactorLoader';

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
  const result: CostFactor[] = [];
  
  if (!rawData) {
    return result;
  }
  
  // Process each factor type (baseRates, region, quality, condition, age)
  Object.keys(rawData).forEach(factorType => {
    const factors = rawData[factorType];
    
    if (Array.isArray(factors)) {
      factors.forEach(factor => {
        result.push({
          factorClass: 'cost',
          factorType: factorType === 'baseRates' ? 'baseRate' : factorType,
          code: factor.code,
          description: factor.description,
          value: factor.value,
          source
        });
      });
    }
  });
  
  return result;
}

/**
 * Get cost factors for the specified source and optional filters
 * @param {string} source - The cost data source (marshallSwift, rsMeans)
 * @param {string} propertyType - Optional property type filter
 * @param {string} region - Optional region filter
 * @returns {CostFactor[]} Cost factors matching the criteria
 */
export function getCostFactors(source: string = getCostSource(), propertyType?: string, region?: string): CostFactor[] {
  const data = loadCostFactorData(source);
  
  if (!data) {
    console.warn(`No cost factor data available for source: ${source}`);
    return [];
  }
  
  const factors = transformCostFactors(source, data);
  
  // Apply filters if provided
  let filteredFactors = factors;
  
  if (propertyType) {
    filteredFactors = filteredFactors.filter(factor => 
      factor.factorType === 'baseRate' && factor.code === propertyType
    );
  }
  
  if (region) {
    filteredFactors = filteredFactors.filter(factor => 
      factor.factorType === 'region' && factor.code === region
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
  
  const factor = factors.find(f => 
    f.factorType === factorType && f.code === code
  );
  
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
  return getCostFactorValue(source, 'region', region);
}

/**
 * Get the quality factor for a quality code
 * @param {string} source - The cost data source (marshallSwift, rsMeans) 
 * @param {string} quality - The quality code
 * @returns {number} The quality factor (or 1.0 for not found)
 */
export function getQualityFactor(source: string, quality: string): number {
  return getCostFactorValue(source, 'quality', quality);
}

/**
 * Get the condition factor for a condition code
 * @param {string} source - The cost data source (marshallSwift, rsMeans)
 * @param {string} condition - The condition code
 * @returns {number} The condition factor (or 1.0 for not found)
 */
export function getConditionFactor(source: string, condition: string): number {
  return getCostFactorValue(source, 'condition', condition);
}

/**
 * Get the age factor for an age code
 * @param {string} source - The cost data source (marshallSwift, rsMeans)
 * @param {string} age - The age code
 * @returns {number} The age factor (or 1.0 for not found)
 */
export function getAgeFactor(source: string, age: string): number {
  return getCostFactorValue(source, 'age', age);
}

// Export other utilities from costFactorLoader for convenience
export { 
  getCostSource, 
  setCostSource, 
  isCostSourceAvailable, 
  getAvailableSources,
  COST_SOURCES
};