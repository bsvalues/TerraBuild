/**
 * Supabase Client Utility
 * 
 * This module provides a singleton Supabase client for connecting to the Supabase
 * database. It ensures that only one client instance is created regardless of
 * how many times the module is imported.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Using any for Database type until full database schema is defined
type Database = any;

// Keep track of the singleton client instance
let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Get the Supabase URL from environment variables or use the hardcoded value
 * @returns The Supabase URL
 */
export function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL || 'https://romjfbwktyxljvgcthmk.supabase.co';
}

/**
 * Get the Supabase anonymous key from environment variables or use the hardcoded value
 * @returns The Supabase anonymous key
 */
export function getSupabaseAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbWpmYndrdHl4bGp2Z2N0aG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0OTM3ODksImV4cCI6MjA2MDA2OTc4OX0.-WNRs4iaAF0cYeseSbXYbhPICZ--dZQuJZqCb7pF7EM';
}

/**
 * Get the Supabase service key from environment variables or use the hardcoded value
 * @returns The Supabase service key
 */
export function getSupabaseServiceKey(): string {
  // If we get a service key from environment, use it, otherwise use anon key or fallback
  return process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_API_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbWpmYndrdHl4bGp2Z2N0aG1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ5Mzc4OSwiZXhwIjoyMDYwMDY5Nzg5fQ.UWhLtKDfjQnmUjzx0CM7PWAXl_BPIj2gGiR27031fgU';
}

/**
 * Check if Supabase is configured by checking the required environment variables
 * @returns true if Supabase is configured, false otherwise
 */
export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const serviceKey = getSupabaseServiceKey();
  
  return !!url && (!!anonKey || !!serviceKey);
}

/**
 * Create a new Supabase client
 * @param useServiceKey - If true, uses the service key instead of the anonymous key
 * @returns A new Supabase client
 */
export function createSupabaseClient(useServiceKey = false): SupabaseClient<Database> {
  const url = getSupabaseUrl();
  const key = useServiceKey ? getSupabaseServiceKey() : getSupabaseAnonKey();
  
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  
  return createClient<Database>(url, key);
}

/**
 * Get the Supabase client singleton instance, creating it if it doesn't exist
 * @param useServiceKey - If true, uses the service key instead of the anonymous key
 * @returns The Supabase client singleton instance
 */
export function getSupabaseClient(useServiceKey = false): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient(useServiceKey);
  }
  return supabaseClient;
}

/**
 * Reset the Supabase client singleton instance
 * Useful for testing or when environment variables change
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}