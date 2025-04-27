import React, { createContext, ReactNode, useContext } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';
import { User } from '@shared/schema';

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login?: (username: string, password: string) => Promise<User>;
  logout?: () => Promise<void>;
  register?: (userData: any) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthHook();
  
  // Add dummy methods for backward compatibility with existing components
  const enhancedAuth: AuthContextType = {
    ...auth,
    login: async (username: string, password: string) => {
      console.log('Login method called with:', username);
      // This will redirect to the Replit Auth login page
      window.location.href = '/api/login';
      return {} as User; // This won't actually be returned due to redirect
    },
    logout: async () => {
      console.log('Logout method called');
      // This will redirect to the Replit Auth logout page
      window.location.href = '/api/logout';
    },
    register: async (userData: any) => {
      console.log('Register method called with:', userData);
      // For Replit Auth, registration is handled by Replit
      window.location.href = '/api/login';
      return {} as User; // This won't actually be returned due to redirect
    }
  };
  
  return (
    <AuthContext.Provider value={enhancedAuth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}