/**
 * Marshall Swift Cost Service
 * 
 * This module provides a facade for the Marshall Swift cost factors
 * that will be used for building cost calculations. It uses the
 * CostFactorTables service internally but presents a simpler API
 * specifically for marshallSwift factors.
 */

import { getBaseRate, getRegionalFactor, getCostFactorValue } from './CostFactorTables';

const SOURCE = 'marshallSwift';

/**
 * Get the base cost rate for a building type
 * @param {string} buildingType - The building type code
 * @returns {number} The base cost rate
 */
export function getBaseCost(buildingType: string): number {
  return getBaseRate(SOURCE, buildingType);
}

/**
 * Get the regional factor for a region
 * @param {string} region - The region code
 * @returns {number} The regional factor
 */
export function getRegionFactor(region: string): number {
  return getRegionalFactor(SOURCE, region);
}

/**
 * Get the quality factor for a quality level
 * @param {string} quality - The quality level code
 * @returns {number} The quality factor
 */
export function getQualityFactor(quality: string): number {
  return getCostFactorValue(SOURCE, 'quality', quality);
}

/**
 * Get the condition factor for a condition level
 * @param {string} condition - The condition level code
 * @returns {number} The condition factor
 */
export function getConditionFactor(condition: string): number {
  return getCostFactorValue(SOURCE, 'condition', condition);
}

/**
 * Calculate the age factor based on the year built
 * @param {number} yearBuilt - The year the building was built
 * @returns {number} The age factor
 */
export function calculateAgeFactor(yearBuilt: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;
  
  // Define age brackets based on the data
  if (age <= 5) return getCostFactorValue(SOURCE, 'age', '0-5');
  if (age <= 10) return getCostFactorValue(SOURCE, 'age', '6-10');
  if (age <= 20) return getCostFactorValue(SOURCE, 'age', '11-20');
  if (age <= 30) return getCostFactorValue(SOURCE, 'age', '21-30');
  if (age <= 40) return getCostFactorValue(SOURCE, 'age', '31-40');
  if (age <= 50) return getCostFactorValue(SOURCE, 'age', '41-50');
  if (age <= 75) return getCostFactorValue(SOURCE, 'age', '51-75');
  
  // Fallback for very old buildings
  return getCostFactorValue(SOURCE, 'age', '75+');
}

/**
 * Calculate cost estimation for a building
 * @param {object} request - The cost request object
 * @returns {object} The cost estimation results
 */
export function calculateCostEstimation(request: any): any {
  try {
    // Extract request parameters
    const { buildingType, region, quality, condition, yearBuilt, area } = request;
    
    // Get base cost for building type
    const baseCost = getBaseCost(buildingType);
    
    // Get adjustment factors
    const regionFactor = getRegionFactor(region);
    const qualityFactor = getQualityFactor(quality);
    const conditionFactor = getConditionFactor(condition);
    const ageFactor = calculateAgeFactor(yearBuilt);
    
    // Calculate adjusted cost per square foot
    const adjustedCost = baseCost * regionFactor * qualityFactor * conditionFactor * ageFactor;
    
    // Calculate total cost
    const totalCost = adjustedCost * area;
    
    return {
      success: true,
      baseCost,
      adjustments: {
        region: regionFactor,
        quality: qualityFactor,
        condition: conditionFactor,
        age: ageFactor
      },
      costPerSqFt: adjustedCost,
      totalCost,
      source: SOURCE
    };
  } catch (error) {
    console.error('Error calculating cost estimation:', error);
    return {
      success: false,
      error: 'Failed to calculate cost estimation',
      source: SOURCE
    };
  }
}