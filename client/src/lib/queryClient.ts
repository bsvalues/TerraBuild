import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

type FetchOptions = {
  on401?: 'throw' | 'returnNull';
  on404?: 'throw' | 'returnNull';
};

/**
 * Get a query function that fetches from the API
 */
export const getQueryFn = (options: FetchOptions = {}) => {
  return async ({ queryKey }: { queryKey: string[] }) => {
    const path = queryKey[0];
    const res = await fetch(path);

    if (res.status === 401 && options.on401 === 'returnNull') {
      return null;
    }

    if (res.status === 404 && options.on404 === 'returnNull') {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
    }

    return res.json();
  };
};

/**
 * Make an API request with the given method and body
 */
export const apiRequest = async (
  method: 'POST' | 'PATCH' | 'DELETE', 
  url: string, 
  body?: unknown
) => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API request failed: ${response.statusText}`);
  }

  return response;
};