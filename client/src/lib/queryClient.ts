import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient instance for React Query
 * This provides caching and state management for API requests
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (was cacheTime in v4)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Default query function for React Query
 * @param input - URL or Request object
 * @param init - Request init object
 * @returns - Fetch promise
 */
export function getQueryFn({ on401 = 'throw' }: { on401?: 'throw' | 'returnNull' } = {}) {
  return async (context: { queryKey: string | readonly unknown[] }) => {
    // Handle queryKey that might be an array or string
    const queryKey = Array.isArray(context.queryKey) ? context.queryKey[0] : context.queryKey;
    
    if (typeof queryKey !== 'string') {
      throw new Error(`Invalid query key: ${String(queryKey)}`);
    }
    
    const response = await fetch(queryKey);
    
    if (response.status === 401) {
      if (on401 === 'returnNull') {
        return null;
      }
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return null;
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  };
}

/**
 * Helper function for API requests
 * @param method - HTTP method
 * @param url - API endpoint
 * @param data - Request data
 * @returns - Fetch response
 */
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    // Try to parse error as JSON first
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    } catch (e) {
      // If parsing as JSON fails, throw generic error
      if (e instanceof Error && e.message.includes('API Error')) {
        throw e;
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  }
  
  return response;
}