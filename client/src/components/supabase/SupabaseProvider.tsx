/**
 * Supabase Provider Component
 * 
 * This component provides the Supabase client and related authentication
 * state to the entire application through React Context.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import supabase, { 
  checkSupabaseConnection, 
  isSupabaseConfigured,
  verifySupabaseServices,
  SupabaseServiceStatus
} from '@/lib/utils/supabaseClient';
import { AlertCircle, CheckCircle } from 'lucide-react';

// Define the context shape
interface SupabaseContextType {
  supabase: typeof supabase;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  isConfigured: boolean;
  connectionStatus: 'connected' | 'error' | 'unconfigured' | 'connecting' | 'partial';
  checkConnection: () => Promise<boolean>;
  diagnostics: string[];
  serviceStatus?: SupabaseServiceStatus;
  verifyServices: () => Promise<SupabaseServiceStatus>;
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
  diagnostics: [],
  verifyServices: async () => ({
    health: false,
    auth: false,
    storage: false,
    database: false,
    functions: false,
    realtime: false,
    tables: [],
    message: 'Not verified',
    diagnostics: []
  }),
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
const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'unconfigured' | 'connecting' | 'partial'>('connecting');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [serviceStatus, setServiceStatus] = useState<SupabaseServiceStatus | undefined>(undefined);
  const MAX_RETRIES = 3;

  // Check if Supabase is properly configured with environment variables
  const checkSupabaseConfig = useCallback(() => {
    const configStatus = isSupabaseConfigured();
    setIsConfigured(configStatus);
    
    // Add diagnostics information
    setDiagnostics(prev => [
      ...prev, 
      `Supabase configuration check: ${configStatus ? '✅ Configured' : '❌ Not configured'}`
    ]);
    
    return configStatus;
  }, []);

  // Enhanced service verification for detailed diagnostics
  const verifyServices = useCallback(async (): Promise<SupabaseServiceStatus> => {
    try {
      setDiagnostics(prev => [...prev, "Starting comprehensive service verification..."]);
      const status = await verifySupabaseServices();
      setServiceStatus(status);
      
      // Update diagnostics with the results
      setDiagnostics(prev => [...prev, ...status.diagnostics]);
      
      // Determine connection status based on service availability
      if (Object.values(status).filter(Boolean).length === 0) {
        // If no services are available
        setConnectionStatus('error');
      } else if (status.auth && status.database) {
        // If core services are available
        setConnectionStatus('connected');
      } else if (status.auth || status.database || status.storage || status.realtime) {
        // If at least some services are available
        setConnectionStatus('partial');
      } else {
        setConnectionStatus('error');
      }
      
      return status;
    } catch (error) {
      setConnectionStatus('error');
      if (error instanceof Error) {
        setError(error);
        setDiagnostics(prev => [...prev, `❌ Service verification error: ${error.message}`]);
      }
      
      // Return a default error status
      const errorStatus: SupabaseServiceStatus = {
        health: false,
        auth: false,
        storage: false,
        database: false,
        functions: false,
        realtime: false,
        tables: [],
        message: error instanceof Error ? `Error: ${error.message}` : 'Unknown error during service verification',
        diagnostics: ['Service verification failed']
      };
      
      setServiceStatus(errorStatus);
      return errorStatus;
    }
  }, []);

  // Function to check Supabase connection that can be called from consumers
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      setDiagnostics(prev => [...prev, "Starting connection check..."]);
      const isConnected = await checkSupabaseConnection();
      
      if (isConnected) {
        setConnectionStatus('connected');
        setDiagnostics(prev => [...prev, "✅ Connection successful!"]);
        
        // If we've verified a successful connection, also verify services
        // but don't wait for it to complete
        verifyServices().catch(error => console.error("Service verification error:", error));
        
        // Show success toast but only if we were previously in error state
        if (connectionStatus === 'error' || connectionStatus === 'unconfigured') {
          toast({
            title: "Supabase Connection Restored",
            description: "Successfully connected to Supabase",
            variant: "default",
          });
        }
      } else {
        // Verify services to get detailed status when the basic check fails
        const status = await verifyServices();
        
        // If we have at least auth service but health check fails, we consider it a partial connection
        if (status.auth) {
          setConnectionStatus('partial');
          setDiagnostics(prev => [...prev, "⚠️ Partial Supabase connection - some services available"]);
          
          // In development, this is expected so we don't show an error toast
          if (process.env.NODE_ENV !== 'development') {
            toast({
              title: "Partial Supabase Connection",
              description: `Some Supabase services are available: ${[
                status.auth ? 'Auth' : null,
                status.database ? 'Database' : null,
                status.storage ? 'Storage' : null,
                status.realtime ? 'Realtime' : null
              ].filter(Boolean).join(', ')}`,
              variant: "default",
            });
          }
          
          // Return true if auth is available as this is often sufficient for basic operations
          return status.auth;
        } else {
          setConnectionStatus('error');
          setDiagnostics(prev => [...prev, "❌ Connection failed - all checks failed"]);
          
          // Only show toast if not in development mode to avoid spamming
          if (process.env.NODE_ENV === 'production') {
            toast({
              title: "Supabase Connection Failed",
              description: "Could not connect to Supabase. Check console for details.",
              variant: "destructive",
            });
          }
        }
      }
      
      return isConnected;
    } catch (error) {
      setConnectionStatus('error');
      
      if (error instanceof Error) {
        setError(error);
        setDiagnostics(prev => [...prev, `❌ Connection error: ${error.message}`]);
        
        // Only show toast if not in development mode to avoid spamming
        if (process.env.NODE_ENV === 'production') {
          toast({
            title: "Supabase Connection Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
      
      return false;
    }
  }, [connectionStatus, verifyServices]);

  // Initialize and set up auth state listener
  useEffect(() => {
    let authUnsubscribe: (() => void) | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    
    // Clear diagnostics on each initialization attempt
    setDiagnostics(["Initializing Supabase connection..."]);
    
    // Get the initial session
    const initializeSupabase = async () => {
      try {
        setIsLoading(true);
        setConnectionStatus('connecting');
        
        // First check if Supabase is configured
        if (!checkSupabaseConfig()) {
          setConnectionStatus('unconfigured');
          setDiagnostics(prev => [...prev, "❌ Supabase is not configured"]);
          setIsLoading(false);
          
          // Show a toast to help users understand the issue
          toast({
            title: "Supabase Configuration Issue",
            description: "Supabase is not properly configured. Please check environment variables.",
            variant: "destructive",
            duration: 10000,
          });
          
          return;
        }
        
        // Try a simple ping to Supabase
        const isConnected = await checkConnection();
        
        if (!isConnected) {
          // If we've reached max retries, don't attempt again
          if (retryCount >= MAX_RETRIES) {
            setDiagnostics(prev => [...prev, `⚠️ Maximum retry attempts (${MAX_RETRIES}) reached, giving up`]);
            setIsLoading(false);
            
            // Show fallback message in dev mode
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Supabase connection failed after ${MAX_RETRIES} attempts, using mock data for development`);
              setDiagnostics(prev => [...prev, "ℹ️ Using mock data in development mode"]);
            }
            
            return;
          }
          
          // Set a retry timeout with exponential backoff
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setDiagnostics(prev => [...prev, `⏱️ Retry attempt ${retryCount + 1}/${MAX_RETRIES} in ${retryDelay}ms`]);
          
          retryTimeout = setTimeout(() => {
            setRetryCount(prevCount => prevCount + 1);
            initializeSupabase();
          }, retryDelay);
          
          return;
        }
        
        // Get initial session
        setDiagnostics(prev => [...prev, "Fetching auth session..."]);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setDiagnostics(prev => [...prev, `❌ Auth session error: ${sessionError.message}`]);
          throw sessionError;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setDiagnostics(prev => [...prev, `${session ? '✅ User authenticated' : 'ℹ️ No authenticated user'}`]);

        // Listen for auth changes
        setDiagnostics(prev => [...prev, "Setting up auth state listener..."]);
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            setDiagnostics(prev => [...prev, `🔄 Auth state changed: ${event}`]);
            setSession(session);
            setUser(session?.user ?? null);
          }
        );

        // Store cleanup function
        authUnsubscribe = () => {
          authListener?.subscription?.unsubscribe();
        };
        
        setDiagnostics(prev => [...prev, "✅ Supabase initialization complete"]);
      } catch (error) {
        setConnectionStatus('error');
        
        if (error instanceof Error) {
          setError(error);
          setDiagnostics(prev => [...prev, `❌ Initialization error: ${error.message}`]);
          
          // Show specific toast for auth errors
          const isAuthError = error.message.includes('auth') || 
                             error.message.includes('token') ||
                             error.message.includes('session');
                             
          if (isAuthError) {
            toast({
              title: "Authentication Error",
              description: error.message,
              variant: "destructive",
              duration: 8000,
            });
          } else {
            toast({
              title: "Supabase Connection Error",
              description: error.message || "Failed to initialize Supabase connection",
              variant: "destructive",
              duration: 8000,
            });
          }
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
  }, [retryCount, checkConnection, checkSupabaseConfig]);

  // Add warning toast in the UI if Supabase is not connected after initialization
  useEffect(() => {
    if (!isLoading && connectionStatus === 'error' && process.env.NODE_ENV === 'production') {
      toast({
        title: (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-destructive" />
            Supabase Connection Issue
          </div>
        ),
        description: "The application is having trouble connecting to Supabase. Some features may be unavailable.",
        variant: "destructive",
        duration: 10000,
      });
    } else if (!isLoading && connectionStatus === 'connected') {
      // Only show in production to avoid noise in development
      if (process.env.NODE_ENV === 'production') {
        toast({
          title: (
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Supabase Connected
            </div>
          ),
          description: "Successfully connected to Supabase.",
          variant: "default",
          duration: 3000,
        });
      }
    }
  }, [isLoading, connectionStatus]);

  const value = {
    supabase,
    user,
    session,
    isLoading,
    error,
    isConfigured,
    connectionStatus,
    checkConnection,
    diagnostics,
    serviceStatus,
    verifyServices,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export default SupabaseProvider;