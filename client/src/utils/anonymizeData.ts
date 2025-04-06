/**
 * Data Anonymization Utility
 * 
 * Provides functions to anonymize different types of data in the BCBS application.
 * This is used to protect sensitive information when sharing or exporting data.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Anonymization configuration options
 */
export interface AnonymizationOptions {
  /**
   * Anonymize personal identifiers (names, IDs, etc.)
   */
  anonymizeIdentifiers?: boolean;
  
  /**
   * Anonymize location information (addresses, coordinates, etc.)
   */
  anonymizeLocations?: boolean;
  
  /**
   * Anonymize financial values (apply randomization within a range to costs)
   */
  anonymizeFinancials?: boolean;
  
  /**
   * How much variance to apply to financial values when anonymizing (0.1 = 10%)
   * Default is 0.1 (10%)
   */
  financialVariance?: number;
  
  /**
   * Preserve statistical validity (maintain relative proportions in data)
   */
  preserveStatistics?: boolean;
}

// Default anonymization options
const defaultOptions: AnonymizationOptions = {
  anonymizeIdentifiers: true,
  anonymizeLocations: true,
  anonymizeFinancials: false,
  financialVariance: 0.1,
  preserveStatistics: true
};

// Cache for consistent anonymization of values
const anonymizationCache = new Map<string, string>();

/**
 * Anonymize a string value based on type
 */
function anonymizeString(value: string, type: 'identifier' | 'location' | 'other' = 'other'): string {
  // Check if this value was previously anonymized
  if (anonymizationCache.has(value)) {
    return anonymizationCache.get(value)!;
  }
  
  let anonymized: string;
  
  switch (type) {
    case 'identifier':
      // Replace with a random ID
      anonymized = `ID-${uuidv4().substring(0, 8)}`;
      break;
      
    case 'location':
      // Replace with a generic location code
      anonymized = `LOC-${uuidv4().substring(0, 6)}`;
      break;
      
    default:
      // Generic anonymization for other types
      anonymized = `ANON-${uuidv4().substring(0, 6)}`;
  }
  
  // Cache the anonymized value for consistency
  anonymizationCache.set(value, anonymized);
  return anonymized;
}

/**
 * Anonymize a number value with controlled variance
 */
function anonymizeNumber(value: number, variance: number = 0.1, preserveStatistics: boolean = true): number {
  if (!variance) {
    return value;
  }
  
  // Generate a random factor within the variance range
  const factor = 1 + (Math.random() * 2 - 1) * variance;
  
  // Apply the factor to the value
  let anonymized = value * factor;
  
  // If preserving statistics, ensure the same average is maintained
  if (preserveStatistics) {
    // This is a simplistic approach - in a full implementation you'd
    // want to maintain the distribution characteristics of the full dataset
    anonymized = Math.round(anonymized * 100) / 100;
  }
  
  return anonymized;
}

/**
 * Anonymize building data
 */
export function anonymizeBuildingData(
  data: Record<string, any>,
  options: AnonymizationOptions = defaultOptions
): Record<string, any> {
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create a copy of the data to avoid modifying the original
  const anonymizedData = { ...data };
  
  // Anonymize identifiers
  if (mergedOptions.anonymizeIdentifiers) {
    if (anonymizedData.buildingId) {
      anonymizedData.buildingId = anonymizeString(
        anonymizedData.buildingId.toString(), 
        'identifier'
      );
    }
    
    if (anonymizedData.ownerName) {
      anonymizedData.ownerName = anonymizeString(
        anonymizedData.ownerName, 
        'identifier'
      );
    }
    
    if (anonymizedData.assessorId) {
      anonymizedData.assessorId = anonymizeString(
        anonymizedData.assessorId.toString(), 
        'identifier'
      );
    }
    
    if (anonymizedData.parcelNumber) {
      anonymizedData.parcelNumber = anonymizeString(
        anonymizedData.parcelNumber.toString(), 
        'identifier'
      );
    }
  }
  
  // Anonymize location information
  if (mergedOptions.anonymizeLocations) {
    if (anonymizedData.address) {
      anonymizedData.address = anonymizeString(
        anonymizedData.address, 
        'location'
      );
    }
    
    if (anonymizedData.coordinates) {
      anonymizedData.coordinates = anonymizeString(
        anonymizedData.coordinates.toString(), 
        'location'
      );
    }
    
    // If subdivision or lot information exists
    if (anonymizedData.subdivision) {
      anonymizedData.subdivision = anonymizeString(
        anonymizedData.subdivision, 
        'location'
      );
    }
    
    if (anonymizedData.lotNumber) {
      anonymizedData.lotNumber = anonymizeString(
        anonymizedData.lotNumber.toString(), 
        'location'
      );
    }
  }
  
  // Anonymize financial values
  if (mergedOptions.anonymizeFinancials) {
    const variance = mergedOptions.financialVariance || 0.1;
    const preserveStats = mergedOptions.preserveStatistics !== false;
    
    if (typeof anonymizedData.baseCost === 'number') {
      anonymizedData.baseCost = anonymizeNumber(
        anonymizedData.baseCost, 
        variance, 
        preserveStats
      );
    }
    
    if (typeof anonymizedData.totalCost === 'number') {
      anonymizedData.totalCost = anonymizeNumber(
        anonymizedData.totalCost, 
        variance, 
        preserveStats
      );
    }
    
    // Anonymize material costs if they exist
    if (Array.isArray(anonymizedData.materialCosts)) {
      anonymizedData.materialCosts = anonymizedData.materialCosts.map((material: any) => ({
        ...material,
        unitCost: typeof material.unitCost === 'number' 
          ? anonymizeNumber(material.unitCost, variance, preserveStats) 
          : material.unitCost,
        totalCost: typeof material.totalCost === 'number' 
          ? anonymizeNumber(material.totalCost, variance, preserveStats) 
          : material.totalCost
      }));
    }
  }
  
  return anonymizedData;
}

/**
 * Anonymize a collection of building records
 */
export function anonymizeBuildingCollection(
  records: Record<string, any>[],
  options: AnonymizationOptions = defaultOptions
): Record<string, any>[] {
  // Clear the cache before processing the collection
  // to ensure consistency across the dataset
  anonymizationCache.clear();
  
  return records.map(record => anonymizeBuildingData(record, options));
}

/**
 * Anonymize the calculation result data
 */
export function anonymizeCalculationData(
  calculationData: Record<string, any>,
  options: AnonymizationOptions = defaultOptions
): Record<string, any> {
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create a copy of the data
  const anonymized = { ...calculationData };
  
  // Anonymize financial values if enabled
  if (mergedOptions.anonymizeFinancials) {
    const variance = mergedOptions.financialVariance || 0.1;
    const preserveStats = mergedOptions.preserveStatistics !== false;
    
    if (typeof anonymized.baseCost === 'number') {
      anonymized.baseCost = anonymizeNumber(anonymized.baseCost, variance, preserveStats);
    }
    
    if (typeof anonymized.totalCost === 'number') {
      anonymized.totalCost = anonymizeNumber(anonymized.totalCost, variance, preserveStats);
    }
    
    // Anonymize material costs if they exist
    if (Array.isArray(anonymized.materialCosts)) {
      anonymized.materialCosts = anonymized.materialCosts.map((material: any) => ({
        ...material,
        unitCost: typeof material.unitCost === 'number' 
          ? anonymizeNumber(material.unitCost, variance, preserveStats) 
          : material.unitCost,
        totalCost: typeof material.totalCost === 'number' 
          ? anonymizeNumber(material.totalCost, variance, preserveStats) 
          : material.totalCost
      }));
    }
  }
  
  // Anonymize location-related information
  if (mergedOptions.anonymizeLocations && anonymized.region) {
    // Preserve region info if it's a standard code, otherwise anonymize it
    if (!/^(CENTRAL|EAST|WEST|NORTH|SOUTH)$/.test(anonymized.region)) {
      anonymized.region = anonymizeString(anonymized.region, 'location');
    }
  }
  
  return anonymized;
}