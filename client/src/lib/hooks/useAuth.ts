import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

type User = {
  id: number;
  username: string;
  name: string | null;
  role: string;
  isActive: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const { 
    data: user, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<User>({ 
    queryKey: ['/api/user'], 
    retry: false,
    refetchOnWindowFocus: false
  });
  
  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!isLoading && !user && !isRedirecting && window.location.pathname !== '/auth') {
      setIsRedirecting(true);
      setLocation('/auth');
    }
  }, [isLoading, user, setLocation, isRedirecting]);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      // Refetch the user data
      await refetch();
      
      // Redirect to dashboard on successful login
      setLocation('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Clear user data
      await refetch();
      
      // Redirect to login page
      setLocation('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user: user || null,
    isLoading,
    isError: !!error,
    login,
    logout,
  };

  // Create element using React.createElement
  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}