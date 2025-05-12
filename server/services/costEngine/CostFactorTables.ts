/**
 * Cost Factor Tables Service
 * 
 * This service provides access to the cost factors for building cost calculations.
 * It replaces the hardcoded Marshall & Swift tables with data-driven factors
 * that can be loaded from JSON files or from the database.
 */

import { costFactorLoader, type CostFactors } from './costFactorLoader';

export class CostFactorTables {
  private costFactors: CostFactors | null = null;
  private isInitialized = false;
  
  constructor() {}
  
  /**
   * Initialize the cost factor tables
   */
  async initialize(): Promise<boolean> {
    try {
      this.costFactors = await costFactorLoader.load();
      this.isInitialized = this.costFactors !== null;
      
      if (this.isInitialized && this.costFactors) {
        console.log(`CostFactorTables initialized from source: ${this.costFactors.source}`);
      } else {
        console.warn('CostFactorTables failed to initialize');
      }
      
      return this.isInitialized;
    } catch (error) {
      console.error('Error initializing CostFactorTables:', error);
      return false;
    }
  }
  
  /**
   * Get the base rate for a building type
   */
  getBaseRate(buildingType: string): number {
    if (!this.isInitialized || !this.costFactors) {
      throw new Error('CostFactorTables not initialized');
    }
    
    const standardizedType = buildingType.toUpperCase();
    
    if (this.costFactors.baseRates[standardizedType]) {
      return this.costFactors.baseRates[standardizedType];
    }
    
    // If building type not found, use residential as fallback
    console.warn(`Building type '${buildingType}' not found in base rates. Using RESIDENTIAL rate.`);
    return this.costFactors.baseRates['RESIDENTIAL'];
  }
  
  /**
   * Get the region factor for a region
   */
  getRegionFactor(region: string): number {
    if (!this.isInitialized || !this.costFactors) {
      throw new Error('CostFactorTables not initialized');
    }
    
    const standardizedRegion = region.toUpperCase();
    
    if (this.costFactors.regionFactors[standardizedRegion]) {
      return this.costFactors.regionFactors[standardizedRegion];
    }
    
    // If region not found, use central (default factor of 1.0)
    console.warn(`Region '${region}' not found in region factors. Using CENTRAL factor.`);
    return this.costFactors.regionFactors['CENTRAL'] || 1.0;
  }
  
  /**
   * Get the quality factor for a quality level
   */
  getQualityFactor(quality: string): number {
    if (!this.isInitialized || !this.costFactors) {
      throw new Error('CostFactorTables not initialized');
    }
    
    const standardizedQuality = quality.toUpperCase();
    
    if (this.costFactors.qualityFactors[standardizedQuality]) {
      return this.costFactors.qualityFactors[standardizedQuality];
    }
    
    // If quality not found, use medium (default factor of 1.0)
    console.warn(`Quality '${quality}' not found in quality factors. Using MEDIUM quality.`);
    return this.costFactors.qualityFactors['MEDIUM'] || 1.0;
  }
  
  /**
   * Get the condition factor for a condition level
   */
  getConditionFactor(condition: string): number {
    if (!this.isInitialized || !this.costFactors) {
      throw new Error('CostFactorTables not initialized');
    }
    
    const standardizedCondition = condition.toUpperCase();
    
    if (this.costFactors.conditionFactors[standardizedCondition]) {
      return this.costFactors.conditionFactors[standardizedCondition];
    }
    
    // If condition not found, use average (default factor of 1.0)
    console.warn(`Condition '${condition}' not found in condition factors. Using AVERAGE condition.`);
    return this.costFactors.conditionFactors['AVERAGE'] || 1.0;
  }
  
  /**
   * Calculate the age factor based on year built
   */
  calculateAgeFactor(yearBuilt: number): number {
    if (!this.isInitialized || !this.costFactors) {
      throw new Error('CostFactorTables not initialized');
    }
    
    const currentYear = new Date().getFullYear();
    const age = currentYear - yearBuilt;
    
    // Buildings newer than 5 years don't have age depreciation
    if (age <= 5) {
      return this.costFactors.agingFactors['NEW_5YRS'] || 1.0;
    }
    
    if (age <= 10) {
      return this.costFactors.agingFactors['5_10YRS'] || 0.95;
    }
    
    if (age <= 20) {
      return this.costFactors.agingFactors['10_20YRS'] || 0.9;
    }
    
    if (age <= 30) {
      return this.costFactors.agingFactors['20_30YRS'] || 0.85;
    }
    
    if (age <= 40) {
      return this.costFactors.agingFactors['30_40YRS'] || 0.8;
    }
    
    if (age <= 50) {
      return this.costFactors.agingFactors['40_50YRS'] || 0.75;
    }
    
    // Over 50 years old
    return this.costFactors.agingFactors['50_PLUS'] || 0.7;
  }
  
  /**
   * Calculate complexity factor based on building details
   */
  calculateComplexityFactor(buildingDetails: any): number {
    if (!this.isInitialized || !this.costFactors) {
      throw new Error('CostFactorTables not initialized');
    }
    
    let complexityFactor = 1.0;
    
    if (!buildingDetails) {
      return complexityFactor;
    }
    
    // Adjust for number of stories
    if (buildingDetails.stories) {
      const storyFactors = this.costFactors.complexityFactors.STORIES;
      
      if (buildingDetails.stories === 1 && storyFactors['1']) {
        complexityFactor *= storyFactors['1'];
      } else if (buildingDetails.stories === 2 && storyFactors['2']) {
        complexityFactor *= storyFactors['2'];
      } else if (buildingDetails.stories === 3 && storyFactors['3']) {
        complexityFactor *= storyFactors['3'];
      } else if (buildingDetails.stories === 4 && storyFactors['4']) {
        complexityFactor *= storyFactors['4'];
      } else if (buildingDetails.stories >= 5 && storyFactors['5_PLUS']) {
        complexityFactor *= storyFactors['5_PLUS'];
      }
    }
    
    // Adjust for foundation type
    if (buildingDetails.foundation) {
      const foundationFactors = this.costFactors.complexityFactors.FOUNDATION;
      const foundationType = buildingDetails.foundation.toUpperCase();
      
      if (foundationFactors[foundationType]) {
        complexityFactor *= foundationFactors[foundationType];
      }
    }
    
    // Adjust for roof type
    if (buildingDetails.roof || buildingDetails.roofType) {
      const roofFactors = this.costFactors.complexityFactors.ROOF;
      const roofType = (buildingDetails.roofType || buildingDetails.roof).toUpperCase();
      
      if (roofFactors[roofType]) {
        complexityFactor *= roofFactors[roofType];
      }
    }
    
    // Adjust for HVAC (heating/cooling)
    let hvacType = 'BASIC';
    
    if (buildingDetails.hvac) {
      hvacType = buildingDetails.hvac.toUpperCase();
    } else if (buildingDetails.heating === 'FORCED_AIR' && buildingDetails.cooling === 'CENTRAL') {
      hvacType = 'CENTRAL';
    } else if (buildingDetails.heating === 'HEAT_PUMP') {
      hvacType = 'HEAT_PUMP';
    } else if (buildingDetails.heating && !buildingDetails.cooling) {
      hvacType = 'BASIC';
    } else if (!buildingDetails.heating && !buildingDetails.cooling) {
      hvacType = 'NONE';
    }
    
    const hvacFactors = this.costFactors.complexityFactors.HVAC;
    if (hvacFactors[hvacType]) {
      complexityFactor *= hvacFactors[hvacType];
    }
    
    return complexityFactor;
  }
  
  /**
   * Get all cost factors
   */
  getAllFactors(): CostFactors | null {
    return this.costFactors;
  }
  
  /**
   * Get the source of the cost factors
   */
  getSource(): string {
    if (!this.isInitialized || !this.costFactors) {
      return 'Not initialized';
    }
    
    return this.costFactors.source;
  }
  
  /**
   * Get the year of the cost factors
   */
  getYear(): number {
    if (!this.isInitialized || !this.costFactors) {
      return new Date().getFullYear();
    }
    
    return this.costFactors.year;
  }
  
  /**
   * Reload the cost factors from the source
   */
  async reload(): Promise<boolean> {
    costFactorLoader.clearCache();
    return this.initialize();
  }
  
  /**
   * Check if the service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.costFactors !== null;
  }
}

// Singleton instance
export const costFactorTables = new CostFactorTables();

export default costFactorTables;