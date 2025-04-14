/**
 * Authentication Context Provider
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, login as authLogin, logout as authLogout, apiRequest, isAuthenticated } from '@/lib/auth';

// Auth context interface
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

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
      try {
        const response = await apiRequest('/api/user');
        if (!response.ok) {
          throw new Error('Not authenticated');
        }
        return response.json();
      } catch (err) {
        // In development, return a mock user
        if (process.env.NODE_ENV === 'development') {
          return {
            id: 1,
            username: 'admin',
            name: 'Admin User',
            role: 'admin',
            isActive: true
          };
        }
        throw err;
      }
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

  // Login function wrapper
  const login = async (username: string, password: string) => {
    try {
      setError(null);
      await authLogin(username, password);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    }
  };

  // Logout function wrapper
  const logout = async () => {
    try {
      setError(null);
      await authLogout();
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
      throw err;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    user: user || null,
    isAuthenticated: isAuthenticated(user),
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