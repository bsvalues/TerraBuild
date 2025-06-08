import React, { createContext, ReactNode, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, getQueryFn, apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login?: (username: string, password: string) => Promise<User>;
  logout?: () => Promise<void>;
  register?: (userData: any) => Promise<User>;
  loginMutation?: { mutate: (data: any) => void; isPending: boolean };
  logoutMutation?: { mutate: () => void; isPending: boolean };
  registerMutation?: { mutate: (data: any) => void; isPending: boolean };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
  });

  const authValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login: async (username: string, password: string) => {
      const result = await loginMutation.mutateAsync({ username, password });
      return result;
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    register: async (userData: any) => {
      const result = await registerMutation.mutateAsync(userData);
      return result;
    },
    loginMutation,
    logoutMutation,
    registerMutation,
  };
  
  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return fallback auth state instead of throwing error
    console.warn('useAuth was called outside of AuthProvider - using fallback values');
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      login: async () => ({ id: 1, username: 'demo', name: 'Demo User' } as User),
      logout: async () => {},
      register: async () => ({ id: 1, username: 'demo', name: 'Demo User' } as User),
      loginMutation: { mutate: () => {}, isPending: false },
      logoutMutation: { mutate: () => {}, isPending: false },
      registerMutation: { mutate: () => {}, isPending: false },
    };
  }
  return context;
}