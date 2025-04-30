/**
 * Unified Auth context hook
 * 
 * This is the central authentication hook that should be used by all components.
 * It provides compatibility with all auth implementations in the codebase.
 */
import { useContext } from 'react';
import { AuthContext } from '../contexts/auth-context';

// Make the hook compatible with both the original implementation and enhanced auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn("useAuth was called outside of AuthProvider - using fallback values");
    
    // Return a fallback that won't crash the app in development
    // Include all properties that might be expected by components
    return {
      // Common properties
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      
      // Auth context methods
      login: async (username: string, password: string) => { 
        console.warn("Login called outside AuthProvider"); 
        return null as any; 
      },
      logout: async () => { 
        console.warn("Logout called outside AuthProvider"); 
      },
      register: async (userData: any) => { 
        console.warn("Register called outside AuthProvider"); 
        return null as any; 
      },
      
      // Enhanced auth provider properties
      isInitializing: false,
      authMethod: 'local' as const,
      setAuthMethod: (method: 'local' | 'county-network') => { 
        console.warn("setAuthMethod called outside EnhancedAuthProvider"); 
      },
      
      // Original auth context properties (for backward compatibility)
      loginMutation: { isPending: false, mutateAsync: async () => null } as any,
      logoutMutation: { isPending: false, mutateAsync: async () => {} } as any,
      registerMutation: { isPending: false, mutateAsync: async () => null } as any,
    };
  }
  
  return context;
}