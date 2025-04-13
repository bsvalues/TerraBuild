/**
 * Supabase Proxy Routes
 * 
 * This file defines Express routes that act as a proxy for Supabase requests.
 * It helps bypass CORS issues when accessing Supabase from within Replit.
 */

import express from 'express';
import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseClient } from '../utils/supabaseClient';
import { Request, Response } from 'express';

const router = express.Router();

/**
 * Test the Supabase connection
 */
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    // Test connection by fetching a single record
    const { data, error } = await supabase
      .from('scenarios')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test error:', error);
      return res.status(500).json({
        success: false,
        message: `Connection error: ${error.message}`,
        error
      });
    }
    
    return res.json({
      success: true,
      message: 'Connection successful',
      data
    });
  } catch (error: any) {
    console.error('Supabase connection test exception:', error);
    return res.status(500).json({
      success: false,
      message: `Exception: ${error.message || 'Unknown error'}`,
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
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) {
      return res.status(500).json({
        success: false,
        message: `Table access error: ${error.message}`,
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
    return res.status(500).json({
      success: false,
      message: `Exception: ${error.message || 'Unknown error'}`,
      error: error.toString()
    });
  }
});

/**
 * Get Supabase configuration status
 */
router.get('/config-status', (req: Request, res: Response) => {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  
  // Don't expose the full key in the response
  const hasAnonKey = !!anonKey;
  const anonKeyPreview = hasAnonKey ? 
    `${anonKey.substring(0, 10)}...${anonKey.substring(anonKey.length - 5)}` : 
    'Not configured';
  
  return res.json({
    success: true,
    configured: !!url && hasAnonKey,
    url,
    anonKeyConfigured: hasAnonKey,
    anonKeyPreview
  });
});

/**
 * Execute a query on a table
 */
router.post('/query/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { select, filters, limit = 10 } = req.body;
    
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from(tableName)
      .select(select || '*')
      .limit(limit);
    
    // Apply filters if provided
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({
        success: false,
        message: `Query error: ${error.message}`,
        error
      });
    }
    
    return res.json({
      success: true,
      count: data?.length || 0,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Exception: ${error.message || 'Unknown error'}`,
      error: error.toString()
    });
  }
});

export default router;