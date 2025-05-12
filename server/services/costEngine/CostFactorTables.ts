/**
 * Cost Factor Tables Service
 * Provides cost factors and calculations based on standardized cost factor tables
 */

import { z } from 'zod';
import { loadCostFactors, getCostSource } from './costFactorLoader';

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
  AGRICULTURAL = 'AGR',
  MULTIFAMILY = 'MUL'
}

// Cost factor schema
export const factorSchema = z.object({
  id: z.number().optional(),
  factorClass: z.nativeEnum(FactorClass),
  factorType: z.string(),
  code: z.string(),
  description: z.string(),
  value: z.number(),
  yearEffective: z.number().optional(),
  source: z.string().optional(),
});

export type CostFactorTablesFactor = z.infer<typeof factorSchema>;

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
export function getCostFactors(propertyType: string, region: string) {
  const source = getCostSource();
  const costFactors = loadCostFactors(source);
  const factors: CostFactorTablesFactor[] = [];
  
  // Building type base cost
  const buildingType = costFactors.buildingTypes?.find(
    (type: any) => type.code === propertyType
  );
  
  if (buildingType) {
    // Add building type as a factor
    factors.push({
      factorClass: propertyType as FactorClass,
      factorType: 'baseRate',
      code: propertyType,
      description: buildingType.description,
      value: buildingType.baseCost,
      source
    });
  }
  
  // Region factor
  const regionFactor = costFactors.regions?.find(
    (r: any) => r.code === region
  );
  
  if (regionFactor) {
    factors.push({
      factorClass: propertyType as FactorClass,
      factorType: 'regionFactor',
      code: region,
      description: regionFactor.name,
      value: regionFactor.factor,
      source
    });
  }
  
  return factors;
}

/**
 * Get all available factors for a given source
 */
export function getAllFactors() {
  const source = getCostSource();
  const costFactors = loadCostFactors(source);
  const factors: CostFactorTablesFactor[] = [];
  
  // Process each factor type
  Object.entries(factorTypeMapping).forEach(([factorType, dataKey]) => {
    if (costFactors[dataKey] && Array.isArray(costFactors[dataKey])) {
      costFactors[dataKey].forEach((item: any) => {
        factors.push({
          factorClass: item.factorClass || 'ALL',
          factorType,
          code: item.code || item.level || item.range,
          description: item.description,
          value: item.factor,
          source
        });
      });
    }
  });
  
  return factors;
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
   * Get all factors
   */
  async getAllFactors() {
    return getAllFactors();
  }
  
  /**
   * Calculate cost with standardized factors
   */
  calculateCost(baseCost: number, factors: Record<CostFactorType, number>) {
    return calculateAdjustedCost(baseCost, factors);
  }
  
  /**
   * Get the current cost source
   */
  getCurrentSource() {
    return getCostSource();
  }
}

export default new CostFactorTablesService();
