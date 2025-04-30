/**
 * Marshall & Swift Cost Factor Service
 * Provides cost factors and calculations based on Marshall & Swift data
 */

import { z } from 'zod';

// MarshallSwift factor types
export type MsCostFactorType = 
  'regionFactor' | 
  'qualityFactor' | 
  'conditionFactor' | 
  'complexityFactor' | 
  'sizeFactor' | 
  'heightFactor' | 
  'ageFactor';

// MarshallSwift class codes
export enum MsClass {
  RESIDENTIAL = 'RES',
  COMMERCIAL = 'COM', 
  INDUSTRIAL = 'IND',
  AGRICULTURAL = 'AGR'
}

// MarshallSwift factor schema
export const msFactorSchema = z.object({
  id: z.number().optional(),
  msClass: z.nativeEnum(MsClass),
  factorType: z.string(),
  code: z.string(),
  description: z.string(),
  value: z.number(),
  yearEffective: z.number(),
  source: z.string().optional(),
});

export type MarshallSwiftFactor = z.infer<typeof msFactorSchema>;

/**
 * Get cost factors for a specific property type and region
 */
export function getMsCostFactors(propertyType: string, region: string) {
  // Implementation would fetch from database
  return [];
}

/**
 * Calculate the adjusted cost using MarshallSwift factors
 */
export function calculateMsAdjustedCost(baseCost: number, factors: Record<MsCostFactorType, number>) {
  let adjustedCost = baseCost;
  
  // Apply each factor
  Object.values(factors).forEach(factor => {
    adjustedCost *= factor;
  });
  
  return adjustedCost;
}

/**
 * MarshallSwift service class
 */
export class MarshallSwiftService {
  /**
   * Get cost factors for property
   */
  async getFactors(propertyType: string, region: string) {
    return getMsCostFactors(propertyType, region);
  }
  
  /**
   * Calculate cost with MarshallSwift method
   */
  calculateCost(baseCost: number, factors: Record<MsCostFactorType, number>) {
    return calculateMsAdjustedCost(baseCost, factors);
  }
}

export default new MarshallSwiftService();
