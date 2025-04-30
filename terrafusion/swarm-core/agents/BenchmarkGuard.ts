/**
 * TerraBuild AI Swarm - BenchmarkGuard Agent
 * 
 * This specialized agent monitors calculations for consistency,
 * flags outliers, and ensures assessments align with expected benchmarks.
 */

import { Agent, AgentConfig, AgentTask } from '../Agent';

export interface PropertyAssessment {
  id: string;
  propertyId: string;
  parcelNumber: string;
  buildingType: string;
  buildingSize: number;
  yearBuilt: number;
  quality: string;
  condition: string;
  region: string;
  totalValue: number;
  landValue: number;
  improvementValue: number;
  assessmentDate: Date;
  calculationMethod: string;
  metadata?: Record<string, any>;
}

export interface BenchmarkRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'range' | 'ratio' | 'comparison' | 'statistical';
  parameters: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

export interface BenchmarkViolation {
  ruleId: string;
  ruleName: string;
  propertyId: string;
  parcelNumber: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
}

export class BenchmarkGuard extends Agent {
  private assessments: Map<string, PropertyAssessment> = new Map();
  private rules: Map<string, BenchmarkRule> = new Map();
  private violations: Map<string, BenchmarkViolation[]> = new Map();
  private benchmarkData: Map<string, Record<string, any>> = new Map();

  constructor() {
    const config: AgentConfig = {
      id: 'benchmark-guard',
      name: 'BenchmarkGuard',
      description: 'Monitors calculations for consistency and flags outliers that need additional review',
      version: '1.0.0',
      capabilities: [
        'assessment:validate',
        'assessment:benchmark',
        'outlier:detect',
        'rule:evaluate',
        'quality:report'
      ]
    };
    
    super(config);
  }

  /**
   * Initialize the agent with benchmark rules and data
   */
  public async initialize(): Promise<boolean> {
    try {
      // Load benchmark rules
      await this.loadBenchmarkRules();
      
      // Load benchmark data
      await this.loadBenchmarkData();
      
      return super.initialize();
    } catch (error) {
      console.error('Failed to initialize BenchmarkGuard agent:', error);
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
        case 'assessment:validate':
          await this.processValidateAssessmentTask(task);
          break;
        case 'assessment:benchmark':
          await this.processBenchmarkAssessmentTask(task);
          break;
        case 'outlier:detect':
          await this.processDetectOutliersTask(task);
          break;
        case 'rule:evaluate':
          await this.processEvaluateRuleTask(task);
          break;
        case 'quality:report':
          await this.processQualityReportTask(task);
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
   * Process a task to validate an assessment
   */
  private async processValidateAssessmentTask(task: AgentTask): Promise<void> {
    const { assessment } = task.data;
    
    if (!assessment) {
      throw new Error('No assessment provided for validation');
    }
    
    // Convert to PropertyAssessment type and store
    const propertyAssessment: PropertyAssessment = assessment;
    this.assessments.set(propertyAssessment.id, propertyAssessment);
    
    // Validate against all enabled rules
    const enabledRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled);
    
    const validationResults = [];
    const violations: BenchmarkViolation[] = [];
    
    for (const rule of enabledRules) {
      const result = this.evaluateRule(rule, propertyAssessment);
      validationResults.push(result);
      
      if (!result.passed) {
        const violation: BenchmarkViolation = {
          ruleId: rule.id,
          ruleName: rule.name,
          propertyId: propertyAssessment.id,
          parcelNumber: propertyAssessment.parcelNumber,
          severity: rule.severity,
          message: result.message,
          details: result.details,
          timestamp: new Date()
        };
        
        violations.push(violation);
      }
    }
    
    // Store violations
    if (violations.length > 0) {
      this.violations.set(propertyAssessment.id, violations);
    }
    
    // Complete the task with results
    this.completeTask(task.id, {
      propertyId: propertyAssessment.id,
      parcelNumber: propertyAssessment.parcelNumber,
      totalRulesChecked: enabledRules.length,
      passedRules: validationResults.filter(r => r.passed).length,
      failedRules: validationResults.filter(r => !r.passed).length,
      violations,
      passed: violations.length === 0,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to benchmark an assessment against comparable properties
   */
  private async processBenchmarkAssessmentTask(task: AgentTask): Promise<void> {
    const { assessmentId, comparableType } = task.data;
    
    // Get the assessment
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment with ID ${assessmentId} not found`);
    }
    
    // Get the comparable assessments based on the type
    const comparables = this.findComparableProperties(assessment, comparableType);
    
    if (comparables.length === 0) {
      throw new Error(`No comparable properties found for assessment ${assessmentId}`);
    }
    
    // Calculate benchmark metrics
    const metrics = this.calculateBenchmarkMetrics(assessment, comparables);
    
    // Generate insights based on the metrics
    const insights = this.generateBenchmarkInsights(assessment, metrics);
    
    // Complete the task with results
    this.completeTask(task.id, {
      assessmentId,
      parcelNumber: assessment.parcelNumber,
      comparableType,
      comparableCount: comparables.length,
      metrics,
      insights,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to detect outliers in a batch of assessments
   */
  private async processDetectOutliersTask(task: AgentTask): Promise<void> {
    const { assessmentIds, method, parameters } = task.data;
    
    // Get the assessments
    const targetAssessments = assessmentIds
      ? assessmentIds.map(id => this.assessments.get(id)).filter(a => a)
      : Array.from(this.assessments.values());
    
    if (targetAssessments.length === 0) {
      throw new Error('No assessments available for outlier detection');
    }
    
    // Detect outliers based on the specified method
    let outliers;
    switch (method) {
      case 'zscore':
        outliers = this.detectOutliersZScore(targetAssessments, parameters);
        break;
      case 'iqr':
        outliers = this.detectOutliersIQR(targetAssessments, parameters);
        break;
      case 'localfactor':
        outliers = this.detectOutliersLocalFactor(targetAssessments, parameters);
        break;
      default:
        outliers = this.detectOutliersZScore(targetAssessments, parameters);
    }
    
    // Complete the task with results
    this.completeTask(task.id, {
      method,
      assessmentsAnalyzed: targetAssessments.length,
      outliersDetected: outliers.length,
      outliers,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to evaluate a specific rule
   */
  private async processEvaluateRuleTask(task: AgentTask): Promise<void> {
    const { ruleId, assessmentIds } = task.data;
    
    // Get the rule
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }
    
    // Get the assessments
    const targetAssessments = assessmentIds
      ? assessmentIds.map(id => this.assessments.get(id)).filter(a => a)
      : Array.from(this.assessments.values());
    
    if (targetAssessments.length === 0) {
      throw new Error('No assessments available for rule evaluation');
    }
    
    // Evaluate the rule for each assessment
    const results = targetAssessments.map(assessment => {
      const result = this.evaluateRule(rule, assessment);
      return {
        assessmentId: assessment.id,
        parcelNumber: assessment.parcelNumber,
        passed: result.passed,
        message: result.message,
        details: result.details
      };
    });
    
    // Complete the task with results
    this.completeTask(task.id, {
      ruleId,
      ruleName: rule.name,
      assessmentsEvaluated: results.length,
      passedCount: results.filter(r => r.passed).length,
      failedCount: results.filter(r => !r.passed).length,
      results,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to generate a quality report
   */
  private async processQualityReportTask(task: AgentTask): Promise<void> {
    const { region, buildingTypes, period } = task.data;
    
    // Filter assessments based on criteria
    let filteredAssessments = Array.from(this.assessments.values());
    
    if (region) {
      filteredAssessments = filteredAssessments.filter(a => a.region === region);
    }
    
    if (buildingTypes && buildingTypes.length > 0) {
      filteredAssessments = filteredAssessments.filter(a => 
        buildingTypes.includes(a.buildingType)
      );
    }
    
    if (period) {
      const startDate = new Date(period.start);
      const endDate = new Date(period.end);
      filteredAssessments = filteredAssessments.filter(a => 
        a.assessmentDate >= startDate && a.assessmentDate <= endDate
      );
    }
    
    if (filteredAssessments.length === 0) {
      throw new Error('No assessments found matching the specified criteria');
    }
    
    // Generate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(filteredAssessments);
    
    // Generate violation summary
    const violationSummary = this.generateViolationSummary(filteredAssessments);
    
    // Generate recommendations
    const recommendations = this.generateQualityRecommendations(
      qualityMetrics, 
      violationSummary
    );
    
    // Complete the task with results
    this.completeTask(task.id, {
      region,
      buildingTypes,
      period,
      assessmentCount: filteredAssessments.length,
      qualityMetrics,
      violationSummary,
      recommendations,
      timestamp: new Date()
    });
  }

  /**
   * Evaluate a single rule against an assessment
   */
  private evaluateRule(
    rule: BenchmarkRule, 
    assessment: PropertyAssessment
  ): { passed: boolean; message: string; details: Record<string, any> } {
    const { type, parameters } = rule;
    
    switch (type) {
      case 'range':
        return this.evaluateRangeRule(assessment, parameters);
      case 'ratio':
        return this.evaluateRatioRule(assessment, parameters);
      case 'comparison':
        return this.evaluateComparisonRule(assessment, parameters);
      case 'statistical':
        return this.evaluateStatisticalRule(assessment, parameters);
      default:
        return {
          passed: false,
          message: `Unknown rule type: ${type}`,
          details: { ruleType: type }
        };
    }
  }

  /**
   * Evaluate a range rule (e.g., value must be between min and max)
   */
  private evaluateRangeRule(
    assessment: PropertyAssessment,
    parameters: Record<string, any>
  ): { passed: boolean; message: string; details: Record<string, any> } {
    const { property, min, max } = parameters;
    
    // Get the property value
    const value = this.getPropertyValue(assessment, property);
    
    // Check if value is within range
    const passed = value >= min && value <= max;
    
    return {
      passed,
      message: passed
        ? `Value ${value} for ${property} is within acceptable range (${min}-${max})`
        : `Value ${value} for ${property} is outside acceptable range (${min}-${max})`,
      details: {
        property,
        value,
        min,
        max,
        deviation: passed ? 0 : (value < min ? value - min : value - max)
      }
    };
  }

  /**
   * Evaluate a ratio rule (e.g., ratio between two properties must be within range)
   */
  private evaluateRatioRule(
    assessment: PropertyAssessment,
    parameters: Record<string, any>
  ): { passed: boolean; message: string; details: Record<string, any> } {
    const { numerator, denominator, minRatio, maxRatio } = parameters;
    
    // Get the property values
    const numeratorValue = this.getPropertyValue(assessment, numerator);
    const denominatorValue = this.getPropertyValue(assessment, denominator);
    
    // Check for division by zero
    if (denominatorValue === 0) {
      return {
        passed: false,
        message: `Cannot calculate ratio - ${denominator} is zero`,
        details: {
          numerator,
          denominator,
          numeratorValue,
          denominatorValue
        }
      };
    }
    
    // Calculate ratio
    const ratio = numeratorValue / denominatorValue;
    
    // Check if ratio is within range
    const passed = ratio >= minRatio && ratio <= maxRatio;
    
    return {
      passed,
      message: passed
        ? `Ratio ${ratio.toFixed(2)} (${numerator}/${denominator}) is within acceptable range (${minRatio}-${maxRatio})`
        : `Ratio ${ratio.toFixed(2)} (${numerator}/${denominator}) is outside acceptable range (${minRatio}-${maxRatio})`,
      details: {
        ratio,
        numerator,
        denominator,
        numeratorValue,
        denominatorValue,
        minRatio,
        maxRatio,
        deviation: passed ? 0 : (ratio < minRatio ? ratio - minRatio : ratio - maxRatio)
      }
    };
  }

  /**
   * Evaluate a comparison rule (e.g., compare with benchmark value)
   */
  private evaluateComparisonRule(
    assessment: PropertyAssessment,
    parameters: Record<string, any>
  ): { passed: boolean; message: string; details: Record<string, any> } {
    const { property, benchmark, tolerance } = parameters;
    
    // Get the property value
    const value = this.getPropertyValue(assessment, property);
    
    // Get benchmark value
    let benchmarkValue;
    
    if (typeof benchmark === 'number') {
      // Static benchmark value
      benchmarkValue = benchmark;
    } else if (typeof benchmark === 'string') {
      // Benchmark from data
      benchmarkValue = this.getBenchmarkValue(assessment, benchmark);
      if (benchmarkValue === null) {
        return {
          passed: false,
          message: `Benchmark value ${benchmark} not found`,
          details: {
            property,
            value,
            benchmark
          }
        };
      }
    } else {
      return {
        passed: false,
        message: `Invalid benchmark definition`,
        details: {
          property,
          value,
          benchmark
        }
      };
    }
    
    // Calculate deviation and check against tolerance
    const deviation = Math.abs((value - benchmarkValue) / benchmarkValue);
    const passed = deviation <= tolerance;
    
    return {
      passed,
      message: passed
        ? `Value ${value} for ${property} is within tolerance of benchmark ${benchmarkValue} (deviation: ${(deviation * 100).toFixed(2)}%)`
        : `Value ${value} for ${property} exceeds tolerance of benchmark ${benchmarkValue} (deviation: ${(deviation * 100).toFixed(2)}%)`,
      details: {
        property,
        value,
        benchmarkValue,
        deviation,
        tolerance,
        deviationPercent: (deviation * 100).toFixed(2) + '%'
      }
    };
  }

  /**
   * Evaluate a statistical rule (e.g., z-score within limits)
   */
  private evaluateStatisticalRule(
    assessment: PropertyAssessment,
    parameters: Record<string, any>
  ): { passed: boolean; message: string; details: Record<string, any> } {
    const { property, method, threshold } = parameters;
    
    // Get the property value
    const value = this.getPropertyValue(assessment, property);
    
    // Get comparable properties for statistical comparison
    const comparables = this.findComparableProperties(assessment, 'similar');
    
    if (comparables.length < 5) {
      return {
        passed: true, // Not enough comparables to make a statistical judgment
        message: `Insufficient comparable properties (${comparables.length}) for statistical evaluation`,
        details: {
          property,
          value,
          comparableCount: comparables.length
        }
      };
    }
    
    // Calculate statistics based on the method
    switch (method) {
      case 'zscore': {
        const values = comparables.map(p => this.getPropertyValue(p, property));
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const stdDev = Math.sqrt(
          values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
        );
        
        if (stdDev === 0) {
          return {
            passed: true,
            message: `All comparable properties have identical ${property} values`,
            details: {
              property,
              value,
              mean,
              stdDev: 0
            }
          };
        }
        
        const zScore = (value - mean) / stdDev;
        const passed = Math.abs(zScore) <= threshold;
        
        return {
          passed,
          message: passed
            ? `Z-score ${zScore.toFixed(2)} for ${property} is within threshold ${threshold}`
            : `Z-score ${zScore.toFixed(2)} for ${property} exceeds threshold ${threshold}`,
          details: {
            property,
            value,
            mean,
            stdDev,
            zScore,
            threshold,
            comparableCount: comparables.length
          }
        };
      }
      
      case 'percentile': {
        const values = comparables.map(p => this.getPropertyValue(p, property)).sort((a, b) => a - b);
        const rank = values.findIndex(v => v >= value);
        const percentile = rank / values.length;
        
        // Check if percentile is within acceptable range
        const passed = percentile >= parameters.minPercentile && 
                      percentile <= parameters.maxPercentile;
        
        return {
          passed,
          message: passed
            ? `Percentile ${(percentile * 100).toFixed(1)}% for ${property} is within acceptable range (${parameters.minPercentile * 100}%-${parameters.maxPercentile * 100}%)`
            : `Percentile ${(percentile * 100).toFixed(1)}% for ${property} is outside acceptable range (${parameters.minPercentile * 100}%-${parameters.maxPercentile * 100}%)`,
          details: {
            property,
            value,
            percentile,
            minPercentile: parameters.minPercentile,
            maxPercentile: parameters.maxPercentile,
            comparableCount: comparables.length
          }
        };
      }
      
      default:
        return {
          passed: false,
          message: `Unknown statistical method: ${method}`,
          details: {
            property,
            value,
            method
          }
        };
    }
  }

  /**
   * Find comparable properties for an assessment
   */
  private findComparableProperties(
    assessment: PropertyAssessment,
    comparableType: string
  ): PropertyAssessment[] {
    const allAssessments = Array.from(this.assessments.values());
    
    // Filter out the current assessment
    const otherAssessments = allAssessments.filter(a => a.id !== assessment.id);
    
    switch (comparableType) {
      case 'same_type':
        // Properties with the same building type
        return otherAssessments.filter(a => 
          a.buildingType === assessment.buildingType
        );
        
      case 'same_region':
        // Properties in the same region
        return otherAssessments.filter(a => 
          a.region === assessment.region
        );
        
      case 'same_quality':
        // Properties with the same quality rating
        return otherAssessments.filter(a => 
          a.quality === assessment.quality
        );
        
      case 'similar':
        // Properties that are similar in multiple dimensions
        return otherAssessments.filter(a => 
          a.buildingType === assessment.buildingType &&
          a.region === assessment.region &&
          Math.abs(a.buildingSize - assessment.buildingSize) / assessment.buildingSize <= 0.2 && // within 20% size
          Math.abs(a.yearBuilt - assessment.yearBuilt) <= 10 // within 10 years
        );
        
      case 'same_size_range':
        // Properties within 20% of the same size
        return otherAssessments.filter(a => 
          Math.abs(a.buildingSize - assessment.buildingSize) / assessment.buildingSize <= 0.2
        );
        
      default:
        // Default to same building type
        return otherAssessments.filter(a => 
          a.buildingType === assessment.buildingType
        );
    }
  }

  /**
   * Calculate benchmark metrics for an assessment compared to other properties
   */
  private calculateBenchmarkMetrics(
    assessment: PropertyAssessment,
    comparables: PropertyAssessment[]
  ): Record<string, any> {
    // Calculate value per square foot
    const valuePerSqFt = assessment.totalValue / assessment.buildingSize;
    
    const comparableValues = comparables.map(p => p.totalValue / p.buildingSize);
    
    // Calculate statistics
    const min = Math.min(...comparableValues);
    const max = Math.max(...comparableValues);
    const mean = comparableValues.reduce((sum, v) => sum + v, 0) / comparableValues.length;
    const median = this.calculateMedian(comparableValues);
    
    const sortedValues = [...comparableValues].sort((a, b) => a - b);
    const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
    const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
    
    // Calculate percentile rank of the assessment
    const rank = sortedValues.findIndex(v => v >= valuePerSqFt);
    const percentile = rank / sortedValues.length;
    
    // Calculate z-score
    const stdDev = Math.sqrt(
      comparableValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / comparableValues.length
    );
    const zScore = stdDev === 0 ? 0 : (valuePerSqFt - mean) / stdDev;
    
    return {
      assessmentValuePerSqFt: valuePerSqFt,
      comparableCount: comparables.length,
      statistics: {
        min,
        max,
        mean,
        median,
        q1,
        q3,
        stdDev,
        range: max - min,
        iqr: q3 - q1
      },
      comparison: {
        percentile,
        zScore,
        differenceFromMean: valuePerSqFt - mean,
        percentDifferenceFromMean: ((valuePerSqFt - mean) / mean) * 100,
        differenceFromMedian: valuePerSqFt - median,
        percentDifferenceFromMedian: ((valuePerSqFt - median) / median) * 100
      }
    };
  }

  /**
   * Generate insights based on benchmark metrics
   */
  private generateBenchmarkInsights(
    assessment: PropertyAssessment,
    metrics: Record<string, any>
  ): Array<{ type: string; message: string; severity: string }> {
    const insights = [];
    const { comparison } = metrics;
    
    // Check z-score for outliers
    if (Math.abs(comparison.zScore) > 2) {
      insights.push({
        type: 'outlier',
        message: `Assessment is a statistical outlier (z-score: ${comparison.zScore.toFixed(2)})`,
        severity: Math.abs(comparison.zScore) > 3 ? 'critical' : 'warning'
      });
    }
    
    // Check percentile ranking
    if (comparison.percentile < 0.1) {
      insights.push({
        type: 'low_percentile',
        message: `Assessment is in the bottom 10% of comparable properties`,
        severity: 'warning'
      });
    } else if (comparison.percentile > 0.9) {
      insights.push({
        type: 'high_percentile',
        message: `Assessment is in the top 10% of comparable properties`,
        severity: 'warning'
      });
    }
    
    // Check percent difference from mean
    if (Math.abs(comparison.percentDifferenceFromMean) > 25) {
      insights.push({
        type: 'significant_deviation',
        message: `Assessment differs from mean by ${comparison.percentDifferenceFromMean.toFixed(1)}%`,
        severity: Math.abs(comparison.percentDifferenceFromMean) > 50 ? 'critical' : 'warning'
      });
    }
    
    // Check for land/improvement ratio issues
    const landRatio = assessment.landValue / assessment.totalValue;
    if (landRatio < 0.1 || landRatio > 0.8) {
      insights.push({
        type: 'unusual_land_ratio',
        message: `Unusual land-to-total value ratio: ${(landRatio * 100).toFixed(1)}%`,
        severity: 'warning'
      });
    }
    
    // If no issues found, add a positive insight
    if (insights.length === 0) {
      insights.push({
        type: 'aligned',
        message: 'Assessment aligns well with comparable properties',
        severity: 'info'
      });
    }
    
    return insights;
  }

  /**
   * Detect outliers using Z-Score method
   */
  private detectOutliersZScore(
    assessments: PropertyAssessment[],
    parameters: Record<string, any>
  ): Array<Record<string, any>> {
    const { property, threshold } = parameters || { property: 'totalValue', threshold: 2.5 };
    
    // Get values for the specified property
    const values = assessments.map(a => this.getPropertyValue(a, property));
    
    // Calculate mean and standard deviation
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );
    
    // If standard deviation is 0, no outliers can be detected
    if (stdDev === 0) {
      return [];
    }
    
    // Identify outliers
    const outliers = assessments.filter((assessment, index) => {
      const value = values[index];
      const zScore = Math.abs((value - mean) / stdDev);
      return zScore > threshold;
    });
    
    // Format the results
    return outliers.map(assessment => {
      const value = this.getPropertyValue(assessment, property);
      const zScore = (value - mean) / stdDev;
      
      return {
        assessmentId: assessment.id,
        parcelNumber: assessment.parcelNumber,
        property,
        value,
        mean,
        stdDev,
        zScore,
        deviationPercent: ((value - mean) / mean * 100).toFixed(2) + '%',
        severity: Math.abs(zScore) > 3 ? 'critical' : 'warning'
      };
    });
  }

  /**
   * Detect outliers using Interquartile Range (IQR) method
   */
  private detectOutliersIQR(
    assessments: PropertyAssessment[],
    parameters: Record<string, any>
  ): Array<Record<string, any>> {
    const { property, multiplier } = parameters || { property: 'totalValue', multiplier: 1.5 };
    
    // Get values for the specified property
    const values = assessments.map(a => this.getPropertyValue(a, property));
    const sortedValues = [...values].sort((a, b) => a - b);
    
    // Calculate quartiles
    const q1Index = Math.floor(sortedValues.length * 0.25);
    const q3Index = Math.floor(sortedValues.length * 0.75);
    const q1 = sortedValues[q1Index];
    const q3 = sortedValues[q3Index];
    const iqr = q3 - q1;
    
    // If IQR is 0, no outliers can be detected
    if (iqr === 0) {
      return [];
    }
    
    // Define outlier boundaries
    const lowerBound = q1 - (multiplier * iqr);
    const upperBound = q3 + (multiplier * iqr);
    
    // Identify outliers
    const outliers = assessments.filter((assessment, index) => {
      const value = values[index];
      return value < lowerBound || value > upperBound;
    });
    
    // Format the results
    return outliers.map(assessment => {
      const value = this.getPropertyValue(assessment, property);
      const isLower = value < lowerBound;
      
      return {
        assessmentId: assessment.id,
        parcelNumber: assessment.parcelNumber,
        property,
        value,
        q1,
        q3,
        iqr,
        bound: isLower ? lowerBound : upperBound,
        direction: isLower ? 'below' : 'above',
        deviationAmount: isLower ? lowerBound - value : value - upperBound,
        severity: (isLower ? value < q1 - (3 * iqr) : value > q3 + (3 * iqr)) 
          ? 'critical' : 'warning'
      };
    });
  }

  /**
   * Detect outliers using Local Factors (comparison with similar properties)
   */
  private detectOutliersLocalFactor(
    assessments: PropertyAssessment[],
    parameters: Record<string, any>
  ): Array<Record<string, any>> {
    const { property, thresholdPercent } = parameters || { property: 'totalValue', thresholdPercent: 30 };
    const threshold = thresholdPercent / 100;
    
    const outliers = [];
    
    // For each assessment, compare with similar properties
    for (const assessment of assessments) {
      const similars = this.findComparableProperties(assessment, 'similar');
      
      // If not enough similar properties, skip
      if (similars.length < 5) continue;
      
      // Calculate average value for similar properties
      const similarValues = similars.map(a => this.getPropertyValue(a, property));
      const avgValue = similarValues.reduce((sum, v) => sum + v, 0) / similarValues.length;
      
      // Check if assessment deviates significantly from the average
      const value = this.getPropertyValue(assessment, property);
      const deviation = Math.abs((value - avgValue) / avgValue);
      
      if (deviation > threshold) {
        outliers.push({
          assessmentId: assessment.id,
          parcelNumber: assessment.parcelNumber,
          property,
          value,
          avgSimilarValue: avgValue,
          deviationPercent: (deviation * 100).toFixed(2) + '%',
          direction: value > avgValue ? 'above' : 'below',
          similarCount: similars.length,
          severity: deviation > (threshold * 2) ? 'critical' : 'warning'
        });
      }
    }
    
    return outliers;
  }

  /**
   * Calculate quality metrics for a batch of assessments
   */
  private calculateQualityMetrics(
    assessments: PropertyAssessment[]
  ): Record<string, any> {
    // Count assessments by building type
    const buildingTypeCounts = assessments.reduce((acc, a) => {
      acc[a.buildingType] = (acc[a.buildingType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get all violations for these assessments
    const allViolations = assessments
      .map(a => this.violations.get(a.id) || [])
      .flat();
    
    // Calculate violation rate
    const assessmentsWithViolations = new Set(
      allViolations.map(v => v.propertyId)
    ).size;
    
    const violationRate = assessments.length > 0 
      ? assessmentsWithViolations / assessments.length 
      : 0;
    
    // Count violations by severity
    const violationsBySeverity = allViolations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count violations by rule
    const violationsByRule = allViolations.reduce((acc, v) => {
      acc[v.ruleName] = (acc[v.ruleName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate statistical consistency
    const valuePerSqFtByType = {} as Record<string, number[]>;
    
    assessments.forEach(a => {
      if (!valuePerSqFtByType[a.buildingType]) {
        valuePerSqFtByType[a.buildingType] = [];
      }
      valuePerSqFtByType[a.buildingType].push(a.totalValue / a.buildingSize);
    });
    
    const coefficientOfVariation = Object.entries(valuePerSqFtByType)
      .reduce((acc, [type, values]) => {
        if (values.length < 5) return acc; // Skip if not enough samples
        
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const stdDev = Math.sqrt(
          values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
        );
        
        acc[type] = (stdDev / mean) * 100; // CV as percentage
        return acc;
      }, {} as Record<string, number>);
    
    return {
      totalAssessments: assessments.length,
      buildingTypeCounts,
      violations: {
        total: allViolations.length,
        assessmentsWithViolations,
        violationRate,
        bySeverity: violationsBySeverity,
        byRule: violationsByRule
      },
      consistency: {
        coefficientOfVariation
      }
    };
  }

  /**
   * Generate a summary of violations
   */
  private generateViolationSummary(
    assessments: PropertyAssessment[]
  ): Record<string, any> {
    // Get all violations for these assessments
    const allViolations = assessments
      .map(a => this.violations.get(a.id) || [])
      .flat();
    
    // Group violations by rule
    const ruleGroups = allViolations.reduce((acc, violation) => {
      if (!acc[violation.ruleId]) {
        acc[violation.ruleId] = {
          ruleName: violation.ruleName,
          count: 0,
          bySeverity: {
            info: 0,
            warning: 0,
            critical: 0
          },
          samples: []
        };
      }
      
      acc[violation.ruleId].count++;
      acc[violation.ruleId].bySeverity[violation.severity]++;
      
      // Add a sample of this violation (up to 5 per rule)
      if (acc[violation.ruleId].samples.length < 5) {
        acc[violation.ruleId].samples.push({
          parcelNumber: violation.parcelNumber,
          message: violation.message,
          details: violation.details
        });
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Find patterns in violations
    const patterns = this.identifyViolationPatterns(allViolations, assessments);
    
    return {
      totalViolations: allViolations.length,
      ruleGroups: Object.values(ruleGroups),
      patterns
    };
  }

  /**
   * Identify patterns in violations
   */
  private identifyViolationPatterns(
    violations: BenchmarkViolation[],
    assessments: PropertyAssessment[]
  ): Array<{ pattern: string; description: string; count: number }> {
    const patterns = [];
    
    // Check for building type patterns
    const buildingTypeCounts = {} as Record<string, { violations: number; total: number }>;
    
    // Count assessments by building type
    assessments.forEach(a => {
      if (!buildingTypeCounts[a.buildingType]) {
        buildingTypeCounts[a.buildingType] = { violations: 0, total: 0 };
      }
      buildingTypeCounts[a.buildingType].total++;
    });
    
    // Count violations by building type
    const violationPropertyIds = new Set(violations.map(v => v.propertyId));
    
    assessments.forEach(a => {
      if (violationPropertyIds.has(a.id)) {
        buildingTypeCounts[a.buildingType].violations++;
      }
    });
    
    // Identify building types with high violation rates
    Object.entries(buildingTypeCounts).forEach(([type, { violations, total }]) => {
      if (total >= 5) { // Only consider types with enough samples
        const rate = violations / total;
        if (rate >= 0.5) { // 50% or more have violations
          patterns.push({
            pattern: 'building_type',
            description: `${type} properties have a high violation rate (${(rate * 100).toFixed(1)}%)`,
            count: violations
          });
        }
      }
    });
    
    // Check for region patterns
    const regionCounts = {} as Record<string, { violations: number; total: number }>;
    
    // Count assessments by region
    assessments.forEach(a => {
      if (!regionCounts[a.region]) {
        regionCounts[a.region] = { violations: 0, total: 0 };
      }
      regionCounts[a.region].total++;
    });
    
    // Count violations by region
    assessments.forEach(a => {
      if (violationPropertyIds.has(a.id)) {
        regionCounts[a.region].violations++;
      }
    });
    
    // Identify regions with high violation rates
    Object.entries(regionCounts).forEach(([region, { violations, total }]) => {
      if (total >= 5) { // Only consider regions with enough samples
        const rate = violations / total;
        if (rate >= 0.5) { // 50% or more have violations
          patterns.push({
            pattern: 'region',
            description: `${region} region has a high violation rate (${(rate * 100).toFixed(1)}%)`,
            count: violations
          });
        }
      }
    });
    
    // Check for year built patterns
    const yearBuiltRanges = {
      'pre_1950': { violations: 0, total: 0 },
      '1950_1979': { violations: 0, total: 0 },
      '1980_1999': { violations: 0, total: 0 },
      '2000_present': { violations: 0, total: 0 }
    };
    
    // Count assessments by year range
    assessments.forEach(a => {
      let range;
      if (a.yearBuilt < 1950) {
        range = 'pre_1950';
      } else if (a.yearBuilt < 1980) {
        range = '1950_1979';
      } else if (a.yearBuilt < 2000) {
        range = '1980_1999';
      } else {
        range = '2000_present';
      }
      
      yearBuiltRanges[range].total++;
      
      if (violationPropertyIds.has(a.id)) {
        yearBuiltRanges[range].violations++;
      }
    });
    
    // Identify year ranges with high violation rates
    Object.entries(yearBuiltRanges).forEach(([range, { violations, total }]) => {
      if (total >= 5) { // Only consider ranges with enough samples
        const rate = violations / total;
        if (rate >= 0.5) { // 50% or more have violations
          let rangeLabel;
          switch (range) {
            case 'pre_1950': rangeLabel = 'Pre-1950'; break;
            case '1950_1979': rangeLabel = '1950-1979'; break;
            case '1980_1999': rangeLabel = '1980-1999'; break;
            case '2000_present': rangeLabel = '2000-present'; break;
          }
          
          patterns.push({
            pattern: 'year_built',
            description: `${rangeLabel} buildings have a high violation rate (${(rate * 100).toFixed(1)}%)`,
            count: violations
          });
        }
      }
    });
    
    return patterns;
  }

  /**
   * Generate quality recommendations based on metrics and violations
   */
  private generateQualityRecommendations(
    metrics: Record<string, any>,
    violationSummary: Record<string, any>
  ): Array<{ recommendation: string; priority: 'low' | 'medium' | 'high'; details?: string }> {
    const recommendations = [];
    
    // Check for high violation rate
    if (metrics.violations.violationRate > 0.3) {
      recommendations.push({
        recommendation: 'Review assessment methodology',
        priority: metrics.violations.violationRate > 0.5 ? 'high' : 'medium',
        details: `High violation rate of ${(metrics.violations.violationRate * 100).toFixed(1)}% indicates systemic issues with the assessment process.`
      });
    }
    
    // Check for critical violations
    if (metrics.violations.bySeverity.critical > 0) {
      recommendations.push({
        recommendation: 'Address critical violations',
        priority: 'high',
        details: `${metrics.violations.bySeverity.critical} critical violations require immediate attention.`
      });
    }
    
    // Check for high coefficient of variation
    for (const [type, cv] of Object.entries(metrics.consistency.coefficientOfVariation)) {
      if (cv > 30) { // 30% variation is high
        recommendations.push({
          recommendation: `Review ${type} assessment consistency`,
          priority: cv > 50 ? 'high' : 'medium',
          details: `High coefficient of variation (${cv.toFixed(1)}%) indicates inconsistent assessments for ${type} buildings.`
        });
      }
    }
    
    // Check for patterns in violations
    violationSummary.patterns.forEach(pattern => {
      recommendations.push({
        recommendation: `Investigate ${pattern.pattern} pattern`,
        priority: pattern.count > 10 ? 'high' : 'medium',
        details: pattern.description
      });
    });
    
    // Check for rules with high violation counts
    violationSummary.ruleGroups.forEach((group: any) => {
      if (group.count > 10 && group.bySeverity.critical + group.bySeverity.warning > 5) {
        recommendations.push({
          recommendation: `Review rule: ${group.ruleName}`,
          priority: group.bySeverity.critical > 5 ? 'high' : 'medium',
          details: `High violation count (${group.count}) for this rule may indicate systemic issues.`
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Load benchmark rules from data source (simulation)
   */
  private async loadBenchmarkRules(): Promise<void> {
    // Simulate loading rules from database or file
    const sampleRules: BenchmarkRule[] = [
      {
        id: 'rule_value_range',
        name: 'Property Value Range',
        description: 'Checks if total property value is within expected range for the building type',
        enabled: true,
        type: 'range',
        parameters: {
          property: 'totalValue',
          min: 50000,
          max: 5000000
        },
        severity: 'warning'
      },
      {
        id: 'rule_land_to_total_ratio',
        name: 'Land to Total Value Ratio',
        description: 'Checks if the ratio of land value to total value is within expected range',
        enabled: true,
        type: 'ratio',
        parameters: {
          numerator: 'landValue',
          denominator: 'totalValue',
          minRatio: 0.1,
          maxRatio: 0.8
        },
        severity: 'warning'
      },
      {
        id: 'rule_value_per_sqft',
        name: 'Value per Square Foot',
        description: 'Checks if the value per square foot is consistent with benchmarks',
        enabled: true,
        type: 'comparison',
        parameters: {
          property: 'valuePerSqFt',
          benchmark: 'type_avg_value_per_sqft',
          tolerance: 0.25  // 25% tolerance
        },
        severity: 'warning'
      },
      {
        id: 'rule_age_factor',
        name: 'Age-Based Depreciation',
        description: 'Checks if depreciation based on building age is appropriate',
        enabled: true,
        type: 'comparison',
        parameters: {
          property: 'ageFactor',
          benchmark: 'expected_age_factor',
          tolerance: 0.15  // 15% tolerance
        },
        severity: 'info'
      },
      {
        id: 'rule_statistical_outlier',
        name: 'Statistical Outlier Detection',
        description: 'Checks if assessment is a statistical outlier compared to similar properties',
        enabled: true,
        type: 'statistical',
        parameters: {
          property: 'totalValue',
          method: 'zscore',
          threshold: 2.5
        },
        severity: 'warning'
      },
      {
        id: 'rule_improvement_to_land_ratio',
        name: 'Improvement to Land Ratio',
        description: 'Checks if the ratio of improvement value to land value is within expected range',
        enabled: true,
        type: 'ratio',
        parameters: {
          numerator: 'improvementValue',
          denominator: 'landValue',
          minRatio: 0.5,
          maxRatio: 10.0
        },
        severity: 'warning'
      },
      {
        id: 'rule_quality_consistency',
        name: 'Quality Rating Consistency',
        description: 'Checks if value is consistent with quality rating',
        enabled: true,
        type: 'statistical',
        parameters: {
          property: 'valuePerSqFt',
          method: 'percentile',
          minPercentile: 0.1,
          maxPercentile: 0.9
        },
        severity: 'warning'
      }
    ];
    
    // Store in map
    sampleRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Load benchmark data from data source (simulation)
   */
  private async loadBenchmarkData(): Promise<void> {
    // Simulate loading benchmark data from database or file
    const sampleBenchmarkData = {
      // Average value per square foot by building type
      'type_avg_value_per_sqft': {
        'single_family': 185,
        'multi_family': 155,
        'commercial': 210,
        'industrial': 95,
        'agricultural': 45
      },
      
      // Expected age factor by decade
      'expected_age_factor': {
        '2020': 1.0,
        '2010': 0.95,
        '2000': 0.9,
        '1990': 0.85,
        '1980': 0.8,
        '1970': 0.75,
        '1960': 0.7,
        '1950': 0.65,
        'pre_1950': 0.6
      },
      
      // Regional adjustment factors
      'regional_factors': {
        'BENTON': 1.05,
        'KING': 1.25,
        'SPOKANE': 0.92,
        'PIERCE': 1.1,
        'SNOHOMISH': 1.15
      }
    };
    
    // Store in map
    for (const [key, value] of Object.entries(sampleBenchmarkData)) {
      this.benchmarkData.set(key, value);
    }
  }

  /**
   * Get a property value, handling derived properties
   */
  private getPropertyValue(
    assessment: PropertyAssessment,
    property: string
  ): number {
    // Handle direct properties
    if (property in assessment) {
      return (assessment as any)[property];
    }
    
    // Handle derived properties
    switch (property) {
      case 'valuePerSqFt':
        return assessment.totalValue / assessment.buildingSize;
        
      case 'landValuePerSqFt':
        return assessment.landValue / assessment.buildingSize;
        
      case 'improvementValuePerSqFt':
        return assessment.improvementValue / assessment.buildingSize;
        
      case 'landToTotalRatio':
        return assessment.landValue / assessment.totalValue;
        
      case 'improvementToLandRatio':
        return assessment.improvementValue / assessment.landValue;
        
      case 'ageFactor':
        return this.calculateAgeFactor(assessment.yearBuilt);
        
      default:
        console.warn(`Unknown property: ${property}`);
        return 0;
    }
  }

  /**
   * Get a benchmark value for a specific assessment
   */
  private getBenchmarkValue(
    assessment: PropertyAssessment,
    benchmark: string
  ): number | null {
    switch (benchmark) {
      case 'type_avg_value_per_sqft': {
        const benchmarks = this.benchmarkData.get('type_avg_value_per_sqft');
        return benchmarks?.[assessment.buildingType] || null;
      }
      
      case 'expected_age_factor': {
        const benchmarks = this.benchmarkData.get('expected_age_factor');
        if (!benchmarks) return null;
        
        // Find the appropriate decade
        let decade;
        if (assessment.yearBuilt >= 2020) {
          decade = '2020';
        } else if (assessment.yearBuilt >= 2010) {
          decade = '2010';
        } else if (assessment.yearBuilt >= 2000) {
          decade = '2000';
        } else if (assessment.yearBuilt >= 1990) {
          decade = '1990';
        } else if (assessment.yearBuilt >= 1980) {
          decade = '1980';
        } else if (assessment.yearBuilt >= 1970) {
          decade = '1970';
        } else if (assessment.yearBuilt >= 1960) {
          decade = '1960';
        } else if (assessment.yearBuilt >= 1950) {
          decade = '1950';
        } else {
          decade = 'pre_1950';
        }
        
        return benchmarks[decade] || null;
      }
      
      case 'regional_factor': {
        const benchmarks = this.benchmarkData.get('regional_factors');
        return benchmarks?.[assessment.region] || null;
      }
      
      default:
        return null;
    }
  }

  /**
   * Calculate age factor based on year built
   */
  private calculateAgeFactor(yearBuilt: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - yearBuilt;
    
    // Simple linear depreciation with floor
    // 1% per year, minimum 50% of original value
    return Math.max(0.5, 1 - (age * 0.01));
  }

  /**
   * Calculate median of an array of numbers
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }
}