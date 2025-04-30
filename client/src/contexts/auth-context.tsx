import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';

// Define authentication methods available in the system
type AuthMethod = "county-network" | "local";

// Define User interface
export interface User {
  id: number;
  username: string;
  name: string | null;
  role: string;
  is_active: boolean;
}

// Define RegisterData interface
export interface RegisterData {
  username: string;
  password: string;
  name?: string;
  email: string;
}

// Define the auth context type
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<User>;
  error: Error | null;
  // County network specific props
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  // Convenience methods for mutations
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Main Authentication Provider
 * Provides authentication functionality with county network support
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("county-network");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check if in development environment for mock auth
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Query for current user
  const { isLoading, data: fetchedUser, error: fetchError } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        if (isDevelopment) {
          console.log("Setting up mock admin user for development");
          // Use mock user in development to simplify testing
          const mockUser: User = {
            id: 1,
            username: "admin",
            name: "Admin User",
            role: "admin",
            is_active: true
          };
          return mockUser;
        }
        
        console.log("Fetching current user");
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated, return null
            return null;
          }
          throw new Error('Failed to fetch user');
        }
        
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        throw err;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Update user state when fetched user changes
  useEffect(() => {
    if (fetchedUser) {
      setUser(fetchedUser);
    }
    if (fetchError) {
      setError(fetchError instanceof Error ? fetchError : new Error('Unknown error'));
    }
  }, [fetchedUser, fetchError]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      try {
        if (isDevelopment) {
          console.log("Intercepting auth request in development mode");
          return {
            id: 1,
            username: "admin",
            name: "Admin User",
            role: "admin",
            is_active: true
          };
        }

        // Use the appropriate endpoint based on auth method
        const endpoint = authMethod === 'county-network' ? '/api/county-login' : '/api/login';
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }));
          throw new Error(errorData.message || 'Authentication failed');
        }
        
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Login failed'));
        throw err;
      }
    },
    onSuccess: (userData) => {
      setUser(userData);
      setError(null);
      queryClient.setQueryData(['/api/user'], userData);
      toast({
        description: `Successfully logged in ${authMethod === 'county-network' ? 'via County Network' : ''}`,
      });
    },
    onError: (error: Error) => {
      setError(error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        if (isDevelopment) {
          return; // No-op in development
        }
        
        const response = await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Logout failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Logout failed'));
        throw err;
      }
    },
    onSuccess: () => {
      setUser(null);
      setError(null);
      queryClient.setQueryData(['/api/user'], null);
      toast({
        description: "Successfully logged out",
      });
    },
    onError: (error: Error) => {
      setError(error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "There was a problem logging you out. Please try again.",
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (registerData: RegisterData) => {
      try {
        if (isDevelopment) {
          return {
            id: 1,
            username: registerData.username,
            name: registerData.name || "New User",
            role: "user",
            is_active: true
          };
        }
        
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
          throw new Error(errorData.message || 'Registration failed');
        }
        
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Registration failed'));
        throw err;
      }
    },
    onSuccess: (userData) => {
      setUser(userData);
      setError(null);
      queryClient.setQueryData(['/api/user'], userData);
      toast({
        description: "Registration successful",
      });
    },
    onError: (error: Error) => {
      setError(error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "There was a problem creating your account. Please try again.",
      });
    }
  });

  // Convenience methods that use the mutations
  const login = async (username: string, password: string) => {
    return await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const register = async (userData: RegisterData) => {
    return await registerMutation.mutateAsync(userData);
  };

  // Create the auth context value
  const value: AuthContextType = {
    user,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    error,
    authMethod,
    setAuthMethod,
    loginMutation,
    logoutMutation,
    registerMutation
  };

  return (
    <AuthErrorBoundary>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </AuthErrorBoundary>
  );
}