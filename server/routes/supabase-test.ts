/**
 * Supabase Test Routes
 * 
 * This file provides routes to test the Supabase connection and configuration.
 * These routes are intended for development and testing only.
 */

import express from 'express';
import { getSupabaseClient, isSupabaseConfigured } from '../utils/supabaseClient';

const router = express.Router();

// Test Supabase connection
router.get('/test-connection', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        error: 'Supabase not configured',
        message: 'Supabase environment variables are missing',
        timestamp: new Date().toISOString()
      });
    }
    
    const supabase = getSupabaseClient();
    
    // Try a simple query to test the connection
    const { data, error } = await supabase.from('scenarios').select('count');
    
    if (error) {
      return res.status(500).json({
        error: 'Supabase connection failed',
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      status: 'connected',
      message: 'Successfully connected to Supabase',
      data,
      timestamp: new Date().toISOString(),
      environment: {
        url: process.env.SUPABASE_URL ? 'configured' : 'missing',
        anonKey: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
        serviceKey: process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'missing'
      }
    });
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    res.status(500).json({
      error: 'Failed to test Supabase connection',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Get Supabase configuration status
router.get('/config-status', (req, res) => {
  const isConfigured = isSupabaseConfigured();
  
  res.json({
    configured: isConfigured,
    timestamp: new Date().toISOString(),
    environment: {
      url: process.env.SUPABASE_URL ? 'configured' : 'missing',
      anonKey: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
      serviceKey: process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'missing'
    }
  });
});

export default router;