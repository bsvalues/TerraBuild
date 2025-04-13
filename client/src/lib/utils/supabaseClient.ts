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

// Create a strongly typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Method to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

export default supabase;