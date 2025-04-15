import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  name: string | null;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<User>;
}

interface RegisterData {
  username: string;
  password: string;
  name?: string;
  email: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  // Mock user data to bypass authentication
  const mockUser: User = {
    id: 1,
    username: "admin",
    name: "Admin User",
    role: "admin",
    is_active: true
  };
  
  const [user, setUser] = useState<User | null>(mockUser);
  const queryClient = useQueryClient();

  // Set mock user data in query cache
  useEffect(() => {
    queryClient.setQueryData(['user'], mockUser);
  }, [queryClient]);
  
  // Mock query to avoid actual API call
  const { isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      // Return mock user without API call
      return mockUser;
    },
    initialData: mockUser,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/logout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // Additionally, clear other relevant cached data
      queryClient.clear();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (registerData: RegisterData) => {
      const response = await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const login = async (username: string, password: string) => {
    const result = await loginMutation.mutateAsync({ username, password });
    return result;
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const register = async (userData: RegisterData) => {
    const result = await registerMutation.mutateAsync(userData);
    return result;
  };

  const value = {
    user,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!user,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}