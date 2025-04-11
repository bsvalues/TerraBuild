/**
 * Agent Exports for Model Content Protocol
 * 
 * This file exports all MCP agents for easy importing throughout the application.
 */

// Export agent types from base agent
export * from './baseAgent';

// Export the event bus
export * from './eventBus';

// Export individual agents
export { dataQualityAgent } from './dataQualityAgent';
export { complianceAgent } from './complianceAgent';
export { costAnalysisAgent } from './costAnalysisAgent';

// Export an agent registry object for easy access to all agents
import { BaseAgent } from './baseAgent';
import { dataQualityAgent } from './dataQualityAgent';
import { complianceAgent } from './complianceAgent';
import { costAnalysisAgent } from './costAnalysisAgent';

/**
 * Registry of all available agents
 */
interface AgentRegistry {
  dataQuality: BaseAgent;
  compliance: BaseAgent;
  costAnalysis: BaseAgent;
  
  // Get a specific agent by name
  getAgent(name: string): BaseAgent | undefined;
  
  // Initialize all agents
  initializeAllAgents(): Promise<void>;
  
  // Shutdown all agents
  shutdownAllAgents(): Promise<void>;
}

/**
 * Registry of all agents in the system
 */
export const agentRegistry: AgentRegistry = {
  dataQuality: dataQualityAgent,
  compliance: complianceAgent,
  costAnalysis: costAnalysisAgent as unknown as BaseAgent, // Type assertion until costAnalysisAgent is updated
  
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
      
      console.log('All MCP agents initialized successfully');
    } catch (error) {
      console.error('Error initializing MCP agents:', error);
      throw error;
    }
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
      
      console.log('All MCP agents shut down successfully');
    } catch (error) {
      console.error('Error shutting down MCP agents:', error);
      throw error;
    }
  }
};