/**
 * Supabase Proxy Routes
 * 
 * This file defines Express routes that act as a proxy for Supabase requests.
 * It helps bypass CORS issues when accessing Supabase from within Replit.
 */

import { Router, Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const router = Router();

/**
 * Get the Supabase client with environment credentials
 */
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase configuration missing in environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Test the Supabase connection
 */
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      return res.json({
        success: false,
        message: `Connection failed: ${error.message}`,
        error: error
      });
    }
    
    return res.json({
      success: true,
      message: 'Successfully connected to Supabase',
      data: data
    });
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Error connecting to Supabase: ${err.message}`,
      error: err
    });
  }
});

/**
 * Test access to a specific table
 */
router.get('/test-table/:tableName', async (req: Request, res: Response) => {
  const { tableName } = req.params;
  
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from(tableName).select('count').limit(1);
    
    if (error) {
      return res.json({
        success: false,
        message: `Access to table '${tableName}' failed: ${error.message}`,
        error: error
      });
    }
    
    return res.json({
      success: true,
      message: `Successfully accessed table '${tableName}'`,
      data: data
    });
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Error accessing table '${tableName}': ${err.message}`,
      error: err
    });
  }
});

/**
 * Get Supabase configuration status
 */
router.get('/config-status', (req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  return res.json({
    success: true,
    data: {
      configured: !!(supabaseUrl && (supabaseServiceKey || supabaseAnonKey)),
      urlConfigured: !!supabaseUrl,
      serviceKeyConfigured: !!supabaseServiceKey,
      anonKeyConfigured: !!supabaseAnonKey
    }
  });
});

/**
 * Execute a query on a table
 */
router.post('/query/:tableName', async (req: Request, res: Response) => {
  const { tableName } = req.params;
  const { select, filters, limit } = req.body;
  
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from(tableName).select(select || '*');
    
    // Apply filters if provided
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    // Apply limit if provided
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.json({
        success: false,
        message: `Query on table '${tableName}' failed: ${error.message}`,
        error: error
      });
    }
    
    return res.json({
      success: true,
      message: `Successfully queried table '${tableName}'`,
      data: data
    });
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Error querying table '${tableName}': ${err.message}`,
      error: err
    });
  }
});

export default router;