import { QueryClient } from '@tanstack/react-query';

/**
 * Configure the React Query client 
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Utility to make API requests
 * @param url - API endpoint
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data;
}

/**
 * Utility to check if secrets are available
 * @param keys - Array of secret keys to check
 * @returns Promise with the check result
 */
export async function check_secrets(keys: string[]) {
  try {
    const response = await fetch('/api/check-secrets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keys }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking secrets:', error);
    return { available: false };
  }
}