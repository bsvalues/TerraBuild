import express from 'express';
import postgres from 'postgres';

const router = express.Router();

/**
 * Health check endpoint for load balancer and monitoring
 * Returns 200 OK if the application and database are healthy
 */
router.get('/health', async (req, res) => {
  try {
    // Create a temporary connection to check database health
    // Using process.env.DATABASE_URL directly to avoid circular dependencies
    const sql = postgres(process.env.DATABASE_URL || '');
    await sql`SELECT 1`;
    await sql.end();
    
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