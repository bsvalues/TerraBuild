/**
 * Cost Estimation Agent for Benton County Building Cost System
 * 
 * This specialized agent handles building cost estimation tasks, including:
 * - Applying regional cost factors
 * - Considering building complexity, quality, and condition
 * - Calculating depreciation based on age and condition
 * - Suggesting optimal valuation methods
 */

import { AgentEventType, AgentMemoryItem } from './baseAgent';
import { CustomAgentBase } from './customAgentBase';
import { v4 as uuidv4 } from 'uuid';

// Building quality levels
enum BuildingQuality {
  LOW = 'LOW',
  MEDIUM_LOW = 'MEDIUM_LOW',
  MEDIUM = 'MEDIUM',
  MEDIUM_HIGH = 'MEDIUM_HIGH',
  HIGH = 'HIGH',
  PREMIUM = 'PREMIUM'
}

// Building condition levels
enum BuildingCondition {
  POOR = 'POOR',
  FAIR = 'FAIR',
  AVERAGE = 'AVERAGE',
  GOOD = 'GOOD',
  EXCELLENT = 'EXCELLENT'
}

// Region cost factors
const REGION_FACTORS: Record<string, number> = {
  'EASTERN': 0.95,
  'CENTRAL': 1.0,
  'WESTERN': 1.05
};

// Quality multipliers
const QUALITY_MULTIPLIERS = {
  [BuildingQuality.LOW]: 0.85,
  [BuildingQuality.MEDIUM_LOW]: 0.95,
  [BuildingQuality.MEDIUM]: 1.0,
  [BuildingQuality.MEDIUM_HIGH]: 1.1,
  [BuildingQuality.HIGH]: 1.25,
  [BuildingQuality.PREMIUM]: 1.5
};

// Condition adjustment factors
const CONDITION_FACTORS = {
  [BuildingCondition.POOR]: 0.7,
  [BuildingCondition.FAIR]: 0.85,
  [BuildingCondition.AVERAGE]: 1.0,
  [BuildingCondition.GOOD]: 1.1,
  [BuildingCondition.EXCELLENT]: 1.2
};

/**
 * Interface for Cost Estimation Request
 */
interface CostEstimationRequest {
  buildingType: string;
  squareFeet: number;
  region: string;
  quality?: BuildingQuality;
  condition?: BuildingCondition;
  yearBuilt?: number;
  constructionDetails?: {
    stories?: number;
    foundation?: string;
    exterior?: string;
    roofType?: string;
    heating?: string;
    cooling?: string;
    additions?: Array<{
      type: string;
      squareFeet: number;
      yearAdded: number;
    }>;
  };
}

/**
 * Interface for Cost Estimation Result
 */
interface CostEstimationResult {
  estimatedCost: number;
  baseRate: number;
  adjustedRate: number;
  appliedFactors: {
    region: number;
    quality: number;
    condition: number;
    age: number;
    complexity: number;
  };
  breakdown: {
    baseValue: number;
    qualityAdjustment: number;
    conditionAdjustment: number;
    regionAdjustment: number;
    ageAdjustment: number;
    complexityAdjustment: number;
  };
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string[];
}

/**
 * Cost Estimation Agent class
 */
export class CostEstimationAgent extends CustomAgentBase {
  private readonly baseRates: Record<string, number> = {
    'RESIDENTIAL': 125,
    'COMMERCIAL': 175,
    'INDUSTRIAL': 150,
    'AGRICULTURAL': 85,
    'INSTITUTIONAL': 190,
    'MIXED_USE': 160
  };

  constructor() {
    super('cost-estimation-agent', 'Cost Estimation Agent');
    
    // Register event handlers
    this.registerEventHandler('cost:estimate:request', this.handleCostEstimationRequest.bind(this));
    this.registerEventHandler('cost:matrix:update', this.handleCostMatrixUpdate.bind(this));
    
    console.log('Cost Estimation Agent initialized');
  }

  /**
   * Handle a cost estimation request
   * 
   * @param event The event containing the cost estimation request
   */
  // Add a memory item to the agent's memory
  private recordMemory(item: AgentMemoryItem) {
    // For now just log the memory item
    console.log(`Memory recorded: ${item.type}`);
  }
  
  private async handleCostEstimationRequest(event: any, context: any): Promise<void> {
    console.log(`Cost Estimation Agent received request with ID: ${event.correlationId}`);
    
    try {
      // Support both payload (from AgentEventBus) and data (from tests) formats
      const request: CostEstimationRequest = event.payload?.request || event.data?.request;
      
      if (!request || !request.buildingType || !request.squareFeet || !request.region) {
        throw new Error('Invalid cost estimation request. Missing required parameters.');
      }
      
      // Standardize inputs
      const standardizedRequest = this.standardizeRequest(request);
      
      // Calculate the cost estimation
      const estimation = await this.calculateCostEstimation(standardizedRequest);
      
      // Emit the result
      this.emitEvent('cost:estimate:completed', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          estimation,
          success: true,
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
      
      console.log(`Cost estimation completed for request ID: ${event.correlationId}`);
      
      // Record this interaction in the agent's memory
      this.recordMemory({
        type: 'cost_estimation',
        timestamp: new Date(),
        input: standardizedRequest,
        output: estimation,
        tags: ['estimation', 'success']
      });
    } catch (error) {
      console.error('Error in cost estimation:', error instanceof Error ? error.message : String(error));
      
      // Emit error event
      this.emitEvent('cost:estimate:error', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          errorMessage: error instanceof Error ? error.message : String(error),
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
      
      // Record the failure in memory
      this.recordMemory({
        type: 'cost_estimation_failure',
        timestamp: new Date(),
        input: event.data?.request || event.payload?.request,
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        },
        tags: ['estimation', 'error']
      });
    }
  }

  /**
   * Handle a cost matrix update
   * 
   * @param event The event containing the updated cost matrix
   * @param context Additional context for event handling
   */
  private async handleCostMatrixUpdate(event: any, context: any): Promise<void> {
    console.log(`Cost Estimation Agent received matrix update with ID: ${event.correlationId}`);
    
    try {
      const matrix = event.payload?.matrix || event.data?.matrix;
      
      if (!matrix) {
        throw new Error('Invalid cost matrix update event. Missing matrix data.');
      }
      
      // Update the base rates with the new matrix
      this.updateBaseRates(matrix);
      
      // Emit acknowledgment
      this.emitEvent('cost:matrix:updated', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          success: true,
          message: 'Cost matrix updated successfully'
        }
      });
      
      console.log('Cost matrix updated successfully');
      
      // Record this interaction in the agent's memory
      this.recordMemory({
        type: 'cost_matrix_update',
        timestamp: new Date(),
        input: matrix,
        metadata: {
          matrixId: matrix.id || 'unknown'
        },
        tags: ['matrix', 'update', 'success']
      });
    } catch (error) {
      console.error('Error updating cost matrix:', error instanceof Error ? error.message : String(error));
      
      // Emit error event
      this.emitEvent('cost:matrix:error', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });
      
      // Record the failure in memory
      this.recordMemory({
        type: 'cost_matrix_update_failure',
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        },
        tags: ['matrix', 'update', 'error']
      });
    }
  }

  /**
   * Standardize a cost estimation request
   * 
   * @param request The request to standardize
   * @returns The standardized request
   */
  private standardizeRequest(request: CostEstimationRequest): CostEstimationRequest {
    // Clone the request to avoid modifying the original
    const standardized = { ...request };
    
    // Standardize building type
    standardized.buildingType = standardized.buildingType.toUpperCase();
    
    // Standardize region
    standardized.region = standardized.region.toUpperCase();
    
    // Set defaults for missing values
    if (!standardized.quality) {
      standardized.quality = BuildingQuality.MEDIUM;
    }
    
    if (!standardized.condition) {
      standardized.condition = BuildingCondition.AVERAGE;
    }
    
    if (!standardized.yearBuilt) {
      standardized.yearBuilt = new Date().getFullYear() - 10; // Default to 10 years old
    }
    
    return standardized;
  }

  /**
   * Calculate a cost estimation
   * 
   * @param request The cost estimation request
   * @returns The cost estimation result
   */
  private async calculateCostEstimation(request: CostEstimationRequest): Promise<CostEstimationResult> {
    // Get the base rate for the building type
    const baseRate = this.getBaseRate(request.buildingType);
    
    // Calculate adjustments
    const regionFactor = this.getRegionFactor(request.region);
    const qualityFactor = this.getQualityFactor(request.quality || BuildingQuality.MEDIUM);
    const conditionFactor = this.getConditionFactor(request.condition || BuildingCondition.AVERAGE);
    const ageFactor = this.calculateAgeFactor(request.yearBuilt || (new Date().getFullYear() - 10));
    const complexityFactor = this.calculateComplexityFactor(request);
    
    // Calculate the adjusted rate
    const adjustedRate = baseRate * regionFactor * qualityFactor * conditionFactor * ageFactor * complexityFactor;
    
    // Calculate total cost
    const totalCost = adjustedRate * request.squareFeet;
    
    // Calculate breakdown
    const baseValue = baseRate * request.squareFeet;
    const regionAdjustment = baseValue * (regionFactor - 1);
    const qualityAdjustment = baseValue * (qualityFactor - 1);
    const conditionAdjustment = baseValue * (conditionFactor - 1);
    const ageAdjustment = baseValue * (ageFactor - 1);
    const complexityAdjustment = baseValue * (complexityFactor - 1);
    
    // Generate notes
    const notes: string[] = [];
    if (regionFactor !== 1.0) {
      notes.push(`Applied regional factor of ${regionFactor.toFixed(2)} for ${request.region} region.`);
    }
    
    if (qualityFactor !== 1.0) {
      notes.push(`Applied quality adjustment of ${qualityFactor.toFixed(2)} for ${request.quality} quality.`);
    }
    
    if (conditionFactor !== 1.0) {
      notes.push(`Applied condition adjustment of ${conditionFactor.toFixed(2)} for ${request.condition} condition.`);
    }
    
    if (ageFactor !== 1.0) {
      notes.push(`Applied age adjustment of ${ageFactor.toFixed(2)} for a building from ${request.yearBuilt}.`);
    }
    
    if (complexityFactor !== 1.0) {
      notes.push(`Applied complexity adjustment of ${complexityFactor.toFixed(2)} based on building details.`);
    }
    
    // Determine confidence level
    const confidenceLevel = this.determineConfidenceLevel(request);
    
    return {
      estimatedCost: Math.round(totalCost * 100) / 100,
      baseRate,
      adjustedRate: Math.round(adjustedRate * 100) / 100,
      appliedFactors: {
        region: regionFactor,
        quality: qualityFactor,
        condition: conditionFactor,
        age: ageFactor,
        complexity: complexityFactor
      },
      breakdown: {
        baseValue,
        regionAdjustment,
        qualityAdjustment,
        conditionAdjustment,
        ageAdjustment,
        complexityAdjustment
      },
      confidenceLevel,
      notes
    };
  }

  /**
   * Get the base rate for a building type
   * 
   * @param buildingType The building type
   * @returns The base rate
   */
  private getBaseRate(buildingType: string): number {
    const standardizedType = buildingType.toUpperCase();
    
    if (this.baseRates[standardizedType]) {
      return this.baseRates[standardizedType];
    }
    
    // If building type not found, use residential as fallback
    console.warn(`Building type '${buildingType}' not found in base rates. Using RESIDENTIAL rate.`);
    return this.baseRates['RESIDENTIAL'];
  }

  /**
   * Get the region factor
   * 
   * @param region The region
   * @returns The region factor
   */
  private getRegionFactor(region: string): number {
    const standardizedRegion = region.toUpperCase();
    
    if (REGION_FACTORS[standardizedRegion]) {
      return REGION_FACTORS[standardizedRegion];
    }
    
    // If region not found, use central (default factor of 1.0)
    console.warn(`Region '${region}' not found in region factors. Using CENTRAL factor.`);
    return REGION_FACTORS['CENTRAL'];
  }

  /**
   * Get the quality factor
   * 
   * @param quality The building quality
   * @returns The quality factor
   */
  private getQualityFactor(quality: BuildingQuality): number {
    if (QUALITY_MULTIPLIERS[quality]) {
      return QUALITY_MULTIPLIERS[quality];
    }
    
    // If quality not found, use medium (default factor of 1.0)
    console.warn(`Quality '${quality}' not found in quality multipliers. Using MEDIUM quality.`);
    return QUALITY_MULTIPLIERS[BuildingQuality.MEDIUM];
  }

  /**
   * Get the condition factor
   * 
   * @param condition The building condition
   * @returns The condition factor
   */
  private getConditionFactor(condition: BuildingCondition): number {
    if (CONDITION_FACTORS[condition]) {
      return CONDITION_FACTORS[condition];
    }
    
    // If condition not found, use average (default factor of 1.0)
    console.warn(`Condition '${condition}' not found in condition factors. Using AVERAGE condition.`);
    return CONDITION_FACTORS[BuildingCondition.AVERAGE];
  }

  /**
   * Calculate the age factor based on year built
   * 
   * @param yearBuilt The year the building was built
   * @returns The age factor
   */
  private calculateAgeFactor(yearBuilt: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - yearBuilt;
    
    // Age factor formula (example: 50-year-old building has factor of 0.75)
    // Buildings newer than 10 years don't have age depreciation
    if (age <= 10) {
      return 1.0;
    }
    
    // Maximum depreciation of 50% for very old buildings (100+ years)
    const ageFactor = Math.max(0.5, 1.0 - ((age - 10) / 200));
    
    return ageFactor;
  }

  /**
   * Calculate the complexity factor based on construction details
   * 
   * @param request The cost estimation request
   * @returns The complexity factor
   */
  private calculateComplexityFactor(request: CostEstimationRequest): number {
    let complexityFactor = 1.0;
    
    if (!request.constructionDetails) {
      return complexityFactor;
    }
    
    // Adjust for multiple stories
    if (request.constructionDetails.stories && request.constructionDetails.stories > 1) {
      // Multi-story buildings are more complex
      complexityFactor += 0.05 * Math.min(request.constructionDetails.stories - 1, 4);
    }
    
    // Adjust for premium features
    if (request.constructionDetails.cooling === 'CENTRAL' && request.constructionDetails.heating === 'FORCED_AIR') {
      complexityFactor += 0.03;
    }
    
    // Adjust for complex foundation
    if (request.constructionDetails.foundation === 'BASEMENT' || request.constructionDetails.foundation === 'CRAWLSPACE') {
      complexityFactor += 0.05;
    }
    
    // Adjust for complex roof
    if (request.constructionDetails.roofType === 'COMPLEX' || request.constructionDetails.roofType === 'HIP') {
      complexityFactor += 0.03;
    }
    
    // Adjust for additions
    if (request.constructionDetails.additions && request.constructionDetails.additions.length > 0) {
      // Each addition increases complexity
      complexityFactor += 0.02 * Math.min(request.constructionDetails.additions.length, 5);
    }
    
    return complexityFactor;
  }

  /**
   * Determine the confidence level of the estimation
   * 
   * @param request The cost estimation request
   * @returns The confidence level
   */
  private determineConfidenceLevel(request: CostEstimationRequest): 'LOW' | 'MEDIUM' | 'HIGH' {
    // More detailed requests have higher confidence
    let detailScore = 0;
    
    // Check for required fields
    if (request.buildingType && request.squareFeet && request.region) {
      detailScore += 1;
    }
    
    // Check for additional fields
    if (request.quality) detailScore += 1;
    if (request.condition) detailScore += 1;
    if (request.yearBuilt) detailScore += 1;
    
    // Check for construction details
    if (request.constructionDetails) {
      if (request.constructionDetails.stories) detailScore += 1;
      if (request.constructionDetails.foundation) detailScore += 1;
      if (request.constructionDetails.exterior) detailScore += 1;
      if (request.constructionDetails.roofType) detailScore += 1;
      if (request.constructionDetails.heating) detailScore += 1;
      if (request.constructionDetails.cooling) detailScore += 1;
      if (request.constructionDetails.additions && request.constructionDetails.additions.length > 0) detailScore += 1;
    }
    
    // Determine confidence level based on detail score
    if (detailScore >= 8) {
      return 'HIGH';
    } else if (detailScore >= 4) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Update the base rates with a new cost matrix
   * 
   * @param matrix The new cost matrix
   */
  private updateBaseRates(matrix: any): void {
    if (!matrix || !matrix.buildingTypes) {
      console.warn('Cost matrix does not contain building types');
      return;
    }
    
    // Update base rates from the matrix
    for (const buildingType of matrix.buildingTypes) {
      if (buildingType.code && buildingType.baseRate) {
        this.baseRates[buildingType.code.toUpperCase()] = buildingType.baseRate;
      }
    }
    
    console.log('Base rates updated from cost matrix');
  }
}

// Create the singleton instance
export const costEstimationAgent = new CostEstimationAgent();