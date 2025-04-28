import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AuthErrorBoundary } from "@/components/auth/auth-error-boundary";

// Define the base authentication context types based on AuthContext from AuthContext.tsx
interface BaseAuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login?: (username: string, password: string) => Promise<any>;
  logout?: () => Promise<void>;
  register?: (userData: any) => Promise<any>;
  error: Error | null;
}

// Extended auth context type that includes initialization state
interface EnhancedAuthContextType extends BaseAuthContextType {
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<any>;
}

// Create a context that will be used by components to access the enhanced auth state
export const EnhancedAuthContext = createContext<EnhancedAuthContextType | null>(null);

interface EnhancedAuthProviderProps {
  children: ReactNode;
}

/**
 * Enhanced authentication provider that adds error handling and logging
 * Wraps the standard AuthProvider with additional functionality
 */
export function EnhancedAuthProvider({ children }: EnhancedAuthProviderProps) {
  // Get the original auth context data
  const auth = useAuth();
  const { toast } = useToast();
  
  // Add initialization state
  const [isInitializing, setIsInitializing] = useState(true);

  // Simulate initialization to show how we'd handle this
  useEffect(() => {
    console.log("Initializing authentication system");
    
    // Simulate a short initialization process
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle authentication errors
  useEffect(() => {
    if (auth.error) {
      console.error("Authentication error:", auth.error);
      
      // Show toast notification for auth errors
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: auth.error.message || "There was a problem with authentication",
      });
    }
  }, [auth.error, toast]);

  // Enhanced login with better error handling
  const enhancedLogin = async (username: string, password: string) => {
    try {
      if (auth.login) {
        const user = await auth.login(username, password);
        toast({
          description: "Successfully logged in",
        });
        return user;
      } else {
        throw new Error("Login function not available");
      }
    } catch (error) {
      console.error("Login error:", error);
      // Error will be handled by the auth provider itself
      throw error;
    }
  };

  // Enhanced logout with better feedback
  const enhancedLogout = async () => {
    try {
      if (auth.logout) {
        await auth.logout();
        // The toast is shown by the component that calls logout
      } else {
        throw new Error("Logout function not available");
      }
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Enhanced register with improved error handling
  const enhancedRegister = async (userData: any) => {
    try {
      if (auth.register) {
        await auth.register(userData);
        toast({
          description: "Registration successful",
        });
      } else {
        throw new Error("Register function not available");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Create the enhanced context value with the correct function types
  const enhancedAuthValue: EnhancedAuthContextType = {
    user: auth.user,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    error: auth.error,
    isInitializing,
    login: enhancedLogin,
    logout: enhancedLogout,
    register: enhancedRegister
  };

  // Wrap everything in our error boundary for better error handling
  return (
    <AuthErrorBoundary>
      <EnhancedAuthContext.Provider value={enhancedAuthValue}>
        {children}
      </EnhancedAuthContext.Provider>
    </AuthErrorBoundary>
  );
}

/**
 * Custom hook to use the enhanced auth context
 * This hook provides type safety and error handling
 */
export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext);
  
  if (!context) {
    throw new Error("useEnhancedAuth must be used within an EnhancedAuthProvider");
  }
  
  return context;
}