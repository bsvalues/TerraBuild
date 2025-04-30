/**
 * TerraBuild AI Swarm - BOEArguer Agent
 * 
 * This specialized agent generates persuasive arguments and evidence for Board of Equalization
 * appeals regarding property valuations.
 */

import { Agent, AgentConfig, AgentTask } from '../Agent';
import Anthropic from '@anthropic-ai/sdk';

// Environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface BOECaseDetails {
  propertyId: string;
  ownerName: string;
  currentAssessment: number;
  proposedAssessment: number;
  propertyDetails: {
    type: string;
    address: string;
    yearBuilt: number;
    squareFeet: number;
    lotSize: number;
    features: string[];
  };
  comparableSales?: Array<{
    address: string;
    saleDate: Date;
    salePrice: number;
    squareFeet: number;
    yearBuilt: number;
    distance: number; // miles from subject property
  }>;
  assessorRationale?: string;
  appealBasis?: 'overvaluation' | 'inequity' | 'classification' | 'exemption';
}

export interface BOEArgumentRequest {
  caseDetails: BOECaseDetails;
  desiredTone?: 'professional' | 'technical' | 'persuasive' | 'concise';
  includeCitations?: boolean;
  maxLength?: number; // word count
  focusAreas?: string[];
}

export class BOEArguer extends Agent {
  private anthropicClient: Anthropic | null = null;
  private casePrecedents: Record<string, any> = {};
  private statuteReferences: Record<string, any> = {};

  constructor() {
    const config: AgentConfig = {
      id: 'boe-arguer',
      name: 'BOEArguer',
      description: 'Generates persuasive arguments for Board of Equalization appeals',
      version: '1.0.0',
      capabilities: [
        'boe:generate-argument',
        'boe:analyze-case',
        'boe:find-precedents',
        'boe:cite-statutes'
      ],
      parameters: {
        defaultTone: 'professional',
        defaultMaxLength: 1500,
        modelVersion: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        temperature: 0.7,
        maxCitations: 10
      }
    };
    
    super(config);
  }

  /**
   * Initialize the agent and connect to Anthropic API
   */
  public async initialize(): Promise<boolean> {
    try {
      // Initialize Anthropic client
      if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set');
      }
      
      this.anthropicClient = new Anthropic({
        apiKey: ANTHROPIC_API_KEY,
      });
      
      // Load case precedents and statute references
      await this.loadReferences();
      
      // Call parent initialize method
      return await super.initialize();
    } catch (error) {
      console.error(`Error initializing BOEArguer agent:`, error);
      this.emit('agent:error', { 
        agentId: this.config.id, 
        error: `Initialization failed: ${error.message}`
      });
      return false;
    }
  }

  /**
   * Load reference materials like case precedents and statutes
   */
  private async loadReferences(): Promise<void> {
    // In a real implementation, this would load from a database or files
    this.casePrecedents = {
      'overvaluation': [
        {
          id: 'case-2024-0142',
          title: 'Johnson v. Benton County Assessor',
          outcome: 'reduction',
          summary: 'Assessment reduced due to poor condition of property not accounted for in mass appraisal',
          year: 2024
        },
        // Additional cases would be listed here
      ],
      'inequity': [
        {
          id: 'case-2023-0089',
          title: 'Westview HOA v. Benton County Assessor',
          outcome: 'reduction',
          summary: 'Assessments reduced after showing similar properties were assessed at lower values',
          year: 2023
        },
        // Additional cases would be listed here
      ]
    };
    
    this.statuteReferences = {
      'valuation': {
        code: 'RCW 84.40.030',
        text: 'All property shall be valued at one hundred percent of its true and fair value in money and assessed on the same basis unless specifically provided otherwise by law.'
      },
      'appeal_process': {
        code: 'RCW 84.48.010',
        text: 'The county board of equalization shall meet in open session for this purpose annually on the 15th day of July and, having each taken an oath fairly and impartially to perform their duties as members of such board, they shall examine and compare the returns of the assessment of the property of the county and proceed to equalize the same, so that each tract or lot of real property and each article or class of personal property shall be entered on the assessment list at its true and fair value, according to the measure of value used by the county assessor in such assessment year.'
      }
    };
  }

  /**
   * Process a task submitted to this agent
   */
  protected async processTask(taskId: string): Promise<void> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Mark task as processing
      task.status = 'processing';
      this.tasks.set(taskId, task);
      
      // Process based on task type
      switch (task.type) {
        case 'boe:generate-argument':
          const argument = await this.generateArgument(task.data as BOEArgumentRequest);
          this.completeTask(taskId, argument);
          break;
        
        case 'boe:analyze-case':
          const analysis = await this.analyzeCase(task.data);
          this.completeTask(taskId, analysis);
          break;
        
        case 'boe:find-precedents':
          const precedents = await this.findRelevantPrecedents(task.data);
          this.completeTask(taskId, precedents);
          break;
        
        case 'boe:cite-statutes':
          const statutes = await this.findRelevantStatutes(task.data);
          this.completeTask(taskId, statutes);
          break;
          
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      console.error(`Error processing task ${taskId}:`, error);
      this.failTask(taskId, error.message);
    }
  }
  
  /**
   * Generate a persuasive argument for a BOE appeal
   */
  private async generateArgument(request: BOEArgumentRequest): Promise<any> {
    // Validate the client is initialized
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }
    
    // Get relevant precedents and statutes
    const precedents = await this.findRelevantPrecedents({
      appealBasis: request.caseDetails.appealBasis,
      propertyType: request.caseDetails.propertyDetails.type
    });
    
    const statutes = await this.findRelevantStatutes({
      appealBasis: request.caseDetails.appealBasis
    });
    
    // Format property details
    const propertyDetails = request.caseDetails.propertyDetails;
    const formattedProperty = `${propertyDetails.address}, a ${propertyDetails.squareFeet} sq.ft. ${propertyDetails.type} built in ${propertyDetails.yearBuilt} on a ${propertyDetails.lotSize} acre lot`;
    
    // Format comparables
    let comparablesText = '';
    if (request.caseDetails.comparableSales && request.caseDetails.comparableSales.length > 0) {
      comparablesText = request.caseDetails.comparableSales.map(comp => {
        return `- ${comp.address}: ${comp.squareFeet} sq.ft., built in ${comp.yearBuilt}, sold for $${comp.salePrice.toLocaleString()} on ${comp.saleDate.toLocaleDateString()}, located ${comp.distance.toFixed(1)} miles from subject property`;
      }).join('\n');
    }
    
    // Build the prompt
    const tone = request.desiredTone || this.config.parameters?.defaultTone || 'professional';
    const maxLength = request.maxLength || this.config.parameters?.defaultMaxLength || 1500;
    
    const prompt = `
You are an expert in property tax appeals representing property owners before the Board of Equalization.

Please generate a ${tone} argument for a property tax appeal with the following details:

PROPERTY OWNER: ${request.caseDetails.ownerName}
PROPERTY: ${formattedProperty}
CURRENT ASSESSMENT: $${request.caseDetails.currentAssessment.toLocaleString()}
PROPOSED ASSESSMENT: $${request.caseDetails.proposedAssessment.toLocaleString()}
BASIS OF APPEAL: ${request.caseDetails.appealBasis || 'overvaluation'}

FEATURES:
${request.caseDetails.propertyDetails.features.join(', ')}

${request.caseDetails.comparableSales ? `COMPARABLE SALES:
${comparablesText}` : ''}

${request.caseDetails.assessorRationale ? `ASSESSOR'S RATIONALE:
${request.caseDetails.assessorRationale}` : ''}

RELEVANT STATUTES:
${Object.values(statutes).map(statute => `${statute.code}: ${statute.text}`).join('\n')}

RELEVANT PRECEDENTS:
${precedents.map(precedent => `${precedent.title} (${precedent.year}): ${precedent.summary}`).join('\n')}

${request.focusAreas ? `FOCUS ON THESE AREAS:
${request.focusAreas.join('\n')}` : ''}

Please write a persuasive argument for the Board of Equalization explaining why the property assessment should be reduced to the proposed value.
${request.includeCitations ? 'Include citations to relevant statutes and precedents where appropriate.' : ''}
Keep the argument under ${maxLength} words.
`;

    try {
      // Call the Anthropic API
      const response = await this.anthropicClient.messages.create({
        model: this.config.parameters?.modelVersion || 'claude-3-7-sonnet-20250219',
        max_tokens: 4000,
        temperature: this.config.parameters?.temperature || 0.7,
        messages: [{ role: 'user', content: prompt }],
      });
      
      // Process the response
      return {
        argument: response.content[0].text,
        wordCount: response.content[0].text.split(/\s+/).length,
        tone: tone,
        precedentsUsed: precedents.length,
        statutesUsed: Object.keys(statutes).length,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw new Error(`Failed to generate argument: ${error.message}`);
    }
  }
  
  /**
   * Analyze a case to determine strengths and weaknesses
   */
  private async analyzeCase(data: any): Promise<any> {
    // In a full implementation, this would do a more thorough analysis
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];
    
    // Check if there's a significant difference between assessments
    const currentAssessment = data.caseDetails?.currentAssessment || 0;
    const proposedAssessment = data.caseDetails?.proposedAssessment || 0;
    const percentDifference = ((currentAssessment - proposedAssessment) / currentAssessment) * 100;
    
    if (percentDifference > 20) {
      strengths.push('Large assessment difference provides incentive for board to compromise');
    } else if (percentDifference < 5) {
      weaknesses.push('Small assessment difference may not be worth board\'s time to adjust');
    }
    
    // Check for comparable sales
    if (data.caseDetails?.comparableSales && data.caseDetails.comparableSales.length >= 3) {
      strengths.push(`${data.caseDetails.comparableSales.length} comparable sales provide strong evidence`);
    } else {
      weaknesses.push('Insufficient comparable sales data');
      recommendations.push('Find at least 3 comparable sales to strengthen case');
    }
    
    // Return analysis
    return {
      strengths,
      weaknesses,
      recommendations,
      appealPotential: strengths.length > weaknesses.length ? 'high' : 'moderate',
      analyzedAt: new Date().toISOString()
    };
  }
  
  /**
   * Find relevant case precedents
   */
  private async findRelevantPrecedents(data: any): Promise<any[]> {
    const appealBasis = data.appealBasis || 'overvaluation';
    const propertyType = data.propertyType;
    
    // Get precedents for this appeal basis
    const basisPrecedents = this.casePrecedents[appealBasis] || [];
    
    // If property type is specified, filter by that as well
    if (propertyType && basisPrecedents.length > 0) {
      // In a real implementation, we would have property type tags on precedents
      // This is just a placeholder implementation
      return basisPrecedents.slice(0, 3);
    }
    
    return basisPrecedents;
  }
  
  /**
   * Find relevant statutes
   */
  private async findRelevantStatutes(data: any): Promise<Record<string, any>> {
    const appealBasis = data.appealBasis || 'overvaluation';
    
    // Return relevant statutes based on appeal basis
    // In a real implementation, this would be more sophisticated
    if (appealBasis === 'overvaluation') {
      return {
        valuation: this.statuteReferences.valuation,
        appeal_process: this.statuteReferences.appeal_process
      };
    } else if (appealBasis === 'inequity') {
      return {
        appeal_process: this.statuteReferences.appeal_process
      };
    }
    
    // Default fallback
    return this.statuteReferences;
  }
  
  /**
   * Request assistance from another agent
   */
  public async requestAgentAssistance(agentId: string, taskType: string, taskData: any): Promise<any> {
    if (!this.swarm) {
      throw new Error('Not connected to swarm');
    }
    
    // Get the agent from the swarm
    const targetAgent = this.swarm.getAgent(agentId);
    if (!targetAgent) {
      throw new Error(`Agent ${agentId} not found in swarm`);
    }
    
    // Submit task to the other agent
    const taskId = await targetAgent.submitTask({
      type: taskType,
      priority: 'high',
      data: taskData
    });
    
    // Wait for the task to complete
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        const task = targetAgent.getTask(taskId);
        if (!task) {
          clearInterval(checkInterval);
          reject(new Error(`Task ${taskId} not found`));
          return;
        }
        
        if (task.status === 'completed') {
          clearInterval(checkInterval);
          resolve(task.result);
        } else if (task.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(task.error || 'Task failed'));
        }
      }, 250);
    });
  }
}