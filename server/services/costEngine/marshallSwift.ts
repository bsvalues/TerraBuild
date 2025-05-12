/**
 * Marshall & Swift Cost Factor Service
 * Provides cost factors and calculations based on Marshall & Swift data
 */

import { z } from 'zod';
import { loadCostFactors } from './costFactorLoader';

// Marshall Swift factor types
export type MsCostFactorType = 
  'regionFactor' | 
  'qualityFactor' | 
  'conditionFactor' | 
  'complexityFactor' | 
  'sizeFactor' | 
  'heightFactor' | 
  'ageFactor';

// Marshall Swift class codes
export enum MsClass {
  RESIDENTIAL = 'RES',
  COMMERCIAL = 'COM', 
  INDUSTRIAL = 'IND',
  AGRICULTURAL = 'AGR',
  MULTIFAMILY = 'MUL'
}

// Marshall Swift factor schema
export const msFactorSchema = z.object({
  id: z.number().optional(),
  msClass: z.nativeEnum(MsClass),
  factorType: z.string(),
  code: z.string(),
  description: z.string(),
  value: z.number(),
  yearEffective: z.number().optional(),
  source: z.string().optional(),
});

export type MarshallSwiftFactor = z.infer<typeof msFactorSchema>;

// Define a mapping between factor types and data structure
const factorTypeMapping = {
  regionFactor: 'regions',
  qualityFactor: 'quality',
  conditionFactor: 'condition',
  complexityFactor: 'complexity',
  ageFactor: 'age'
};

/**
 * Get cost factors for a specific property type and region
 */
export function getMsCostFactors(propertyType: string, region: string) {
  const marshallSwiftData = loadCostFactors('marshallSwift');
  const factors: MarshallSwiftFactor[] = [];
  
  // Building type base cost
  const buildingType = marshallSwiftData.buildingTypes?.find(
    (type: any) => type.code === propertyType
  );
  
  if (buildingType) {
    // Add building type as a factor
    factors.push({
      msClass: propertyType as MsClass,
      factorType: 'baseRate',
      code: propertyType,
      description: buildingType.description,
      value: buildingType.baseCost,
      source: 'marshallSwift'
    });
  }
  
  // Region factor
  const regionFactor = marshallSwiftData.regions?.find(
    (r: any) => r.code === region
  );
  
  if (regionFactor) {
    factors.push({
      msClass: propertyType as MsClass,
      factorType: 'regionFactor',
      code: region,
      description: regionFactor.name,
      value: regionFactor.factor,
      source: 'marshallSwift'
    });
  }
  
  return factors;
}

/**
 * Get all available factors
 */
export function getAllMsFactors() {
  const marshallSwiftData = loadCostFactors('marshallSwift');
  const factors: MarshallSwiftFactor[] = [];
  
  // Process each factor type
  Object.entries(factorTypeMapping).forEach(([factorType, dataKey]) => {
    if (marshallSwiftData[dataKey] && Array.isArray(marshallSwiftData[dataKey])) {
      marshallSwiftData[dataKey].forEach((item: any) => {
        factors.push({
          msClass: item.msClass || 'ALL',
          factorType,
          code: item.code || item.level || item.range,
          description: item.description,
          value: item.factor,
          source: 'marshallSwift'
        });
      });
    }
  });
  
  return factors;
}

/**
 * Calculate the adjusted cost using Marshall Swift factors
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
   * Get all Marshall Swift factors
   */
  async getAllFactors() {
    return getAllMsFactors();
  }
  
  /**
   * Calculate cost with Marshall Swift method
   */
  calculateCost(baseCost: number, factors: Record<MsCostFactorType, number>) {
    return calculateMsAdjustedCost(baseCost, factors);
  }
}

export default new MarshallSwiftService();