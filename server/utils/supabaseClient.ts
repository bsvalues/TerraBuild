/**
 * Supabase Client Utility
 * 
 * This file provides a configured Supabase client that can be used
 * throughout the server for database operations. It connects to the
 * Supabase project using environment variables.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables (with fallbacks for local development)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Validate required environment variables
if (!supabaseUrl) {
  console.error('ERROR: Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  console.error('ERROR: Missing SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY environment variable');
}

let supabase: SupabaseClient | null = null;

/**
 * Get the Supabase client instance
 * 
 * @returns SupabaseClient The configured Supabase client
 * @throws Error if environment variables are missing
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    // Throw error if environment variables are missing
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are missing. Please check your .env file.');
    }
    
    // Create and configure the Supabase client
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    console.log('Supabase client initialized');
  }
  
  return supabase;
}

/**
 * Check if the Supabase connection is properly configured
 * 
 * @returns boolean True if Supabase is configured, false otherwise
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

/**
 * Test the Supabase connection
 * 
 * @returns Promise<boolean> True if connection is successful
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { 
        success: false, 
        message: 'Supabase environment variables are missing' 
      };
    }
    
    const client = getSupabaseClient();
    // Test a simple query to verify connection
    const { data, error } = await client.from('scenarios').select('count').limit(1);
    
    if (error) {
      return { 
        success: false, 
        message: `Supabase connection failed: ${error.message}` 
      };
    }
    
    return { 
      success: true, 
      message: 'Successfully connected to Supabase' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Supabase connection error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}