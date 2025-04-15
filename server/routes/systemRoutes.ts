/**
 * System Routes
 * 
 * This file provides system-level API routes for the application,
 * including database connection status, health checks, and other system information.
 */

import { Router, Request, Response } from 'express';
import { AdaptiveStorage } from '../adaptive-storage';
import { config } from 'dotenv';

config();

export const systemRoutes = Router();

// Database connection status endpoint
systemRoutes.get('/connection-status', async (req: Request, res: Response) => {
  try {
    const storage = req.app.locals.storage as AdaptiveStorage;
    const status = await storage.getConnectionStatus();

    res.json({
      supabase: {
        available: status.supabase.available,
        configured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY,
        lastChecked: status.supabase.lastChecked
      },
      postgres: {
        available: status.postgres.available,
        configured: !!process.env.DATABASE_URL,
        lastChecked: status.postgres.lastChecked
      },
      activeProvider: status.activeProvider
    });
  } catch (error) {
    console.error('Error retrieving connection status:', error);
    res.status(500).json({
      message: 'Failed to retrieve database connection status',
      error: (error as Error).message
    });
  }
});

// Health check endpoint
systemRoutes.get('/health', async (req: Request, res: Response) => {
  try {
    const storage = req.app.locals.storage as AdaptiveStorage;
    const dbStatus = await storage.checkHealth();
    
    const systemHealth = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
    };
    
    const overallStatus = dbStatus.connected ? 'healthy' : 'degraded';
    
    res.status(200).json({
      ...systemHealth,
      overallStatus
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: (error as Error).message
    });
  }
});

// Get system environment information (non-sensitive)
systemRoutes.get('/environment', (req: Request, res: Response) => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'development',
    databaseProvider: req.app.locals.storage?.getCurrentProvider() || 'unknown'
  });
});