/**
 * Cost Factor Tables Service
 * Provides cost factors and calculations based on standardized cost factor tables
 */

import { z } from 'zod';

// Cost factor types
export type CostFactorType = 
  'regionFactor' | 
  'qualityFactor' | 
  'conditionFactor' | 
  'complexityFactor' | 
  'sizeFactor' | 
  'heightFactor' | 
  'ageFactor';

// Factor class codes
export enum FactorClass {
  RESIDENTIAL = 'RES',
  COMMERCIAL = 'COM', 
  INDUSTRIAL = 'IND',
  AGRICULTURAL = 'AGR'
}

// Cost factor schema
export const factorSchema = z.object({
  id: z.number().optional(),
  factorClass: z.nativeEnum(FactorClass),
  factorType: z.string(),
  code: z.string(),
  description: z.string(),
  value: z.number(),
  yearEffective: z.number(),
  source: z.string().optional(),
});

export type CostFactorTablesFactor = z.infer<typeof factorSchema>;

/**
 * Get cost factors for a specific property type and region
 */
export function getCostFactors(propertyType: string, region: string) {
  // Implementation would fetch from database
  return [];
}

/**
 * Calculate the adjusted cost using cost factors
 */
export function calculateAdjustedCost(baseCost: number, factors: Record<CostFactorType, number>) {
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
    return getCostFactors(propertyType, region);
  }
  
  /**
   * Calculate cost with standardized factors
   */
  calculateCost(baseCost: number, factors: Record<CostFactorType, number>) {
    return calculateAdjustedCost(baseCost, factors);
  }
}

export default new CostFactorTablesService();
