/**
 * County Network Auth Context Hook
 * 
 * This is the central authentication hook that should be used by all components.
 * It focuses on providing county network authentication for the application.
 */
import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/contexts/auth-context';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    console.warn("useAuth was called outside of AuthProvider - using fallback values");
    
    // Return a fallback that won't crash the app in development
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
      
      // County network specific props
      authMethod: 'county-network' as const,
      setAuthMethod: (method: 'local' | 'county-network') => { 
        console.warn("setAuthMethod called outside AuthProvider"); 
      },
      
      // Mutation convenience methods
      loginMutation: { isPending: false, mutateAsync: async () => null } as any,
      logoutMutation: { isPending: false, mutateAsync: async () => {} } as any,
      registerMutation: { isPending: false, mutateAsync: async () => null } as any,
    };
  }
  
  return context;
}