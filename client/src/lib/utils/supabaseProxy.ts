/**
 * Supabase Proxy Service
 * 
 * This module provides a CORS-friendly alternative to direct Supabase calls.
 * It sends requests through our server proxy to avoid CORS issues in Replit.
 */

import { apiRequest } from "@/lib/queryClient";
import axios from "axios";

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
  const response = await axios.post<ProxyResponse<T[]>>(
    `/api/supabase-proxy/query/${tableName}`,
    options
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to query table");
  }

  return response.data.data || [];
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
 * Insert a record into a Supabase table through our server proxy
 * @param tableName Name of the table to insert into
 * @param data Data to insert
 * @returns Promise resolving to the inserted record
 */
export async function insertRecord<T = any, U = any>(
  tableName: string,
  data: U
): Promise<T> {
  const response = await axios.post<ProxyResponse<T>>(
    `/api/supabase-proxy/insert/${tableName}`,
    { data }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to insert record");
  }

  return response.data.data as T;
}

/**
 * Update a record in a Supabase table through our server proxy
 * @param tableName Name of the table to update
 * @param id ID of the record to update
 * @param data Data to update
 * @returns Promise resolving to the updated record
 */
export async function updateRecord<T = any, U = any>(
  tableName: string,
  id: number | string,
  data: U
): Promise<T> {
  const response = await axios.post<ProxyResponse<T>>(
    `/api/supabase-proxy/update/${tableName}/${id}`,
    { data }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update record");
  }

  return response.data.data as T;
}

/**
 * Delete a record from a Supabase table through our server proxy
 * @param tableName Name of the table to delete from
 * @param id ID of the record to delete
 * @returns Promise resolving to success status
 */
export async function deleteRecord(
  tableName: string,
  id: number | string
): Promise<boolean> {
  const response = await axios.delete<ProxyResponse>(
    `/api/supabase-proxy/delete/${tableName}/${id}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to delete record");
  }

  return true;
}

/**
 * Upload a file to Supabase storage through our server proxy
 * @param bucketName Name of the storage bucket
 * @param file File to upload
 * @param path Optional path within the bucket (default: filename)
 * @returns Promise resolving to the file URL
 */
export async function uploadFile(
  bucketName: string,
  file: File,
  path?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucketName);
  
  if (path) {
    formData.append('path', path);
  }

  const response = await axios.post<ProxyResponse<{url: string}>>(
    `/api/supabase-proxy/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to upload file");
  }

  return response.data.data?.url || '';
}

/**
 * Import a data file directly to the database
 * @param fileType Type of file being imported (e.g., 'cost-matrix', 'property-data')
 * @param fileId ID of the uploaded file in the system
 * @param options Additional import options
 * @returns Promise resolving to import results
 */
export async function importDataFile<T = any>(
  fileType: string,
  fileId: number | string,
  options: Record<string, any> = {}
): Promise<T> {
  const response = await axios.post<ProxyResponse<T>>(
    `/api/supabase-proxy/import/${fileType}`,
    { fileId, ...options }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to import data file");
  }

  return response.data.data as T;
}

/**
 * Check connection status to Supabase through our proxy
 * @returns Promise resolving to connection status information
 */
export async function checkConnection(): Promise<ProxyResponse> {
  const response = await axios.get<ProxyResponse>("/api/supabase-proxy/test-connection");
  return response.data;
}

/**
 * Get Supabase configuration status from our proxy
 * @returns Promise resolving to configuration status information
 */
export async function getConfigStatus(): Promise<ProxyResponse> {
  const response = await axios.get<ProxyResponse>("/api/supabase-proxy/config-status");
  return response.data;
}

const supabaseProxy = {
  queryTable,
  getRecordById,
  insertRecord,
  updateRecord,
  deleteRecord,
  uploadFile,
  importDataFile,
  checkConnection,
  getConfigStatus,
};

export default supabaseProxy;