/**
 * Auth Utilities Module
 * 
 * This module provides the core auth functions without any circular dependencies.
 * Used by both AuthContext and the useAuth hook.
 */

import { queryClient } from './queryClient';

// User interface
export interface User {
  id: number;
  username: string;
  name?: string;
  role: string;
  isActive: boolean;
}

// API request utility
export const apiRequest = async (url: string, options = {}) => {
  const defaultOptions = { method: 'GET', headers: {} };
  const fetchOptions = { ...defaultOptions, ...options };
  
  try {
    // For development/testing
    if (process.env.NODE_ENV === 'development' && url === '/api/user') {
      return {
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          username: 'admin',
          name: 'Admin User',
          role: 'admin',
          isActive: true
        })
      };
    }
    
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (err) {
    console.error('API request error:', err);
    throw err;
  }
};

// Login function
export const login = async (username: string, password: string) => {
  try {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      queryClient.setQueryData(['/api/user'], {
        id: 1,
        username,
        name: 'Admin User',
        role: 'admin',
        isActive: true
      });
      return;
    }
    
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    // Refetch the user data after successful login
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  } catch (err) {
    throw err instanceof Error ? err : new Error('Login failed');
  }
};

// Logout function
export const logout = async () => {
  try {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      queryClient.setQueryData(['/api/user'], null);
      return;
    }
    
    await apiRequest('/api/auth/logout', { method: 'POST' });
    
    // Clear user from query cache
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  } catch (err) {
    throw err instanceof Error ? err : new Error('Logout failed');
  }
};

// Check if a user is authenticated
export const isAuthenticated = (user: User | null | undefined): boolean => {
  return !!user;
};

// Get a mock user for development environment
export const getMockUser = (): User => {
  return {
    id: 1,
    username: 'admin',
    name: 'Admin User',
    role: 'admin',
    isActive: true
  };
};