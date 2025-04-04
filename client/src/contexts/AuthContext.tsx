/**
 * Authentication Context Provider
 * 
 * This context provides state and methods for authentication in the application.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// User interface
interface User {
  id: number;
  username: string;
  name?: string;
  role: string;
  isActive: boolean;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  // Fetch current user data
  const { 
    data: user, 
    isLoading, 
    isError, 
    error: queryError,
    refetch 
  } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest('/api/user');
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Handle query error
  useEffect(() => {
    if (isError && queryError) {
      setError(queryError instanceof Error ? queryError : new Error('Authentication error'));
    } else {
      setError(null);
    }
  }, [isError, queryError]);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      // Refetch the user data after successful login
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setError(null);
      await apiRequest('/api/auth/logout', { method: 'POST' });
      
      // Clear user from query cache
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
      throw err;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}