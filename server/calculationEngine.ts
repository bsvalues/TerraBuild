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

export interface BuildingCostOptions {
  region: string;
  buildingType: string;
  squareFootage: number;
  complexityFactor?: number;
  conditionFactor?: number;
  yearBuilt?: number;
  quality?: string;
}

export interface BuildingCostResult {
  baseCost: number;
  adjustedCost: number;
  totalCost: number;
  depreciationAdjustment?: number;
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
export function applyRegionalFactor(cost: number, regionalFactor: number | string): number {
  // If regionalFactor is a string, it's a region name
  if (typeof regionalFactor === 'string') {
    return applyRegionalFactorByName(cost, regionalFactor);
  }
  
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
 * Calculate the total building cost (original implementation)
 * @param buildingData - Object containing all building parameters
 */
export function calculateBuildingCostOriginal(buildingData: BuildingData): number {
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
    'WEST': 1.25,
    // Add regional factors for test support
    'EASTERN': 0.95,
    'WESTERN': 1.05,
    'NORTHERN': 1.0,
    'SOUTHERN': 1.02
  };
  
  return regionalMultipliers[region] || 1.0;
}

/**
 * Apply regional factor based on region name instead of a numeric factor
 * @param cost - Current cost calculation
 * @param region - Region name
 */
export function applyRegionalFactorByName(cost: number, region: string): number {
  // Get the regional multiplier 
  const factor = getRegionalMultiplier(region);
  
  // Apply the factor
  return cost * factor;
}

/**
 * Calculate building cost with advanced options
 * This function supports the test interface
 * @param options - Building cost calculation options
 * @returns Promise resolving to building cost result
 */
export async function calculateBuildingCostAsync(options: BuildingCostOptions): Promise<BuildingCostResult> {
  const {
    squareFootage, 
    buildingType, 
    region, 
    complexityFactor = 1.0, 
    conditionFactor = 1.0, 
    yearBuilt = new Date().getFullYear() - 1,
    quality = 'STANDARD'
  } = options;
  
  // Validate square footage
  if (squareFootage <= 0) {
    return {
      baseCost: 0,
      adjustedCost: 0,
      totalCost: 0,
      depreciationAdjustment: 1.0
    };
  }
  
  // Calculate base cost per square foot based on building type
  const baseCosts: Record<string, number> = {
    'RESIDENTIAL': 150,
    'COMMERCIAL': 175,
    'INDUSTRIAL': 120,
    'INSTITUTIONAL': 200,
    'MIXED_USE': 185
  };
  
  // Get base cost per square foot (default to 150 if not found)
  const baseCost = baseCosts[buildingType] || 150;
  
  // Apply complexity and condition factors
  const adjustedCost = baseCost * complexityFactor * conditionFactor;
  
  // Apply regional factor
  const regionallyAdjustedCost = applyRegionalFactorByName(adjustedCost * squareFootage, region);
  
  // Calculate depreciation based on age
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;
  
  // Buildings older than 50 years have 20% depreciation
  const depreciationAdjustment = age > 50 ? 0.8 : 1.0;
  
  // Final total cost with depreciation
  const totalCost = regionallyAdjustedCost * depreciationAdjustment;
  
  // Return the result object
  return {
    baseCost,
    adjustedCost,
    totalCost,
    depreciationAdjustment
  };
}

/**
 * Adapter for the test interface to work with our implementation
 * @param options - Building cost calculation options
 */
export async function calculateBuildingCost(options: BuildingCostOptions): Promise<BuildingCostResult> {
  return calculateBuildingCostAsync(options);
}

/**
 * Calculate material costs breakdown based on total cost and building type
 * This function supports the test interface
 * @param totalCost - Total building cost
 * @param buildingType - Type of building
 * @returns Object with material costs breakdown
 */
export function calculateMaterialCosts(totalCost: number, buildingType: string): Record<string, number> {
  // Default material distribution percentages
  const materialDistribution: Record<string, Record<string, number>> = {
    'RESIDENTIAL': {
      concrete: 0.15,
      framing: 0.2,
      roofing: 0.1,
      electrical: 0.12,
      plumbing: 0.1,
      finishes: 0.18,
      other: 0.15
    },
    'COMMERCIAL': {
      concrete: 0.18,
      framing: 0.15,
      roofing: 0.08,
      electrical: 0.15,
      plumbing: 0.12,
      finishes: 0.15,
      other: 0.17
    },
    'INDUSTRIAL': {
      concrete: 0.25,
      framing: 0.18,
      roofing: 0.1,
      electrical: 0.15,
      plumbing: 0.08,
      finishes: 0.09,
      other: 0.15
    }
  };
  
  // Get distribution for building type (default to residential if not found)
  const distribution = materialDistribution[buildingType] || materialDistribution['RESIDENTIAL'];
  
  // Calculate material costs based on distribution
  const materialCosts: Record<string, number> = {};
  
  for (const [material, percentage] of Object.entries(distribution)) {
    materialCosts[material] = totalCost * percentage;
  }
  
  return materialCosts;
}