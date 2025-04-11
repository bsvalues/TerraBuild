/**
 * Data Quality Agent for Model Content Protocol
 * 
 * This agent is responsible for validating and enhancing property data quality
 * through automated checks and analysis. It implements the Benton County Assessor's
 * requirements for property data validation.
 */

import { FunctionResponse } from '../schemas/types';
import { BaseAgent, AgentEventType } from './baseAgent';
import { DataQualityValidator, allPropertyRules, costMatrixRules, RuleType } from '../../data-quality';

// Create a data quality validator instance
const dataQualityFramework = new DataQualityValidator([...allPropertyRules, ...costMatrixRules]);

// Types for data validation
interface DataQualityValidationRequest {
  entityType: 'property' | 'cost_matrix' | 'improvement' | 'land';
  data: any;
  context?: Record<string, any>;
}

interface DataQualityRuleMatch {
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  location?: string; // Path to the field with issue
  value?: any; // Problematic value
  suggestions?: any[]; // Suggested fixes
}

interface DataQualityRecommendation {
  field: string;
  currentValue: any;
  suggestedValue: any;
  confidence: number;
  reason: string;
}

/**
 * Data Quality Agent Class
 * Implements MCP agent for validating and improving data quality
 */
export class DataQualityAgent extends BaseAgent {
  /**
   * Create a new Data Quality Agent
   */
  constructor() {
    super(
      'data-quality-agent',
      'Data Quality Agent',
      'Validates and enhances property data quality through automated checks',
      [
        'validateData',
        'analyzeDataQuality',
        'recommendImprovements',
        'standardizePropertyData'
      ],
      ['READ_PROPERTY_DATA', 'SUGGEST_CHANGES']
    );
  }
  
  /**
   * Initialize this agent
   */
  public async initialize(): Promise<void> {
    await super.initialize();
    
    // Subscribe to specific events of interest
    this.addEventListener(AgentEventType.DATA_AVAILABLE, this.handleDataAvailable.bind(this));
    this.addEventListener(AgentEventType.REQUEST_ASSISTANCE, this.handleAssistanceRequest.bind(this));
    
    // Register with the data quality framework
    try {
      // This would register the agent with any data quality middlewares
      console.log(`Data Quality Agent registered with quality framework`);
    } catch (error) {
      console.error('Error registering Data Quality Agent:', error);
    }
  }
  
  /**
   * Handle data available events
   */
  private async handleDataAvailable(event: any): Promise<void> {
    const { entityType, data } = event.payload;
    
    console.log(`Data Quality Agent received ${entityType} data`);
    
    // Auto-validate incoming data if configured to do so
    if (this.state.context && this.state.context.autoValidate) {
      await this.validateData({ entityType, data });
    }
  }
  
  /**
   * Handle assistance requests from other agents
   */
  private async handleAssistanceRequest(event: any): Promise<void> {
    const { requestType, data } = event.payload;
    
    console.log(`Data Quality Agent received assistance request: ${requestType}`);
    
    if (requestType === 'validate_data') {
      const validationResult = await this.validateData(data);
      
      // Respond with validation results
      await this.emitEvent({
        type: AgentEventType.PROVIDE_FEEDBACK,
        sourceAgentId: this.definition.id,
        targetAgentId: event.sourceAgentId,
        timestamp: new Date(),
        correlationId: event.correlationId,
        payload: {
          responseType: 'validation_results',
          results: validationResult.data
        }
      });
    }
  }
  
  /**
   * Validate data against rules
   * 
   * @param request The validation request
   * @returns Function response with validation results
   */
  public async validateData(request: DataQualityValidationRequest): Promise<FunctionResponse> {
    console.log(`Data Quality Agent: Validating ${request.entityType} data`);
    
    // Update agent state
    this.updateState({
      currentTask: 'data_validation',
      entityType: request.entityType,
      dataSnapshot: typeof request.data === 'object' ? 
        { 
          id: request.data.id || request.data.propId, 
          type: request.entityType 
        } : 
        { type: request.entityType }
    });
    
    try {
      // Map entity type to RuleType
      let ruleType: RuleType;
      
      switch (request.entityType) {
        case 'property':
          ruleType = RuleType.PROPERTY;
          break;
        case 'cost_matrix':
          ruleType = RuleType.COST_MATRIX;
          break;
        case 'improvement':
          ruleType = RuleType.IMPROVEMENT;
          break;
        case 'land':
          ruleType = RuleType.LAND_DETAIL;
          break;
        default:
          return {
            success: false,
            error: `Unsupported entity type: ${request.entityType}`
          };
      }
      
      // Validate the data using the framework
      const validationReport = dataQualityFramework.validate(request.data, ruleType, request.context);
      
      // Extract validation statistics using toJSON() which returns the summary
      const validationResults = validationReport.toJSON();
      const { summary } = validationResults;
      
      // Record validation in memory
      this.recordMemory({
        type: 'data_validation',
        timestamp: new Date(),
        input: {
          entityType: request.entityType,
          dataId: request.data.id || request.data.propId || 'unknown'
        },
        output: {
          passed: validationResults.passedRecords === validationResults.totalRecords,
          errorCount: validationResults.errors,
          warningCount: validationResults.warnings
        },
        tags: ['validation', request.entityType]
      });
      
      // Create the response
      const response: FunctionResponse = {
        success: true,
        data: {
          validated: true,
          entityType: request.entityType,
          dataId: request.data.id || request.data.propId || 'unknown',
          passed: validationResults.passedRecords === validationResults.totalRecords,
          errorCount: validationResults.errors,
          warningCount: validationResults.warnings,
          criticalCount: validationResults.criticalErrors,
          infoCount: validationResults.infoMessages,
          totalRules: validationResults.totalRules,
          ruleResults: validationResults.ruleStats.map((stat: { 
            ruleId: string;
            passed: boolean;
            severity: string;
            message?: string;
            details?: any;
          }) => ({
            ruleId: stat.ruleId,
            passed: stat.passed,
            severity: stat.severity,
            message: stat.message,
            details: stat.details
          }))
        }
      };
      
      // Emit insights if there are issues
      if (validationResults.errors > 0 || validationResults.criticalErrors > 0) {
        this.emitEvent({
          type: AgentEventType.INSIGHT_GENERATED,
          sourceAgentId: this.definition.id,
          timestamp: new Date(),
          payload: {
            insightType: 'data_quality_issues',
            entityType: request.entityType,
            dataId: request.data.id || request.data.propId || 'unknown',
            severity: validationResults.criticalErrors > 0 ? 'CRITICAL' : 'HIGH',
            summary: `Found ${validationResults.errors + validationResults.criticalErrors} issues in ${request.entityType} data`,
            details: {
              criticalIssues: validationResults.criticalErrors,
              errors: validationResults.errors,
              warnings: validationResults.warnings
            }
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error(`Error validating ${request.entityType} data:`, error);
      
      return {
        success: false,
        error: `Error validating data: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Analyze data quality metrics and patterns
   * 
   * @param dataSet The dataset to analyze
   * @returns Function response with analysis results
   */
  public async analyzeDataQuality(dataSet: {
    entityType: string;
    records: any[];
    context?: Record<string, any>;
  }): Promise<FunctionResponse> {
    console.log(`Data Quality Agent: Analyzing data quality for ${dataSet.entityType}`);
    
    // Update agent state
    this.updateState({
      currentTask: 'data_quality_analysis',
      entityType: dataSet.entityType,
      recordCount: dataSet.records.length
    });
    
    try {
      // Track validation counts
      let totalRecords = dataSet.records.length;
      let validRecords = 0;
      let invalidRecords = 0;
      let criticalIssues = 0;
      let totalErrors = 0;
      let totalWarnings = 0;
      
      // Collect field-level statistics
      const fieldStats: Record<string, {
        nullCount: number;
        emptyCount: number;
        invalidCount: number;
        validCount: number;
        totalCount: number;
      }> = {};
      
      // Validate each record
      for (const record of dataSet.records) {
        // Map entity type to RuleType
        const ruleType = dataSet.entityType === 'cost_matrix' ? 
          RuleType.COST_MATRIX : 
          dataSet.entityType === 'improvement' ? 
            RuleType.IMPROVEMENT : 
            dataSet.entityType === 'land' ? 
              RuleType.LAND_DETAIL : 
              RuleType.PROPERTY;
        
        // Validate the record
        const validationReport = dataQualityFramework.validate(record, ruleType, dataSet.context);
        const result = validationReport.toJSON();
        const { summary } = result;
        
        // Update counts
        if (result.passedRecords === result.totalRecords) {
          validRecords++;
        } else {
          invalidRecords++;
        }
        
        criticalIssues += result.criticalErrors;
        totalErrors += result.errors;
        totalWarnings += result.warnings;
        
        // Update field statistics
        if (record && typeof record === 'object') {
          for (const [key, value] of Object.entries(record)) {
            if (!fieldStats[key]) {
              fieldStats[key] = {
                nullCount: 0,
                emptyCount: 0,
                invalidCount: 0,
                validCount: 0,
                totalCount: 0
              };
            }
            
            fieldStats[key].totalCount++;
            
            if (value === null) {
              fieldStats[key].nullCount++;
            } else if (value === '') {
              fieldStats[key].emptyCount++;
            } else if (
              // Check if this field had validation issues
              result.ruleStats.some((rule: {
                passed: boolean;
                details?: { field?: string };
              }) => 
                rule.passed === false && 
                rule.details && 
                rule.details.field === key
              )
            ) {
              fieldStats[key].invalidCount++;
            } else {
              fieldStats[key].validCount++;
            }
          }
        }
      }
      
      // Generate field quality scores (0-100)
      const fieldQualityScores = Object.entries(fieldStats).map(([field, stats]) => {
        const qualityScore = Math.round((stats.validCount / stats.totalCount) * 100);
        return {
          field,
          qualityScore,
          nullPercentage: Math.round((stats.nullCount / stats.totalCount) * 100),
          emptyPercentage: Math.round((stats.emptyCount / stats.totalCount) * 100),
          invalidPercentage: Math.round((stats.invalidCount / stats.totalCount) * 100),
          completeness: Math.round(((stats.totalCount - stats.nullCount - stats.emptyCount) / stats.totalCount) * 100)
        };
      });
      
      // Sort fields by quality score (ascending - worst first)
      fieldQualityScores.sort((a, b) => a.qualityScore - b.qualityScore);
      
      // Identify problematic fields (quality score < 90)
      const problematicFields = fieldQualityScores
        .filter(field => field.qualityScore < 90)
        .map(field => field.field);
      
      // Overall data quality score
      const overallQualityScore = Math.round((validRecords / totalRecords) * 100);
      
      // Record analysis in memory
      this.recordMemory({
        type: 'data_quality_analysis',
        timestamp: new Date(),
        input: {
          entityType: dataSet.entityType,
          recordCount: totalRecords
        },
        output: {
          overallQualityScore,
          validPercentage: Math.round((validRecords / totalRecords) * 100),
          problematicFieldCount: problematicFields.length
        },
        tags: ['analysis', dataSet.entityType]
      });
      
      // Emit insight about data quality
      await this.emitEvent({
        type: AgentEventType.INSIGHT_GENERATED,
        sourceAgentId: this.definition.id,
        timestamp: new Date(),
        payload: {
          insightType: 'data_quality_analysis',
          entityType: dataSet.entityType,
          severity: overallQualityScore < 70 ? 'HIGH' : overallQualityScore < 90 ? 'MEDIUM' : 'LOW',
          summary: `Overall data quality score: ${overallQualityScore}/100 for ${dataSet.entityType}`,
          details: {
            totalRecords,
            validRecords,
            invalidRecords,
            criticalIssues,
            problematicFields: problematicFields.slice(0, 5) // Top 5 worst fields
          }
        }
      });
      
      return {
        success: true,
        data: {
          entityType: dataSet.entityType,
          overallQualityScore,
          recordStats: {
            total: totalRecords,
            valid: validRecords,
            invalid: invalidRecords,
            validPercentage: Math.round((validRecords / totalRecords) * 100)
          },
          issueStats: {
            criticalIssues,
            errors: totalErrors,
            warnings: totalWarnings,
            issuesPerRecord: totalRecords > 0 ? 
              ((criticalIssues + totalErrors) / totalRecords).toFixed(2) : 0
          },
          fieldQualityScores,
          problematicFields,
          recommendedActions: problematicFields.length > 0 ? [
            'Run data standardization on problematic fields',
            'Review validation rules for potential updates',
            'Consider data enrichment for incomplete fields'
          ] : []
        }
      };
    } catch (error) {
      console.error(`Error analyzing data quality:`, error);
      
      return {
        success: false,
        error: `Error analyzing data quality: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Recommend improvements to data quality
   * 
   * @param request The recommendation request
   * @returns Function response with recommended improvements
   */
  public async recommendImprovements(request: {
    entityType: string;
    data: any;
    context?: Record<string, any>;
  }): Promise<FunctionResponse> {
    console.log(`Data Quality Agent: Recommending improvements for ${request.entityType} data`);
    
    // Update agent state
    this.updateState({
      currentTask: 'recommend_improvements',
      entityType: request.entityType,
      dataId: request.data.id || request.data.propId || 'unknown'
    });
    
    try {
      // First, validate the data to identify issues
      const validationResponse = await this.validateData({
        entityType: request.entityType as any,
        data: request.data,
        context: request.context
      });
      
      if (!validationResponse.success) {
        return validationResponse;
      }
      
      const validationResult = validationResponse.data;
      
      // Generate recommendations based on validation results
      const recommendations: DataQualityRecommendation[] = [];
      
      // Process each rule result to generate recommendations
      for (const ruleResult of validationResult.ruleResults) {
        if (!ruleResult.passed) {
          // Skip rules without details or location
          if (!ruleResult.details || !ruleResult.details.field) {
            continue;
          }
          
          const field = ruleResult.details.field;
          const currentValue = request.data[field];
          
          // Generate a recommendation based on the rule type
          switch (ruleResult.ruleId) {
            case 'missing_required_field':
            case 'empty_required_field':
              // Can't recommend specific value for missing fields
              break;
              
            case 'invalid_format':
              if (ruleResult.details.expectedFormat) {
                let suggestedValue = currentValue;
                
                // Attempt to format based on expected format
                if (ruleResult.details.expectedFormat === 'date') {
                  // Try to parse and format date
                  const date = new Date(currentValue);
                  if (!isNaN(date.getTime())) {
                    suggestedValue = date.toISOString().split('T')[0];
                  }
                } else if (ruleResult.details.expectedFormat === 'number') {
                  // Try to extract numeric value
                  const number = parseFloat(currentValue);
                  if (!isNaN(number)) {
                    suggestedValue = number;
                  }
                } else if (ruleResult.details.expectedFormat === 'boolean') {
                  // Convert various values to boolean
                  suggestedValue = 
                    ['yes', 'true', 'y', '1', 't'].includes(String(currentValue).toLowerCase()) ? true :
                    ['no', 'false', 'n', '0', 'f'].includes(String(currentValue).toLowerCase()) ? false :
                    null;
                }
                
                if (suggestedValue !== currentValue) {
                  recommendations.push({
                    field,
                    currentValue,
                    suggestedValue,
                    confidence: 0.8,
                    reason: `Reformatted to match expected ${ruleResult.details.expectedFormat} format`
                  });
                }
              }
              break;
              
            case 'value_out_of_range':
              if (ruleResult.details.min !== undefined && currentValue < ruleResult.details.min) {
                recommendations.push({
                  field,
                  currentValue,
                  suggestedValue: ruleResult.details.min,
                  confidence: 0.7,
                  reason: `Value is below minimum allowed (${ruleResult.details.min})`
                });
              } else if (ruleResult.details.max !== undefined && currentValue > ruleResult.details.max) {
                recommendations.push({
                  field,
                  currentValue,
                  suggestedValue: ruleResult.details.max,
                  confidence: 0.7,
                  reason: `Value is above maximum allowed (${ruleResult.details.max})`
                });
              }
              break;
              
            case 'invalid_value':
              if (ruleResult.details.allowedValues && ruleResult.details.allowedValues.length > 0) {
                // Find closest matching value
                const closestMatch = this.findClosestMatch(
                  currentValue, 
                  ruleResult.details.allowedValues
                );
                
                if (closestMatch) {
                  recommendations.push({
                    field,
                    currentValue,
                    suggestedValue: closestMatch.value,
                    confidence: closestMatch.similarity,
                    reason: `Changed to closest allowed value`
                  });
                }
              }
              break;
              
            // Add more rule-specific recommendation logic as needed
          }
        }
      }
      
      // Now handle field standardization (beyond just fixing errors)
      const standardizationRecommendations = this.generateStandardizationRecommendations(
        request.entityType,
        request.data
      );
      
      // Combine all recommendations, removing duplicates for the same field
      const allRecommendations = [
        ...recommendations,
        ...standardizationRecommendations
      ];
      
      // Remove duplicates by field (keep highest confidence)
      const fieldMap = new Map<string, DataQualityRecommendation>();
      allRecommendations.forEach(rec => {
        if (!fieldMap.has(rec.field) || fieldMap.get(rec.field)!.confidence < rec.confidence) {
          fieldMap.set(rec.field, rec);
        }
      });
      
      const finalRecommendations = Array.from(fieldMap.values());
      
      // Calculate impact score (how much would these recommendations improve data quality)
      const impactScore = Math.min(
        100,
        Math.round((finalRecommendations.length / Object.keys(request.data).length) * 100)
      );
      
      // Record recommendations in memory
      this.recordMemory({
        type: 'improvement_recommendations',
        timestamp: new Date(),
        input: {
          entityType: request.entityType,
          dataId: request.data.id || request.data.propId || 'unknown'
        },
        output: {
          recommendationCount: finalRecommendations.length,
          impactScore
        },
        tags: ['recommendations', request.entityType]
      });
      
      return {
        success: true,
        data: {
          entityType: request.entityType,
          dataId: request.data.id || request.data.propId || 'unknown',
          recommendationCount: finalRecommendations.length,
          impactScore,
          recommendations: finalRecommendations
        }
      };
    } catch (error) {
      console.error(`Error generating improvement recommendations:`, error);
      
      return {
        success: false,
        error: `Error generating recommendations: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Standardize property data based on Benton County standards
   * 
   * @param data The property data to standardize
   * @returns Function response with standardized data
   */
  public async standardizePropertyData(data: {
    entityType: string;
    data: any;
    fieldsToStandardize?: string[];
    context?: Record<string, any>;
  }): Promise<FunctionResponse> {
    console.log(`Data Quality Agent: Standardizing ${data.entityType} data`);
    
    // Update agent state
    this.updateState({
      currentTask: 'standardize_data',
      entityType: data.entityType,
      dataId: data.data.id || data.data.propId || 'unknown'
    });
    
    try {
      // Clone the data to avoid modifying the original
      const standardizedData = { ...data.data };
      const fieldsToStandardize = data.fieldsToStandardize || Object.keys(standardizedData);
      const standardizationActions: Array<{
        field: string;
        originalValue: any;
        standardizedValue: any;
        action: string;
      }> = [];
      
      // Apply entity-specific standardization rules
      switch (data.entityType) {
        case 'property':
          // Standardize property-specific fields
          for (const field of fieldsToStandardize) {
            if (!standardizedData.hasOwnProperty(field)) continue;
            
            const originalValue = standardizedData[field];
            let standardizedValue = originalValue;
            let action = '';
            
            switch (field) {
              case 'propId':
                // Ensure propId is a string with consistent formatting
                if (standardizedValue !== null && standardizedValue !== undefined) {
                  standardizedValue = String(standardizedValue).trim();
                  action = 'Formatted as string';
                }
                break;
                
              case 'address':
                // Standardize address format
                if (typeof standardizedValue === 'string') {
                  standardizedValue = this.standardizeAddress(standardizedValue);
                  action = 'Standardized address format';
                }
                break;
                
              case 'region':
                // Standardize region names
                if (typeof standardizedValue === 'string') {
                  standardizedValue = this.standardizeRegion(standardizedValue);
                  action = 'Standardized region name';
                }
                break;
                
              case 'yearBuilt':
                // Ensure yearBuilt is a number and within reasonable range
                if (standardizedValue !== null && standardizedValue !== undefined) {
                  const year = parseInt(standardizedValue);
                  if (!isNaN(year)) {
                    const currentYear = new Date().getFullYear();
                    if (year > currentYear) {
                      standardizedValue = currentYear;
                      action = 'Adjusted future year to current year';
                    } else if (year < 1800) {
                      // Benton County wasn't established before 1800
                      standardizedValue = 1800;
                      action = 'Adjusted implausible year to minimum valid year';
                    } else {
                      standardizedValue = year;
                      action = 'Converted to number';
                    }
                  }
                }
                break;
                
              case 'condition':
                // Standardize condition values
                if (typeof standardizedValue === 'string') {
                  const conditions = ['EXCELLENT', 'GOOD', 'AVERAGE', 'FAIR', 'POOR'];
                  const match = this.findClosestMatch(standardizedValue, conditions);
                  if (match && match.similarity > 0.7) {
                    standardizedValue = match.value;
                    action = 'Standardized condition value';
                  }
                }
                break;
                
              // Add more field-specific standardization rules
            }
            
            // Record standardization action if the value changed
            if (standardizedValue !== originalValue) {
              standardizedData[field] = standardizedValue;
              standardizationActions.push({
                field,
                originalValue,
                standardizedValue,
                action
              });
            }
          }
          break;
          
        case 'cost_matrix':
          // Standardize cost matrix fields
          for (const field of fieldsToStandardize) {
            if (!standardizedData.hasOwnProperty(field)) continue;
            
            const originalValue = standardizedData[field];
            let standardizedValue = originalValue;
            let action = '';
            
            switch (field) {
              case 'region':
                // Standardize region names
                if (typeof standardizedValue === 'string') {
                  standardizedValue = this.standardizeRegion(standardizedValue);
                  action = 'Standardized region name';
                }
                break;
                
              case 'buildingType':
                // Standardize building type codes
                if (typeof standardizedValue === 'string') {
                  standardizedValue = standardizedValue.toUpperCase().trim();
                  action = 'Formatted to uppercase';
                }
                break;
                
              case 'quality':
                // Standardize quality values
                if (typeof standardizedValue === 'string') {
                  const qualities = ['LOW', 'AVERAGE', 'GOOD', 'HIGH', 'PREMIUM'];
                  const match = this.findClosestMatch(standardizedValue, qualities);
                  if (match && match.similarity > 0.7) {
                    standardizedValue = match.value;
                    action = 'Standardized quality value';
                  }
                }
                break;
                
              // Add more field-specific standardization rules
            }
            
            // Record standardization action if the value changed
            if (standardizedValue !== originalValue) {
              standardizedData[field] = standardizedValue;
              standardizationActions.push({
                field,
                originalValue,
                standardizedValue,
                action
              });
            }
          }
          break;
          
        // Add more entity types as needed
      }
      
      // Calculate standardization impact score
      const impactScore = Math.min(
        100,
        Math.round((standardizationActions.length / fieldsToStandardize.length) * 100)
      );
      
      // Record standardization in memory
      this.recordMemory({
        type: 'data_standardization',
        timestamp: new Date(),
        input: {
          entityType: data.entityType,
          dataId: standardizedData.id || standardizedData.propId || 'unknown'
        },
        output: {
          standardizationCount: standardizationActions.length,
          impactScore
        },
        tags: ['standardization', data.entityType]
      });
      
      return {
        success: true,
        data: {
          entityType: data.entityType,
          dataId: standardizedData.id || standardizedData.propId || 'unknown',
          standardizedData,
          standardizationActions,
          fieldsStandardized: standardizationActions.length,
          fieldsProcessed: fieldsToStandardize.length,
          impactScore
        }
      };
    } catch (error) {
      console.error(`Error standardizing ${data.entityType} data:`, error);
      
      return {
        success: false,
        error: `Error standardizing data: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Generate standardization recommendations (beyond just fixing errors)
   * 
   * @param entityType Type of entity
   * @param data The data to analyze
   * @returns Array of recommendations
   */
  private generateStandardizationRecommendations(
    entityType: string,
    data: any
  ): DataQualityRecommendation[] {
    const recommendations: DataQualityRecommendation[] = [];
    
    if (!data || typeof data !== 'object') {
      return recommendations;
    }
    
    // Entity-specific standardization recommendations
    switch (entityType) {
      case 'property':
        // Check address standardization
        if (data.address && typeof data.address === 'string') {
          const standardized = this.standardizeAddress(data.address);
          if (standardized !== data.address) {
            recommendations.push({
              field: 'address',
              currentValue: data.address,
              suggestedValue: standardized,
              confidence: 0.85,
              reason: 'Standardized address format'
            });
          }
        }
        
        // Check region standardization
        if (data.region && typeof data.region === 'string') {
          const standardized = this.standardizeRegion(data.region);
          if (standardized !== data.region) {
            recommendations.push({
              field: 'region',
              currentValue: data.region,
              suggestedValue: standardized,
              confidence: 0.9,
              reason: 'Standardized region name'
            });
          }
        }
        
        // Add more property standardization checks
        break;
        
      case 'cost_matrix':
        // Check region standardization
        if (data.region && typeof data.region === 'string') {
          const standardized = this.standardizeRegion(data.region);
          if (standardized !== data.region) {
            recommendations.push({
              field: 'region',
              currentValue: data.region,
              suggestedValue: standardized,
              confidence: 0.9,
              reason: 'Standardized region name'
            });
          }
        }
        
        // Add more cost matrix standardization checks
        break;
        
      // Add more entity types as needed
    }
    
    return recommendations;
  }
  
  /**
   * Standardize address format
   * 
   * @param address The address to standardize
   * @returns Standardized address
   */
  private standardizeAddress(address: string): string {
    if (!address) return address;
    
    let standardized = address.trim();
    
    // Replace multiple spaces with a single space
    standardized = standardized.replace(/\s+/g, ' ');
    
    // Standardize common abbreviations
    const abbreviations: Record<string, string> = {
      'ST\\.': 'ST',
      'ST$': 'STREET',
      'RD\\.': 'RD',
      'RD$': 'ROAD',
      'AVE\\.': 'AVE',
      'AVE$': 'AVENUE',
      'BLVD\\.': 'BLVD',
      'BLVD$': 'BOULEVARD',
      'DR\\.': 'DR',
      'DR$': 'DRIVE',
      'LN\\.': 'LN',
      'LN$': 'LANE',
      'CT\\.': 'CT',
      'CT$': 'COURT',
      'N\\.': 'N',
      'N$': 'NORTH',
      'S\\.': 'S',
      'S$': 'SOUTH',
      'E\\.': 'E',
      'E$': 'EAST',
      'W\\.': 'W',
      'W$': 'WEST'
    };
    
    for (const [pattern, replacement] of Object.entries(abbreviations)) {
      const regex = new RegExp(pattern, 'i');
      standardized = standardized.replace(regex, replacement);
    }
    
    return standardized;
  }
  
  /**
   * Standardize region names
   * 
   * @param region The region name to standardize
   * @returns Standardized region name
   */
  private standardizeRegion(region: string): string {
    if (!region) return region;
    
    const regionMap: Record<string, string> = {
      'EAST': 'EASTERN',
      'EASTERN WASHINGTON': 'EASTERN',
      'E WASHINGTON': 'EASTERN',
      'E. WASHINGTON': 'EASTERN',
      'EAST WA': 'EASTERN',
      
      'WEST': 'WESTERN',
      'WESTERN WASHINGTON': 'WESTERN',
      'W WASHINGTON': 'WESTERN',
      'W. WASHINGTON': 'WESTERN',
      'WEST WA': 'WESTERN',
      
      'CENTRAL': 'CENTRAL',
      'CENTRAL WASHINGTON': 'CENTRAL',
      'C WASHINGTON': 'CENTRAL',
      'C. WASHINGTON': 'CENTRAL',
      'CENTRAL WA': 'CENTRAL'
    };
    
    const standardized = region.trim().toUpperCase();
    return regionMap[standardized] || standardized;
  }
  
  /**
   * Find the closest matching value from a list of allowed values
   * 
   * @param value The value to match
   * @param allowedValues Array of allowed values
   * @returns The closest match and similarity score
   */
  private findClosestMatch(value: any, allowedValues: any[]): {value: any, similarity: number} | null {
    if (!value || !allowedValues || allowedValues.length === 0) {
      return null;
    }
    
    // Convert to string for comparison
    const stringValue = String(value).toUpperCase().trim();
    
    let bestMatch = null;
    let highestSimilarity = 0;
    
    for (const allowedValue of allowedValues) {
      const allowedString = String(allowedValue).toUpperCase().trim();
      
      // Calculate similarity
      let similarity = 0;
      
      if (stringValue === allowedString) {
        // Exact match
        similarity = 1.0;
      } else if (allowedString.includes(stringValue) || stringValue.includes(allowedString)) {
        // Substring match
        const longerLength = Math.max(stringValue.length, allowedString.length);
        const shorterLength = Math.min(stringValue.length, allowedString.length);
        similarity = shorterLength / longerLength;
      } else {
        // Levenshtein distance for more complex cases
        const distance = this.levenshteinDistance(stringValue, allowedString);
        const maxLength = Math.max(stringValue.length, allowedString.length);
        similarity = 1 - (distance / maxLength);
      }
      
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = allowedValue;
      }
    }
    
    return bestMatch !== null ? { value: bestMatch, similarity: highestSimilarity } : null;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   * 
   * @param a First string
   * @param b Second string
   * @returns The edit distance
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
}

// Export a singleton instance
export const dataQualityAgent = new DataQualityAgent();