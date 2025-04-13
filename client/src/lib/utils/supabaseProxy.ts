/**
 * Supabase Proxy Service
 * 
 * This module provides a CORS-friendly alternative to direct Supabase calls.
 * It sends requests through our server proxy to avoid CORS issues in Replit.
 */

import axios from 'axios';

// Define types for the responses from our proxy endpoints
export interface ProxyResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}

/**
 * Query a Supabase table through our server proxy
 * @param tableName Name of the table to query
 * @param options Query options including select, filters, and limit
 * @returns Promise resolving to the query results
 */
export async function queryTable<T = any>(
  tableName: string, 
  options: {
    select?: string;
    filters?: Record<string, any>;
    limit?: number;
  } = {}
): Promise<T[]> {
  try {
    const response = await axios.post<ProxyResponse<T[]>>(
      `/api/supabase-proxy/query/${tableName}`,
      options
    );
    
    if (response.data.success) {
      return response.data.data || [];
    } else {
      console.error('Supabase proxy query error:', response.data.message);
      throw new Error(response.data.message || 'Error querying table');
    }
  } catch (error: any) {
    console.error('Supabase proxy error:', error);
    throw error;
  }
}

/**
 * Get a single record by ID from a Supabase table through our server proxy
 * @param tableName Name of the table to query
 * @param id ID of the record to retrieve
 * @param select Fields to select
 * @returns Promise resolving to the record or null if not found
 */
export async function getRecordById<T = any>(
  tableName: string,
  id: number | string,
  select?: string
): Promise<T | null> {
  try {
    const response = await queryTable<T>(tableName, {
      select,
      filters: { id },
      limit: 1
    });
    
    return response && response.length > 0 ? response[0] : null;
  } catch (error) {
    console.error(`Error getting record from ${tableName} by ID ${id}:`, error);
    throw error;
  }
}

/**
 * Check connection status to Supabase through our proxy
 * @returns Promise resolving to connection status information
 */
export async function checkConnection(): Promise<ProxyResponse> {
  try {
    const response = await axios.get<ProxyResponse>('/api/supabase-proxy/test-connection');
    return response.data;
  } catch (error: any) {
    console.error('Error checking Supabase connection:', error);
    return {
      success: false,
      message: error.message || 'Failed to check connection',
      error
    };
  }
}

/**
 * Get Supabase configuration status from our proxy
 * @returns Promise resolving to configuration status information
 */
export async function getConfigStatus(): Promise<ProxyResponse> {
  try {
    const response = await axios.get<ProxyResponse>('/api/supabase-proxy/config-status');
    return response.data;
  } catch (error: any) {
    console.error('Error getting Supabase config status:', error);
    return {
      success: false,
      message: error.message || 'Failed to get configuration status',
      error
    };
  }
}

// Export default as a service object for convenient imports
export default {
  queryTable,
  getRecordById,
  checkConnection,
  getConfigStatus
};