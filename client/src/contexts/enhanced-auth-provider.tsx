import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { AuthProvider, useAuth as useAuthHook } from './AuthContext';
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedAuthContextType {
  isInitializing: boolean;
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

interface EnhancedAuthProviderProps {
  children: ReactNode;
}

/**
 * Enhanced authentication provider that adds error handling and logging
 * Wraps the standard AuthProvider with additional functionality
 */
export function EnhancedAuthProvider({ children }: EnhancedAuthProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();
  
  // Initialize auth-related functionality here
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Any pre-authentication setup would go here
        console.log('Initializing authentication system');
        
        // Simulate initialization (remove in production)
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('Authentication initialization error:', error);
        toast({
          title: 'Authentication Error',
          description: 'Failed to initialize authentication system',
          variant: 'destructive',
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [toast]);

  // Show loading indicator during initialization
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Initializing authentication...</p>
      </div>
    );
  }

  return (
    <EnhancedAuthContext.Provider value={{ isInitializing }}>
      <AuthErrorBoundary>
        <AuthProvider>
          {children}
        </AuthProvider>
      </AuthErrorBoundary>
    </EnhancedAuthContext.Provider>
  );
}

export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext);
  const auth = useAuthHook();
  
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  
  return {
    ...auth,
    isInitializing: context.isInitializing,
  };
}