/**
 * TerraBuild AI Swarm - API Routes
 * 
 * This file defines the API routes for interacting with the TerraBuild AI Swarm framework.
 * It provides endpoints for initialization, status checking, and running agent tasks.
 */

import { Router } from 'express';
import { SwarmRunner } from '../../terrafusion/swarm-core/SwarmRunner';

// Initialize the router
const router = Router();

// Create a singleton SwarmRunner instance
let swarmRunner: SwarmRunner | null = null;

/**
 * Initialize the SwarmRunner if it's not already initialized
 */
async function getSwarmRunner(): Promise<SwarmRunner> {
  if (!swarmRunner) {
    swarmRunner = new SwarmRunner({
      enabledAgents: [
        'factortuner',
        'benchmarkguard',
        'curvetrainer',
        'scenarioagent'
        // 'boearguer' will be added when implemented
      ],
      logLevel: 'info',
      dataPath: './data',
      maxConcurrentTasks: 5
    });
    
    // Initialize the swarm
    const initialized = await swarmRunner.initialize();
    if (!initialized) {
      throw new Error('Failed to initialize TerraBuild AI Swarm');
    }
  }
  
  return swarmRunner;
}

/**
 * Initialize or get status of the AI Swarm
 */
router.get('/status', async (req, res) => {
  try {
    // Initialize swarm if needed
    const runner = await getSwarmRunner();
    
    // Get swarm status
    const status = runner.getStatus();
    
    res.json({
      active: runner.isActive(),
      status
    });
  } catch (error) {
    console.error('Error getting swarm status:', error);
    res.status(500).json({
      error: 'Failed to get swarm status',
      message: error.message
    });
  }
});

/**
 * Run a task with a specific agent
 */
router.post('/agent-task', async (req, res) => {
  try {
    const { agentId, taskType, taskData } = req.body;
    
    // Validate request
    if (!agentId || !taskType || !taskData) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'agentId, taskType, and taskData are required'
      });
    }
    
    // Initialize swarm if needed
    const runner = await getSwarmRunner();
    
    // Run the task
    const result = await runner.runAgentTask(agentId, taskType, taskData);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error running agent task:', error);
    res.status(500).json({
      error: 'Failed to run agent task',
      message: error.message
    });
  }
});

/**
 * Run a composite task involving multiple agents
 */
router.post('/swarm-task', async (req, res) => {
  try {
    const { description, agentTasks } = req.body;
    
    // Validate request
    if (!description || !agentTasks) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'description and agentTasks are required'
      });
    }
    
    // Initialize swarm if needed
    const runner = await getSwarmRunner();
    
    // Run the task
    const result = await runner.runSwarmTask(description, agentTasks);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error running swarm task:', error);
    res.status(500).json({
      error: 'Failed to run swarm task',
      message: error.message
    });
  }
});

/**
 * Run a predefined demo workflow
 */
router.post('/demo', async (req, res) => {
  try {
    const { demoType } = req.body;
    
    // Validate request
    if (!demoType) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'demoType is required'
      });
    }
    
    // Check if demo type is valid
    const validDemoTypes = ['cost-assessment', 'scenario-analysis', 'sensitivity-analysis'];
    if (!validDemoTypes.includes(demoType)) {
      return res.status(400).json({
        error: 'Invalid demo type',
        message: `Demo type must be one of: ${validDemoTypes.join(', ')}`
      });
    }
    
    // Initialize swarm if needed
    const runner = await getSwarmRunner();
    
    // Run the demo workflow
    const result = await runner.runDemoWorkflow(demoType);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error running demo workflow:', error);
    res.status(500).json({
      error: 'Failed to run demo workflow',
      message: error.message
    });
  }
});

/**
 * Shutdown the AI Swarm
 */
router.post('/shutdown', async (req, res) => {
  try {
    if (!swarmRunner) {
      return res.json({
        success: true,
        message: 'Swarm is not running'
      });
    }
    
    // Shutdown the swarm
    const success = await swarmRunner.shutdown();
    swarmRunner = null;
    
    res.json({
      success,
      message: success ? 'Swarm shut down successfully' : 'Failed to shut down swarm properly'
    });
  } catch (error) {
    console.error('Error shutting down swarm:', error);
    res.status(500).json({
      error: 'Failed to shut down swarm',
      message: error.message
    });
  }
});

export default router;