/**
 * Supabase Connection Test Utility
 * 
 * This module provides functions to test the Supabase connection
 * and diagnose any issues with connectivity or authentication.
 */

import supabase from './supabaseClient';

export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Test the basic Supabase connection without authentication
 * @returns Promise resolving to a test result
 */
export async function testConnection(): Promise<TestResult> {
  try {
    // Attempt to query a simple table to verify connectivity
    const { data, error } = await supabase
      .from('scenarios')
      .select('id')
      .limit(1);
    
    if (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        details: error
      };
    }
    
    return {
      success: true,
      message: `Connection successful. Database is accessible.`,
      details: { data }
    };
  } catch (error: any) {
    console.error("Supabase connection test error:", error);
    return {
      success: false,
      message: `Connection test threw an error: ${error.message || 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Test the Supabase connection with a specific table
 * @param tableName The name of the table to query
 * @returns Promise resolving to a test result
 */
export async function testTableAccess(tableName: string): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          message: `Table '${tableName}' does not exist or you don't have access to it.`,
          details: error
        };
      }
      
      return {
        success: false,
        message: `Failed to access table '${tableName}': ${error.message}`,
        details: error
      };
    }
    
    return {
      success: true,
      message: `Successfully accessed table '${tableName}'. Retrieved ${data?.length || 0} rows.`,
      details: { data }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error accessing table '${tableName}': ${error.message || 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Run a comprehensive test of the Supabase connection
 * @returns Promise resolving to an array of test results
 */
export async function runComprehensiveTest(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test basic connection
  results.push(await testConnection());
  
  // Test access to known tables
  const tables = ['scenarios', 'properties', 'improvements'];
  for (const table of tables) {
    results.push(await testTableAccess(table));
  }
  
  return results;
}

/**
 * Get diagnostic information about the Supabase connection
 * @returns Object with diagnostic information
 */
export function getDiagnosticInfo() {
  const url = supabase.supabaseUrl;
  // Safely check if auth is defined before accessing properties
  const authSession = supabase.auth && supabase.auth.session && supabase.auth.session();
  
  return {
    url,
    isAuthConfigured: !!supabase.auth,
    hasActiveSession: !!authSession,
    clientType: 'Supabase JS Client',
    clientVersion: 'Latest'
  };
}

export default {
  testConnection,
  testTableAccess,
  runComprehensiveTest,
  getDiagnosticInfo
};