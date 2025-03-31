/**
 * Building Cost Functions for Model Content Protocol
 * 
 * This module provides building cost calculation functions that can be called by the AI
 * to support building cost predictions, analytics, and explanations.
 */

import { calculateBuildingCost } from '../../calculationEngine';

// Type definitions for function parameters
type BuildingTypeData = {
  code: string;
  name: string;
  baseCost: number;
  description: string;
};

type RegionData = {
  code: string;
  name: string;
  factor: number;
};

// Building type data
const buildingTypes: BuildingTypeData[] = [
  { code: 'RESIDENTIAL', name: 'Residential', baseCost: 200, description: 'Single-family homes' },
  { code: 'COMMERCIAL', name: 'Commercial', baseCost: 250, description: 'Office and retail buildings' },
  { code: 'INDUSTRIAL', name: 'Industrial', baseCost: 180, description: 'Manufacturing and warehouse facilities' },
  { code: 'RETAIL', name: 'Retail', baseCost: 220, description: 'Shopping centers and storefronts' },
  { code: 'WAREHOUSE', name: 'Warehouse', baseCost: 120, description: 'Storage facilities' },
  { code: 'OFFICE', name: 'Office', baseCost: 230, description: 'Corporate and professional offices' },
  { code: 'APARTMENT', name: 'Apartment', baseCost: 190, description: 'Multi-family residential buildings' },
  { code: 'HOTEL', name: 'Hotel', baseCost: 280, description: 'Hospitality and lodging facilities' },
  { code: 'HOSPITAL', name: 'Hospital', baseCost: 350, description: 'Healthcare facilities' },
  { code: 'SCHOOL', name: 'School', baseCost: 260, description: 'Educational institutions' },
  { code: 'GOVERNMENT', name: 'Government', baseCost: 270, description: 'Government and public buildings' }
];

// Region data
const regions: RegionData[] = [
  { code: 'NORTHWEST', name: 'Northwest', factor: 1.2 },
  { code: 'NORTHEAST', name: 'Northeast', factor: 1.05 },
  { code: 'SOUTHWEST', name: 'Southwest', factor: 1.15 },
  { code: 'SOUTHEAST', name: 'Southeast', factor: 1.0 },
  { code: 'CENTRAL', name: 'Central', factor: 1.1 },
  { code: 'COASTAL', name: 'Coastal', factor: 1.25 },
  { code: 'MOUNTAIN', name: 'Mountain', factor: 1.15 },
  { code: 'BENTON_COUNTY', name: 'Benton County', factor: 1.1 }
];

/**
 * Get building type information
 * 
 * @param buildingType Building type code
 * @returns Building type data
 */
function getBuildingTypeInfo(buildingType: string) {
  return buildingTypes.find(bt => bt.code === buildingType.toUpperCase()) || buildingTypes[0];
}

/**
 * Get region information
 * 
 * @param region Region code
 * @returns Region data
 */
function getRegionInfo(region: string) {
  return regions.find(r => r.code === region.toUpperCase()) || regions[0];
}

/**
 * Calculate building cost
 * 
 * @param buildingType Building type code
 * @param squareFootage Square footage of the building
 * @param region Region code
 * @param yearBuilt Year the building was built
 * @param condition Condition of the building
 * @returns Building cost calculation result
 */
async function calculateCost(
  buildingType: string,
  squareFootage: number,
  region: string,
  yearBuilt?: number,
  condition?: string
) {
  try {
    // Use the calculation engine to calculate the cost
    const result = await calculateBuildingCost({
      buildingType,
      squareFootage,
      region,
      yearBuilt: yearBuilt || new Date().getFullYear() - 10, // Default to 10 years old
      condition: condition || 'AVERAGE',
      complexityFactor: 1.0,
      conditionFactor: condition === 'EXCELLENT' ? 1.2 :
                      condition === 'GOOD' ? 1.1 :
                      condition === 'AVERAGE' ? 1.0 :
                      condition === 'FAIR' ? 0.9 :
                      condition === 'POOR' ? 0.8 : 1.0
    });
    
    return result;
  } catch (error) {
    console.error('Error calculating cost:', error);
    
    // Fallback calculation if the calculation engine fails
    const buildingTypeInfo = getBuildingTypeInfo(buildingType);
    const regionInfo = getRegionInfo(region);
    
    const baseCost = buildingTypeInfo.baseCost;
    const regionalFactor = regionInfo.factor;
    
    // Apply age depreciation (1% per year over 10 years, max 30%)
    const currentYear = new Date().getFullYear();
    const age = yearBuilt ? currentYear - yearBuilt : 10;
    const ageFactor = Math.max(0.7, 1 - Math.max(0, age - 10) * 0.01);
    
    // Apply condition factor
    const conditionFactor = condition === 'EXCELLENT' ? 1.2 :
                           condition === 'GOOD' ? 1.1 :
                           condition === 'AVERAGE' ? 1.0 :
                           condition === 'FAIR' ? 0.9 :
                           condition === 'POOR' ? 0.8 : 1.0;
    
    // Calculate cost per square foot
    const costPerSqFt = baseCost * regionalFactor * ageFactor * conditionFactor;
    
    // Calculate total cost
    const totalCost = costPerSqFt * squareFootage;
    
    return {
      baseCost,
      adjustedCost: costPerSqFt,
      totalCost,
      regionalFactor,
      buildingTypeFactor: 1.0,
      ageDepreciation: ageFactor,
      conditionAdjustment: conditionFactor
    };
  }
}

// Export building cost functions
export const buildingCostFunctions = {
  getBuildingTypeInfo,
  getRegionInfo,
  calculateCost
};