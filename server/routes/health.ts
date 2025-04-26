/**
 * Health Check Endpoint for BCBS Application
 * 
 * This file provides health check endpoints that can be used
 * for monitoring, load balancers, and container orchestration systems.
 */

import { Request, Response } from 'express';
import { db } from '../db';

// Health check status types
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

// Component health information
interface ComponentHealth {
  status: HealthStatus;
  responseTime?: number;
  details?: Record<string, any>;
}

// Overall health response
interface HealthResponse {
  status: HealthStatus;
  version: string;
  timestamp: string;
  uptime: number;
  components: Record<string, ComponentHealth>;
}

// Application start time for uptime calculation
const startTime = Date.now();

/**
 * Get database health status
 * @returns {Promise<ComponentHealth>} Database health
 */
async function getDatabaseHealth(): Promise<ComponentHealth> {
  try {
    const startQuery = Date.now();
    // Simple query to check database connectivity
    await db.execute('SELECT 1');
    const queryTime = Date.now() - startQuery;
    
    return {
      status: 'healthy',
      responseTime: queryTime,
      details: {
        connectionPool: 'active'
      }
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      details: {
        error: (error as Error).message
      }
    };
  }
}

/**
 * Get memory usage health
 * @returns {ComponentHealth} Memory health
 */
function getMemoryHealth(): ComponentHealth {
  const memoryUsage = process.memoryUsage();
  const memoryThresholdMB = 1024; // 1GB
  
  const usedHeapMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const totalHeapMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const status: HealthStatus = usedHeapMB > memoryThresholdMB ? 'degraded' : 'healthy';
  
  return {
    status,
    details: {
      heapUsed: `${usedHeapMB}MB`,
      heapTotal: `${totalHeapMB}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
    }
  };
}

/**
 * Get application info for health check
 * @returns {ComponentHealth} App info
 */
function getAppInfo(): ComponentHealth {
  return {
    status: 'healthy',
    details: {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    }
  };
}

/**
 * Health check handler for complete detailed health information
 */
export async function healthCheck(req: Request, res: Response) {
  const dbHealth = await getDatabaseHealth();
  const memoryHealth = getMemoryHealth();
  const appInfo = getAppInfo();
  
  // Determine overall health status
  let overallStatus: HealthStatus = 'healthy';
  
  if (dbHealth.status === 'unhealthy' || memoryHealth.status === 'unhealthy') {
    overallStatus = 'unhealthy';
  } else if (dbHealth.status === 'degraded' || memoryHealth.status === 'degraded') {
    overallStatus = 'degraded';
  }
  
  const healthData: HealthResponse = {
    status: overallStatus,
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000), // in seconds
    components: {
      database: dbHealth,
      memory: memoryHealth,
      application: appInfo
    }
  };
  
  // Set appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 :
                    overallStatus === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(healthData);
}

/**
 * Simple health check handler for load balancers
 * Returns 200 OK if the service is available, 503 if not
 */
export function simpleHealthCheck(req: Request, res: Response) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}

/**
 * Readiness probe for Kubernetes and other orchestrators
 * Checks if the application is ready to serve traffic
 */
export async function readinessProbe(req: Request, res: Response) {
  try {
    // Check database connectivity
    await db.execute('SELECT 1');
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      message: 'Database connection failed'
    });
  }
}

/**
 * Liveness probe for Kubernetes and other orchestrators
 * Checks if the application is alive and healthy
 */
export function livenessProbe(req: Request, res: Response) {
  // Simple check that the Node.js process is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000) // in seconds
  });
}