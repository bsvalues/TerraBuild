import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AuthErrorBoundary } from "@/components/auth/auth-error-boundary";

// Define authentication methods available in the system
type AuthMethod = "county-network" | "local" | "replit";

// Define the base authentication context types based on useAuth hook
interface BaseAuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

// Extended auth context type that includes initialization state
interface EnhancedAuthContextType extends BaseAuthContextType {
  isInitializing: boolean;
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
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
  // Track which authentication method is being used
  const [authMethod, setAuthMethod] = useState<AuthMethod>("county-network");

  // Simulate initialization to show how we'd handle this
  useEffect(() => {
    console.log("Initializing authentication system");
    
    // Try to detect if we're running in the county network
    const checkNetworkAuth = async () => {
      try {
        // This would be a real network check in production
        const isCountyNetwork = window.location.hostname.includes('county') || 
                               window.location.hostname.includes('terrafusion');
        
        // Set the appropriate auth method based on environment
        setAuthMethod(isCountyNetwork ? "county-network" : "local");
        
        // Finish initialization
        setIsInitializing(false);
      } catch (error) {
        console.error("Error detecting network environment:", error);
        // Default to local auth if detection fails
        setAuthMethod("local");
        setIsInitializing(false);
      }
    };
    
    // Run the network check
    checkNetworkAuth();
  }, []);

  // Handle authentication errors with better error checking
  useEffect(() => {
    if (auth.error) {
      console.error("Authentication error:", auth.error);
      
      // Make sure we have a valid error with a message before showing toast
      const errorMessage = auth.error instanceof Error 
        ? auth.error.message 
        : typeof auth.error === 'string'
          ? auth.error
          : "There was a problem with authentication";
      
      // Show toast notification for auth errors
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
    }
  }, [auth.error, toast]);

  // Enhanced login with better error handling and auth method support
  const enhancedLogin = async (username: string, password: string) => {
    try {
      // If using county network authentication, use the county login endpoint
      if (authMethod === "county-network") {
        // Make direct API call to county network authentication endpoint
        const response = await fetch('/api/county-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error("County network authentication failed");
        }
        
        const user = await response.json();
        
        toast({
          description: "Successfully logged in via County Network",
        });
        
        return user;
      } else {
        // Use standard authentication for local or replit auth
        // Direct API call to login endpoint
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error("Authentication failed");
        }
        
        const user = await response.json();
        
        toast({
          description: "Successfully logged in",
        });
        
        return user;
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
      // Direct API call to logout endpoint
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      
      toast({
        description: "Successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Enhanced register with improved error handling
  const enhancedRegister = async (userData: any) => {
    try {
      // Direct API call to register endpoint
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Registration failed");
      }
      
      const user = await response.json();
      
      toast({
        description: "Registration successful",
      });
      
      return user;
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
    authMethod,
    setAuthMethod,
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