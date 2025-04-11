/**
 * MCP API Routes
 * 
 * This file defines the API routes for the Model Content Protocol framework.
 */

import express from 'express';
import { agentCoordinator, TaskType } from './experience';
import { agentRegistry } from './agents';
import { handleDashboardRequest, handleHtmlDashboardRequest } from './monitoring/dashboard';
import { cacheMiddleware } from '../utils/cache';

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

// GET /api/mcp/dashboard - Get dashboard metrics
router.get('/dashboard', cacheMiddleware(15), handleDashboardRequest); // Cache for 15 seconds

// GET /api/mcp/dashboard/view - View HTML dashboard
router.get('/dashboard/view', cacheMiddleware(30), handleHtmlDashboardRequest); // Cache for 30 seconds

export default router;