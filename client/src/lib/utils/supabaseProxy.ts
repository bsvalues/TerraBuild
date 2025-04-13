/**
 * Supabase Proxy Service
 * 
 * This module provides a CORS-friendly alternative to direct Supabase calls.
 * It sends requests through our server proxy to avoid CORS issues in Replit.
 */

import { apiRequest } from "@/lib/queryClient";

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
  const response = await apiRequest<ProxyResponse<T[]>>({
    url: `/api/supabase-proxy/query/${tableName}`,
    method: "POST",
    data: options,
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to query table");
  }

  return response.data || [];
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
  const response = await queryTable<T>(tableName, {
    select,
    filters: { id },
    limit: 1,
  });

  return response.length > 0 ? response[0] : null;
}

/**
 * Check connection status to Supabase through our proxy
 * @returns Promise resolving to connection status information
 */
export async function checkConnection(): Promise<ProxyResponse> {
  return apiRequest<ProxyResponse>({
    url: "/api/supabase-proxy/test-connection",
    method: "GET",
  });
}

/**
 * Get Supabase configuration status from our proxy
 * @returns Promise resolving to configuration status information
 */
export async function getConfigStatus(): Promise<ProxyResponse> {
  return apiRequest<ProxyResponse>({
    url: "/api/supabase-proxy/config-status",
    method: "GET",
  });
}

const supabaseProxy = {
  queryTable,
  getRecordById,
  checkConnection,
  getConfigStatus,
};

export default supabaseProxy;