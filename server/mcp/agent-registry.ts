/**
 * MCP Agent Registry
 * 
 * This module provides a registry for MCP agents and manages agent
 * registration, lookup, and status.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Agent, AgentStatus } from './types';
import { logger } from '../utils/logger';
import { registerDataQualityAgent } from './handlers/data-quality-handler';
import { registerComplianceAgent } from './handlers/compliance-handler';
import { registerCostAnalysisAgent } from './handlers/cost-analysis-handler';

// Get current directory equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Agent registry interface
interface AgentRegistry {
  agents: Record<string, Agent>;
  getAgent: (id: string) => Agent | null;
  registerAgent: (agent: Agent) => void;
  getAllAgentIds: () => string[];
  getAllAgents: () => Agent[];
  updateAgentStatus: (id: string, status: AgentStatus) => void;
  saveToFile: () => void;
  loadFromFile: () => void;
  ensureCriticalAgentsExist: () => void;
  initializeAllAgents: () => void;
}

// Create agent registry instance
class AgentRegistryImpl implements AgentRegistry {
  agents: Record<string, Agent> = {};
  private readonly registryPath: string = path.join(__dirname, 'agents.json');
  
  constructor() {
    // Load agent definitions from file
    this.loadFromFile();
    
    // Make sure critical agents exist after loading
    this.ensureCriticalAgentsExist();
  }
  
  /**
   * Get an agent by ID
   * 
   * @param id Agent ID
   * @returns Agent or null if not found
   */
  getAgent(id: string): Agent | null {
    return this.agents[id] || null;
  }
  
  /**
   * Register an agent
   * 
   * @param agent Agent to register
   */
  registerAgent(agent: Agent): void {
    logger.info(`Registering agent: ${agent.name} (${agent.id})`);
    
    // Check if agent is already registered
    if (this.agents[agent.id]) {
      logger.warn(`Agent ${agent.id} is already registered, updating...`);
    }
    
    // Store agent in registry
    this.agents[agent.id] = agent;
    
    // Save updated registry to file
    this.saveToFile();
    
    logger.info(`Agent ${agent.name} (${agent.id}) registered successfully`);
  }
  
  /**
   * Get all agent IDs
   * 
   * @returns Array of agent IDs
   */
  getAllAgentIds(): string[] {
    return Object.keys(this.agents);
  }
  
  /**
   * Get all agents
   * 
   * @returns Array of agents
   */
  getAllAgents(): Agent[] {
    return Object.values(this.agents);
  }
  
  /**
   * Update an agent's status
   * 
   * @param id Agent ID
   * @param status New status
   */
  updateAgentStatus(id: string, status: AgentStatus): void {
    const agent = this.getAgent(id);
    
    if (!agent) {
      logger.warn(`Cannot update status for unknown agent: ${id}`);
      return;
    }
    
    logger.info(`Updating status for agent ${agent.name} (${id}): ${status}`);
    
    // Update agent status
    agent.status = status;
    
    // Save updated registry to file
    this.saveToFile();
  }
  
  /**
   * Save agent registry to file
   */
  saveToFile(): void {
    try {
      // Save as an object map for direct access by ID
      const data = {
        agents: this.agents
      };
      
      fs.writeFileSync(this.registryPath, JSON.stringify(data, null, 2));
      logger.debug(`Agent registry saved to ${this.registryPath}`);
    } catch (error) {
      logger.error(`Error saving agent registry to file:`, error);
    }
  }
  
  /**
   * Load agent registry from file
   */
  loadFromFile(): void {
    try {
      if (fs.existsSync(this.registryPath)) {
        const fileContent = fs.readFileSync(this.registryPath, 'utf8');
        
        if (!fileContent || fileContent.trim() === '') {
          logger.warn(`Agent registry file at ${this.registryPath} is empty, initializing with defaults`);
          this.agents = {};
          return;
        }
        
        const data = JSON.parse(fileContent);
        
        // Initialize empty registry
        this.agents = {};
        
        // Check if data contains nested agents object
        if (data.agents && typeof data.agents === 'object') {
          if (!Array.isArray(data.agents)) {
            // If agents is an object map (not an array), use it directly
            this.agents = data.agents;
            logger.info(`Loaded ${Object.keys(this.agents).length} agents from registry map at ${this.registryPath}`);
          } else {
            // If agents is an array, convert to map
            for (const agentData of data.agents) {
              if (agentData && agentData.id) {
                // Create agent object with required fields
                const agent: Agent = {
                  id: agentData.id,
                  name: agentData.name,
                  status: agentData.status || 'inactive',
                  capabilities: agentData.capabilities || [],
                  metadata: agentData.metadata || {
                    description: agentData.description || ''
                  },
                  lastUpdated: Date.now()
                };
                
                // Register agent
                this.agents[agent.id] = agent;
              }
            }
            logger.info(`Loaded ${Object.keys(this.agents).length} agents from registry array at ${this.registryPath}`);
            
            // Save back in object format to prevent future issues
            this.saveToFile();
          }
        } else {
          logger.warn(`Agent registry file at ${this.registryPath} has invalid format, initializing with defaults`);
        }
      } else {
        logger.warn(`Agent registry file not found at ${this.registryPath}, initializing empty registry`);
        this.agents = {};
      }
    } catch (error) {
      logger.error(`Error loading agent registry from file:`, error);
      this.agents = {};
    }
    
    // Always initialize three critical agents
    this._initializeCriticalAgents();
  }
  
  /**
   * Initialize critical agents if they don't exist
   * @private
   */
  private _initializeCriticalAgents(): void {
    // Add data quality agent
    if (!this.agents['data-quality-agent']) {
      this.agents['data-quality-agent'] = {
        id: 'data-quality-agent',
        name: 'Data Quality Agent',
        status: 'active',
        capabilities: ['data:validate', 'data:analyze:quality'],
        metadata: {
          description: 'Validates data quality and identifies issues in property data'
        },
        lastUpdated: Date.now()
      };
    }
    
    // Add compliance agent
    if (!this.agents['compliance-agent']) {
      this.agents['compliance-agent'] = {
        id: 'compliance-agent',
        name: 'Compliance Agent',
        status: 'active',
        capabilities: ['compliance:check', 'compliance:validate'],
        metadata: {
          description: 'Checks data against compliance rules and regulations'
        },
        lastUpdated: Date.now()
      };
    }
    
    // Add cost analysis agent
    if (!this.agents['cost-analysis-agent']) {
      this.agents['cost-analysis-agent'] = {
        id: 'cost-analysis-agent',
        name: 'Cost Analysis Agent',
        status: 'active',
        capabilities: ['cost:analyze', 'cost:estimate', 'cost:compare'],
        metadata: {
          description: 'Analyzes and compares cost data for properties'
        },
        lastUpdated: Date.now()
      };
    }
    
    // Save to ensure critical agents are persisted
    this.saveToFile();
  }
  
  /**
   * Ensure that critical agents exist in the registry
   */
  ensureCriticalAgentsExist(): void {
    // List of critical agent IDs that must always exist
    const criticalAgentIds = ['data-quality-agent', 'compliance-agent', 'cost-analysis-agent'];
    
    // Check and add each critical agent if missing
    for (const id of criticalAgentIds) {
      if (!this.getAgent(id)) {
        logger.info(`Adding missing critical agent: ${id}`);
        
        // Create default agent
        const agent: Agent = {
          id,
          name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          status: 'active',
          capabilities: [],
          metadata: {
            description: `Default ${id} implementation`
          },
          lastUpdated: Date.now()
        };
        
        // Register agent
        this.agents[id] = agent;
      }
    }
    
    // Save changes to disk
    if (criticalAgentIds.some(id => !this.getAgent(id))) {
      this.saveToFile();
    }
  }
  
  /**
   * Initialize all registered agents
   */
  initializeAllAgents(): void {
    logger.info('Initializing all registered agents...');
    
    try {
      // Initialize data quality agent
      const dataQualityAgent = registerDataQualityAgent();
      this.registerAgent(dataQualityAgent);
      
      // Initialize compliance agent
      const complianceAgent = registerComplianceAgent();
      this.registerAgent(complianceAgent);
      
      // Initialize cost analysis agent
      const costAnalysisAgent = registerCostAnalysisAgent();
      this.registerAgent(costAnalysisAgent);
      
      logger.info('All agents initialized successfully');
    } catch (error) {
      logger.error('Error initializing agents:', error);
    }
  }
}

// Create singleton instance
export const agentRegistry = new AgentRegistryImpl();

// Add commonly used agents if they don't exist
(function ensureCommonAgents() {
  // Add data quality agent
  if (!agentRegistry.getAgent('data-quality-agent')) {
    const dataQualityAgent: Agent = {
      id: 'data-quality-agent',
      name: 'Data Quality Agent', 
      status: 'active',
      capabilities: ['data:validate', 'data:analyze:quality'],
      metadata: {
        description: 'Validates data quality and identifies issues in property data'
      },
      lastUpdated: Date.now()
    };
    agentRegistry.registerAgent(dataQualityAgent);
  }
  
  // Add compliance agent
  if (!agentRegistry.getAgent('compliance-agent')) {
    const complianceAgent: Agent = {
      id: 'compliance-agent', 
      name: 'Compliance Agent',
      status: 'active',
      capabilities: ['compliance:check', 'compliance:validate'],
      metadata: {
        description: 'Checks data against compliance rules and regulations'
      },
      lastUpdated: Date.now()
    };
    agentRegistry.registerAgent(complianceAgent);
  }
  
  // Add cost analysis agent
  if (!agentRegistry.getAgent('cost-analysis-agent')) {
    const costAnalysisAgent: Agent = {
      id: 'cost-analysis-agent',
      name: 'Cost Analysis Agent',
      status: 'active',
      capabilities: ['cost:analyze', 'cost:estimate', 'cost:compare'],
      metadata: {
        description: 'Analyzes and compares cost data for properties'
      },
      lastUpdated: Date.now()
    };
    agentRegistry.registerAgent(costAnalysisAgent);
  }
})();