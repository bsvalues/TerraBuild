/**
 * TerraBuild Monitoring Routes
 * 
 * This file defines standalone monitoring routes for health checks and metrics.
 * These routes are registered directly in server/index.ts before the Vite middleware.
 */

import express from 'express';
import { storage } from './storage-factory';
import { z } from 'zod';

// Simple utility function for async route handling
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

const router = express.Router();

// Health check endpoint with detailed system status
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await storage.checkDatabaseConnection();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // Check system uptime
    const uptime = process.uptime();
    
    // Service version
    const version = process.env.npm_package_version || '1.0.0';
    
    // Check agent health
    const agentStatuses = await storage.getAgentStatuses();
    
    // Return comprehensive health information
    res.json({
      status: dbStatus ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version,
      uptime,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
      },
      database: {
        connected: dbStatus,
      },
      agents: agentStatuses || { status: 'unknown' },
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'critical', 
      timestamp: new Date().toISOString(),
      error: 'Failed to perform health check'
    });
  }
});

// Prometheus metrics endpoint - exposes metrics in Prometheus format for scraping
router.get('/metrics', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await storage.checkDatabaseConnection();
    
    // Memory usage in bytes
    const memoryUsage = process.memoryUsage();
    
    // Get agent statuses
    const agentStatuses = await storage.getAgentStatuses();
    
    // Format metrics for Prometheus
    let prometheusMetrics = '';
    
    // System uptime
    prometheusMetrics += `# HELP app_uptime_seconds The uptime of the application in seconds\n`;
    prometheusMetrics += `# TYPE app_uptime_seconds gauge\n`;
    prometheusMetrics += `app_uptime_seconds ${process.uptime()}\n\n`;
    
    // Memory usage
    prometheusMetrics += `# HELP app_memory_usage_bytes Memory usage of the app in bytes\n`;
    prometheusMetrics += `# TYPE app_memory_usage_bytes gauge\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="rss"} ${memoryUsage.rss}\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="external"} ${memoryUsage.external}\n\n`;
    
    // Database status
    prometheusMetrics += `# HELP app_database_connected Database connection status (1 for connected, 0 for disconnected)\n`;
    prometheusMetrics += `# TYPE app_database_connected gauge\n`;
    prometheusMetrics += `app_database_connected ${dbStatus ? 1 : 0}\n\n`;
    
    // Agent health metrics
    prometheusMetrics += `# HELP app_agent_status AI Agent status (1 for healthy, 0 for unhealthy)\n`;
    prometheusMetrics += `# TYPE app_agent_status gauge\n`;
    
    // Convert agent statuses to Prometheus format
    Object.entries(agentStatuses).forEach(([agentId, status]) => {
      const isHealthy = status.status === 'healthy' ? 1 : 0;
      prometheusMetrics += `app_agent_status{agent="${agentId}"} ${isHealthy}\n`;
    });
    
    // Set content type for Prometheus metrics
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    console.error('Metrics collection error:', error);
    res.status(500).send('# Error collecting metrics');
  }
});

// Agent status endpoints
router.get('/agents', asyncHandler(async (req, res) => {
  const agentStatuses = await storage.getAgentStatuses();
  res.json(agentStatuses);
}));

router.get('/agents/:agentId', asyncHandler(async (req, res) => {
  const agentStatus = await storage.getAgentStatus(req.params.agentId);
  if (!agentStatus) {
    return res.status(404).json({ message: 'Agent not found' });
  }
  res.json(agentStatus);
}));

router.post('/agents/:agentId/status', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const { status, metadata, errorMessage } = req.body;
  
  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }
  
  const success = await storage.updateAgentStatus(
    agentId,
    status,
    metadata,
    errorMessage
  );
  
  if (!success) {
    return res.status(500).json({ message: 'Failed to update agent status' });
  }
  
  res.status(200).json({ message: 'Agent status updated successfully' });
}));

export default router;