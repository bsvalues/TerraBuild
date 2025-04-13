/**
 * Supabase Proxy Routes
 * 
 * This file defines Express routes that act as a proxy for Supabase requests.
 * It helps bypass CORS issues when accessing Supabase from within Replit.
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Create a router
const router = Router();

// Helper function to create a Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Test the Supabase connection
 */
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    
    // Perform a simple query to check connectivity
    const { data, error } = await supabase
      .from('scenarios')
      .select('id')
      .limit(1);
    
    if (error) {
      return res.json({
        success: false,
        message: `Connection error: ${error.message || 'Unknown error'}`,
        error
      });
    }
    
    return res.json({
      success: true,
      message: 'Successfully connected to Supabase',
      count: data?.length || 0,
      data
    });
  } catch (error: any) {
    console.error('Supabase connection test error:', error);
    return res.status(500).json({
      success: false,
      message: `Connection error: ${error.message || 'Unknown error'}`,
      error: error.toString()
    });
  }
});

/**
 * Test access to a specific table
 */
router.get('/test-table/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const supabase = getSupabaseClient();
    
    // Perform a query on the specified table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) {
      return res.json({
        success: false,
        message: `Table access error: ${error.message || 'Unknown error'}`,
        error
      });
    }
    
    return res.json({
      success: true,
      message: `Successfully accessed table '${tableName}'`,
      count: data?.length || 0,
      data
    });
  } catch (error: any) {
    console.error(`Supabase table test error for ${req.params.tableName}:`, error);
    return res.status(500).json({
      success: false,
      message: `Table access error: ${error.message || 'Unknown error'}`,
      error: error.toString()
    });
  }
});

/**
 * Get Supabase configuration status
 */
router.get('/config-status', (req: Request, res: Response) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    // Don't return the actual values, just indicate if they're configured
    const configStatus = {
      supabaseUrlConfigured: !!supabaseUrl,
      supabaseAnonKeyConfigured: !!supabaseAnonKey,
      timestamp: new Date().toISOString()
    };
    
    return res.json({
      success: true,
      message: 'Supabase configuration status retrieved',
      config: configStatus
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Configuration status error: ${error.message || 'Unknown error'}`,
      error: error.toString()
    });
  }
});

/**
 * Execute a query on a table
 */
router.post('/query/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { select, filters, limit } = req.body;
    const supabase = getSupabaseClient();
    
    // Start building the query
    let query = supabase.from(tableName).select(select || '*');
    
    // Apply filters if provided
    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    // Apply limit if provided
    if (limit && typeof limit === 'number') {
      query = query.limit(limit);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      return res.json({
        success: false,
        message: `Query error: ${error.message || 'Unknown error'}`,
        error
      });
    }
    
    return res.json({
      success: true,
      message: `Successfully queried table '${tableName}'`,
      count: data?.length || 0,
      data
    });
  } catch (error: any) {
    console.error(`Supabase query error for ${req.params.tableName}:`, error);
    return res.status(500).json({
      success: false,
      message: `Query error: ${error.message || 'Unknown error'}`,
      error: error.toString()
    });
  }
});

export default router;