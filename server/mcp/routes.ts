/**
 * MCP API Routes
 * 
 * This file defines the API routes for the Model Content Protocol framework.
 */

import express from 'express';
import { agentCoordinator, TaskType } from './experience';
import { agentRegistry } from './agents';
import { cacheMiddleware } from '../utils/cache';
import { generateDashboardData, clearDashboardCache } from './monitoring/dashboard';

const router = express.Router();

// GET /api/mcp/status - Get overall MCP status
router.get('/status', (req, res) => {
  try {
    // Get agent health statuses
    const agentHealth = agentCoordinator.getAgentHealth() as Record<string, any>;
    
    // Get performance metrics
    const metrics = agentCoordinator.getPerformanceMetrics();
    
    res.json({
      status: 'active',
      agents: Object.keys(agentHealth).length,
      agentHealth,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching MCP status:', error);
    res.status(500).json({
      error: 'Error fetching MCP status',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/mcp/dashboard - Get dashboard data for MCP monitoring
router.get('/dashboard', cacheMiddleware(30), (req, res) => {
  try {
    const dashboardData = generateDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error('Error generating MCP dashboard data:', error);
    res.status(500).json({
      error: 'Error generating MCP dashboard data',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /api/mcp/dashboard/refresh - Force refresh of dashboard data
router.post('/dashboard/refresh', (req, res) => {
  try {
    clearDashboardCache();
    const dashboardData = generateDashboardData();
    res.json({
      success: true,
      message: 'Dashboard data refreshed successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Error refreshing dashboard data',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/mcp/agents - Get all agent information
router.get('/agents', (req, res) => {
  try {
    const agents = [];
    
    // Get all registered agents
    const agentIds = ['data-quality-agent', 'compliance-agent', 'cost-analysis-agent'];
    
    for (const agentId of agentIds) {
      const agent = agentRegistry.getAgent(agentId);
      if (!agent) continue;
      
      // Get agent definition
      const definition = agent.getDefinition();
      
      // Get agent health
      const health = agentCoordinator.getAgentHealth(agentId);
      
      agents.push({
        id: definition.id,
        name: definition.name,
        description: definition.description,
        capabilities: definition.capabilities,
        status: health
      });
    }
    
    res.json({
      agents,
      count: agents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agent information:', error);
    res.status(500).json({
      error: 'Error fetching agent information',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/mcp/agents/:agentId - Get specific agent information
router.get('/agents/:agentId', (req, res) => {
  try {
    const agentId = req.params.agentId;
    const agent = agentRegistry.getAgent(agentId);
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `No agent found with ID: ${agentId}`
      });
    }
    
    // Get agent definition
    const definition = agent.getDefinition();
    
    // Get agent state (exclude memory for brevity)
    const state = agent.getState();
    const { memory, ...stateWithoutMemory } = state;
    
    // Get agent health
    const health = agentCoordinator.getAgentHealth(agentId);
    
    res.json({
      agent: {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        capabilities: definition.capabilities,
        state: stateWithoutMemory,
        status: health,
        memorySize: memory?.length || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching agent ${req.params.agentId} information:`, error);
    res.status(500).json({
      error: 'Error fetching agent information',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /api/mcp/tasks - Create a new task
router.post('/tasks', (req, res) => {
  try {
    const { type, parameters, priority, assignTo } = req.body;
    
    // Validate task type
    if (!type || !Object.values(TaskType).includes(type)) {
      return res.status(400).json({
        error: 'Invalid task type',
        message: `Task type must be one of: ${Object.values(TaskType).join(', ')}`
      });
    }
    
    // Validate parameters
    if (!parameters || typeof parameters !== 'object') {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: 'Parameters must be a non-null object'
      });
    }
    
    // Create task
    const task = agentCoordinator.createTask(
      type,
      parameters,
      priority || 'MEDIUM',
      assignTo
    );
    
    res.status(201).json({
      task,
      message: 'Task created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      error: 'Error creating task',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/mcp/tasks - Get all tasks
router.get('/tasks', (req, res) => {
  try {
    const { status, agentId, limit } = req.query;
    
    // Apply filters
    const tasks = agentCoordinator.getTasks(task => {
      if (status && task.status !== status) {
        return false;
      }
      if (agentId && task.assignedTo !== agentId) {
        return false;
      }
      return true;
    });
    
    // Apply limit
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;
    const limitedTasks = limitNum ? tasks.slice(0, limitNum) : tasks;
    
    res.json({
      tasks: limitedTasks,
      count: limitedTasks.length,
      totalCount: tasks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      error: 'Error fetching tasks',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/mcp/tasks/:taskId - Get specific task
router.get('/tasks/:taskId', (req, res) => {
  try {
    const taskId = req.params.taskId;
    const task = agentCoordinator.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: `No task found with ID: ${taskId}`
      });
    }
    
    res.json({
      task,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching task ${req.params.taskId}:`, error);
    res.status(500).json({
      error: 'Error fetching task',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /api/mcp/request-assistance - Request agent assistance
router.post('/request-assistance', (req, res) => {
  try {
    const { agentId, issueType, context } = req.body;
    
    // Validate agent ID
    if (!agentId) {
      return res.status(400).json({
        error: 'Missing agent ID',
        message: 'Agent ID is required'
      });
    }
    
    // Request assistance
    const taskId = agentCoordinator.requestAgentAssistance(
      agentId,
      issueType || 'performance_degradation',
      context || {}
    );
    
    res.status(200).json({
      taskId,
      message: `Assistance requested for agent ${agentId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error requesting assistance:', error);
    res.status(500).json({
      error: 'Error requesting assistance',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/mcp/dashboard/html - View HTML dashboard (not implemented yet)
router.get('/dashboard/html', cacheMiddleware(30), (req, res) => {
  res.send(`
    <html>
      <head>
        <title>MCP Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1 { color: #0066cc; }
          .card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
          .metrics { display: flex; flex-wrap: wrap; gap: 15px; }
          .metric { background: #f5f5f5; padding: 10px; border-radius: 4px; min-width: 150px; }
          .metric-title { font-weight: bold; margin-bottom: 5px; }
          .positive { color: green; }
          .negative { color: red; }
        </style>
      </head>
      <body>
        <h1>MCP Dashboard</h1>
        <p>This is a simple HTML view of the MCP dashboard data. For a more interactive experience, use the React-based dashboard.</p>
        <div class="card">
          <h2>Visit the React Dashboard</h2>
          <p>A more interactive version of this dashboard is available at: <a href="/mcp-visualizations">/mcp-visualizations</a></p>
        </div>
      </body>
    </html>
  `);
});

export default router;