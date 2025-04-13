/**
 * Supabase Connection Test Utility
 * 
 * This module provides functions to test the Supabase connection
 * and diagnose any issues with connectivity or authentication.
 */

import axios from 'axios';
import { supabase } from './supabaseClient';

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
    // Use proxy endpoint instead of direct Supabase connection
    const response = await axios.get('/api/supabase-proxy/test-connection');
    
    if (response.data.success) {
      return {
        success: true,
        message: 'Successfully connected to Supabase through proxy',
        details: response.data
      };
    } else {
      return {
        success: false,
        message: `Connection error: ${response.data.message}`,
        details: response.data
      };
    }
  } catch (error: any) {
    console.error('Supabase connection test error:', error);
    return {
      success: false,
      message: `Connection failed: ${error.message || 'Unknown error'}`,
      details: error.response?.data || error
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
    // Use proxy endpoint instead of direct Supabase connection
    const response = await axios.get(`/api/supabase-proxy/test-table/${tableName}`);
    
    if (response.data.success) {
      return {
        success: true,
        message: `Successfully accessed table '${tableName}' (${response.data.count} records)`,
        details: response.data
      };
    } else {
      return {
        success: false,
        message: `Table access error: ${response.data.message}`,
        details: response.data
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Table access failed: ${error.message || 'Unknown error'}`,
      details: error.response?.data || error
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
  const connectionTest = await testConnection();
  results.push(connectionTest);
  
  // If connection is successful, test some key tables
  if (connectionTest.success) {
    const tableTests = await Promise.all([
      testTableAccess('scenarios'),
      testTableAccess('users'),
      testTableAccess('projects')
    ]);
    
    results.push(...tableTests);
  }
  
  // Test configuration
  try {
    const configResponse = await axios.get('/api/supabase-proxy/config-status');
    results.push({
      success: true,
      message: 'Retrieved Supabase configuration',
      details: configResponse.data
    });
  } catch (error: any) {
    results.push({
      success: false,
      message: `Configuration check failed: ${error.message}`,
      details: error.response?.data || error
    });
  }
  
  return results;
}

/**
 * Get diagnostic information about the Supabase connection
 * @returns Object with diagnostic information
 */
export function getDiagnosticInfo() {
  const diagnosticInfo: Record<string, any> = {};
  
  try {
    // Get client-side information only, without exposing sensitive data
    // We can't directly access supabase.supabaseUrl due to it being protected
    diagnosticInfo.configured = supabase && true;
    
    // We don't want to expose actual key values, just check if they exist
    const hasAuthSession = supabase.auth && true;
    diagnosticInfo.authConfigured = hasAuthSession;
    
    // API version information
    diagnosticInfo.clientVersion = '@supabase/supabase-js client';
    diagnosticInfo.timestamp = new Date().toISOString();
  } catch (error: any) {
    diagnosticInfo.error = error.message;
  }
  
  return diagnosticInfo;
}