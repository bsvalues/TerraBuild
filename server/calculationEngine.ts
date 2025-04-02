/**
 * Building Cost Calculation Engine for Benton County Building Cost System
 * 
 * This module provides functions for calculating building costs based on
 * various parameters such as building type, size, quality, and regional factors.
 */

export interface BuildingData {
  squareFootage: number;
  buildingType: string;
  quality: string;
  complexityFactor?: number;
  conditionFactor?: number;
  regionalFactor?: number;
  materials?: Material[];
}

export interface Material {
  name: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Calculate the base cost of a building based on square footage, type, and quality
 * @param squareFootage - Square footage of the building
 * @param buildingType - Type of building (RESIDENTIAL, COMMERCIAL, INDUSTRIAL)
 * @param quality - Quality level (STANDARD, PREMIUM, LUXURY)
 */
export function calculateBaseCost(squareFootage: number, buildingType: string, quality: string): number {
  const baseCosts: Record<string, Record<string, number>> = {
    'RESIDENTIAL': { 'STANDARD': 125, 'PREMIUM': 175, 'LUXURY': 250 },
    'COMMERCIAL': { 'STANDARD': 150, 'PREMIUM': 200, 'LUXURY': 300 },
    'INDUSTRIAL': { 'STANDARD': 100, 'PREMIUM': 150, 'LUXURY': 225 }
  };
  
  // Get cost per square foot (default to 150 if not found)
  const costPerSqFt = baseCosts[buildingType]?.[quality] || 150;
  
  return squareFootage * costPerSqFt;
}

/**
 * Apply a complexity factor to the base cost
 * @param baseCost - Base cost of the building
 * @param complexityFactor - Factor to account for building complexity
 */
export function applyComplexityFactor(baseCost: number, complexityFactor: number): number {
  // Validate factor (default to 1.0 if invalid)
  const factor = complexityFactor > 0 ? complexityFactor : 1.0;
  return baseCost * factor;
}

/**
 * Apply a condition factor to the cost
 * @param cost - Current cost calculation
 * @param conditionFactor - Factor to account for building condition
 */
export function applyConditionFactor(cost: number, conditionFactor: number): number {
  // Validate factor (default to 1.0 if invalid)
  const factor = conditionFactor > 0 ? conditionFactor : 1.0;
  return cost * factor;
}

/**
 * Apply a regional factor to the cost
 * @param cost - Current cost calculation
 * @param regionalFactor - Factor to account for regional cost differences
 */
export function applyRegionalFactor(cost: number, regionalFactor: number): number {
  // Validate factor (default to 1.0 if invalid or zero)
  let factor = regionalFactor;
  
  if (factor === 0) {
    factor = 1.0;
  } else if (factor < 0) {
    // Handle negative factors by using absolute value
    factor = Math.abs(factor);
  }
  
  return cost * factor;
}

/**
 * Calculate the total material cost
 * @param materials - Array of materials with quantity and unit price
 */
export function calculateMaterialCost(materials: Material[]): number {
  if (!materials || materials.length === 0) {
    return 0;
  }
  
  return materials.reduce((total, material) => {
    // Skip materials with missing price or quantity
    if (typeof material.quantity !== 'number' || typeof material.unitPrice !== 'number') {
      return total;
    }
    
    return total + (material.quantity * material.unitPrice);
  }, 0);
}

/**
 * Calculate the total building cost
 * @param buildingData - Object containing all building parameters
 */
export function calculateBuildingCost(buildingData: BuildingData): number {
  const {
    squareFootage,
    buildingType,
    quality,
    complexityFactor = 1.0,
    conditionFactor = 1.0,
    regionalFactor = 1.0,
    materials = []
  } = buildingData;
  
  // Calculate base cost
  let cost = calculateBaseCost(squareFootage, buildingType, quality);
  
  // Apply factors
  cost = applyComplexityFactor(cost, complexityFactor);
  cost = applyConditionFactor(cost, conditionFactor);
  cost = applyRegionalFactor(cost, regionalFactor);
  
  // Add material costs
  const materialCost = calculateMaterialCost(materials);
  
  return cost + materialCost;
}

/**
 * Calculate cost with adjustments for specific building components
 * @param baseCalculation - Base building cost calculation
 * @param components - Building components with adjustment factors
 */
export function calculateWithComponents(baseCalculation: number, components: Record<string, number>): number {
  if (!components) return baseCalculation;
  
  let adjustedCost = baseCalculation;
  
  // Apply component factors
  Object.entries(components).forEach(([component, factor]) => {
    if (typeof factor === 'number' && factor > 0) {
      // Component factors are additive adjustments
      adjustedCost += baseCalculation * factor;
    }
  });
  
  return adjustedCost;
}

/**
 * Get the regional cost multiplier for a specific region
 * @param region - Region name or code
 */
export function getRegionalMultiplier(region: string): number {
  const regionalMultipliers: Record<string, number> = {
    'RICHLAND': 1.05,
    'KENNEWICK': 1.02,
    'PASCO': 1.0,
    'WEST_RICHLAND': 1.07,
    'BENTON_CITY': 0.95,
    'PROSSER': 0.93,
    // Default regions from matrix
    'NORTHEAST': 1.15,
    'MIDWEST': 1.0,
    'SOUTH': 0.92,
    'WEST': 1.25
  };
  
  return regionalMultipliers[region] || 1.0;
}