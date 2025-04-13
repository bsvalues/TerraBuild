/**
 * Supabase Provider Component
 * 
 * This component provides the Supabase client and related authentication
 * state to the entire application through React Context.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import supabase from '@/lib/utils/supabaseClient';

// Define the context shape
interface SupabaseContextType {
  supabase: typeof supabase;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  isConfigured: boolean;
  connectionStatus: 'connected' | 'error' | 'unconfigured' | 'connecting';
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

  // Initialize and set up auth state listener
  useEffect(() => {
    // Check if Supabase is properly configured with environment variables
    const checkSupabaseConfig = () => {
      const configStatus = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
      setIsConfigured(configStatus);
      return configStatus;
    };

    let authUnsubscribe: (() => void) | null = null;
    
    // Get the initial session
    const initializeSupabase = async () => {
      try {
        setIsLoading(true);
        setConnectionStatus('connecting');
        
        // First check if Supabase is configured
        if (!checkSupabaseConfig()) {
          setConnectionStatus('unconfigured');
          return;
        }
        
        // Try a simple ping to Supabase
        try {
          // Attempt a simple operation to check connectivity
          await supabase.from('scenarios').select('count', { count: 'exact', head: true });
          setConnectionStatus('connected');
        } catch (pingError) {
          setConnectionStatus('error');
          throw new Error('Could not connect to Supabase. Please check your network connection and Supabase credentials.');
        }
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
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
    };
  }, []);

  const value = {
    supabase,
    user,
    session,
    isLoading,
    error,
    isConfigured,
    connectionStatus,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export default SupabaseProvider;