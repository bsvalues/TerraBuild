import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AuthErrorBoundary } from "@/components/auth/auth-error-boundary";

// Define authentication methods available in the system
type AuthMethod = "county-network" | "local" | "replit";

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