/**
 * Marshall & Swift Cost Factor Service
 * Provides cost factors and calculations based on Marshall & Swift data
 */

import { z } from 'zod';

// CostFactorTables factor types
export type FactorCostFactorType = 
  'regionFactor' | 
  'qualityFactor' | 
  'conditionFactor' | 
  'complexityFactor' | 
  'sizeFactor' | 
  'heightFactor' | 
  'ageFactor';

// CostFactorTables class codes
export enum FactorClass {
  RESIDENTIAL = 'RES',
  COMMERCIAL = 'COM', 
  INDUSTRIAL = 'IND',
  AGRICULTURAL = 'AGR'
}

// CostFactorTables factor schema
export const factorFactorSchema = z.object({
  id: z.number().optional(),
  factorClass: z.nativeEnum(FactorClass),
  factorType: z.string(),
  code: z.string(),
  description: z.string(),
  value: z.number(),
  yearEffective: z.number(),
  source: z.string().optional(),
});

export type CostFactorTablesFactor = z.infer<typeof factorFactorSchema>;

/**
 * Get cost factors for a specific property type and region
 */
export function getFactorCostFactors(propertyType: string, region: string) {
  // Implementation would fetch from database
  return [];
}

/**
 * Calculate the adjusted cost using CostFactorTables factors
 */
export function calculateFactorAdjustedCost(baseCost: number, factors: Record<FactorCostFactorType, number>) {
  let adjustedCost = baseCost;
  
  // Apply each factor
  Object.values(factors).forEach(factor => {
    adjustedCost *= factor;
  });
  
  return adjustedCost;
}

/**
 * CostFactorTables service class
 */
export class CostFactorTablesService {
  /**
   * Get cost factors for property
   */
  async getFactors(propertyType: string, region: string) {
    return getFactorCostFactors(propertyType, region);
  }
  
  /**
   * Calculate cost with CostFactorTables method
   */
  calculateCost(baseCost: number, factors: Record<FactorCostFactorType, number>) {
    return calculateFactorAdjustedCost(baseCost, factors);
  }
}

export default new CostFactorTablesService();
