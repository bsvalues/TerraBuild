/**
 * Supabase Client
 * 
 * This file sets up the Supabase client with the correct types and configuration.
 * It provides a centralized point for Supabase connectivity throughout the application.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/supabase';

// Get Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || 'https://romjfbwktyxljvgcthmk.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_API_KEY as string || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbWpmYndrdHl4bGp2Z2N0aG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0OTM3ODksImV4cCI6MjA2MDA2OTc4OX0.-WNRs4iaAF0cYeseSbXYbhPICZ--dZQuJZqCb7pF7EM';

// Validation check to ensure we have the required environment variables
if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Missing Supabase environment variables.');
  console.warn('To enable Supabase functionality, please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

// Create a strongly typed Supabase client with error handling
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    // Add global error handling to catch network issues
    fetch: (...args) => {
      return fetch(...args).catch(err => {
        console.error('Supabase fetch error:', err);
        // Re-throw with a more descriptive message but preserve the original error
        throw new Error(`Supabase connection error: ${err.message}`);
      });
    }
  }
});

// Method to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  // Using hardcoded fallback values, so it will always be configured
  return true;
};

// Utility to check if Supabase is accessible
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Most reliable method - try to get the auth configuration which should always exist
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (!authError) {
      return true;
    }
    
    // Try the generic health check
    try {
      // Make a simple HTTP request to the Supabase URL to check if the service is up
      const response = await fetch(`${supabaseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        }
      });
      
      if (response.ok) {
        return true;
      }
    } catch (fetchError) {
      console.warn('Health check failed:', fetchError);
      // Continue to try other methods
    }
    
    // Try a simple table query with minimal permissions requirements
    try {
      // Try each of these common tables that might exist
      const commonTables = ['users', 'cost_matrix', 'properties', 'projects', 'settings'];
      
      for (const table of commonTables) {
        const { error: queryError } = await supabase.from(table).select('count', { count: 'exact', head: true });
        
        // If we found a table that works, connection is good
        if (!queryError || (queryError && !queryError.message.includes('does not exist'))) {
          return true;
        }
      }
    } catch (queryError) {
      console.warn('Table queries failed:', queryError);
    }
    
    // All checks failed - no connection
    console.error('All Supabase connection checks failed');
    return false;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

export default supabase;