import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseTestRouter = Router();

// Simple test to check if Supabase is configured
supabaseTestRouter.get('/config-status', async (req, res) => {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.json({
        configured: false,
        message: 'Supabase environment variables are not set'
      });
    }
    
    // Create the Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try a simple request to test the connection
    const { error } = await supabase.from('scenarios').select('count');
    
    // If the error is about the table not existing, we still consider it configured
    if (error && error.code === '42P01') { // "relation does not exist"
      return res.json({
        configured: true,
        message: 'Supabase connection successful. Tables not yet created.'
      });
    } else if (error) {
      console.error('Supabase connection error:', error);
      return res.json({
        configured: false,
        message: `Supabase connection error: ${error.message}`
      });
    }
    
    return res.json({
      configured: true,
      message: 'Supabase connection successful'
    });
  } catch (err) {
    console.error('Error checking Supabase configuration:', err);
    return res.json({
      configured: false,
      message: `Error checking Supabase configuration: ${err instanceof Error ? err.message : String(err)}`
    });
  }
});

// Test connection with more details
supabaseTestRouter.get('/test-connection', async (req, res) => {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        message: 'Supabase environment variables are not set',
        details: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      });
    }
    
    // Create the Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Attempt to query the database version
    const { data, error } = await supabase.rpc('get_pg_version');
    
    if (error) {
      // If the function doesn't exist, try a direct version query
      if (error.code === '42883') { // undefined_function
        const versionQuery = await supabase.rpc('pgexec', {
          query: 'SELECT version();'
        });
        
        if (versionQuery.error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to query database version',
            error: versionQuery.error
          });
        }
        
        return res.json({
          success: true,
          message: 'Supabase connection successful',
          version: versionQuery.data
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to Supabase',
        error: error
      });
    }
    
    return res.json({
      success: true,
      message: 'Successfully connected to Supabase',
      version: data
    });
  } catch (err) {
    console.error('Error testing Supabase connection:', err);
    return res.status(500).json({
      success: false,
      message: 'Error testing Supabase connection',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// Create pgexec function if it doesn't exist
supabaseTestRouter.post('/create-pgexec', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        message: 'Supabase environment variables are not set'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // SQL to create the pgexec function
    const createFunctionSql = `
    CREATE OR REPLACE FUNCTION pgexec(query text)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result JSONB;
    BEGIN
      EXECUTE query INTO result;
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'error', SQLERRM,
        'code', SQLSTATE
      );
    END;
    $$;
    `;
    
    // Execute the SQL to create the function
    const { error } = await supabase.rpc('pgexec', {
      query: createFunctionSql
    });
    
    if (error) {
      // If pgexec doesn't exist, we need to create it via SQL API (if available)
      console.error('Failed to create pgexec function:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create pgexec function',
        error: error
      });
    }
    
    return res.json({
      success: true,
      message: 'Successfully created pgexec function'
    });
  } catch (err) {
    console.error('Error creating pgexec function:', err);
    return res.status(500).json({
      success: false,
      message: 'Error creating pgexec function',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

export default supabaseTestRouter;