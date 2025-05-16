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
 * @param method - HTTP method (GET, POST, etc.)
 * @param url - API endpoint
 * @param data - Optional data to send with request
 * @returns - Response object
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: any
): Promise<Response> {
  const options: RequestInit = {
    method: method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  // Add body for non-GET requests with data
  if (method !== 'GET' && data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error(`API ${method} request to ${url} failed:`, error);
    throw error;
  }
}