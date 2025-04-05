import { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Helper function to make API requests using fetch
 * This provides consistent error handling and response parsing
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  // Handle non-2xx responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || response.statusText || 'Unknown error';
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  // Return empty object for 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  // Parse and return JSON response
  return response.json();
}

/**
 * Common query function for TanStack Query
 * @param queryKey - Query key array or string
 */
export function getQueryFn({ queryKey }: { queryKey: QueryKey }) {
  // Convert queryKey to URL string if it's an array
  const url = Array.isArray(queryKey) 
    ? queryKey[0] as string
    : queryKey as string;
    
  // Additional parameters can be passed in the queryKey array
  const params = Array.isArray(queryKey) && queryKey.length > 1 
    ? queryKey[1]
    : undefined;
  
  // Apply params as query string if provided
  const urlWithParams = params 
    ? `${url}${url.includes('?') ? '&' : '?'}${new URLSearchParams(params as any).toString()}`
    : url;
  
  return apiRequest(urlWithParams);
}

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      queryFn: async ({ queryKey }) => {
        // Convert queryKey to URL string if it's an array
        const url = Array.isArray(queryKey) 
          ? queryKey[0] as string
          : queryKey as string;
          
        // Additional parameters can be passed in the queryKey array
        const params = Array.isArray(queryKey) && queryKey.length > 1 
          ? queryKey[1]
          : undefined;
        
        // Apply params as query string if provided
        const urlWithParams = params 
          ? `${url}${url.includes('?') ? '&' : '?'}${new URLSearchParams(params as any).toString()}`
          : url;
        
        return apiRequest(urlWithParams);
      },
    },
  },
});