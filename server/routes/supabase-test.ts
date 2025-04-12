/**
 * Supabase Test Routes
 * 
 * This file provides routes to test the Supabase connection and configuration.
 * These routes are intended for development and testing only.
 */

import express from 'express';
import { getSupabaseClient, testSupabaseConnection, isSupabaseConfigured } from '../utils/supabaseClient';

const router = express.Router();

// GET /api/supabase-test/status - Get Supabase connection status
router.get('/status', async (req, res) => {
  try {
    const connectionStatus = await testSupabaseConnection();
    
    res.json({
      configured: isSupabaseConfigured(),
      connection: connectionStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking Supabase status:', error);
    res.status(500).json({
      error: 'Failed to check Supabase connection',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/supabase-test/tables - List tables in the Supabase database
router.get('/tables', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        error: 'Supabase not configured',
        message: 'Supabase environment variables are missing',
        timestamp: new Date().toISOString()
      });
    }
    
    const supabase = getSupabaseClient();
    
    // Query the system schema for all tables
    const { data, error } = await supabase.rpc('get_tables');
    
    if (error) {
      throw error;
    }
    
    res.json({
      tables: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error listing Supabase tables:', error);
    res.status(500).json({
      error: 'Failed to list Supabase tables',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router;