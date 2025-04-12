import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Define the context for Supabase
type SupabaseContextType = {
  supabase: SupabaseClient | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
};

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isLoading: true,
  isConfigured: false,
  error: null,
});

// Define provider props
interface SupabaseProviderProps {
  children: React.ReactNode;
}

// Provider component
export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        // Check if Supabase URL and key are available
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

        if (!supabaseUrl || !supabaseKey) {
          setError('Supabase environment variables are not configured');
          setIsLoading(false);
          return;
        }

        // Create Supabase client
        const client = createClient(supabaseUrl, supabaseKey);
        setSupabase(client);

        // Test connection by making a simple request
        const { error } = await client.from('scenarios').select('count');
        
        if (error) {
          // If the error is about the table not existing, we still consider it configured
          if (error.code === '42P01') { // PostgreSQL error code for "relation does not exist"
            console.warn('Supabase tables not yet created, but connection is working');
            setIsConfigured(true);
          } else {
            console.error('Supabase connection error:', error);
            setError(`Supabase connection error: ${error.message}`);
          }
        } else {
          setIsConfigured(true);
        }
      } catch (err) {
        console.error('Error initializing Supabase:', err);
        setError(`Error initializing Supabase: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSupabase();
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, isLoading, isConfigured, error }}>
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Connecting to Supabase...</p>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Supabase Connection Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !isConfigured ? (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Supabase Not Configured</AlertTitle>
          <AlertDescription>
            Supabase is not properly configured. Some features may not work correctly.
          </AlertDescription>
        </Alert>
      ) : null}
      {children}
    </SupabaseContext.Provider>
  );
};

// Custom hook to use the Supabase context
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};