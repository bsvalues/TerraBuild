/**
 * Supabase Client
 * 
 * This file sets up the Supabase client with the correct types and configuration.
 * It provides a centralized point for Supabase connectivity throughout the application.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/supabase';
import { toast } from '@/hooks/use-toast';

// Explicitly expose environment variables to make debugging clearer
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const ENV_SUPABASE_API_KEY = import.meta.env.VITE_SUPABASE_API_KEY as string;

// Get Supabase URL and key, with fallbacks for development
const supabaseUrl = ENV_SUPABASE_URL || 'https://romjfbwktyxljvgcthmk.supabase.co';
const supabaseKey = ENV_SUPABASE_ANON_KEY || ENV_SUPABASE_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbWpmYndrdHl4bGp2Z2N0aG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0OTM3ODksImV4cCI6MjA2MDA2OTc4OX0.-WNRs4iaAF0cYeseSbXYbhPICZ--dZQuJZqCb7pF7EM';

// Debug log to console to help troubleshoot environment variable setup
console.log('Supabase configuration:', {
  hasUrlEnv: !!ENV_SUPABASE_URL,
  hasAnonKeyEnv: !!ENV_SUPABASE_ANON_KEY,
  hasApiKeyEnv: !!ENV_SUPABASE_API_KEY,
  usingFallbackUrl: !ENV_SUPABASE_URL,
  usingFallbackKey: !ENV_SUPABASE_ANON_KEY && !ENV_SUPABASE_API_KEY
});

// Validation check to ensure we have the required values
if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Missing Supabase environment variables.');
  console.warn('To enable Supabase functionality, please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  
  // Show toast notification in UI
  toast({
    title: "Supabase Configuration Issue",
    description: "Missing Supabase credentials. Check the console for details.",
    variant: "destructive",
  });
}

// Create a retry-enabled fetch function
const retryFetch = async (url: RequestInfo, options: RequestInit, retries = 3, backoff = 300) => {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries === 0) {
      throw err;
    }
    
    // Wait with exponential backoff before retrying
    await new Promise(resolve => setTimeout(resolve, backoff));
    
    // Retry with decreased retry count and increased backoff
    return retryFetch(url, options, retries - 1, backoff * 2);
  }
};

// Create a strongly typed Supabase client with enhanced error handling
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'bcbs-supabase-auth',
  },
  global: {
    // Add global error handling to catch network issues with retry mechanism
    fetch: async (...args) => {
      try {
        // Use retry mechanism for fetch operations
        return await retryFetch(args[0], args[1] || {}, 3, 300);
      } catch (err) {
        console.error('Supabase fetch error:', err);
        
        // Provide different error messages based on error type
        if (err instanceof TypeError && err.message.includes('fetch')) {
          throw new Error(`Network error connecting to Supabase. Please check your internet connection.`);
        } else if (err instanceof TypeError && err.message.includes('NetworkError')) {
          throw new Error(`CORS error connecting to Supabase. Please check your Supabase configuration.`);
        } else {
          // Generic fallback error
          throw new Error(`Supabase connection error: ${err.message}`);
        }
      }
    },
    // Configure better retry behavior for all Supabase operations
    headers: {
      'x-client-info': 'benton-county-bcbs-app',
    }
  }
});

// Method to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  // Check environment variables first
  const hasEnvVars = !!ENV_SUPABASE_URL && (!!ENV_SUPABASE_ANON_KEY || !!ENV_SUPABASE_API_KEY);
  
  // If we have environment variables, we're properly configured
  if (hasEnvVars) return true;
  
  // Using hardcoded fallback values for development, so return true
  // but this would return false in production if env vars are missing
  return process.env.NODE_ENV === 'development';
};

// Enhanced utility to check if Supabase is accessible with diagnostics
export const checkSupabaseConnection = async (): Promise<boolean> => {
  let diagnostics: string[] = [];
  diagnostics.push(`Testing Supabase connection to: ${supabaseUrl}`);
  
  try {
    // Try a direct REST health check first (fastest)
    try {
      diagnostics.push('Attempting health check endpoint...');
      const healthResponse = await fetch(`${supabaseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        }
      });
      
      if (healthResponse.ok) {
        diagnostics.push('✅ Health check successful!');
        console.info('Supabase diagnostics:', diagnostics.join('\n'));
        return true;
      } else {
        diagnostics.push(`❌ Health check failed with status: ${healthResponse.status}`);
      }
    } catch (healthError) {
      diagnostics.push(`❌ Health check error: ${healthError instanceof Error ? healthError.message : String(healthError)}`);
    }
    
    // Try auth session (reliable but requires auth permissions)
    try {
      diagnostics.push('Attempting auth session check...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (!authError) {
        diagnostics.push('✅ Auth session check successful!');
        console.info('Supabase diagnostics:', diagnostics.join('\n'));
        return true;
      } else {
        diagnostics.push(`❌ Auth session check failed: ${authError.message}`);
      }
    } catch (authCheckError) {
      diagnostics.push(`❌ Auth check error: ${authCheckError instanceof Error ? authCheckError.message : String(authCheckError)}`);
    }
    
    // Try common tables as last resort
    try {
      diagnostics.push('Attempting table queries...');
      // Try each of these common tables that might exist
      const commonTables = ['users', 'cost_matrix', 'properties', 'projects', 'settings', 
                           'cost_factors', 'improvements', 'material_types', 'material_costs',
                           'building_types', 'regions', 'calculation_history'];
      
      let tableSuccesses = 0;
      for (const table of commonTables) {
        try {
          const { error: queryError } = await supabase.from(table).select('count', { count: 'exact', head: true });
          
          // If we found a table that works, connection is good
          if (!queryError) {
            tableSuccesses++;
            diagnostics.push(`✅ Table '${table}' query successful!`);
          } else if (queryError.message.includes('does not exist')) {
            diagnostics.push(`ℹ️ Table '${table}' does not exist`);
          } else {
            diagnostics.push(`❌ Table '${table}' query failed: ${queryError.message}`);
          }
        } catch (tableError) {
          diagnostics.push(`❌ Error querying table '${table}': ${tableError instanceof Error ? tableError.message : String(tableError)}`);
        }
      }
      
      if (tableSuccesses > 0) {
        diagnostics.push(`✅ ${tableSuccesses} table queries successful!`);
        console.info('Supabase diagnostics:', diagnostics.join('\n'));
        return true;
      }
    } catch (tablesError) {
      diagnostics.push(`❌ Tables check error: ${tablesError instanceof Error ? tablesError.message : String(tablesError)}`);
    }
    
    // All checks failed - no connection
    diagnostics.push('⚠️ All Supabase connection checks failed');
    console.error('Supabase diagnostics:', diagnostics.join('\n'));
    return false;
  } catch (error) {
    diagnostics.push(`❌ Overall connection check failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Supabase diagnostics:', diagnostics.join('\n'));
    return false;
  }
};

export default supabase;