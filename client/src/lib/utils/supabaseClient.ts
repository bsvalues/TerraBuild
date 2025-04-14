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
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbWpmYndrdHl4bGp2Z2N0aG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0OTM3ODksImV4cCI6MjA2MDA2OTc4OX0.-WNRs4iaAF0cYeseSbXYbhPICZ--dZQuJZqCb7pF7EM';

// Validation check to ensure we have the required environment variables
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Missing Supabase environment variables. Using fallback values for development.');
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
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// Utility to check if Supabase is accessible
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Try a lightweight query that doesn't require authentication
    const { error } = await supabase.from('scenarios').select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

export default supabase;