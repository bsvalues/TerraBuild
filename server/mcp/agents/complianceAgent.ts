/**
 * Compliance Agent for Model Content Protocol
 * 
 * This agent ensures adherence to Washington State regulations for property assessment.
 * It validates that property valuations and assessments comply with state laws and guidelines.
 */

import { FunctionResponse } from '../schemas/types';
import { BaseAgent, AgentEventType } from './baseAgent';

// Types for compliance verification
interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'VALUATION' | 'CLASSIFICATION' | 'REPORTING' | 'EXEMPTION' | 'PROCEDURAL';
  authority: string; // Legal reference
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  check: (data: any, context?: Record<string, any>) => Promise<ComplianceCheckResult>;
}

interface ComplianceCheckResult {
  passed: boolean;
  message: string;
  details?: any;
  remediation?: string;
}

interface ComplianceVerificationRequest {
  entityType: 'property' | 'assessment' | 'calculation' | 'report';
  data: any;
  context?: Record<string, any>;
}

/**
 * Compliance Agent Class
 * Implements MCP agent for ensuring regulatory compliance
 */
export class ComplianceAgent extends BaseAgent {
  private complianceRules: ComplianceRule[] = [];
  
  /**
   * Create a new Compliance Agent
   */
  constructor() {
    super(
      'compliance-agent',
      'Compliance Agent',
      'Ensures adherence to Washington State regulations for property assessment',
      [
        'verifyCompliance',
        'generateComplianceReport',
        'checkRegulation',
        'auditAssessment'
      ],
      ['READ_PROPERTY_DATA', 'READ_REGULATIONS']
    );
    
    // Initialize with Washington State property assessment compliance rules
    this.initializeComplianceRules();
  }
  
  /**
   * Initialize this agent
   */
  public async initialize(): Promise<void> {
    await super.initialize();
    
    // Subscribe to specific events of interest
    this.addEventListener(AgentEventType.DATA_AVAILABLE, this.handleDataAvailable.bind(this));
    this.addEventListener(AgentEventType.REQUEST_ASSISTANCE, this.handleAssistanceRequest.bind(this));
    
    console.log(`Compliance Agent initialized with ${this.complianceRules.length} rules`);
  }
  
  /**
   * Initialize compliance rules based on Washington State regulations
   */
  private initializeComplianceRules(): void {
    // Rule 1: Property Valuation Standard
    this.complianceRules.push({
      id: 'property_valuation_standard',
      name: 'Property Valuation Standard',
      description: 'Property must be valued at 100% of true and fair market value',
      category: 'VALUATION',
      authority: 'RCW 84.40.030',
      severity: 'CRITICAL',
      check: async (data, context) => {
        // Simplified check - in reality would be more complex
        if (!data.assessedValue || !data.marketValue) {
          return {
            passed: false,
            message: 'Missing required valuation data',
            details: { 
              missing: !data.assessedValue ? 'assessedValue' : 'marketValue' 
            },
            remediation: 'Provide both assessed value and market value'
          };
        }
        
        // In WA, assessed value should generally match market value
        const ratio = data.assessedValue / data.marketValue;
        const isWithinTolerance = ratio >= 0.95 && ratio <= 1.05;
        
        return {
          passed: isWithinTolerance,
          message: isWithinTolerance ? 
            'Assessed value appropriately reflects market value' : 
            'Assessed value deviates significantly from market value',
          details: {
            assessedValue: data.assessedValue,
            marketValue: data.marketValue,
            ratio,
            tolerance: '±5%'
          },
          remediation: !isWithinTolerance ? 
            'Adjust assessed value to align with current market value' : 
            undefined
        };
      }
    });
    
    // Rule 2: Uniform Assessment
    this.complianceRules.push({
      id: 'uniform_assessment',
      name: 'Uniform Assessment',
      description: 'Similar properties must be assessed uniformly',
      category: 'VALUATION',
      authority: 'WA Constitution Article VII, RCW 84.48.065',
      severity: 'HIGH',
      check: async (data, context) => {
        // This check requires context about similar properties
        if (!context || !context.similarProperties || !Array.isArray(context.similarProperties)) {
          return {
            passed: true, // Cannot fail without comparison data
            message: 'Unable to verify uniformity - insufficient comparison data',
            details: { 
              reason: 'No similar properties provided for comparison'
            }
          };
        }
        
        // Calculate coefficient of dispersion (measure of assessment uniformity)
        // Simplified implementation
        const propertyRate = data.assessedValue / data.squareFootage;
        const rates = context.similarProperties.map(p => p.assessedValue / p.squareFootage);
        rates.push(propertyRate);
        
        const median = this.calculateMedian(rates);
        const deviations = rates.map(rate => Math.abs(rate - median));
        const avgDeviation = deviations.reduce((sum, val) => sum + val, 0) / deviations.length;
        const cod = (avgDeviation / median) * 100; // Coefficient of dispersion
        
        // For residential property, COD should be less than 15% per IAAO standards
        const codThreshold = 15;
        const isUniform = cod <= codThreshold;
        
        return {
          passed: isUniform,
          message: isUniform ? 
            'Assessment appears uniform compared to similar properties' : 
            'Assessment uniformity exceeds recommended thresholds',
          details: {
            cod,
            threshold: codThreshold,
            propertyRate,
            medianRate: median,
            comparisonCount: context.similarProperties.length
          },
          remediation: !isUniform ? 
            'Review assessment rates across similar properties for consistency' : 
            undefined
        };
      }
    });
    
    // Rule 3: Current Use Classification
    this.complianceRules.push({
      id: 'current_use_classification',
      name: 'Current Use Classification',
      description: 'Farm and agricultural land must meet specific criteria for current use classification',
      category: 'CLASSIFICATION',
      authority: 'RCW 84.34.020',
      severity: 'HIGH',
      check: async (data, context) => {
        // Only apply to properties classified as farm/agricultural
        if (data.classification !== 'FARM' && data.classification !== 'AGRICULTURAL') {
          return {
            passed: true,
            message: 'Rule does not apply to this property classification',
            details: { 
              classification: data.classification
            }
          };
        }
        
        // Check minimum requirements for farm/agricultural classification
        const meetsMinimumSize = data.acreage >= 5;
        const hasFarmIncome = data.farmIncome && data.farmIncome >= 3000;
        const passesCheck = meetsMinimumSize && hasFarmIncome;
        
        return {
          passed: passesCheck,
          message: passesCheck ? 
            'Property meets farm/agricultural classification requirements' : 
            'Property does not meet farm/agricultural classification requirements',
          details: {
            requiredAcreage: 5,
            actualAcreage: data.acreage,
            requiredIncome: 3000,
            actualIncome: data.farmIncome
          },
          remediation: !passesCheck ? 
            'Reclassify property or ensure it meets minimum requirements' : 
            undefined
        };
      }
    });
    
    // Rule 4: Senior Citizen Exemption
    this.complianceRules.push({
      id: 'senior_citizen_exemption',
      name: 'Senior Citizen Exemption',
      description: 'Senior citizen exemptions must meet age, residency, and income requirements',
      category: 'EXEMPTION',
      authority: 'RCW 84.36.381',
      severity: 'MEDIUM',
      check: async (data, context) => {
        // Only apply to properties with senior exemption
        if (!data.exemptions || !data.exemptions.includes('SENIOR')) {
          return {
            passed: true,
            message: 'Rule does not apply - no senior exemption claimed',
            details: { 
              exemptions: data.exemptions || [] 
            }
          };
        }
        
        // Extract owner data
        const owner = data.ownerData || {};
        
        // Check requirements for senior exemption
        const isAgeEligible = owner.age >= 61;
        const meetsResidencyRequirement = owner.residencyYears >= 1;
        const incomeThreshold = 40000; // Simplified - WA has complex income tiers
        const meetsIncomeRequirement = owner.income && owner.income <= incomeThreshold;
        const isPrimaryResidence = data.isPrimaryResidence === true;
        
        const passesCheck = isAgeEligible && 
                           meetsResidencyRequirement && 
                           meetsIncomeRequirement &&
                           isPrimaryResidence;
        
        return {
          passed: passesCheck,
          message: passesCheck ? 
            'Property owner meets senior exemption requirements' : 
            'Property owner does not meet all senior exemption requirements',
          details: {
            age: {
              required: '61 or older',
              actual: owner.age,
              passed: isAgeEligible
            },
            residency: {
              required: '1 year minimum',
              actual: owner.residencyYears,
              passed: meetsResidencyRequirement
            },
            income: {
              required: `$${incomeThreshold} or less`,
              actual: owner.income,
              passed: meetsIncomeRequirement
            },
            isPrimaryResidence: {
              required: true,
              actual: data.isPrimaryResidence,
              passed: isPrimaryResidence
            }
          },
          remediation: !passesCheck ? 
            'Remove senior exemption or verify owner meets all requirements' : 
            undefined
        };
      }
    });
    
    // Rule 5: Revaluation Cycle
    this.complianceRules.push({
      id: 'revaluation_cycle',
      name: 'Revaluation Cycle',
      description: 'Properties must be physically inspected at least once every 6 years',
      category: 'PROCEDURAL',
      authority: 'RCW 84.41.041',
      severity: 'MEDIUM',
      check: async (data, context) => {
        if (!data.lastPhysicalInspection) {
          return {
            passed: false,
            message: 'Missing last physical inspection date',
            details: { 
              missing: 'lastPhysicalInspection' 
            },
            remediation: 'Record the date of the last physical inspection'
          };
        }
        
        // Calculate time since last inspection
        const lastInspection = new Date(data.lastPhysicalInspection);
        const currentDate = context?.currentDate ? new Date(context.currentDate) : new Date();
        
        // Check for invalid dates
        if (isNaN(lastInspection.getTime())) {
          return {
            passed: false,
            message: 'Invalid last physical inspection date',
            details: { 
              lastPhysicalInspection: data.lastPhysicalInspection 
            },
            remediation: 'Correct the last physical inspection date format'
          };
        }
        
        const yearsSinceInspection = (currentDate.getTime() - lastInspection.getTime()) / 
                                    (1000 * 60 * 60 * 24 * 365.25);
        const maxYears = 6;
        const passesCheck = yearsSinceInspection <= maxYears;
        
        return {
          passed: passesCheck,
          message: passesCheck ? 
            'Property inspection is within required cycle' : 
            'Property inspection cycle exceeds the 6-year requirement',
          details: {
            lastInspection: lastInspection.toISOString().split('T')[0],
            yearsSinceInspection: yearsSinceInspection.toFixed(1),
            maxYears
          },
          remediation: !passesCheck ? 
            'Schedule physical inspection for this property' : 
            undefined
        };
      }
    });
    
    // Add more compliance rules as needed
  }
  
  /**
   * Handle data available events
   */
  private async handleDataAvailable(event: any): Promise<void> {
    const { entityType, data } = event.payload;
    
    console.log(`Compliance Agent received ${entityType} data`);
    
    // Auto-verify compliance if configured to do so
    if (this.state.context.autoVerify && 
        (entityType === 'property' || entityType === 'assessment')) {
      await this.verifyCompliance({ 
        entityType: entityType, 
        data
      });
    }
  }
  
  /**
   * Handle assistance requests from other agents
   */
  private async handleAssistanceRequest(event: any): Promise<void> {
    const { requestType, data } = event.payload;
    
    console.log(`Compliance Agent received assistance request: ${requestType}`);
    
    if (requestType === 'verify_compliance') {
      const complianceResult = await this.verifyCompliance(data);
      
      // Respond with compliance results
      await this.emitEvent({
        type: AgentEventType.PROVIDE_FEEDBACK,
        sourceAgentId: this.definition.id,
        targetAgentId: event.sourceAgentId,
        timestamp: new Date(),
        correlationId: event.correlationId,
        payload: {
          responseType: 'compliance_results',
          results: complianceResult.data
        }
      });
    } else if (requestType === 'check_regulation') {
      const regulationResult = await this.checkRegulation({
        regulationId: data.regulationId,
        data: data.data
      });
      
      // Respond with regulation check results
      await this.emitEvent({
        type: AgentEventType.PROVIDE_FEEDBACK,
        sourceAgentId: this.definition.id,
        targetAgentId: event.sourceAgentId,
        timestamp: new Date(),
        correlationId: event.correlationId,
        payload: {
          responseType: 'regulation_check_results',
          results: regulationResult.data
        }
      });
    }
  }
  
  /**
   * Verify compliance against applicable rules
   * 
   * @param request The compliance verification request
   * @returns Function response with compliance results
   */
  public async verifyCompliance(request: ComplianceVerificationRequest): Promise<FunctionResponse> {
    console.log(`Compliance Agent: Verifying compliance for ${request.entityType}`);
    
    // Update agent state
    this.updateState({
      currentTask: 'compliance_verification',
      entityType: request.entityType,
      dataId: request.data.id || request.data.propId || 'unknown'
    });
    
    try {
      // Track compliance check results
      const results: Array<{
        ruleId: string;
        ruleName: string;
        category: string;
        passed: boolean;
        message: string;
        severity: string;
        details?: any;
        remediation?: string;
      }> = [];
      
      // Determine which rules to apply based on entity type
      const applicableRules = this.complianceRules.filter(rule => {
        switch (request.entityType) {
          case 'property':
            // Apply all rules to property data
            return true;
          case 'assessment':
            // Only apply valuation and classification rules to assessment data
            return rule.category === 'VALUATION' || 
                   rule.category === 'CLASSIFICATION';
          case 'calculation':
            // Only apply valuation rules to calculations
            return rule.category === 'VALUATION';
          case 'report':
            // Only apply reporting rules to reports
            return rule.category === 'REPORTING';
          default:
            return false;
        }
      });
      
      // Execute all applicable compliance rules
      for (const rule of applicableRules) {
        try {
          const result = await rule.check(request.data, request.context);
          
          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            passed: result.passed,
            message: result.message,
            severity: rule.severity,
            details: result.details,
            remediation: result.remediation
          });
        } catch (error) {
          console.error(`Error executing compliance rule ${rule.id}:`, error);
          
          // Record failed rule execution
          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            passed: false,
            message: `Error executing rule: ${error instanceof Error ? error.message : String(error)}`,
            severity: rule.severity,
            details: { error: error instanceof Error ? error.message : String(error) }
          });
        }
      }
      
      // Calculate compliance statistics
      const totalRules = results.length;
      const passedRules = results.filter(r => r.passed).length;
      const failedRules = totalRules - passedRules;
      
      const criticalFailures = results.filter(r => !r.passed && r.severity === 'CRITICAL').length;
      const highFailures = results.filter(r => !r.passed && r.severity === 'HIGH').length;
      const mediumFailures = results.filter(r => !r.passed && r.severity === 'MEDIUM').length;
      const lowFailures = results.filter(r => !r.passed && r.severity === 'LOW').length;
      
      const complianceScore = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 100;
      
      // Determine overall compliance status
      let complianceStatus: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';
      if (criticalFailures > 0) {
        complianceStatus = 'NON_COMPLIANT';
      } else if (highFailures > 0 || complianceScore < 70) {
        complianceStatus = 'PARTIALLY_COMPLIANT';
      } else {
        complianceStatus = 'COMPLIANT';
      }
      
      // Record verification in memory
      this.recordMemory({
        type: 'compliance_verification',
        timestamp: new Date(),
        input: {
          entityType: request.entityType,
          dataId: request.data.id || request.data.propId || 'unknown'
        },
        output: {
          complianceScore,
          complianceStatus,
          totalRules,
          passedRules,
          failedRules
        },
        tags: ['compliance', request.entityType, complianceStatus.toLowerCase()]
      });
      
      // Emit insight if there are compliance issues
      if (complianceStatus !== 'COMPLIANT') {
        await this.emitEvent({
          type: AgentEventType.INSIGHT_GENERATED,
          sourceAgentId: this.definition.id,
          timestamp: new Date(),
          payload: {
            insightType: 'compliance_issues',
            entityType: request.entityType,
            dataId: request.data.id || request.data.propId || 'unknown',
            severity: complianceStatus === 'NON_COMPLIANT' ? 'HIGH' : 'MEDIUM',
            summary: `${request.entityType} has compliance issues (Score: ${complianceScore}/100)`,
            details: {
              complianceStatus,
              criticalFailures,
              highFailures,
              mediumFailures,
              totalFailures: failedRules
            }
          }
        });
      }
      
      return {
        success: true,
        data: {
          entityType: request.entityType,
          dataId: request.data.id || request.data.propId || 'unknown',
          complianceStatus,
          complianceScore,
          rulesSummary: {
            total: totalRules,
            passed: passedRules,
            failed: failedRules,
            criticalFailures,
            highFailures,
            mediumFailures,
            lowFailures
          },
          results: results,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Error verifying compliance:`, error);
      
      return {
        success: false,
        error: `Error verifying compliance: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Generate a comprehensive compliance report
   * 
   * @param entityIds Array of entity IDs to include in report
   * @returns Function response with compliance report
   */
  public async generateComplianceReport(request: {
    entityType: string;
    entityIds: string[] | number[];
    includeDetails?: boolean;
    reportFormat?: 'SUMMARY' | 'DETAILED' | 'TECHNICAL';
    context?: Record<string, any>;
  }): Promise<FunctionResponse> {
    console.log(`Compliance Agent: Generating compliance report for ${request.entityIds.length} ${request.entityType} records`);
    
    // Update agent state
    this.updateState({
      currentTask: 'generate_compliance_report',
      entityType: request.entityType,
      entityCount: request.entityIds.length
    });
    
    try {
      if (!request.entityIds || request.entityIds.length === 0) {
        return {
          success: false,
          error: 'No entity IDs provided for report generation'
        };
      }
      
      // This would typically fetch data for each entity from a database
      // For this example, we'll simulate with available data or placeholder
      const entityData = request.context?.entityData || [];
      
      // If we don't have real data and this is just a demonstration, return a sample report
      if (entityData.length === 0) {
        return {
          success: true,
          data: this.generateSampleComplianceReport(
            request.entityType,
            request.entityIds.length,
            request.reportFormat || 'SUMMARY'
          )
        };
      }
      
      // Process actual entity data to generate the report
      const complianceResults = [];
      let totalScore = 0;
      
      for (const entity of entityData) {
        // Verify compliance for each entity
        const result = await this.verifyCompliance({
          entityType: request.entityType as any,
          data: entity,
          context: request.context
        });
        
        if (result.success && result.data) {
          complianceResults.push({
            entityId: entity.id || entity.propId,
            status: result.data.complianceStatus,
            score: result.data.complianceScore,
            issues: result.data.results
              .filter(r => !r.passed)
              .map(r => ({
                rule: r.ruleName,
                severity: r.severity,
                message: r.message,
                remediation: r.remediation
              }))
          });
          
          totalScore += result.data.complianceScore;
        }
      }
      
      // Calculate aggregate report metrics
      const avgScore = complianceResults.length > 0 ? 
        Math.round(totalScore / complianceResults.length) : 0;
      
      const compliantCount = complianceResults.filter(r => r.status === 'COMPLIANT').length;
      const partiallyCompliantCount = complianceResults.filter(r => r.status === 'PARTIALLY_COMPLIANT').length;
      const nonCompliantCount = complianceResults.filter(r => r.status === 'NON_COMPLIANT').length;
      
      const complianceRate = complianceResults.length > 0 ? 
        Math.round((compliantCount / complianceResults.length) * 100) : 0;
      
      // Generate sections based on requested format
      const includeDetails = request.includeDetails !== false;
      const reportFormat = request.reportFormat || 'SUMMARY';
      
      const formatSpecificData: Record<string, any> = {};
      
      if (reportFormat === 'DETAILED' || reportFormat === 'TECHNICAL') {
        formatSpecificData.entityResults = complianceResults.map(result => {
          const formattedResult = {
            entityId: result.entityId,
            status: result.status,
            score: result.score,
            issueCount: result.issues.length
          };
          
          if (includeDetails) {
            return {
              ...formattedResult,
              issues: result.issues
            };
          }
          
          return formattedResult;
        });
      }
      
      if (reportFormat === 'TECHNICAL') {
        // Add technical details for audit trail
        formatSpecificData.technicalDetails = {
          regulations: this.complianceRules.map(rule => ({
            id: rule.id,
            name: rule.name,
            category: rule.category,
            authority: rule.authority,
            severity: rule.severity
          })),
          generatedBy: this.definition.id,
          generatedAt: new Date().toISOString(),
          dataProcessingMethod: 'Rule-based compliance verification'
        };
      }
      
      // Record report generation in memory
      this.recordMemory({
        type: 'compliance_report',
        timestamp: new Date(),
        input: {
          entityType: request.entityType,
          entityCount: request.entityIds.length,
          reportFormat
        },
        output: {
          avgScore,
          complianceRate,
          compliantCount,
          nonCompliantCount
        },
        tags: ['report', request.entityType]
      });
      
      return {
        success: true,
        data: {
          reportType: 'Compliance Report',
          entityType: request.entityType,
          generatedAt: new Date().toISOString(),
          format: reportFormat,
          summary: {
            entityCount: complianceResults.length,
            averageComplianceScore: avgScore,
            complianceRate: `${complianceRate}%`,
            distribution: {
              compliant: compliantCount,
              partiallyCompliant: partiallyCompliantCount,
              nonCompliant: nonCompliantCount
            }
          },
          ...formatSpecificData,
          recommendations: this.generateRecommendations(
            request.entityType,
            complianceResults
          )
        }
      };
    } catch (error) {
      console.error(`Error generating compliance report:`, error);
      
      return {
        success: false,
        error: `Error generating compliance report: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Check specific regulation against property data
   * 
   * @param request The regulation check request
   * @returns Function response with regulation check results
   */
  public async checkRegulation(request: {
    regulationId: string;
    data: any;
    context?: Record<string, any>;
  }): Promise<FunctionResponse> {
    console.log(`Compliance Agent: Checking regulation ${request.regulationId}`);
    
    // Update agent state
    this.updateState({
      currentTask: 'check_regulation',
      regulationId: request.regulationId,
      dataId: request.data.id || request.data.propId || 'unknown'
    });
    
    try {
      // Find the requested regulation/rule
      const rule = this.complianceRules.find(r => r.id === request.regulationId);
      
      if (!rule) {
        return {
          success: false,
          error: `Unknown regulation ID: ${request.regulationId}`
        };
      }
      
      // Execute the regulation check
      const result = await rule.check(request.data, request.context);
      
      // Record check in memory
      this.recordMemory({
        type: 'regulation_check',
        timestamp: new Date(),
        input: {
          regulationId: request.regulationId,
          dataId: request.data.id || request.data.propId || 'unknown'
        },
        output: {
          passed: result.passed,
          message: result.message
        },
        tags: ['regulation', rule.category.toLowerCase()]
      });
      
      return {
        success: true,
        data: {
          regulationId: request.regulationId,
          regulationName: rule.name,
          category: rule.category,
          authority: rule.authority,
          severity: rule.severity,
          passed: result.passed,
          message: result.message,
          details: result.details,
          remediation: result.remediation,
          checkedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Error checking regulation:`, error);
      
      return {
        success: false,
        error: `Error checking regulation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Audit an assessment for compliance with all applicable regulations
   * 
   * @param assessmentId The ID of the assessment to audit
   * @returns Function response with audit results
   */
  public async auditAssessment(request: {
    assessmentId: string | number;
    context?: Record<string, any>;
  }): Promise<FunctionResponse> {
    console.log(`Compliance Agent: Auditing assessment ${request.assessmentId}`);
    
    // Update agent state
    this.updateState({
      currentTask: 'audit_assessment',
      assessmentId: request.assessmentId
    });
    
    try {
      // This would typically fetch assessment data from a database
      // For this example, we'll use data provided in context or a placeholder
      const assessmentData = request.context?.assessmentData;
      
      if (!assessmentData) {
        return {
          success: false,
          error: 'Assessment data not provided'
        };
      }
      
      // Verify compliance for the assessment
      const complianceResult = await this.verifyCompliance({
        entityType: 'assessment',
        data: assessmentData,
        context: request.context
      });
      
      if (!complianceResult.success) {
        return complianceResult;
      }
      
      // Generate recommendations based on compliance issues
      const recommendations = this.generateRecommendations(
        'assessment',
        [{
          entityId: request.assessmentId,
          status: complianceResult.data.complianceStatus,
          score: complianceResult.data.complianceScore,
          issues: complianceResult.data.results
            .filter(r => !r.passed)
            .map(r => ({
              rule: r.ruleName,
              severity: r.severity,
              message: r.message,
              remediation: r.remediation
            }))
        }]
      );
      
      // Record audit in memory
      this.recordMemory({
        type: 'assessment_audit',
        timestamp: new Date(),
        input: {
          assessmentId: request.assessmentId
        },
        output: {
          complianceStatus: complianceResult.data.complianceStatus,
          complianceScore: complianceResult.data.complianceScore,
          issueCount: complianceResult.data.rulesSummary.failed
        },
        tags: ['audit', 'assessment']
      });
      
      // Emit audit results if there are issues
      if (complianceResult.data.complianceStatus !== 'COMPLIANT') {
        await this.emitEvent({
          type: AgentEventType.INSIGHT_GENERATED,
          sourceAgentId: this.definition.id,
          timestamp: new Date(),
          payload: {
            insightType: 'assessment_audit',
            entityType: 'assessment',
            dataId: request.assessmentId,
            severity: complianceResult.data.complianceStatus === 'NON_COMPLIANT' ? 'HIGH' : 'MEDIUM',
            summary: `Assessment audit detected ${complianceResult.data.rulesSummary.failed} compliance issues`,
            details: {
              complianceStatus: complianceResult.data.complianceStatus,
              complianceScore: complianceResult.data.complianceScore,
              criticalFailures: complianceResult.data.rulesSummary.criticalFailures,
              recommendations: recommendations.slice(0, 3) // Top 3 recommendations
            }
          }
        });
      }
      
      return {
        success: true,
        data: {
          assessmentId: request.assessmentId,
          auditType: 'Compliance Audit',
          auditedAt: new Date().toISOString(),
          complianceStatus: complianceResult.data.complianceStatus,
          complianceScore: complianceResult.data.complianceScore,
          rulesSummary: complianceResult.data.rulesSummary,
          issues: complianceResult.data.results.filter(r => !r.passed),
          recommendations
        }
      };
    } catch (error) {
      console.error(`Error auditing assessment:`, error);
      
      return {
        success: false,
        error: `Error auditing assessment: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Generate compliance recommendations based on issues
   * 
   * @param entityType Type of entity
   * @param results Array of compliance results
   * @returns Array of recommendations
   */
  private generateRecommendations(
    entityType: string,
    results: Array<{
      entityId: string | number;
      status: string;
      score: number;
      issues: Array<{
        rule: string;
        severity: string;
        message: string;
        remediation?: string;
      }>;
    }>
  ): Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    description: string;
    impact: string;
    entityCount?: number;
  }> {
    const recommendations = [];
    
    // Group issues by rule
    const issuesByRule: Record<string, {
      count: number;
      severity: string;
      entityIds: Array<string | number>;
      remediation?: string;
    }> = {};
    
    // Collect issues across all entities
    for (const result of results) {
      for (const issue of result.issues) {
        if (!issuesByRule[issue.rule]) {
          issuesByRule[issue.rule] = {
            count: 0,
            severity: issue.severity,
            entityIds: [],
            remediation: issue.remediation
          };
        }
        
        issuesByRule[issue.rule].count++;
        issuesByRule[issue.rule].entityIds.push(result.entityId);
      }
    }
    
    // Generate recommendations based on issue patterns
    for (const [rule, data] of Object.entries(issuesByRule)) {
      // Skip rules with no remediation guidance
      if (!data.remediation) continue;
      
      // Determine priority based on severity and frequency
      let priority: 'HIGH' | 'MEDIUM' | 'LOW';
      
      if (data.severity === 'CRITICAL') {
        priority = 'HIGH';
      } else if (data.severity === 'HIGH') {
        priority = data.count > 1 ? 'HIGH' : 'MEDIUM';
      } else if (data.severity === 'MEDIUM') {
        priority = data.count > 3 ? 'MEDIUM' : 'LOW';
      } else {
        priority = 'LOW';
      }
      
      recommendations.push({
        priority,
        action: data.remediation,
        description: `Address ${rule} compliance issue affecting ${data.entityIds.length} ${entityType}(s)`,
        impact: `Improves compliance score and reduces regulatory risk`,
        entityCount: data.entityIds.length
      });
    }
    
    // Sort recommendations by priority
    const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by entity count (descending)
      return (b.entityCount || 0) - (a.entityCount || 0);
    });
    
    return recommendations;
  }
  
  /**
   * Generate a sample compliance report when actual data is not available
   * 
   * @param entityType Type of entity
   * @param entityCount Number of entities
   * @param reportFormat Desired report format
   * @returns Sample report data
   */
  private generateSampleComplianceReport(
    entityType: string,
    entityCount: number,
    reportFormat: 'SUMMARY' | 'DETAILED' | 'TECHNICAL'
  ): Record<string, any> {
    // Sample distribution data
    const compliantCount = Math.round(entityCount * 0.75);
    const partiallyCompliantCount = Math.round(entityCount * 0.2);
    const nonCompliantCount = entityCount - compliantCount - partiallyCompliantCount;
    
    const report = {
      reportType: 'Compliance Report (Sample)',
      entityType,
      generatedAt: new Date().toISOString(),
      format: reportFormat,
      summary: {
        entityCount,
        averageComplianceScore: 85,
        complianceRate: `${Math.round((compliantCount / entityCount) * 100)}%`,
        distribution: {
          compliant: compliantCount,
          partiallyCompliant: partiallyCompliantCount,
          nonCompliant: nonCompliantCount
        }
      },
      recommendations: [
        {
          priority: 'HIGH' as const,
          action: 'Review and correct senior exemption eligibility verification',
          description: `Address Senior Citizen Exemption compliance issues affecting ${nonCompliantCount} ${entityType}(s)`,
          impact: 'Ensures legal compliance with RCW 84.36.381',
          entityCount: nonCompliantCount
        },
        {
          priority: 'MEDIUM' as const,
          action: 'Update property inspection schedules to meet 6-year cycle',
          description: `Address Revaluation Cycle compliance issues affecting ${partiallyCompliantCount} ${entityType}(s)`,
          impact: 'Improves compliance with RCW 84.41.041',
          entityCount: partiallyCompliantCount
        }
      ]
    };
    
    // Add format-specific sections
    if (reportFormat === 'DETAILED' || reportFormat === 'TECHNICAL') {
      report['entityResults'] = [
        {
          entityId: 'SAMPLE-001',
          status: 'COMPLIANT',
          score: 100,
          issueCount: 0
        },
        {
          entityId: 'SAMPLE-002',
          status: 'PARTIALLY_COMPLIANT',
          score: 75,
          issueCount: 1,
          issues: [
            {
              rule: 'Revaluation Cycle',
              severity: 'MEDIUM',
              message: 'Property inspection cycle exceeds the 6-year requirement',
              remediation: 'Schedule physical inspection for this property'
            }
          ]
        },
        {
          entityId: 'SAMPLE-003',
          status: 'NON_COMPLIANT',
          score: 60,
          issueCount: 2,
          issues: [
            {
              rule: 'Senior Citizen Exemption',
              severity: 'HIGH',
              message: 'Property owner does not meet all senior exemption requirements',
              remediation: 'Remove senior exemption or verify owner meets all requirements'
            },
            {
              rule: 'Uniform Assessment',
              severity: 'MEDIUM',
              message: 'Assessment uniformity exceeds recommended thresholds',
              remediation: 'Review assessment rates across similar properties for consistency'
            }
          ]
        }
      ];
    }
    
    if (reportFormat === 'TECHNICAL') {
      report['technicalDetails'] = {
        regulations: this.complianceRules.map(rule => ({
          id: rule.id,
          name: rule.name,
          category: rule.category,
          authority: rule.authority,
          severity: rule.severity
        })),
        generatedBy: this.definition.id,
        generatedAt: new Date().toISOString(),
        dataProcessingMethod: 'Rule-based compliance verification (Sample)'
      };
    }
    
    return report;
  }
  
  /**
   * Calculate the median of a numeric array
   * 
   * @param values Array of numbers
   * @returns The median value
   */
  private calculateMedian(values: number[]): number {
    if (!values || values.length === 0) return 0;
    
    // Sort values
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      // Even number of items - average the middle two
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      // Odd number of items - return the middle one
      return sorted[middle];
    }
  }
}

// Export a singleton instance
export const complianceAgent = new ComplianceAgent();