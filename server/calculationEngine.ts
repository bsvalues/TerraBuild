/**
 * Building Cost Calculation Engine
 * 
 * This module contains the core calculation functionality for the
 * Benton County Building Cost Building System (BCBS).
 */

import { db } from './db';
import { eq, and } from 'drizzle-orm';
import { costMatrix } from '@shared/schema';

/**
 * Constants for calculation factors
 */
const REGIONAL_FACTORS = {
  "Benton": 1.0,
  "Franklin": 1.05,
  "Urban": 1.15,
  "Suburban": 1.08,
  "Rural": 0.92,
  "Yakima": 0.98,
  "Walla Walla": 1.02,
  "Richland": 1.04,
  "Kennewick": 1.03,
  "Pasco": 1.02,
  "West Richland": 1.01,
  "Prosser": 0.97,
  "Benton City": 0.96,
  // Default factor
  "Default": 1.0
};

const BUILDING_TYPE_FACTORS = {
  "RESIDENTIAL": 1.0,
  "COMMERCIAL": 1.2,
  "INDUSTRIAL": 1.15,
  "AGRICULTURAL": 0.85,
  "INSTITUTIONAL": 1.1,
  "MIXED-USE": 1.05,
  "STORAGE": 0.8,
  "HEALTHCARE": 1.25,
  "EDUCATIONAL": 1.15,
  "OFFICE": 1.1,
  "RETAIL": 1.05,
  // Default factor
  "Default": 1.0
};

const CONDITION_FACTORS = {
  "Excellent": 1.1,
  "Good": 1.0,
  "Average": 0.9,
  "Fair": 0.8,
  "Poor": 0.7,
  "Very Poor": 0.6,
  // Default factor
  "Default": 1.0
};

/**
 * Depreciation calculation constants
 */
const ANNUAL_DEPRECIATION_RATE = 0.015; // 1.5% per year
const MAX_DEPRECIATION = 0.7; // Maximum 70% depreciation
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Interface for building cost calculation input parameters
 */
interface BuildingCostCalculationInput {
  region: string;
  buildingType: string;
  squareFootage: number;
  complexityFactor: number;
  conditionFactor: number;
  yearBuilt: number;
  condition?: string;
  materials?: string[];
  qualityGrade?: string;
  stories?: number;
  occupancyType?: string;
}

/**
 * Interface for building cost calculation result
 */
interface BuildingCostCalculationResult {
  baseCost: number;
  adjustedCost?: number;
  totalCost: number;
  regionalFactor?: number;
  buildingTypeFactor?: number;
  complexityAdjustment?: number;
  conditionAdjustment?: number;
  depreciationAdjustment?: number;
  depreciationRate?: number;
  materialCosts?: { [key: string]: number };
  breakdown?: { [key: string]: number };
  error?: string;
}

/**
 * Calculate the total building cost based on input parameters
 * 
 * @param params Building cost calculation input parameters
 * @returns Building cost calculation result
 */
export async function calculateBuildingCost(
  params: BuildingCostCalculationInput
): Promise<BuildingCostCalculationResult> {
  // Validate inputs
  if (!params.region || params.region.trim() === '') {
    return {
      baseCost: 0,
      totalCost: 0,
      error: 'Region is required'
    };
  }

  if (!params.buildingType || params.buildingType.trim() === '') {
    return {
      baseCost: 0,
      totalCost: 0,
      error: 'Building type is required'
    };
  }

  if (!params.squareFootage || params.squareFootage <= 0) {
    return {
      baseCost: 0,
      totalCost: 0,
      error: 'Square footage must be greater than zero'
    };
  }

  if (params.complexityFactor < 0) {
    return {
      baseCost: 0,
      totalCost: 0,
      error: 'Complexity factor cannot be negative'
    };
  }

  try {
    // Fetch the base cost per square foot from the cost matrix
    const matrixData = await db.query.costMatrix.findFirst({
      where: and(
        eq(costMatrix.region, params.region),
        eq(costMatrix.buildingType, params.buildingType)
      ),
    });

    if (!matrixData) {
      return {
        baseCost: 0,
        totalCost: 0,
        error: `No cost matrix found for region '${params.region}' and building type '${params.buildingType}'`
      };
    }

    // Calculate base cost
    const baseCostPerSqFt = parseFloat(matrixData.baseCost);
    const baseCost = baseCostPerSqFt * params.squareFootage;

    // Apply regional factor
    const regionalFactor = REGIONAL_FACTORS[params.region] || REGIONAL_FACTORS.Default;
    let adjustedCost = applyRegionalFactor(baseCost, params.region);

    // Apply building type factor
    const buildingTypeFactor = BUILDING_TYPE_FACTORS[params.buildingType] || BUILDING_TYPE_FACTORS.Default;
    adjustedCost = adjustedCost * buildingTypeFactor;

    // Apply complexity factor
    const complexityAdjustment = applyComplexityFactor(adjustedCost, params.complexityFactor) - adjustedCost;
    adjustedCost = adjustedCost + complexityAdjustment;

    // Apply condition factor if provided
    let conditionFactor = params.conditionFactor;
    if (params.condition && CONDITION_FACTORS[params.condition]) {
      conditionFactor = CONDITION_FACTORS[params.condition];
    }
    const conditionAdjustment = applyConditionFactor(adjustedCost, conditionFactor) - adjustedCost;
    adjustedCost = adjustedCost + conditionAdjustment;

    // Calculate depreciation based on building age
    const buildingAge = CURRENT_YEAR - params.yearBuilt;
    const depreciationRate = Math.min(buildingAge * ANNUAL_DEPRECIATION_RATE, MAX_DEPRECIATION);
    const depreciationAdjustment = -(adjustedCost * depreciationRate);
    
    // Calculate total cost with all adjustments
    const totalCost = adjustedCost + depreciationAdjustment;

    // Prepare breakdown of costs
    const breakdown = {
      baseCost: baseCost,
      regionalAdjustment: applyRegionalFactor(baseCost, params.region) - baseCost,
      buildingTypeAdjustment: adjustedCost * buildingTypeFactor - adjustedCost,
      complexityAdjustment: complexityAdjustment,
      conditionAdjustment: conditionAdjustment,
      depreciationAdjustment: depreciationAdjustment
    };

    return {
      baseCost: baseCost,
      adjustedCost: adjustedCost,
      totalCost: Math.round(totalCost), // Round to nearest dollar
      regionalFactor: regionalFactor,
      buildingTypeFactor: buildingTypeFactor,
      complexityAdjustment: complexityAdjustment,
      conditionAdjustment: conditionAdjustment,
      depreciationAdjustment: depreciationAdjustment,
      depreciationRate: depreciationRate,
      breakdown: breakdown
    };
  } catch (error) {
    console.error('Error calculating building cost:', error);
    return {
      baseCost: 0,
      totalCost: 0,
      error: `Calculation error: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Apply complexity factor to a base value
 * 
 * @param baseValue Base value to adjust
 * @param complexityFactor Complexity factor multiplier
 * @returns Adjusted value
 */
export function applyComplexityFactor(baseValue: number, complexityFactor: number): number {
  return baseValue * complexityFactor;
}

/**
 * Apply condition factor to a base value
 * 
 * @param baseValue Base value to adjust
 * @param conditionFactor Condition factor multiplier
 * @returns Adjusted value
 */
export function applyConditionFactor(baseValue: number, conditionFactor: number): number {
  return baseValue * conditionFactor;
}

/**
 * Apply regional factor to a base value
 * 
 * @param baseValue Base value to adjust
 * @param region Region name
 * @returns Adjusted value
 */
export function applyRegionalFactor(baseValue: number, region: string): number {
  const factor = REGIONAL_FACTORS[region] || REGIONAL_FACTORS.Default;
  return baseValue * factor;
}

/**
 * Calculate material cost breakdown based on building parameters
 * 
 * @param baseCost Base cost of the building
 * @param buildingType Type of building
 * @returns Material cost breakdown
 */
export function calculateMaterialCosts(baseCost: number, buildingType: string): { [key: string]: number } {
  // Default breakdown percentages
  const defaultBreakdown = {
    "Structure": 0.25,
    "Foundation": 0.12,
    "Electrical": 0.10,
    "Plumbing": 0.08,
    "HVAC": 0.08,
    "Interior Finishes": 0.15,
    "Exterior Finishes": 0.10,
    "Roofing": 0.07,
    "Site Work": 0.05
  };

  // Building type specific adjustments
  const buildingTypeAdjustments: { [key: string]: { [key: string]: number } } = {
    "RESIDENTIAL": {
      "Interior Finishes": 0.18,
      "Plumbing": 0.10,
      "HVAC": 0.07
    },
    "COMMERCIAL": {
      "Electrical": 0.15,
      "HVAC": 0.12,
      "Structure": 0.22
    },
    "INDUSTRIAL": {
      "Structure": 0.30,
      "Electrical": 0.15,
      "Site Work": 0.08
    }
  };

  // Apply adjustments if available for the building type
  const finalBreakdown = { ...defaultBreakdown };
  if (buildingTypeAdjustments[buildingType]) {
    Object.assign(finalBreakdown, buildingTypeAdjustments[buildingType]);
  }

  // Calculate actual costs
  const materialCosts: { [key: string]: number } = {};
  for (const [category, percentage] of Object.entries(finalBreakdown)) {
    materialCosts[category] = Math.round(baseCost * percentage);
  }

  return materialCosts;
}