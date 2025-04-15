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
 * Get the Supabase URL from environment variables
 * @returns The Supabase URL or null if not configured
 */
export function getSupabaseUrl(): string | null {
  return process.env.SUPABASE_URL || null;
}

/**
 * Get the Supabase anonymous key from environment variables
 * @returns The Supabase anonymous key or null if not configured
 */
export function getSupabaseAnonKey(): string | null {
  return process.env.SUPABASE_ANON_KEY || null;
}

/**
 * Get the Supabase service key from environment variables
 * @returns The Supabase service key or null if not configured
 */
export function getSupabaseServiceKey(): string | null {
  // If we get a service key from environment, use it, otherwise use anon key
  return process.env.SUPABASE_SERVICE_KEY || getSupabaseAnonKey();
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