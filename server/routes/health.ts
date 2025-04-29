import express from 'express';
import { db } from '../db';

const router = express.Router();

/**
 * Health check endpoint for load balancer and monitoring
 * Returns 200 OK if the application and database are healthy
 */
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Build response with component statuses
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        api: {
          status: 'healthy'
        },
        database: {
          status: 'healthy'
        }
      },
      version: process.env.npm_package_version || 'unknown'
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    
    const healthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      components: {
        api: {
          status: 'healthy'
        },
        database: {
          status: 'unhealthy',
          error: (error as Error).message
        }
      },
      version: process.env.npm_package_version || 'unknown'
    };
    
    res.status(503).json(healthStatus);
  }
});

export default router;