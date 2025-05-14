/**
 * MCP Test Routes
 * 
 * Routes for testing agent functionality
 */

import express from 'express';
import { agentRegistry } from '../agent-registry';

const router = express.Router();

// GET /api/mcp/test/agents - Test agent registry
router.get('/agents', (req, res) => {
  try {
    const targetIds = ['data-quality-agent', 'compliance-agent', 'cost-analysis-agent'];
    
    // Force register if missing
    for (const id of targetIds) {
      if (!agentRegistry.getAgent(id)) {
        console.log(`Registering missing agent: ${id}`);
        agentRegistry.registerAgent({
          id,
          name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          status: 'active',
          capabilities: [],
          lastUpdated: Date.now()
        });
      }
    }
    
    // Get all agents
    const agents = targetIds.map(id => {
      const agent = agentRegistry.getAgent(id);
      return {
        id,
        found: !!agent,
        agent: agent ? {
          id: agent.id,
          name: agent.name,
          status: agent.status
        } : null
      };
    });
    
    res.json({
      success: true,
      agents,
      allAgentIds: agentRegistry.getAllAgentIds()
    });
  } catch (error) {
    console.error('Error in test/agents:', error);
    res.status(500).json({
      success: false,
      error: 'Error testing agent registry',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;