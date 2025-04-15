/**
 * System Routes
 * 
 * This file provides system-level API routes for the application,
 * including database connection status, health checks, and other system information.
 */

import express from 'express';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import { adaptiveStorage } from '../adaptive-storage';
import { log } from '../vite';

const router = express.Router();

// Get database connection status
router.get('/connection-status', async (req, res) => {
  try {
    // Get adaptive storage's internal state
    const status = {
      supabase: {
        available: false,
        configured: isSupabaseConfigured(),
        lastChecked: null as Date | null
      },
      postgres: {
        available: true, // Postgres is always available locally
        configured: true,
        lastChecked: new Date()
      },
      activeProvider: 'postgres' as 'postgres' | 'supabase'
    };
    
    // If we have access to the adaptive storage's internal state, use it
    if (adaptiveStorage['usesFallback'] !== undefined) {
      status.activeProvider = adaptiveStorage['usesFallback'] ? 'postgres' : 'supabase';
      
      if (adaptiveStorage['lastConnectionCheck']) {
        status.supabase.lastChecked = new Date(adaptiveStorage['lastConnectionCheck']);
      } else {
        status.supabase.lastChecked = null;
      }
      
      // Check Supabase connection directly
      if (status.supabase.configured) {
        try {
          // Use the utility method from supabaseClient.ts to check connection
          const { getSupabaseClient } = await import('../utils/supabaseClient');
          const supabase = getSupabaseClient();
          
          // Try a lightweight query to check connection
          const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
          status.supabase.available = !error;
        } catch (error) {
          log(`Error checking Supabase connection for status route: ${error}`, 'system');
          status.supabase.available = false;
        }
      }
    }
    
    res.json(status);
  } catch (error) {
    log(`Error in connection-status route: ${error}`, 'system');
    res.status(500).json({ 
      error: 'Failed to get connection status',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// System health check
router.get('/health', (req, res) => {
  // Basic health check that returns system info
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform
  };
  
  res.json(healthInfo);
});

export default router;