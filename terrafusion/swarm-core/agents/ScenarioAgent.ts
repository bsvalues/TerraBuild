/**
 * TerraBuild AI Swarm - ScenarioAgent
 * 
 * This specialized agent creates and analyzes what-if scenarios to predict
 * cost outcomes under different conditions, supporting strategic planning
 * and risk assessment.
 */

import { Agent, AgentConfig, AgentTask } from '../Agent';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  baselineYear: number;
  targetYear: number;
  parameters: Record<string, any>;
  assumptions: Record<string, any>;
  status: 'draft' | 'active' | 'archived';
  results?: ScenarioResults;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export interface ScenarioResults {
  predictedCosts: Record<string, any>;
  impactAnalysis: Record<string, any>;
  riskAnalysis: Record<string, any>;
  sensitivityAnalysis?: Record<string, any>;
  comparisonToBaseline: Record<string, any>;
  timestamp: Date;
  confidenceScore: number;
}

export interface SensitivityFactor {
  id: string;
  name: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
  stepSize: number;
  impact: 'low' | 'medium' | 'high';
  resultVariation?: number; // Percentage change in result per unit change
}

export class ScenarioAgent extends Agent {
  private scenarios: Map<string, Scenario> = new Map();
  private economicIndicatorForecasts: Map<string, Record<string, any>> = new Map();
  private sensitivityFactors: Map<string, SensitivityFactor[]> = new Map();
  private riskFactors: Map<string, Record<string, any>> = new Map();

  constructor() {
    const config: AgentConfig = {
      id: 'scenario-agent',
      name: 'ScenarioAgent',
      description: 'Creates and analyzes what-if scenarios to predict cost outcomes under different conditions',
      version: '1.0.0',
      capabilities: [
        'scenario:create',
        'scenario:analyze',
        'scenario:compare',
        'sensitivity:analyze',
        'risk:evaluate'
      ]
    };
    
    super(config);
  }

  /**
   * Initialize the agent with forecasts and default scenarios
   */
  public async initialize(): Promise<boolean> {
    try {
      // Load economic indicator forecasts
      await this.loadEconomicForecasts();
      
      // Load sensitivity factors
      await this.loadSensitivityFactors();
      
      // Load risk factors
      await this.loadRiskFactors();
      
      // Load any existing scenarios
      await this.loadScenarios();
      
      return super.initialize();
    } catch (error) {
      console.error('Failed to initialize ScenarioAgent:', error);
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
        case 'scenario:create':
          await this.processCreateScenarioTask(task);
          break;
        case 'scenario:analyze':
          await this.processAnalyzeScenarioTask(task);
          break;
        case 'scenario:compare':
          await this.processCompareScenarioTask(task);
          break;
        case 'sensitivity:analyze':
          await this.processSensitivityAnalysisTask(task);
          break;
        case 'risk:evaluate':
          await this.processRiskEvaluationTask(task);
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
   * Process a task to create a new scenario
   */
  private async processCreateScenarioTask(task: AgentTask): Promise<void> {
    const { name, description, baselineYear, targetYear, parameters, assumptions } = task.data;
    
    // Validate required fields
    if (!name || !baselineYear || !targetYear) {
      throw new Error('Name, baselineYear, and targetYear are required fields');
    }
    
    // Validate years
    if (baselineYear >= targetYear) {
      throw new Error('Target year must be after baseline year');
    }
    
    // Create a new scenario
    const scenarioId = `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scenario: Scenario = {
      id: scenarioId,
      name,
      description: description || `Scenario from ${baselineYear} to ${targetYear}`,
      baselineYear,
      targetYear,
      parameters: parameters || {},
      assumptions: assumptions || {},
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: task.data.createdBy,
      metadata: task.data.metadata || {}
    };
    
    // Store the scenario
    this.scenarios.set(scenarioId, scenario);
    
    // Complete the task with results
    this.completeTask(task.id, {
      message: `Scenario "${name}" created successfully`,
      scenarioId,
      scenario
    });
  }

  /**
   * Process a task to analyze a scenario
   */
  private async processAnalyzeScenarioTask(task: AgentTask): Promise<void> {
    const { scenarioId, includeRiskAnalysis, includeSensitivityAnalysis } = task.data;
    
    // Get the scenario
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${scenarioId} not found`);
    }
    
    // Perform the analysis
    const results = await this.analyzeScenario(
      scenario, 
      includeRiskAnalysis, 
      includeSensitivityAnalysis
    );
    
    // Update the scenario with the results
    scenario.results = results;
    scenario.status = 'active';
    scenario.updatedAt = new Date();
    this.scenarios.set(scenarioId, scenario);
    
    // Complete the task with results
    this.completeTask(task.id, {
      message: `Scenario "${scenario.name}" analyzed successfully`,
      scenarioId,
      scenarioName: scenario.name,
      targetYear: scenario.targetYear,
      results,
      confidenceScore: results.confidenceScore
    });
  }

  /**
   * Process a task to compare multiple scenarios
   */
  private async processCompareScenarioTask(task: AgentTask): Promise<void> {
    const { scenarioIds, baselineScenarioId, metrics } = task.data;
    
    if (!scenarioIds || !Array.isArray(scenarioIds) || scenarioIds.length < 2) {
      throw new Error('At least two scenario IDs must be provided for comparison');
    }
    
    // Get all scenarios
    const scenarios = scenarioIds.map(id => {
      const scenario = this.scenarios.get(id);
      if (!scenario) {
        throw new Error(`Scenario with ID ${id} not found`);
      }
      if (!scenario.results) {
        throw new Error(`Scenario with ID ${id} has not been analyzed yet`);
      }
      return scenario;
    });
    
    // Determine the baseline scenario
    let baselineScenario;
    if (baselineScenarioId) {
      baselineScenario = this.scenarios.get(baselineScenarioId);
      if (!baselineScenario) {
        throw new Error(`Baseline scenario with ID ${baselineScenarioId} not found`);
      }
      if (!baselineScenario.results) {
        throw new Error(`Baseline scenario with ID ${baselineScenarioId} has not been analyzed yet`);
      }
    } else {
      // Use the first scenario as the baseline
      baselineScenario = scenarios[0];
    }
    
    // Define metrics to compare if not provided
    const metricsToCompare = metrics || [
      'totalCost',
      'costPerSquareFoot',
      'materialCost',
      'laborCost',
      'timelineYears',
      'riskScore'
    ];
    
    // Compare scenarios
    const comparison = this.compareScenarios(
      baselineScenario, 
      scenarios, 
      metricsToCompare
    );
    
    // Complete the task with results
    this.completeTask(task.id, {
      message: `Compared ${scenarios.length} scenarios successfully`,
      baselineScenarioId: baselineScenario.id,
      baselineScenarioName: baselineScenario.name,
      comparedScenarioIds: scenarioIds,
      comparedScenarioNames: scenarios.map(s => s.name),
      metrics: metricsToCompare,
      comparison,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to perform sensitivity analysis
   */
  private async processSensitivityAnalysisTask(task: AgentTask): Promise<void> {
    const { scenarioId, factors, range, steps } = task.data;
    
    // Get the scenario
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${scenarioId} not found`);
    }
    
    // Get factors to analyze
    let factorsToAnalyze = [];
    
    if (factors && Array.isArray(factors) && factors.length > 0) {
      // Use provided factors
      factorsToAnalyze = factors;
    } else {
      // Use default sensitivity factors for the scenario's target year
      const yearFactors = this.sensitivityFactors.get(scenario.targetYear.toString());
      if (!yearFactors || yearFactors.length === 0) {
        // Fall back to the most recent year if target year not found
        const years = Array.from(this.sensitivityFactors.keys())
          .map(Number)
          .sort((a, b) => b - a);
        
        if (years.length > 0) {
          const mostRecentYear = years[0].toString();
          factorsToAnalyze = this.sensitivityFactors.get(mostRecentYear) || [];
        }
      } else {
        factorsToAnalyze = yearFactors;
      }
    }
    
    if (factorsToAnalyze.length === 0) {
      throw new Error('No sensitivity factors available for analysis');
    }
    
    // Set range and steps
    const variationRange = range || 0.3; // 30% by default
    const variationSteps = steps || 5;   // 5 steps by default
    
    // Perform sensitivity analysis
    const analysis = await this.performSensitivityAnalysis(
      scenario,
      factorsToAnalyze,
      variationRange,
      variationSteps
    );
    
    // Update the scenario with the results
    if (scenario.results) {
      scenario.results.sensitivityAnalysis = analysis;
      scenario.updatedAt = new Date();
      this.scenarios.set(scenarioId, scenario);
    }
    
    // Complete the task with results
    this.completeTask(task.id, {
      message: `Sensitivity analysis for scenario "${scenario.name}" completed successfully`,
      scenarioId,
      scenarioName: scenario.name,
      factorsAnalyzed: factorsToAnalyze.map(f => f.name || f.id),
      analysis,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to evaluate risks for a scenario
   */
  private async processRiskEvaluationTask(task: AgentTask): Promise<void> {
    const { scenarioId, customRisks } = task.data;
    
    // Get the scenario
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${scenarioId} not found`);
    }
    
    // Combine default risks with custom risks if provided
    let risksToEvaluate = this.getRisksForScenario(scenario);
    
    if (customRisks && Array.isArray(customRisks) && customRisks.length > 0) {
      risksToEvaluate = [...risksToEvaluate, ...customRisks];
    }
    
    // Perform risk evaluation
    const evaluation = await this.evaluateRisks(scenario, risksToEvaluate);
    
    // Update the scenario with the results if it already has results
    if (scenario.results) {
      scenario.results.riskAnalysis = evaluation;
      scenario.updatedAt = new Date();
      this.scenarios.set(scenarioId, scenario);
    }
    
    // Complete the task with results
    this.completeTask(task.id, {
      message: `Risk evaluation for scenario "${scenario.name}" completed successfully`,
      scenarioId,
      scenarioName: scenario.name,
      riskCount: risksToEvaluate.length,
      evaluation,
      timestamp: new Date()
    });
  }

  /**
   * Analyze a scenario to predict outcomes
   */
  private async analyzeScenario(
    scenario: Scenario,
    includeRiskAnalysis: boolean = true,
    includeSensitivityAnalysis: boolean = false
  ): Promise<ScenarioResults> {
    // Calculate years difference
    const yearsDiff = scenario.targetYear - scenario.baselineYear;
    
    // Get economic indicator forecasts
    const forecasts = this.getEconomicForecasts(scenario.targetYear);
    
    // Combine scenario parameters, assumptions, and forecasts
    const combinedFactors = {
      ...forecasts,
      ...scenario.assumptions,
      yearsDiff
    };
    
    // Calculate material costs considering inflation and other factors
    const materialInflation = forecasts.materialCostIndex || 1.02; // Default to 2% annual inflation
    const materialBaseCost = scenario.parameters.materialBaseCost || 100; // Cost per square foot
    const materialCost = materialBaseCost * Math.pow(materialInflation, yearsDiff);
    
    // Calculate labor costs considering wage growth and productivity
    const laborInflation = forecasts.laborCostIndex || 1.03; // Default to 3% annual growth
    const laborProductivityGrowth = forecasts.laborProductivityGrowth || 1.01; // Default to 1% annual improvement
    const laborBaseCost = scenario.parameters.laborBaseCost || 80; // Cost per square foot
    const laborCost = laborBaseCost * Math.pow(laborInflation / laborProductivityGrowth, yearsDiff);
    
    // Calculate other costs (equipment, overhead, etc.)
    const otherCostsInflation = forecasts.generalInflation || 1.025; // Default to 2.5% annual inflation
    const otherBaseCost = scenario.parameters.otherBaseCost || 50; // Cost per square foot
    const otherCosts = otherBaseCost * Math.pow(otherCostsInflation, yearsDiff);
    
    // Calculate total cost per square foot
    const costPerSquareFoot = materialCost + laborCost + otherCosts;
    
    // Calculate total project cost
    const projectSize = scenario.parameters.projectSize || 10000; // Square feet
    const totalCost = costPerSquareFoot * projectSize;
    
    // Compile predicted costs
    const predictedCosts = {
      totalCost,
      costPerSquareFoot,
      breakdown: {
        materialCost,
        laborCost,
        otherCosts
      },
      byYear: this.calculateCostsByYear(
        scenario.baselineYear,
        scenario.targetYear,
        materialBaseCost,
        laborBaseCost,
        otherBaseCost,
        materialInflation,
        laborInflation,
        laborProductivityGrowth,
        otherCostsInflation,
        projectSize
      )
    };
    
    // Calculate impact analysis
    const impactAnalysis = this.calculateImpactAnalysis(
      scenario,
      predictedCosts,
      combinedFactors
    );
    
    // Initialize results
    const results: ScenarioResults = {
      predictedCosts,
      impactAnalysis,
      riskAnalysis: {},
      comparisonToBaseline: this.calculateBaselineComparison(scenario, predictedCosts),
      timestamp: new Date(),
      confidenceScore: 0.85 // Default confidence score
    };
    
    // Include risk analysis if requested
    if (includeRiskAnalysis) {
      const risks = this.getRisksForScenario(scenario);
      results.riskAnalysis = await this.evaluateRisks(scenario, risks);
      
      // Adjust confidence score based on risk analysis
      const riskImpact = results.riskAnalysis.overallRiskScore / 10; // Scale risk score (0-10) to impact (0-1)
      results.confidenceScore = Math.max(0.5, results.confidenceScore - riskImpact * 0.3);
    }
    
    // Include sensitivity analysis if requested
    if (includeSensitivityAnalysis) {
      const sensFactors = this.getSensitivityFactorsForScenario(scenario);
      results.sensitivityAnalysis = await this.performSensitivityAnalysis(
        scenario,
        sensFactors,
        0.2,  // 20% variation
        5     // 5 steps
      );
      
      // Adjust confidence score based on sensitivity
      if (results.sensitivityAnalysis.highImpactFactors > 2) {
        // Many high impact factors reduce confidence
        results.confidenceScore *= 0.9;
      }
    }
    
    return results;
  }

  /**
   * Calculate costs by year over the scenario period
   */
  private calculateCostsByYear(
    baselineYear: number,
    targetYear: number,
    materialBaseCost: number,
    laborBaseCost: number,
    otherBaseCost: number,
    materialInflation: number,
    laborInflation: number,
    laborProductivityGrowth: number,
    otherCostsInflation: number,
    projectSize: number
  ): Array<{ year: number; totalCost: number; costPerSqFt: number; breakdown: Record<string, number> }> {
    const costsByYear = [];
    
    for (let year = baselineYear; year <= targetYear; year++) {
      const yearsDiff = year - baselineYear;
      
      // Calculate costs for this year
      const materialCost = materialBaseCost * Math.pow(materialInflation, yearsDiff);
      const laborCost = laborBaseCost * Math.pow(laborInflation / laborProductivityGrowth, yearsDiff);
      const otherCosts = otherBaseCost * Math.pow(otherCostsInflation, yearsDiff);
      
      const costPerSqFt = materialCost + laborCost + otherCosts;
      const totalCost = costPerSqFt * projectSize;
      
      costsByYear.push({
        year,
        totalCost,
        costPerSqFt,
        breakdown: {
          materialCost,
          laborCost,
          otherCosts
        }
      });
    }
    
    return costsByYear;
  }

  /**
   * Calculate impact analysis for the scenario
   */
  private calculateImpactAnalysis(
    scenario: Scenario,
    predictedCosts: Record<string, any>,
    factors: Record<string, any>
  ): Record<string, any> {
    // Identify key impact areas
    const impacts = {
      budgetImpact: {
        description: 'Impact on budget planning',
        value: predictedCosts.totalCost,
        percentageChange: ((predictedCosts.totalCost / (scenario.parameters.budgetBaseline || predictedCosts.totalCost * 0.9)) - 1) * 100,
        severity: 'medium'
      },
      timelineImpact: {
        description: 'Impact on project timeline',
        value: scenario.targetYear - scenario.baselineYear,
        unit: 'years',
        severity: 'low'
      },
      economicFactors: {
        description: 'Key economic factors affecting the scenario',
        factors: Object.entries(factors)
          .filter(([key]) => ['materialCostIndex', 'laborCostIndex', 'generalInflation'].includes(key))
          .map(([key, value]) => ({ name: key, value }))
      },
      materialAvailability: {
        description: 'Material availability considerations',
        risk: factors.materialShortageRisk || 'low',
        impact: factors.materialShortageRisk === 'high' ? 'high' : 'medium'
      },
      laborMarket: {
        description: 'Labor market considerations',
        risk: factors.laborShortageRisk || 'medium',
        impact: factors.laborShortageRisk === 'high' ? 'high' : 'medium'
      }
    };
    
    // Determine overall impact rating
    let overallSeverity = 'medium';
    if (impacts.budgetImpact.percentageChange > 15 || 
        impacts.materialAvailability.risk === 'high' || 
        impacts.laborMarket.risk === 'high') {
      overallSeverity = 'high';
    } else if (impacts.budgetImpact.percentageChange < 5 && 
               impacts.materialAvailability.risk !== 'high' && 
               impacts.laborMarket.risk !== 'high') {
      overallSeverity = 'low';
    }
    
    return {
      impacts,
      overallSeverity,
      recommendations: this.generateImpactRecommendations(impacts, overallSeverity),
      timestamp: new Date()
    };
  }

  /**
   * Generate recommendations based on impact analysis
   */
  private generateImpactRecommendations(
    impacts: Record<string, any>,
    overallSeverity: string
  ): string[] {
    const recommendations = [];
    
    // Budget recommendations
    if (impacts.budgetImpact.percentageChange > 10) {
      recommendations.push(`Allocate an additional ${impacts.budgetImpact.percentageChange.toFixed(1)}% to the budget to account for projected cost increases.`);
    }
    
    // Material availability recommendations
    if (impacts.materialAvailability.risk === 'high') {
      recommendations.push('Secure material contracts early and consider alternative materials to mitigate supply risks.');
    } else if (impacts.materialAvailability.risk === 'medium') {
      recommendations.push('Monitor material supply chains and consider establishing relationships with multiple suppliers.');
    }
    
    // Labor market recommendations
    if (impacts.laborMarket.risk === 'high') {
      recommendations.push('Develop a comprehensive labor strategy, including potentially higher wages or training programs for specialized workers.');
    } else if (impacts.laborMarket.risk === 'medium') {
      recommendations.push('Consider flexible scheduling and retention bonuses to maintain workforce stability.');
    }
    
    // Overall recommendations
    if (overallSeverity === 'high') {
      recommendations.push('Conduct detailed quarterly reviews of the project to quickly adapt to changing conditions.');
    } else if (overallSeverity === 'medium') {
      recommendations.push('Establish contingency plans for the most likely risk scenarios.');
    }
    
    return recommendations;
  }

  /**
   * Calculate comparison to baseline
   */
  private calculateBaselineComparison(
    scenario: Scenario,
    predictedCosts: Record<string, any>
  ): Record<string, any> {
    // Use scenario parameters to determine baseline costs if available
    const baselineTotalCost = scenario.parameters.baselineTotalCost || 
      predictedCosts.totalCost * 0.9; // Default to 90% of predicted cost if not specified
    
    const baselineCostPerSqFt = scenario.parameters.baselineCostPerSqFt || 
      predictedCosts.costPerSquareFoot * 0.9;
    
    // Calculate differences
    const totalCostDiff = predictedCosts.totalCost - baselineTotalCost;
    const totalCostPctDiff = (totalCostDiff / baselineTotalCost) * 100;
    
    const costPerSqFtDiff = predictedCosts.costPerSquareFoot - baselineCostPerSqFt;
    const costPerSqFtPctDiff = (costPerSqFtDiff / baselineCostPerSqFt) * 100;
    
    return {
      baselineTotalCost,
      baselineCostPerSqFt,
      totalCostDifference: totalCostDiff,
      totalCostPercentageDifference: totalCostPctDiff,
      costPerSqFtDifference: costPerSqFtDiff,
      costPerSqFtPercentageDifference: costPerSqFtPctDiff,
      comparisonYear: scenario.baselineYear,
      summary: this.generateComparisonSummary(totalCostPctDiff)
    };
  }

  /**
   * Generate summary text for baseline comparison
   */
  private generateComparisonSummary(percentageDiff: number): string {
    if (percentageDiff > 15) {
      return `Projected costs are significantly higher (${percentageDiff.toFixed(1)}%) than the baseline, indicating substantial cost escalation.`;
    } else if (percentageDiff > 5) {
      return `Projected costs are moderately higher (${percentageDiff.toFixed(1)}%) than the baseline, which is within expected inflation range.`;
    } else if (percentageDiff > -5) {
      return `Projected costs are close to baseline (${percentageDiff.toFixed(1)}%), suggesting stable cost expectations.`;
    } else if (percentageDiff > -15) {
      return `Projected costs are moderately lower (${Math.abs(percentageDiff).toFixed(1)}%) than the baseline, which may indicate efficiency improvements.`;
    } else {
      return `Projected costs are significantly lower (${Math.abs(percentageDiff).toFixed(1)}%) than the baseline, which should be validated for accuracy.`;
    }
  }

  /**
   * Compare multiple scenarios
   */
  private compareScenarios(
    baselineScenario: Scenario,
    scenariosToCompare: Scenario[],
    metrics: string[]
  ): Record<string, any> {
    // Ensure all scenarios have been analyzed
    if (!baselineScenario.results) {
      throw new Error(`Baseline scenario "${baselineScenario.name}" has not been analyzed yet`);
    }
    
    for (const scenario of scenariosToCompare) {
      if (!scenario.results) {
        throw new Error(`Scenario "${scenario.name}" has not been analyzed yet`);
      }
    }
    
    // Prepare comparison data
    const comparisonData = {
      baselineScenario: {
        id: baselineScenario.id,
        name: baselineScenario.name,
        targetYear: baselineScenario.targetYear
      },
      scenarios: scenariosToCompare.map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        targetYear: scenario.targetYear
      })),
      metrics: {}
    };
    
    // Extract and compare metrics
    for (const metric of metrics) {
      comparisonData.metrics[metric] = this.compareMetricAcrossScenarios(
        baselineScenario,
        scenariosToCompare,
        metric
      );
    }
    
    // Add overall comparison
    comparisonData['overallComparison'] = this.generateOverallComparison(
      baselineScenario,
      scenariosToCompare,
      comparisonData.metrics
    );
    
    return comparisonData;
  }

  /**
   * Compare a specific metric across scenarios
   */
  private compareMetricAcrossScenarios(
    baselineScenario: Scenario,
    scenariosToCompare: Scenario[],
    metric: string
  ): Record<string, any> {
    // Extract baseline value
    const baselineValue = this.extractMetricValue(baselineScenario, metric);
    
    // Extract values for other scenarios and calculate differences
    const comparisonValues = scenariosToCompare.map(scenario => {
      const value = this.extractMetricValue(scenario, metric);
      const absoluteDiff = value - baselineValue;
      const percentageDiff = baselineValue !== 0 
        ? (absoluteDiff / baselineValue) * 100 
        : 0;
      
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        value,
        absoluteDiff,
        percentageDiff
      };
    });
    
    // Determine range and best/worst scenarios
    const values = comparisonValues.map(c => c.value);
    const min = Math.min(...values, baselineValue);
    const max = Math.max(...values, baselineValue);
    
    // For cost metrics, lower is better; for others it depends
    const isCostMetric = metric.toLowerCase().includes('cost');
    
    let bestScenario, worstScenario;
    
    if (isCostMetric) {
      bestScenario = comparisonValues.reduce((best, current) => 
        (best === null || current.value < best.value) ? current : best, null);
      
      worstScenario = comparisonValues.reduce((worst, current) => 
        (worst === null || current.value > worst.value) ? current : worst, null);
    } else {
      // For non-cost metrics, assume higher is better
      // In a real system, this would need to be more sophisticated
      bestScenario = comparisonValues.reduce((best, current) => 
        (best === null || current.value > best.value) ? current : best, null);
      
      worstScenario = comparisonValues.reduce((worst, current) => 
        (worst === null || current.value < worst.value) ? current : worst, null);
    }
    
    return {
      metric,
      baselineValue,
      range: { min, max },
      comparison: comparisonValues,
      bestScenario: bestScenario ? {
        scenarioId: bestScenario.scenarioId,
        scenarioName: bestScenario.scenarioName,
        value: bestScenario.value,
        percentageDiff: bestScenario.percentageDiff
      } : null,
      worstScenario: worstScenario ? {
        scenarioId: worstScenario.scenarioId,
        scenarioName: worstScenario.scenarioName,
        value: worstScenario.value,
        percentageDiff: worstScenario.percentageDiff
      } : null
    };
  }

  /**
   * Extract a metric value from a scenario
   */
  private extractMetricValue(scenario: Scenario, metric: string): number {
    if (!scenario.results) {
      throw new Error(`Scenario "${scenario.name}" has not been analyzed`);
    }
    
    // Define how to extract different metrics
    switch (metric) {
      case 'totalCost':
        return scenario.results.predictedCosts.totalCost;
        
      case 'costPerSquareFoot':
        return scenario.results.predictedCosts.costPerSquareFoot;
        
      case 'materialCost':
        return scenario.results.predictedCosts.breakdown.materialCost;
        
      case 'laborCost':
        return scenario.results.predictedCosts.breakdown.laborCost;
        
      case 'timelineYears':
        return scenario.targetYear - scenario.baselineYear;
        
      case 'riskScore':
        return scenario.results.riskAnalysis.overallRiskScore || 5; // Default to medium risk
        
      default:
        // Try to find the metric in the results object
        const value = this.findValueInObject(scenario.results, metric);
        if (value !== undefined && typeof value === 'number') {
          return value;
        }
        
        console.warn(`Metric "${metric}" not found in scenario "${scenario.name}"`);
        return 0;
    }
  }

  /**
   * Recursively find a value in a nested object by key
   */
  private findValueInObject(obj: Record<string, any>, key: string): any {
    if (obj === null || typeof obj !== 'object') {
      return undefined;
    }
    
    if (key in obj) {
      return obj[key];
    }
    
    for (const k in obj) {
      if (typeof obj[k] === 'object') {
        const result = this.findValueInObject(obj[k], key);
        if (result !== undefined) {
          return result;
        }
      }
    }
    
    return undefined;
  }

  /**
   * Generate overall comparison between scenarios
   */
  private generateOverallComparison(
    baselineScenario: Scenario,
    scenariosToCompare: Scenario[],
    metricsComparison: Record<string, any>
  ): Record<string, any> {
    // Calculate an overall score for each scenario
    // This is a simplified implementation - a real system would be more sophisticated
    const scenarioScores = scenariosToCompare.map(scenario => {
      let score = 0;
      let totalWeight = 0;
      
      // Cost metrics (lower is better)
      const costMetrics = ['totalCost', 'costPerSquareFoot', 'materialCost', 'laborCost'];
      
      // Risk metric (lower is better)
      const riskMetrics = ['riskScore'];
      
      // Timeline metric (depends on project goals)
      const timelineMetric = 'timelineYears';
      
      // Calculate weighted score
      for (const metric in metricsComparison) {
        if (costMetrics.includes(metric)) {
          const baselineValue = metricsComparison[metric].baselineValue;
          const scenarioComp = metricsComparison[metric].comparison.find(
            c => c.scenarioId === scenario.id
          );
          
          if (scenarioComp && baselineValue !== 0) {
            // Lower cost is better (-1 means 100% reduction, which is best possible)
            const relativeValue = -1 * scenarioComp.percentageDiff / 100;
            score += relativeValue * 3; // Weight cost metrics highly
            totalWeight += 3;
          }
        } else if (riskMetrics.includes(metric)) {
          const baselineValue = metricsComparison[metric].baselineValue;
          const scenarioComp = metricsComparison[metric].comparison.find(
            c => c.scenarioId === scenario.id
          );
          
          if (scenarioComp && baselineValue !== 0) {
            // Lower risk is better (-1 means 100% reduction, which is best possible)
            const relativeValue = -1 * scenarioComp.percentageDiff / 100;
            score += relativeValue * 2; // Weight risk metrics medium
            totalWeight += 2;
          }
        } else if (metric === timelineMetric) {
          // For timeline, it depends on project goals
          // Here we assume shorter timeline is slightly better
          const baselineValue = metricsComparison[metric].baselineValue;
          const scenarioComp = metricsComparison[metric].comparison.find(
            c => c.scenarioId === scenario.id
          );
          
          if (scenarioComp && baselineValue !== 0) {
            // Shorter timeline is slightly preferred (-1 means 100% reduction)
            const relativeValue = -0.5 * scenarioComp.percentageDiff / 100;
            score += relativeValue * 1; // Weight timeline metrics low
            totalWeight += 1;
          }
        }
      }
      
      // Normalize score (0 to 100, where higher is better)
      const normalizedScore = totalWeight > 0 
        ? Math.round(((score / totalWeight) + 1) * 50) // Transform from [-1,1] to [0,100]
        : 50;
      
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        score: normalizedScore,
        ranking: 0 // Will be filled in later
      };
    });
    
    // Sort by score (highest first) and assign rankings
    scenarioScores.sort((a, b) => b.score - a.score);
    scenarioScores.forEach((scenario, idx) => {
      scenario.ranking = idx + 1;
    });
    
    // Generate recommendations based on comparisons
    const recommendations = this.generateComparisonRecommendations(
      baselineScenario,
      scenariosToCompare,
      scenarioScores,
      metricsComparison
    );
    
    return {
      scoredScenarios: scenarioScores,
      topScenario: scenarioScores.length > 0 ? scenarioScores[0] : null,
      recommendations
    };
  }

  /**
   * Generate recommendations based on scenario comparisons
   */
  private generateComparisonRecommendations(
    baselineScenario: Scenario,
    scenarios: Scenario[],
    scenarioScores: Array<Record<string, any>>,
    metricsComparison: Record<string, any>
  ): string[] {
    const recommendations = [];
    
    // If we have a clear top performer
    if (scenarioScores.length > 0 && 
        scenarioScores[0].score > (scenarioScores[1]?.score || 0) + 10) {
      const topScenario = scenarioScores[0];
      recommendations.push(
        `Scenario "${topScenario.scenarioName}" shows the best overall performance with a score of ${topScenario.score}.`
      );
      
      // Cost savings recommendation
      if (metricsComparison.totalCost) {
        const costComp = metricsComparison.totalCost.comparison.find(
          c => c.scenarioId === topScenario.scenarioId
        );
        
        if (costComp && costComp.percentageDiff < -5) {
          recommendations.push(
            `Consider implementing "${topScenario.scenarioName}" to achieve potential cost savings of ${Math.abs(costComp.percentageDiff).toFixed(1)}%.`
          );
        }
      }
    } else if (scenarioScores.length > 1) {
      // If top scenarios are close
      recommendations.push(
        `Scenarios "${scenarioScores[0].scenarioName}" and "${scenarioScores[1].scenarioName}" show similar overall performance.`
      );
      
      // Recommend further analysis
      recommendations.push(
        `Consider a more detailed analysis of these top scenarios, focusing on specific project priorities.`
      );
    }
    
    // Risk considerations
    if (metricsComparison.riskScore) {
      const lowestRiskScenario = metricsComparison.riskScore.comparison.reduce(
        (lowest, current) => !lowest || current.value < lowest.value ? current : lowest,
        null
      );
      
      if (lowestRiskScenario && lowestRiskScenario.scenarioId !== scenarioScores[0]?.scenarioId) {
        const scenarioName = scenarios.find(s => s.id === lowestRiskScenario.scenarioId)?.name;
        recommendations.push(
          `If risk mitigation is a priority, consider scenario "${scenarioName}" which has the lowest risk profile.`
        );
      }
    }
    
    // Timeline considerations
    if (metricsComparison.timelineYears) {
      const fastestScenario = metricsComparison.timelineYears.comparison.reduce(
        (fastest, current) => !fastest || current.value < fastest.value ? current : fastest,
        null
      );
      
      if (fastestScenario && fastestScenario.scenarioId !== scenarioScores[0]?.scenarioId) {
        const scenarioName = scenarios.find(s => s.id === fastestScenario.scenarioId)?.name;
        recommendations.push(
          `For the shortest implementation timeline, scenario "${scenarioName}" offers the fastest path forward.`
        );
      }
    }
    
    // Baseline comparison
    const topScenarioVsBaseline = scenarioScores.length > 0
      ? {
          scenarioId: scenarioScores[0].scenarioId,
          scenarioName: scenarioScores[0].scenarioName,
          score: scenarioScores[0].score
        }
      : null;
    
    if (topScenarioVsBaseline && topScenarioVsBaseline.score > 60) {
      recommendations.push(
        `The top scenario "${topScenarioVsBaseline.scenarioName}" outperforms the baseline scenario "${baselineScenario.name}".`
      );
    } else if (topScenarioVsBaseline) {
      recommendations.push(
        `Consider refining the scenarios further as none show significant improvements over the baseline.`
      );
    }
    
    return recommendations;
  }

  /**
   * Perform sensitivity analysis on a scenario
   */
  private async performSensitivityAnalysis(
    scenario: Scenario,
    factors: SensitivityFactor[] | string[],
    variationRange: number,
    steps: number
  ): Promise<Record<string, any>> {
    // Ensure we have sensitivity factors in the right format
    const sensitivityFactors: SensitivityFactor[] = factors.map(factor => {
      if (typeof factor === 'string') {
        // Convert string factor ID to SensitivityFactor
        return this.getSensitivityFactorById(factor) || {
          id: factor,
          name: factor,
          baseValue: 1.0,
          minValue: 0.5,
          maxValue: 1.5,
          stepSize: 0.1,
          impact: 'medium'
        };
      } else {
        return factor;
      }
    });
    
    const results = {
      factors: [] as Array<Record<string, any>>,
      timestamp: new Date(),
      highImpactFactors: 0,
      mediumImpactFactors: 0,
      lowImpactFactors: 0
    };
    
    // Analyze each factor
    for (const factor of sensitivityFactors) {
      // Define variation range
      const min = factor.baseValue * (1 - variationRange);
      const max = factor.baseValue * (1 + variationRange);
      
      // Generate test values
      const stepSize = (max - min) / (steps - 1);
      const testValues = Array(steps).fill(0).map((_, i) => min + i * stepSize);
      
      // Create variations of the scenario with different factor values
      const variations = await Promise.all(testValues.map(async (value) => {
        // Create a modified version of the scenario
        const modifiedScenario = JSON.parse(JSON.stringify(scenario));
        
        // Update the factor value in the scenario
        if (scenario.parameters[factor.id] !== undefined) {
          modifiedScenario.parameters[factor.id] = value;
        } else if (scenario.assumptions[factor.id] !== undefined) {
          modifiedScenario.assumptions[factor.id] = value;
        } else {
          // Add to parameters if not found
          modifiedScenario.parameters[factor.id] = value;
        }
        
        // Analyze the modified scenario (without risk or sensitivity analysis)
        const results = await this.analyzeScenario(modifiedScenario, false, false);
        
        return {
          factorValue: value,
          totalCost: results.predictedCosts.totalCost,
          costPerSqFt: results.predictedCosts.costPerSquareFoot
        };
      }));
      
      // Calculate impact on costs
      const baseValue = factor.baseValue;
      const baseCost = variations.find(v => Math.abs(v.factorValue - baseValue) < 0.0001)?.totalCost ||
        scenario.results?.predictedCosts.totalCost || 0;
      
      // Calculate percentage changes
      const percentageChanges = variations.map(v => ({
        factorValue: v.factorValue,
        factorPctChange: ((v.factorValue / baseValue) - 1) * 100,
        costValue: v.totalCost,
        costPctChange: ((v.totalCost / baseCost) - 1) * 100
      }));
      
      // Calculate elasticity (sensitivity)
      const elasticities = percentageChanges.map(v => 
        v.factorPctChange !== 0 ? v.costPctChange / v.factorPctChange : 0
      );
      
      const avgElasticity = elasticities.reduce((sum, e) => sum + Math.abs(e), 0) / elasticities.length;
      
      // Determine impact level
      let impactLevel: 'low' | 'medium' | 'high';
      if (avgElasticity > 0.8) {
        impactLevel = 'high';
        results.highImpactFactors++;
      } else if (avgElasticity > 0.3) {
        impactLevel = 'medium';
        results.mediumImpactFactors++;
      } else {
        impactLevel = 'low';
        results.lowImpactFactors++;
      }
      
      // Add factor result
      results.factors.push({
        factor: {
          id: factor.id,
          name: factor.name,
          baseValue: factor.baseValue
        },
        testRange: { min, max, steps },
        variations: percentageChanges,
        avgElasticity,
        impactLevel,
        recommendation: this.generateSensitivityRecommendation(
          factor, 
          avgElasticity, 
          impactLevel
        )
      });
    }
    
    // Sort factors by impact (highest first)
    results.factors.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impactLevel] - impactOrder[a.impactLevel];
    });
    
    return results;
  }

  /**
   * Generate a recommendation based on sensitivity analysis
   */
  private generateSensitivityRecommendation(
    factor: SensitivityFactor,
    elasticity: number,
    impactLevel: 'low' | 'medium' | 'high'
  ): string {
    if (impactLevel === 'high') {
      return `${factor.name} has a high impact on costs (elasticity: ${elasticity.toFixed(2)}). ` +
        `Closely monitor this factor and consider risk mitigation strategies.`;
    } else if (impactLevel === 'medium') {
      return `${factor.name} has a moderate impact on costs (elasticity: ${elasticity.toFixed(2)}). ` +
        `Regular monitoring is recommended.`;
    } else {
      return `${factor.name} has minimal impact on costs (elasticity: ${elasticity.toFixed(2)}). ` +
        `Less critical for risk management.`;
    }
  }

  /**
   * Get sensitivity factor by ID
   */
  private getSensitivityFactorById(factorId: string): SensitivityFactor | null {
    // Check all years for the factor
    for (const [, factors] of this.sensitivityFactors) {
      const factor = factors.find(f => f.id === factorId);
      if (factor) {
        return factor;
      }
    }
    
    return null;
  }

  /**
   * Get sensitivity factors for a scenario
   */
  private getSensitivityFactorsForScenario(scenario: Scenario): SensitivityFactor[] {
    // Try to get factors for the target year
    const yearFactors = this.sensitivityFactors.get(scenario.targetYear.toString());
    if (yearFactors && yearFactors.length > 0) {
      return yearFactors;
    }
    
    // Fall back to the closest year
    const years = Array.from(this.sensitivityFactors.keys())
      .map(Number)
      .sort((a, b) => a - b);
    
    // Find the closest year
    let closestYear = years[0];
    let minDiff = Math.abs(closestYear - scenario.targetYear);
    
    for (const year of years) {
      const diff = Math.abs(year - scenario.targetYear);
      if (diff < minDiff) {
        minDiff = diff;
        closestYear = year;
      }
    }
    
    return this.sensitivityFactors.get(closestYear.toString()) || [];
  }
  
  /**
   * Evaluate risks for a scenario
   */
  private async evaluateRisks(
    scenario: Scenario,
    risks: Array<Record<string, any>>
  ): Promise<Record<string, any>> {
    // Initialize risk analysis
    const analysis = {
      risks: [] as Array<Record<string, any>>,
      riskCategories: {} as Record<string, Record<string, any>>,
      overallRiskScore: 0,
      riskMatrix: {
        highImpactRisks: 0,
        mediumImpactRisks: 0,
        lowImpactRisks: 0,
        highProbabilityRisks: 0,
        mediumProbabilityRisks: 0,
        lowProbabilityRisks: 0
      },
      timestamp: new Date()
    };
    
    // Track risk categories
    const categories = new Set<string>();
    
    // Evaluate each risk
    for (const risk of risks) {
      // Get base risk values
      const baseImpact = risk.baseImpact || 'medium';
      const baseProbability = risk.baseProbability || 'medium';
      
      // Adjust based on scenario parameters
      const adjustedImpact = this.adjustRiskImpact(
        baseImpact, 
        risk.id, 
        scenario
      );
      
      const adjustedProbability = this.adjustRiskProbability(
        baseProbability, 
        risk.id, 
        scenario
      );
      
      // Calculate risk score (1-9)
      const impactScore = { low: 1, medium: 2, high: 3 }[adjustedImpact];
      const probabilityScore = { low: 1, medium: 2, high: 3 }[adjustedProbability];
      const riskScore = impactScore * probabilityScore;
      
      // Calculate risk level
      let riskLevel;
      if (riskScore >= 6) {
        riskLevel = 'high';
      } else if (riskScore >= 3) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }
      
      // Update category tracking
      const category = risk.category || 'general';
      categories.add(category);
      
      // Generate mitigation strategy
      const mitigationStrategy = this.generateMitigationStrategy(
        risk, 
        adjustedImpact, 
        adjustedProbability
      );
      
      // Add to risk analysis
      analysis.risks.push({
        id: risk.id,
        name: risk.name,
        description: risk.description,
        category,
        impact: adjustedImpact,
        probability: adjustedProbability,
        riskScore,
        riskLevel,
        mitigationStrategy
      });
      
      // Update risk matrix counters
      analysis.riskMatrix[`${adjustedImpact}ImpactRisks`]++;
      analysis.riskMatrix[`${adjustedProbability}ProbabilityRisks`]++;
    }
    
    // Calculate category summaries
    categories.forEach(category => {
      const categoryRisks = analysis.risks.filter(r => r.category === category);
      const avgRiskScore = categoryRisks.reduce((sum, r) => sum + r.riskScore, 0) / categoryRisks.length;
      
      let categoryRiskLevel;
      if (avgRiskScore >= 6) {
        categoryRiskLevel = 'high';
      } else if (avgRiskScore >= 3) {
        categoryRiskLevel = 'medium';
      } else {
        categoryRiskLevel = 'low';
      }
      
      analysis.riskCategories[category] = {
        riskCount: categoryRisks.length,
        avgRiskScore,
        riskLevel: categoryRiskLevel,
        highLevelRisks: categoryRisks.filter(r => r.riskLevel === 'high').length
      };
    });
    
    // Calculate overall risk score (0-10)
    if (analysis.risks.length > 0) {
      const sumRiskScores = analysis.risks.reduce((sum, r) => sum + r.riskScore, 0);
      const avgRiskScore = sumRiskScores / analysis.risks.length;
      analysis.overallRiskScore = Math.min(10, Math.round(avgRiskScore * 10 / 9)); // Scale from 1-9 to 0-10
    }
    
    // Sort risks by score (highest first)
    analysis.risks.sort((a, b) => b.riskScore - a.riskScore);
    
    return analysis;
  }

  /**
   * Adjust risk impact based on scenario parameters
   */
  private adjustRiskImpact(
    baseImpact: 'low' | 'medium' | 'high',
    riskId: string,
    scenario: Scenario
  ): 'low' | 'medium' | 'high' {
    // Impact score mapping
    const impactScores = { low: 1, medium: 2, high: 3 };
    let score = impactScores[baseImpact];
    
    // Check for specific risk modifiers in scenario
    const impactModifier = scenario.parameters[`${riskId}_impact`] || 
                          scenario.assumptions[`${riskId}_impact`];
    
    if (impactModifier !== undefined) {
      if (typeof impactModifier === 'string') {
        return impactModifier as 'low' | 'medium' | 'high';
      } else if (typeof impactModifier === 'number') {
        score = impactModifier;
      }
    }
    
    // Check for general risk modifiers
    const projectSize = scenario.parameters.projectSize || 10000; // Square feet
    if (projectSize > 50000) {
      score += 0.5; // Larger projects have higher impact risks
    } else if (projectSize < 5000) {
      score -= 0.5; // Smaller projects have lower impact risks
    }
    
    // Check timeline - longer projects often have higher impacts
    const timelineYears = scenario.targetYear - scenario.baselineYear;
    if (timelineYears > 5) {
      score += 0.5;
    }
    
    // Convert back to category
    if (score >= 2.5) {
      return 'high';
    } else if (score >= 1.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Adjust risk probability based on scenario parameters
   */
  private adjustRiskProbability(
    baseProbability: 'low' | 'medium' | 'high',
    riskId: string,
    scenario: Scenario
  ): 'low' | 'medium' | 'high' {
    // Probability score mapping
    const probabilityScores = { low: 1, medium: 2, high: 3 };
    let score = probabilityScores[baseProbability];
    
    // Check for specific risk modifiers in scenario
    const probabilityModifier = scenario.parameters[`${riskId}_probability`] || 
                               scenario.assumptions[`${riskId}_probability`];
    
    if (probabilityModifier !== undefined) {
      if (typeof probabilityModifier === 'string') {
        return probabilityModifier as 'low' | 'medium' | 'high';
      } else if (typeof probabilityModifier === 'number') {
        score = probabilityModifier;
      }
    }
    
    // Check for general risk modifiers based on timeline
    const timelineYears = scenario.targetYear - scenario.baselineYear;
    if (timelineYears > 5) {
      score += 0.5; // Longer timelines increase probability of risks
    }
    
    // Economic factors can affect probability
    const economicUncertainty = scenario.assumptions.economicUncertainty || 'medium';
    if (economicUncertainty === 'high') {
      score += 0.5;
    } else if (economicUncertainty === 'low') {
      score -= 0.5;
    }
    
    // Convert back to category
    if (score >= 2.5) {
      return 'high';
    } else if (score >= 1.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate a mitigation strategy for a risk
   */
  private generateMitigationStrategy(
    risk: Record<string, any>,
    impact: 'low' | 'medium' | 'high',
    probability: 'low' | 'medium' | 'high'
  ): string {
    // Use predefined strategy if available
    if (risk.mitigationStrategy) {
      return risk.mitigationStrategy;
    }
    
    // Generate based on risk type and level
    const category = risk.category || 'general';
    const riskScore = { low: 1, medium: 2, high: 3 }[impact] * 
                      { low: 1, medium: 2, high: 3 }[probability];
    
    if (category === 'economic') {
      if (riskScore >= 6) {
        return 'Implement contractual cost adjustment clauses and establish regular budget review cycles.';
      } else if (riskScore >= 3) {
        return 'Include contingency funds specifically allocated for economic fluctuations.';
      } else {
        return 'Monitor economic indicators quarterly and adjust as needed.';
      }
    } else if (category === 'supply_chain') {
      if (riskScore >= 6) {
        return 'Establish relationships with multiple suppliers and consider stockpiling critical materials.';
      } else if (riskScore >= 3) {
        return 'Identify backup suppliers and include early procurement strategies.';
      } else {
        return 'Monitor supply chain indicators regularly.';
      }
    } else if (category === 'labor') {
      if (riskScore >= 6) {
        return 'Develop comprehensive labor sourcing strategy, including retention bonuses and training programs.';
      } else if (riskScore >= 3) {
        return 'Identify multiple labor sources and consider flexible scheduling.';
      } else {
        return 'Monitor local labor market conditions regularly.';
      }
    } else if (category === 'regulatory') {
      if (riskScore >= 6) {
        return 'Engage with regulatory authorities early and include compliance experts on the project team.';
      } else if (riskScore >= 3) {
        return 'Conduct thorough regulatory review at project start and establish monitoring process.';
      } else {
        return 'Review regulatory requirements annually.';
      }
    } else {
      // General risk
      if (riskScore >= 6) {
        return 'Develop a detailed risk management plan with regular monitoring and response procedures.';
      } else if (riskScore >= 3) {
        return 'Include risk in regular project reviews and establish basic contingency plans.';
      } else {
        return 'Monitor as part of regular project management activities.';
      }
    }
  }

  /**
   * Get risks for a scenario
   */
  private getRisksForScenario(scenario: Scenario): Array<Record<string, any>> {
    // Get risks for the target year
    const yearRisks = this.riskFactors.get(scenario.targetYear.toString());
    if (yearRisks) {
      return Object.values(yearRisks);
    }
    
    // Fall back to the closest year
    const years = Array.from(this.riskFactors.keys())
      .map(Number)
      .sort((a, b) => Math.abs(a - scenario.targetYear) - Math.abs(b - scenario.targetYear));
    
    if (years.length > 0) {
      const closestYear = years[0].toString();
      return Object.values(this.riskFactors.get(closestYear) || {});
    }
    
    // Return default risks if no year-specific risks found
    return [
      {
        id: 'material_price_volatility',
        name: 'Material Price Volatility',
        description: 'Risk of significant fluctuations in material prices',
        category: 'economic',
        baseImpact: 'medium',
        baseProbability: 'medium'
      },
      {
        id: 'labor_shortage',
        name: 'Labor Shortage',
        description: 'Risk of insufficient skilled labor availability',
        category: 'labor',
        baseImpact: 'high',
        baseProbability: 'medium'
      },
      {
        id: 'regulatory_changes',
        name: 'Regulatory Changes',
        description: 'Risk of changes in building codes or regulations',
        category: 'regulatory',
        baseImpact: 'medium',
        baseProbability: 'low'
      },
      {
        id: 'supply_chain_disruption',
        name: 'Supply Chain Disruption',
        description: 'Risk of delays in material delivery',
        category: 'supply_chain',
        baseImpact: 'high',
        baseProbability: 'medium'
      },
      {
        id: 'economic_downturn',
        name: 'Economic Downturn',
        description: 'Risk of broader economic recession affecting project',
        category: 'economic',
        baseImpact: 'high',
        baseProbability: 'low'
      }
    ];
  }

  /**
   * Get economic forecasts for a specific year
   */
  private getEconomicForecasts(year: number): Record<string, any> {
    // Get forecasts for the specific year
    const yearForecasts = this.economicIndicatorForecasts.get(year.toString());
    if (yearForecasts) {
      return yearForecasts;
    }
    
    // Fall back to the closest year
    const years = Array.from(this.economicIndicatorForecasts.keys())
      .map(Number)
      .sort((a, b) => Math.abs(a - year) - Math.abs(b - year));
    
    if (years.length > 0) {
      const closestYear = years[0].toString();
      return this.economicIndicatorForecasts.get(closestYear) || {};
    }
    
    // Return default forecasts if no year-specific forecasts found
    return {
      materialCostIndex: 1.02,
      laborCostIndex: 1.03,
      generalInflation: 1.025,
      laborProductivityGrowth: 1.01,
      economicGrowth: 0.02,
      interestRate: 0.03
    };
  }

  /**
   * Load economic indicator forecasts (simulation)
   */
  private async loadEconomicForecasts(): Promise<void> {
    // Simulate loading forecasts from database or file
    const forecasts = {
      '2023': {
        materialCostIndex: 1.03,
        laborCostIndex: 1.035,
        generalInflation: 1.03,
        laborProductivityGrowth: 1.01,
        economicGrowth: 0.02,
        interestRate: 0.045,
        materialShortageRisk: 'medium',
        laborShortageRisk: 'high'
      },
      '2024': {
        materialCostIndex: 1.025,
        laborCostIndex: 1.03,
        generalInflation: 1.025,
        laborProductivityGrowth: 1.01,
        economicGrowth: 0.025,
        interestRate: 0.04,
        materialShortageRisk: 'medium',
        laborShortageRisk: 'medium'
      },
      '2025': {
        materialCostIndex: 1.02,
        laborCostIndex: 1.025,
        generalInflation: 1.02,
        laborProductivityGrowth: 1.015,
        economicGrowth: 0.025,
        interestRate: 0.035,
        materialShortageRisk: 'low',
        laborShortageRisk: 'medium'
      },
      '2026': {
        materialCostIndex: 1.02,
        laborCostIndex: 1.025,
        generalInflation: 1.02,
        laborProductivityGrowth: 1.015,
        economicGrowth: 0.02,
        interestRate: 0.035,
        materialShortageRisk: 'low',
        laborShortageRisk: 'medium'
      },
      '2027': {
        materialCostIndex: 1.02,
        laborCostIndex: 1.03,
        generalInflation: 1.025,
        laborProductivityGrowth: 1.02,
        economicGrowth: 0.02,
        interestRate: 0.04,
        materialShortageRisk: 'medium',
        laborShortageRisk: 'high'
      },
      '2028': {
        materialCostIndex: 1.025,
        laborCostIndex: 1.03,
        generalInflation: 1.025,
        laborProductivityGrowth: 1.02,
        economicGrowth: 0.018,
        interestRate: 0.04,
        materialShortageRisk: 'medium',
        laborShortageRisk: 'high'
      }
    };
    
    // Store in map
    for (const [year, forecast] of Object.entries(forecasts)) {
      this.economicIndicatorForecasts.set(year, forecast);
    }
  }

  /**
   * Load sensitivity factors (simulation)
   */
  private async loadSensitivityFactors(): Promise<void> {
    // Simulate loading sensitivity factors from database or file
    const factorsByYear = {
      '2025': [
        {
          id: 'materialCostIndex',
          name: 'Material Cost Inflation',
          baseValue: 1.02,
          minValue: 1.0,
          maxValue: 1.05,
          stepSize: 0.005,
          impact: 'high'
        },
        {
          id: 'laborCostIndex',
          name: 'Labor Cost Inflation',
          baseValue: 1.025,
          minValue: 1.01,
          maxValue: 1.05,
          stepSize: 0.005,
          impact: 'high'
        },
        {
          id: 'laborProductivityGrowth',
          name: 'Labor Productivity Growth',
          baseValue: 1.015,
          minValue: 1.0,
          maxValue: 1.03,
          stepSize: 0.005,
          impact: 'medium'
        },
        {
          id: 'interestRate',
          name: 'Interest Rate',
          baseValue: 0.035,
          minValue: 0.02,
          maxValue: 0.06,
          stepSize: 0.005,
          impact: 'medium'
        },
        {
          id: 'projectSize',
          name: 'Project Size',
          baseValue: 10000,
          minValue: 5000,
          maxValue: 20000,
          stepSize: 1000,
          impact: 'high'
        }
      ],
      '2027': [
        {
          id: 'materialCostIndex',
          name: 'Material Cost Inflation',
          baseValue: 1.02,
          minValue: 1.0,
          maxValue: 1.05,
          stepSize: 0.005,
          impact: 'high'
        },
        {
          id: 'laborCostIndex',
          name: 'Labor Cost Inflation',
          baseValue: 1.03,
          minValue: 1.01,
          maxValue: 1.06,
          stepSize: 0.005,
          impact: 'high'
        },
        {
          id: 'laborProductivityGrowth',
          name: 'Labor Productivity Growth',
          baseValue: 1.02,
          minValue: 1.0,
          maxValue: 1.04,
          stepSize: 0.005,
          impact: 'medium'
        },
        {
          id: 'interestRate',
          name: 'Interest Rate',
          baseValue: 0.04,
          minValue: 0.025,
          maxValue: 0.065,
          stepSize: 0.005,
          impact: 'medium'
        },
        {
          id: 'projectSize',
          name: 'Project Size',
          baseValue: 10000,
          minValue: 5000,
          maxValue: 20000,
          stepSize: 1000,
          impact: 'high'
        }
      ]
    };
    
    // Store in map
    for (const [year, factors] of Object.entries(factorsByYear)) {
      this.sensitivityFactors.set(year, factors);
    }
  }

  /**
   * Load risk factors (simulation)
   */
  private async loadRiskFactors(): Promise<void> {
    // Simulate loading risk factors from database or file
    const risksByYear = {
      '2025': {
        'material_price_volatility': {
          id: 'material_price_volatility',
          name: 'Material Price Volatility',
          description: 'Risk of significant fluctuations in material prices',
          category: 'economic',
          baseImpact: 'medium',
          baseProbability: 'medium',
          mitigationStrategy: 'Use price escalation clauses in contracts and consider bulk purchasing strategies.'
        },
        'labor_shortage': {
          id: 'labor_shortage',
          name: 'Labor Shortage',
          description: 'Risk of insufficient skilled labor availability',
          category: 'labor',
          baseImpact: 'high',
          baseProbability: 'medium',
          mitigationStrategy: 'Develop relationships with multiple subcontractors and consider training programs.'
        },
        'regulatory_changes': {
          id: 'regulatory_changes',
          name: 'Regulatory Changes',
          description: 'Risk of changes in building codes or regulations',
          category: 'regulatory',
          baseImpact: 'medium',
          baseProbability: 'low',
          mitigationStrategy: 'Maintain close relationships with local code officials and monitor proposed changes.'
        },
        'supply_chain_disruption': {
          id: 'supply_chain_disruption',
          name: 'Supply Chain Disruption',
          description: 'Risk of delays in material delivery',
          category: 'supply_chain',
          baseImpact: 'high',
          baseProbability: 'medium',
          mitigationStrategy: 'Identify multiple suppliers and consider early procurement of critical materials.'
        },
        'economic_downturn': {
          id: 'economic_downturn',
          name: 'Economic Downturn',
          description: 'Risk of broader economic recession affecting project',
          category: 'economic',
          baseImpact: 'high',
          baseProbability: 'low',
          mitigationStrategy: 'Include contingency funds and develop phasing strategies to adapt to economic conditions.'
        },
        'weather_delays': {
          id: 'weather_delays',
          name: 'Weather Delays',
          description: 'Risk of project delays due to adverse weather conditions',
          category: 'environmental',
          baseImpact: 'medium',
          baseProbability: 'medium',
          mitigationStrategy: 'Include weather contingency days in the schedule and plan for seasonal work appropriately.'
        }
      },
      '2027': {
        'material_price_volatility': {
          id: 'material_price_volatility',
          name: 'Material Price Volatility',
          description: 'Risk of significant fluctuations in material prices',
          category: 'economic',
          baseImpact: 'high',
          baseProbability: 'high',
          mitigationStrategy: 'Implement comprehensive material price hedging strategies and maintain larger contingencies.'
        },
        'labor_shortage': {
          id: 'labor_shortage',
          name: 'Labor Shortage',
          description: 'Risk of insufficient skilled labor availability',
          category: 'labor',
          baseImpact: 'high',
          baseProbability: 'high',
          mitigationStrategy: 'Develop long-term workforce development programs and consider prefabrication to reduce onsite labor needs.'
        },
        'regulatory_changes': {
          id: 'regulatory_changes',
          name: 'Regulatory Changes',
          description: 'Risk of changes in building codes or regulations',
          category: 'regulatory',
          baseImpact: 'medium',
          baseProbability: 'medium',
          mitigationStrategy: 'Engage with regulatory authorities early and maintain representation in code development process.'
        },
        'supply_chain_disruption': {
          id: 'supply_chain_disruption',
          name: 'Supply Chain Disruption',
          description: 'Risk of delays in material delivery',
          category: 'supply_chain',
          baseImpact: 'high',
          baseProbability: 'high',
          mitigationStrategy: 'Establish robust supply chain risk management system and consider stockpiling critical materials.'
        },
        'economic_downturn': {
          id: 'economic_downturn',
          name: 'Economic Downturn',
          description: 'Risk of broader economic recession affecting project',
          category: 'economic',
          baseImpact: 'high',
          baseProbability: 'medium',
          mitigationStrategy: 'Develop scenario-based project plans and include flexible phasing to adapt to economic conditions.'
        },
        'weather_delays': {
          id: 'weather_delays',
          name: 'Weather Delays',
          description: 'Risk of project delays due to adverse weather conditions',
          category: 'environmental',
          baseImpact: 'high',
          baseProbability: 'high',
          mitigationStrategy: 'Invest in weather mitigation measures and temporary structures to continue work in adverse conditions.'
        },
        'technology_disruption': {
          id: 'technology_disruption',
          name: 'Technology Disruption',
          description: 'Risk of new construction technologies making current methods obsolete',
          category: 'technology',
          baseImpact: 'medium',
          baseProbability: 'medium',
          mitigationStrategy: 'Monitor emerging technologies and design with flexibility to incorporate advancements.'
        }
      }
    };
    
    // Store in map
    for (const [year, risks] of Object.entries(risksByYear)) {
      this.riskFactors.set(year, risks);
    }
  }

  /**
   * Load existing scenarios (simulation)
   */
  private async loadScenarios(): Promise<void> {
    // Simulate loading scenarios from database or file
    const sampleScenarios: Scenario[] = [
      {
        id: 'scenario_baseline_2025',
        name: 'Baseline 2025 Projection',
        description: 'Standard projection based on current economic indicators',
        baselineYear: 2022,
        targetYear: 2025,
        parameters: {
          materialBaseCost: 100,
          laborBaseCost: 80,
          otherBaseCost: 50,
          projectSize: 10000,
          budgetBaseline: 2300000
        },
        assumptions: {
          economicUncertainty: 'medium',
          materialShortageRisk: 'low',
          laborShortageRisk: 'medium'
        },
        status: 'active',
        createdAt: new Date('2022-06-01'),
        updatedAt: new Date('2022-06-01')
      },
      {
        id: 'scenario_high_inflation_2025',
        name: 'High Inflation 2025',
        description: 'Projection assuming higher than expected inflation',
        baselineYear: 2022,
        targetYear: 2025,
        parameters: {
          materialBaseCost: 100,
          laborBaseCost: 80,
          otherBaseCost: 50,
          projectSize: 10000,
          budgetBaseline: 2300000
        },
        assumptions: {
          materialCostIndex: 1.05,
          laborCostIndex: 1.045,
          generalInflation: 1.04,
          economicUncertainty: 'high',
          materialShortageRisk: 'medium',
          laborShortageRisk: 'medium'
        },
        status: 'draft',
        createdAt: new Date('2022-06-15'),
        updatedAt: new Date('2022-06-15')
      }
    ];
    
    // Store in map
    sampleScenarios.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario);
    });
  }
}