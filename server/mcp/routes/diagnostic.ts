/**
 * MCP Diagnostic Routes
 * 
 * Routes for debugging and diagnosing issues with the MCP framework
 */

import express from 'express';
import { agentRegistry } from '../agent-registry';

const router = express.Router();

// GET /api/mcp/diagnostic/registry - Get the current agent registry state
router.get('/registry', (req, res) => {
  try {
    const allAgents = agentRegistry.getAllAgents();
    const allIds = agentRegistry.getAllAgentIds();
    
    // Try to fetch specific agents
    const targetIds = ['data-quality-agent', 'compliance-agent', 'cost-analysis-agent'];
    const targetAgents = targetIds.map(id => {
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
      registry: {
        totalAgents: allAgents.length,
        allIds: allIds,
        specificAgents: targetAgents
      }
    });
  } catch (error) {
    console.error('Error in registry diagnostic:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching registry diagnostic information',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;