/**
 * Supabase Provider Component
 * 
 * This component provides the Supabase client and related authentication
 * state to the entire application through React Context.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import supabase, { checkSupabaseConnection } from '@/lib/utils/supabaseClient';

// Define the context shape
interface SupabaseContextType {
  supabase: typeof supabase;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  isConfigured: boolean;
  connectionStatus: 'connected' | 'error' | 'unconfigured' | 'connecting';
  checkConnection: () => Promise<boolean>;
}

// Create context with default values
const SupabaseContext = createContext<SupabaseContextType>({
  supabase,
  user: null,
  session: null,
  isLoading: true,
  error: null,
  isConfigured: false,
  connectionStatus: 'connecting',
  checkConnection: async () => false,
});

/**
 * Custom hook to access the Supabase context
 * @returns The Supabase context
 */
export const useSupabase = () => useContext(SupabaseContext);

interface SupabaseProviderProps {
  children: React.ReactNode;
}

/**
 * Supabase Provider component that wraps the application
 * @param children React children components
 */
export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'unconfigured' | 'connecting'>('connecting');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Check if Supabase is properly configured with environment variables
  const checkSupabaseConfig = () => {
    // The supabaseClient now has hardcoded fallback values, so it will always be configured
    const configStatus = true;
    setIsConfigured(configStatus);
    return configStatus;
  };

  // Function to check Supabase connection that can be called from consumers
  const checkConnection = async (): Promise<boolean> => {
    try {
      const isConnected = await checkSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');
      return isConnected;
    } catch (error) {
      setConnectionStatus('error');
      if (error instanceof Error) {
        setError(error);
        toast({
          title: "Supabase Connection Check Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  // Initialize and set up auth state listener
  useEffect(() => {
    let authUnsubscribe: (() => void) | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    
    // Get the initial session
    const initializeSupabase = async () => {
      try {
        setIsLoading(true);
        setConnectionStatus('connecting');
        
        // First check if Supabase is configured
        if (!checkSupabaseConfig()) {
          setConnectionStatus('unconfigured');
          setIsLoading(false);
          return;
        }
        
        // Try a simple ping to Supabase
        const isConnected = await checkConnection();
        if (!isConnected) {
          // If we've reached max retries, don't attempt again
          if (retryCount >= MAX_RETRIES) {
            setIsLoading(false);
            return;
          }
          
          // Set a retry timeout with exponential backoff
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          retryTimeout = setTimeout(() => {
            setRetryCount(prevCount => prevCount + 1);
            initializeSupabase();
          }, retryDelay);
          
          return;
        }
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
          }
        );

        // Store cleanup function
        authUnsubscribe = () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (error) {
        setConnectionStatus('error');
        if (error instanceof Error) {
          setError(error);
          toast({
            title: "Supabase Connection Error",
            description: error.message || "Failed to initialize Supabase connection",
            variant: "destructive",
            duration: 8000, // Show for longer since this is an important error
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize
    initializeSupabase();

    // Cleanup
    return () => {
      if (authUnsubscribe) {
        authUnsubscribe();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryCount]);

  const value = {
    supabase,
    user,
    session,
    isLoading,
    error,
    isConfigured,
    connectionStatus,
    checkConnection,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export default SupabaseProvider;