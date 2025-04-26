import { Request, Response, Router } from 'express';
import os from 'os';
import { getConnectedClients } from '../socket';
import { APP_VERSION } from '../../shared/constants';
import { getFeatureFlags } from '../feature-flags';

const healthRouter = Router();

/**
 * Health check endpoint
 * This provides basic health information about the application and system
 */
healthRouter.get('/', async (req: Request, res: Response) => {
  const startTime = process.hrtime();
  
  // Basic system info
  const systemInfo = {
    hostname: os.hostname(),
    uptime: Math.floor(process.uptime()),
    memory: {
      free: os.freemem(),
      total: os.totalmem(),
      usage: (1 - os.freemem() / os.totalmem()) * 100,
    },
    cpus: os.cpus().length,
    load: os.loadavg(),
  };
  
  // Application metrics
  const appMetrics = {
    version: APP_VERSION,
    nodeVersion: process.version,
    connectedClients: getConnectedClients(),
    environment: process.env.NODE_ENV || 'development',
  };
  
  // Active feature flags
  const featureFlags = getFeatureFlags();
  
  // Calculate response time
  const [seconds, nanoseconds] = process.hrtime(startTime);
  const responseTime = seconds * 1000 + nanoseconds / 1000000;
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: systemInfo,
    application: appMetrics,
    features: featureFlags,
    responseTime: `${responseTime.toFixed(2)}ms`,
  });
});

/**
 * Detailed metrics endpoint for monitoring systems
 */
healthRouter.get('/metrics', async (req: Request, res: Response) => {
  // This would typically be integrated with a monitoring system like Prometheus
  // For now, we'll just return some basic metrics
  
  const memoryUsage = process.memoryUsage();
  
  res.json({
    process: {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      uptime: process.uptime(),
    },
    system: {
      loadAvg: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
    },
    application: {
      startTime: process.env.APP_START_TIME || new Date().toISOString(),
      activeRequests: Math.floor(Math.random() * 10), // This would be an actual counter in production
      totalRequests: Math.floor(Math.random() * 1000), // This would be an actual counter in production
      errors: Math.floor(Math.random() * 5), // This would be an actual counter in production
    },
  });
});

/**
 * Liveness probe for Kubernetes
 */
healthRouter.get('/liveness', (req: Request, res: Response) => {
  // Simple check to verify the application is running
  res.status(200).send('OK');
});

/**
 * Readiness probe for Kubernetes
 */
healthRouter.get('/readiness', async (req: Request, res: Response) => {
  // Check if the application is ready to receive traffic
  // This would include checking database connections, etc.
  
  try {
    // In a real application, you would check database connections, etc.
    // For now, we'll just simulate a successful check
    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send('NOT READY');
  }
});

export default healthRouter;