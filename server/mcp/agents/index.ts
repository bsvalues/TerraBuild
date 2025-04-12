/**
 * Agent Exports for Model Content Protocol
 * 
 * This file exports all MCP agents for easy importing throughout the application.
 * Implements the command structure from the strategic guide:
 * 
 * ARCHITECT PRIME → INTEGRATION COORDINATOR → COMPONENT LEADS → SPECIALIST AGENTS
 */

// Export agent types from base agent
export * from './baseAgent';

// Export the event bus
export * from './eventBus';

// Export individual agents
export { dataQualityAgent } from './dataQualityAgent';
export { complianceAgent } from './complianceAgent';
export { costAnalysisAgent } from './costAnalysisAgent';
export { costEstimationAgent } from './costEstimationAgent';
export { geospatialAnalysisAgent } from './geospatialAnalysisAgent';
export { documentProcessingAgent } from './documentProcessingAgent';

// Export an agent registry object for easy access to all agents
import { BaseAgent } from './baseAgent';
import { dataQualityAgent } from './dataQualityAgent';
import { complianceAgent } from './complianceAgent';
import { costAnalysisAgent } from './costAnalysisAgent';
import { costEstimationAgent } from './costEstimationAgent';
import { geospatialAnalysisAgent } from './geospatialAnalysisAgent';
import { documentProcessingAgent } from './documentProcessingAgent';

/**
 * Represents the command structure from the strategic guide:
 * ARCHITECT PRIME → INTEGRATION COORDINATOR → COMPONENT LEADS → SPECIALIST AGENTS
 */
interface CommandStructure {
  architectPrime: BaseAgent | null;
  integrationCoordinator: BaseAgent | null;
  componentLeads: {
    BSBCmaster?: BaseAgent;
    BCBSGISPRO?: BaseAgent;
    BCBSLevy?: BaseAgent;
    BCBSCOSTApp?: BaseAgent;
    BCBSGeoAssessmentPro?: BaseAgent;
  };
  specialistAgents: Record<string, BaseAgent>;
  
  // MCP Processing Groups
  assessmentCalculation: {
    inputProcessing: Record<string, BaseAgent>;
    calculationEngine: Record<string, BaseAgent>;
    outputGeneration: Record<string, BaseAgent>;
  };
  geospatialIntegration: {
    dataIngestion: Record<string, BaseAgent>;
    spatialAnalytics: Record<string, BaseAgent>;
    visualizationGeneration: Record<string, BaseAgent>;
  };
}

/**
 * Registry of all available agents
 */
interface AgentRegistry {
  // Core agents from initial development
  dataQuality: BaseAgent;
  compliance: BaseAgent;
  costAnalysis: BaseAgent;
  
  // Command structure based on strategic guide
  commandStructure: CommandStructure;
  
  // Get a specific agent by name
  getAgent(name: string): BaseAgent | undefined;
  
  // Get all agent IDs
  getAllAgentIds(): string[];
  
  // Initialize all agents
  initializeAllAgents(): Promise<void>;
  
  // Shutdown all agents
  shutdownAllAgents(): Promise<void>;
}

/**
 * Registry of all agents in the system
 */
export const agentRegistry: AgentRegistry = {
  // Core agents from initial development
  dataQuality: dataQualityAgent,
  compliance: complianceAgent,
  costAnalysis: costAnalysisAgent as unknown as BaseAgent, // Type assertion until costAnalysisAgent is updated
  
  // Command structure from strategic guide
  commandStructure: {
    architectPrime: complianceAgent, // Using compliance agent as Architect Prime for now
    integrationCoordinator: dataQualityAgent, // Using data quality agent as Integration Coordinator for now
    componentLeads: {
      BCBSCOSTApp: costAnalysisAgent as unknown as BaseAgent, // Using cost analysis agent as BCBS COST App lead
    },
    specialistAgents: {
      'cost-estimation-agent': costEstimationAgent as unknown as BaseAgent,
      'geospatial-analysis-agent': geospatialAnalysisAgent as unknown as BaseAgent,
      'document-processing-agent': documentProcessingAgent as unknown as BaseAgent
    }, // Specialist agents
    
    // Assessment Calculation MCP
    assessmentCalculation: {
      inputProcessing: {
        'document-processing-agent': documentProcessingAgent as unknown as BaseAgent
      },
      calculationEngine: {},
      outputGeneration: {}
    },
    
    // Geospatial Integration MCP
    geospatialIntegration: {
      dataIngestion: {},
      spatialAnalytics: {
        'geospatial-analysis-agent': geospatialAnalysisAgent as unknown as BaseAgent
      },
      visualizationGeneration: {}
    }
  },
  
  /**
   * Get an agent by name
   * 
   * @param name The name of the agent to get
   * @returns The agent, or undefined if not found
   */
  getAgent(name: string): BaseAgent | undefined {
    switch (name.toLowerCase()) {
      case 'dataquality':
      case 'data-quality':
      case 'data_quality':
      case 'data-quality-agent':
        return this.dataQuality;
        
      case 'compliance':
      case 'compliance-agent':
        return this.compliance;
        
      case 'costanalysis':
      case 'cost-analysis':
      case 'cost_analysis':
      case 'cost-analysis-agent':
        return this.costAnalysis;
        
      case 'costestimation':
      case 'cost-estimation':
      case 'cost_estimation':
      case 'cost-estimation-agent':
        return this.commandStructure.specialistAgents['cost-estimation-agent'];
        
      case 'geospatialanalysis':
      case 'geospatial-analysis':
      case 'geospatial_analysis':
      case 'geospatial-analysis-agent':
        return this.commandStructure.specialistAgents['geospatial-analysis-agent'];
      
      case 'documentprocessing':
      case 'document-processing':
      case 'document_processing':
      case 'document-processing-agent':
        return this.commandStructure.specialistAgents['document-processing-agent'];
        
      default:
        console.log(`Agent not found in registry: ${name}`);
        return undefined;
    }
  },
  
  /**
   * Initialize all agents
   */
  async initializeAllAgents(): Promise<void> {
    try {
      console.log('Initializing MCP agents...');
      
      // Initialize each agent in sequence
      await this.dataQuality.initialize();
      await this.compliance.initialize();
      
      // The cost analysis agent doesn't extend BaseAgent yet, so handle separately
      if (costAnalysisAgent.initialize) {
        await (costAnalysisAgent as unknown as BaseAgent).initialize();
      }
      
      // Initialize specialist agents
      if (this.commandStructure.specialistAgents['cost-estimation-agent']) {
        await (this.commandStructure.specialistAgents['cost-estimation-agent']).initialize();
      }
      
      if (this.commandStructure.specialistAgents['geospatial-analysis-agent']) {
        await (this.commandStructure.specialistAgents['geospatial-analysis-agent']).initialize();
      }
      
      if (this.commandStructure.specialistAgents['document-processing-agent']) {
        await (this.commandStructure.specialistAgents['document-processing-agent']).initialize();
      }
      
      console.log('All MCP agents initialized successfully');
    } catch (error) {
      console.error('Error initializing MCP agents:', error);
      throw error;
    }
  },
  
  /**
   * Get all agent IDs
   * 
   * @returns Array of agent IDs
   */
  getAllAgentIds(): string[] {
    const agentIds = [
      'data-quality-agent',
      'compliance-agent',
      'cost-analysis-agent',
      'development-agent',
      'design-agent',
      'data-analysis-agent',
      'geospatial-analysis-agent',
      'document-processing-agent'
    ];
    
    return agentIds;
  },
  
  /**
   * Shutdown all agents
   */
  async shutdownAllAgents(): Promise<void> {
    try {
      console.log('Shutting down MCP agents...');
      
      // Shutdown each agent in sequence
      await this.dataQuality.shutdown();
      await this.compliance.shutdown();
      
      // The cost analysis agent doesn't extend BaseAgent yet, so handle separately
      if ((this.costAnalysis as any).shutdown) {
        await this.costAnalysis.shutdown();
      }
      
      // Shutdown specialist agents
      for (const agentId in this.commandStructure.specialistAgents) {
        if (this.commandStructure.specialistAgents[agentId]) {
          await this.commandStructure.specialistAgents[agentId].shutdown();
        }
      }
      
      console.log('All MCP agents shut down successfully');
    } catch (error) {
      console.error('Error shutting down MCP agents:', error);
      throw error;
    }
  }
};