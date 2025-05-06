/**
 * TerraBuild AI Swarm - FactorTuner Agent
 * 
 * This specialized agent analyzes historical data and regional economic indicators
 * to fine-tune cost factors for more accurate assessments.
 */

import { Agent, AgentConfig, AgentTask } from '../Agent';

export interface CostFactor {
  id: string;
  category: string;
  name: string;
  description: string;
  baseValue: number;
  currentValue: number;
  minValue: number;
  maxValue: number;
  lastUpdated: Date;
}

export interface FactorTuneRequest {
  factorIds: string[];
  regionCode: string;
  historicalData?: {
    periodStart: Date;
    periodEnd: Date;
  };
  economicIndicators?: Record<string, any>;
  constraintSets?: Array<{
    factors: string[];
    constraint: 'sum' | 'min' | 'max' | 'ratio';
    value: number;
  }>;
}

export class FactorTuner extends Agent {
  private factors: Map<string, CostFactor> = new Map();
  private regionalAdjustments: Map<string, Record<string, number>> = new Map();
  private economicIndices: Map<string, number> = new Map();

  constructor() {
    const config: AgentConfig = {
      id: 'factor-tuner',
      name: 'FactorTuner',
      description: 'Fine-tunes cost factors based on historical data and regional economic indicators',
      version: '1.0.0',
      capabilities: [
        'factor:tune',
        'factor:analyze',
        'factor:recommend',
        'region:analyze'
      ]
    };
    
    super(config);
  }

  /**
   * Initialize the agent with cost factors and economic indices
   */
  public async initialize(): Promise<boolean> {
    try {
      // Load cost factors from data source
      await this.loadFactors();
      
      // Load regional adjustments from data source
      await this.loadRegionalAdjustments();
      
      // Load economic indices from data source
      await this.loadEconomicIndices();
      
      return super.initialize();
    } catch (error) {
      console.error('Failed to initialize FactorTuner agent:', error);
      return false;
    }
  }

  /**
   * Process a task submitted to the agent
   */
  protected async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    try {
      // Update task status to processing
      task.status = 'processing';
      this.tasks.set(taskId, task);
      
      // Process based on task type
      switch (task.type) {
        case 'factor:tune':
          await this.processTuneFactorsTask(task);
          break;
        case 'factor:analyze':
          await this.processAnalyzeFactorsTask(task);
          break;
        case 'factor:recommend':
          await this.processRecommendFactorsTask(task);
          break;
        case 'region:analyze':
          await this.processAnalyzeRegionTask(task);
          break;
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
    } catch (error) {
      console.error(`Error processing task ${taskId}:`, error);
      this.failTask(taskId, error.message);
    }
  }

  /**
   * Process a task to tune cost factors
   */
  private async processTuneFactorsTask(task: AgentTask): Promise<void> {
    const request = task.data as FactorTuneRequest;
    
    // Get the factors to tune
    const factorsToTune = Array.from(this.factors.values())
      .filter(factor => request.factorIds.includes(factor.id));
    
    if (factorsToTune.length === 0) {
      throw new Error('No valid factors found to tune');
    }
    
    // Get regional adjustments
    const regionAdjustments = this.regionalAdjustments.get(request.regionCode) || {};
    
    // Apply ML/statistical tuning model
    const tunedFactors = factorsToTune.map(factor => {
      // Apply regional adjustment if available
      const regionalAdjustment = regionAdjustments[factor.id] || 1.0;
      
      // Apply economic indicators if available
      let economicAdjustment = 1.0;
      if (request.economicIndicators) {
        economicAdjustment = this.calculateEconomicAdjustment(factor, request.economicIndicators);
      }
      
      // Calculate new factor value
      const newValue = factor.baseValue * regionalAdjustment * economicAdjustment;
      
      // Ensure the value is within min/max bounds
      const clampedValue = Math.max(
        factor.minValue,
        Math.min(factor.maxValue, newValue)
      );
      
      // Create updated factor
      return {
        ...factor,
        currentValue: clampedValue,
        lastUpdated: new Date()
      };
    });
    
    // Apply constraints if specified
    let constrainedFactors = tunedFactors;
    if (request.constraintSets && request.constraintSets.length > 0) {
      constrainedFactors = this.applyConstraints(tunedFactors, request.constraintSets);
    }
    
    // Update the factors in the map
    constrainedFactors.forEach(factor => {
      this.factors.set(factor.id, factor);
    });
    
    // Complete the task with results
    this.completeTask(task.id, {
      message: `Successfully tuned ${constrainedFactors.length} factors for region ${request.regionCode}`,
      tunedFactors: constrainedFactors,
      effectiveDate: new Date()
    });
  }

  /**
   * Process a task to analyze factors
   */
  private async processAnalyzeFactorsTask(task: AgentTask): Promise<void> {
    const { factorIds } = task.data;
    
    // Get the factors to analyze
    const factorsToAnalyze = Array.from(this.factors.values())
      .filter(factor => factorIds.includes(factor.id));
    
    if (factorsToAnalyze.length === 0) {
      throw new Error('No valid factors found to analyze');
    }
    
    // Perform analysis (simplified example)
    const analysis = factorsToAnalyze.map(factor => {
      const deviationFromBase = ((factor.currentValue / factor.baseValue) - 1) * 100;
      
      return {
        factorId: factor.id,
        name: factor.name,
        category: factor.category,
        currentValue: factor.currentValue,
        baseValue: factor.baseValue,
        deviationPercent: deviationFromBase,
        lastUpdated: factor.lastUpdated,
        status: this.getFactorStatus(deviationFromBase)
      };
    });
    
    // Complete the task with results
    this.completeTask(task.id, {
      message: `Successfully analyzed ${factorsToAnalyze.length} factors`,
      analysis,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to recommend factor adjustments
   */
  private async processRecommendFactorsTask(task: AgentTask): Promise<void> {
    const { regionCode, categories } = task.data;
    
    // Get the factors related to the categories
    const relatedFactors = Array.from(this.factors.values())
      .filter(factor => categories.includes(factor.category));
    
    if (relatedFactors.length === 0) {
      throw new Error('No factors found for the specified categories');
    }
    
    // Get regional adjustments
    const regionAdjustments = this.regionalAdjustments.get(regionCode) || {};
    
    // Generate recommendations based on economic indicators and regional data
    const recommendations = relatedFactors.map(factor => {
      // Current regional adjustment for this factor (or default to 1.0)
      const currentRegionalAdjustment = regionAdjustments[factor.id] || 1.0;
      
      // Analyze recent trends to recommend adjustment
      const recommendedAdjustment = this.analyzeFactorTrends(factor, regionCode);
      
      // Calculate the impact of the recommendation
      const impact = (recommendedAdjustment - currentRegionalAdjustment) * factor.baseValue;
      
      return {
        factorId: factor.id,
        name: factor.name,
        category: factor.category,
        currentRegionalAdjustment,
        recommendedAdjustment,
        impact,
        confidenceScore: this.calculateConfidenceScore(factor, regionCode),
        justification: this.generateJustification(factor, recommendedAdjustment, currentRegionalAdjustment)
      };
    });
    
    // Complete the task with results
    this.completeTask(task.id, {
      message: `Generated ${recommendations.length} factor recommendations for region ${regionCode}`,
      recommendations,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to analyze regional factors
   */
  private async processAnalyzeRegionTask(task: AgentTask): Promise<void> {
    const { regionCode } = task.data;
    
    // Get regional adjustments
    const regionAdjustments = this.regionalAdjustments.get(regionCode) || {};
    
    if (Object.keys(regionAdjustments).length === 0) {
      throw new Error(`No adjustments found for region ${regionCode}`);
    }
    
    // Calculate regional metrics
    const regionFactors = Array.from(this.factors.values())
      .filter(factor => regionAdjustments[factor.id] !== undefined);
    
    const factorAnalysis = regionFactors.map(factor => {
      const adjustment = regionAdjustments[factor.id];
      return {
        factorId: factor.id,
        name: factor.name,
        category: factor.category,
        regionalAdjustment: adjustment,
        effectiveValue: factor.baseValue * adjustment,
        deviationFromBase: ((adjustment - 1) * 100).toFixed(2) + '%'
      };
    });
    
    // Group by category
    const categoryAnalysis = factorAnalysis.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          categoryName: item.category,
          factorCount: 0,
          averageAdjustment: 0,
          factors: []
        };
      }
      
      acc[item.category].factorCount++;
      acc[item.category].factors.push(item);
      acc[item.category].averageAdjustment += item.regionalAdjustment;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate averages
    Object.values(categoryAnalysis).forEach(category => {
      category.averageAdjustment = category.averageAdjustment / category.factorCount;
    });
    
    // Complete the task with results
    this.completeTask(task.id, {
      message: `Analyzed ${regionFactors.length} factors for region ${regionCode}`,
      regionCode,
      factorAnalysis,
      categoryAnalysis: Object.values(categoryAnalysis),
      timestamp: new Date()
    });
  }

  /**
   * Load factors from data source (simulation)
   */
  private async loadFactors(): Promise<void> {
    // Simulate loading factors from database or file
    const sampleFactors: CostFactor[] = [
      {
        id: 'material:concrete',
        category: 'materials',
        name: 'Concrete',
        description: 'Cost per cubic yard of concrete',
        baseValue: 125.0,
        currentValue: 125.0,
        minValue: 90.0,
        maxValue: 200.0,
        lastUpdated: new Date()
      },
      {
        id: 'material:steel',
        category: 'materials',
        name: 'Steel Framing',
        description: 'Cost per ton of structural steel',
        baseValue: 2200.0,
        currentValue: 2200.0,
        minValue: 1800.0,
        maxValue: 3000.0,
        lastUpdated: new Date()
      },
      {
        id: 'labor:carpentry',
        category: 'labor',
        name: 'Carpentry',
        description: 'Cost per hour for carpentry labor',
        baseValue: 45.0,
        currentValue: 45.0,
        minValue: 35.0,
        maxValue: 65.0,
        lastUpdated: new Date()
      },
      {
        id: 'labor:electrical',
        category: 'labor',
        name: 'Electrical',
        description: 'Cost per hour for electrical labor',
        baseValue: 65.0,
        currentValue: 65.0,
        minValue: 50.0,
        maxValue: 85.0,
        lastUpdated: new Date()
      },
      {
        id: 'equipment:excavator',
        category: 'equipment',
        name: 'Excavator',
        description: 'Cost per day for excavator rental',
        baseValue: 350.0,
        currentValue: 350.0,
        minValue: 300.0,
        maxValue: 450.0,
        lastUpdated: new Date()
      }
    ];
    
    // Store in map
    sampleFactors.forEach(factor => {
      this.factors.set(factor.id, factor);
    });
  }

  /**
   * Load regional adjustments from data source (simulation)
   */
  private async loadRegionalAdjustments(): Promise<void> {
    // Simulate loading regional adjustments
    const sampleRegionalAdjustments: Record<string, Record<string, number>> = {
      'BENTON': {
        'material:concrete': 1.05,
        'material:steel': 1.12,
        'labor:carpentry': 0.95,
        'labor:electrical': 1.02,
        'equipment:excavator': 0.98
      },
      'KING': {
        'material:concrete': 1.15,
        'material:steel': 1.18,
        'labor:carpentry': 1.25,
        'labor:electrical': 1.22,
        'equipment:excavator': 1.10
      },
      'SPOKANE': {
        'material:concrete': 0.95,
        'material:steel': 1.05,
        'labor:carpentry': 0.92,
        'labor:electrical': 0.98,
        'equipment:excavator': 0.95
      }
    };
    
    // Store in map
    Object.entries(sampleRegionalAdjustments).forEach(([region, adjustments]) => {
      this.regionalAdjustments.set(region, adjustments);
    });
  }

  /**
   * Load economic indices from data source (simulation)
   */
  private async loadEconomicIndices(): Promise<void> {
    // Simulate loading economic indices
    const indices = {
      'CPI': 302.6,
      'MATERIAL_INDEX': 215.4,
      'LABOR_INDEX': 187.2,
      'HOUSING_INDEX': 256.1,
      'CONSTRUCTION_INDEX': 234.5
    };
    
    // Store in map
    Object.entries(indices).forEach(([name, value]) => {
      this.economicIndices.set(name, value);
    });
  }

  /**
   * Calculate economic adjustment based on economic indicators
   */
  private calculateEconomicAdjustment(
    factor: CostFactor,
    indicators: Record<string, any>
  ): number {
    // Simple example implementation - in a real system this would involve 
    // more sophisticated statistical/ML modeling
    let adjustment = 1.0;
    
    // Apply CPI impact if available
    if (indicators.CPI && this.economicIndices.has('CPI')) {
      const cpiDiff = indicators.CPI / this.economicIndices.get('CPI')!;
      adjustment *= (0.7 + (0.3 * cpiDiff)); // 30% influence from CPI
    }
    
    // Apply category-specific indices
    if (factor.category === 'materials' && indicators.MATERIAL_INDEX && 
        this.economicIndices.has('MATERIAL_INDEX')) {
      const indexDiff = indicators.MATERIAL_INDEX / this.economicIndices.get('MATERIAL_INDEX')!;
      adjustment *= (0.5 + (0.5 * indexDiff)); // 50% influence from material index
    }
    
    if (factor.category === 'labor' && indicators.LABOR_INDEX && 
        this.economicIndices.has('LABOR_INDEX')) {
      const indexDiff = indicators.LABOR_INDEX / this.economicIndices.get('LABOR_INDEX')!;
      adjustment *= (0.6 + (0.4 * indexDiff)); // 40% influence from labor index
    }
    
    return adjustment;
  }

  /**
   * Apply constraints to tuned factors
   */
  private applyConstraints(
    factors: CostFactor[],
    constraintSets: Array<{
      factors: string[];
      constraint: 'sum' | 'min' | 'max' | 'ratio';
      value: number;
    }>
  ): CostFactor[] {
    // Create a copy of factors to modify
    const result = [...factors];
    
    // Apply each constraint set
    constraintSets.forEach(constraintSet => {
      const constrainedFactors = result.filter(f => 
        constraintSet.factors.includes(f.id)
      );
      
      if (constrainedFactors.length === 0) return;
      
      switch (constraintSet.constraint) {
        case 'sum':
          this.applyConstraintSum(constrainedFactors, constraintSet.value);
          break;
        case 'min':
          this.applyConstraintMin(constrainedFactors, constraintSet.value);
          break;
        case 'max':
          this.applyConstraintMax(constrainedFactors, constraintSet.value);
          break;
        case 'ratio':
          this.applyConstraintRatio(constrainedFactors, constraintSet.value);
          break;
      }
    });
    
    return result;
  }

  /**
   * Apply sum constraint - adjust factors to sum to the target value
   */
  private applyConstraintSum(factors: CostFactor[], targetSum: number): void {
    const currentSum = factors.reduce((sum, f) => sum + f.currentValue, 0);
    const ratio = targetSum / currentSum;
    
    factors.forEach(f => {
      f.currentValue = f.currentValue * ratio;
    });
  }

  /**
   * Apply minimum constraint - ensure no factor is below minimum value
   */
  private applyConstraintMin(factors: CostFactor[], minValue: number): void {
    factors.forEach(f => {
      if (f.currentValue < minValue) {
        f.currentValue = minValue;
      }
    });
  }

  /**
   * Apply maximum constraint - ensure no factor is above maximum value
   */
  private applyConstraintMax(factors: CostFactor[], maxValue: number): void {
    factors.forEach(f => {
      if (f.currentValue > maxValue) {
        f.currentValue = maxValue;
      }
    });
  }

  /**
   * Apply ratio constraint - ensure factors maintain a specific ratio
   */
  private applyConstraintRatio(factors: CostFactor[], ratio: number): void {
    if (factors.length !== 2) return; // Ratio constraint only applies to pairs
    
    const currentRatio = factors[0].currentValue / factors[1].currentValue;
    
    if (Math.abs(currentRatio - ratio) < 0.001) return; // Already at target ratio
    
    // Adjust to maintain the average value while setting the ratio
    const avg = (factors[0].currentValue + factors[1].currentValue) / 2;
    
    factors[0].currentValue = avg * ratio / (ratio + 1);
    factors[1].currentValue = avg / (ratio + 1);
  }

  /**
   * Get factor status based on deviation
   */
  private getFactorStatus(deviationPercent: number): string {
    if (Math.abs(deviationPercent) < 5) {
      return 'stable';
    } else if (deviationPercent > 15) {
      return 'significantly high';
    } else if (deviationPercent > 5) {
      return 'moderately high';
    } else if (deviationPercent < -15) {
      return 'significantly low';
    } else {
      return 'moderately low';
    }
  }

  /**
   * Analyze factor trends to recommend adjustments
   */
  private analyzeFactorTrends(factor: CostFactor, regionCode: string): number {
    // This is a simplified implementation - a real system would use 
    // historical data and statistical methods
    
    // Get current regional adjustment
    const regionAdjustments = this.regionalAdjustments.get(regionCode) || {};
    const currentAdjustment = regionAdjustments[factor.id] || 1.0;
    
    // Simulate analysis based on factor category
    let trend = 0;
    
    if (factor.category === 'materials') {
      // Materials trending up slightly
      trend = 0.02;
    } else if (factor.category === 'labor') {
      // Labor costs trending up more significantly
      trend = 0.04;
    } else if (factor.category === 'equipment') {
      // Equipment costs stable
      trend = 0.01;
    }
    
    // Add some regional variation
    if (regionCode === 'KING') {
      // High growth area - additional pressure on costs
      trend += 0.02;
    } else if (regionCode === 'SPOKANE') {
      // More stable market
      trend -= 0.01;
    }
    
    // Return recommended adjustment
    return currentAdjustment * (1 + trend);
  }

  /**
   * Calculate confidence score for a recommendation
   */
  private calculateConfidenceScore(factor: CostFactor, regionCode: string): number {
    // This is a simplified implementation - a real system would use 
    // data quality metrics, historical accuracy, etc.
    
    // Base confidence level
    let confidence = 0.85;
    
    // Adjust based on data availability
    const regionAdjustments = this.regionalAdjustments.get(regionCode) || {};
    
    if (!regionAdjustments[factor.id]) {
      // Less confidence if we don't have specific regional data
      confidence -= 0.15;
    }
    
    // More confidence in stable categories
    if (factor.category === 'equipment') {
      confidence += 0.05;
    } else if (factor.category === 'materials') {
      // Materials more volatile
      confidence -= 0.10;
    }
    
    return Math.min(0.99, Math.max(0.70, confidence));
  }

  /**
   * Generate justification for a recommendation
   */
  private generateJustification(
    factor: CostFactor, 
    recommended: number, 
    current: number
  ): string {
    const changePct = ((recommended - current) / current * 100).toFixed(1);
    const direction = recommended > current ? 'increase' : 'decrease';
    
    // Generate justification based on factor category and change magnitude
    if (factor.category === 'materials') {
      if (Math.abs(recommended - current) < 0.03) {
        return `Material costs are stable with minimal ${direction} (${changePct}%) based on recent supplier data.`;
      } else {
        return `Material costs are projected to ${direction} by ${changePct}% based on supplier forecasts and regional construction volume.`;
      }
    } else if (factor.category === 'labor') {
      if (Math.abs(recommended - current) < 0.03) {
        return `Labor rates are holding steady with minor ${direction} (${changePct}%) based on recent contract negotiations.`;
      } else {
        return `Labor rates are expected to ${direction} by ${changePct}% based on union agreements and skilled labor availability.`;
      }
    } else if (factor.category === 'equipment') {
      if (Math.abs(recommended - current) < 0.03) {
        return `Equipment rental rates showing minimal ${direction} (${changePct}%) based on market data.`;
      } else {
        return `Equipment costs are projected to ${direction} by ${changePct}% due to changes in fuel costs and demand patterns.`;
      }
    } else {
      return `Recommendation based on analysis of current market trends showing a ${changePct}% ${direction}.`;
    }
  }
}