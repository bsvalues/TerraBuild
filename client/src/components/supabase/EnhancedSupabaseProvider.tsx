/**
 * Enhanced Supabase Provider
 * 
 * This enhanced provider implements offline capabilities, circuit breaker patterns,
 * and reconnection mechanisms to ensure the application works even when Supabase
 * is unavailable.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import SupabaseErrorBoundary from '@/components/error/SupabaseErrorBoundary';
import supabase, { 
  checkSupabaseConnection, 
  isSupabaseConfigured, 
  verifySupabaseServices,
  SupabaseServiceStatus 
} from '@/lib/utils/supabaseClient';
import { localAuth } from '@/lib/utils/localStorageAuth';
import localDB, { isIndexedDBAvailable } from '@/lib/utils/localDatabase';
import syncService from '@/lib/utils/syncService';
import supabaseCircuitBreaker from '@/lib/utils/circuitBreaker';
import { startReconnectionManager } from '@/lib/utils/reconnectionManager';
import { AlertCircle, WifiOff } from 'lucide-react';

// Enhanced context shape
interface EnhancedSupabaseContextType {
  // Original Supabase context props
  supabase: typeof supabase;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  isConfigured: boolean;
  connectionStatus: 'connected' | 'error' | 'unconfigured' | 'connecting' | 'partial' | 'offline';
  checkConnection: () => Promise<boolean>;
  diagnostics: string[];
  serviceStatus?: SupabaseServiceStatus;
  verifyServices: () => Promise<SupabaseServiceStatus>;
  
  // Enhanced offline capabilities
  isOfflineMode: boolean;
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  isSyncing: boolean;
  forceSync: () => Promise<void>;
  lastSyncTime: Date | null;
  pendingSyncChanges: number;
  isIndexedDBSupported: boolean;
}

// Create context with default values
const EnhancedSupabaseContext = createContext<EnhancedSupabaseContextType>({
  // Original Supabase context defaults
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
  
  // Enhanced offline defaults
  isOfflineMode: false,
  enableOfflineMode: () => {},
  disableOfflineMode: () => {},
  isSyncing: false,
  forceSync: async () => {},
  lastSyncTime: null,
  pendingSyncChanges: 0,
  isIndexedDBSupported: false
});

/**
 * Custom hook to access the Enhanced Supabase context
 */
export const useEnhancedSupabase = () => useContext(EnhancedSupabaseContext);

interface EnhancedSupabaseProviderProps {
  children: React.ReactNode;
}

/**
 * Enhanced Supabase Provider component
 */
export const EnhancedSupabaseProvider: React.FC<EnhancedSupabaseProviderProps> = ({ children }) => {
  // Original Supabase state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'unconfigured' | 'connecting' | 'partial' | 'offline'>('connecting');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [serviceStatus, setServiceStatus] = useState<SupabaseServiceStatus | undefined>(undefined);
  
  // Enhanced offline state
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isIndexedDBSupported, setIsIndexedDBSupported] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingSyncChanges, setPendingSyncChanges] = useState<number>(0);
  
  const MAX_RETRIES = 3;

  // Check if IndexedDB is available
  useEffect(() => {
    setIsIndexedDBSupported(isIndexedDBAvailable());
  }, []);

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
      if (isOfflineMode) {
        // If offline mode is enabled, keep it that way
        setConnectionStatus('offline');
      } else if (Object.values(status).filter(Boolean).length === 0) {
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
      if (!isOfflineMode) {
        setConnectionStatus('error');
      }
      
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
  }, [isOfflineMode]);

  // Function to check Supabase connection that can be called from consumers
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // If offline mode is enabled, return false without checking
      if (isOfflineMode) {
        setDiagnostics(prev => [...prev, "⚠️ Offline mode enabled, skipping connection check"]);
        return false;
      }
      
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
        
        // Check if we have pending sync changes
        if (pendingSyncChanges > 0) {
          syncService.forceSync().catch(console.error);
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
      if (!isOfflineMode) {
        setConnectionStatus('error');
      }
      
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
  }, [connectionStatus, verifyServices, isOfflineMode, pendingSyncChanges]);

  // Enable offline mode
  const enableOfflineMode = useCallback(() => {
    setIsOfflineMode(true);
    setConnectionStatus('offline');
    
    // Show toast for offline mode
    toast({
      title: (
        <div className="flex items-center">
          <WifiOff className="h-4 w-4 mr-2 text-amber-500" />
          Offline Mode Enabled
        </div>
      ),
      description: "You are now working offline. Changes will be synchronized when connection is restored.",
      variant: "default",
      duration: 5000,
    });
    
    setDiagnostics(prev => [...prev, "📱 Offline mode enabled - using local storage"]);
  }, []);

  // Disable offline mode and try to reconnect
  const disableOfflineMode = useCallback(async () => {
    setIsOfflineMode(false);
    
    // Try to reconnect
    const isConnected = await checkConnection();
    
    if (isConnected) {
      // If we can reconnect, sync pending changes
      if (pendingSyncChanges > 0) {
        forceSync();
      }
    } else {
      // If we can't reconnect, notify the user but stay in online mode
      toast({
        title: (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
            Connection Issue
          </div>
        ),
        description: "Could not connect to Supabase. Some features may be unavailable.",
        variant: "default",
        duration: 5000,
      });
    }
    
    setDiagnostics(prev => [...prev, "📶 Offline mode disabled - attempting to use Supabase"]);
  }, [checkConnection, pendingSyncChanges]);

  // Force a sync of pending changes
  const forceSync = useCallback(async (): Promise<void> => {
    setIsSyncing(true);
    try {
      await syncService.forceSync();
      setLastSyncTime(new Date());
      
      // Update pending sync count
      const { data } = await localDB.syncQueue.getPending();
      setPendingSyncChanges(data?.length || 0);
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Listen for sync queue changes
  useEffect(() => {
    // Check for pending sync items on mount
    const checkPendingSyncItems = async () => {
      const { data } = await localDB.syncQueue.getPending();
      setPendingSyncChanges(data?.length || 0);
    };
    
    checkPendingSyncItems();
    
    // Listen for storage events to detect changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.includes('syncQueue')) {
        checkPendingSyncItems();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up a poll to check for pending sync items
    const intervalId = setInterval(checkPendingSyncItems, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

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
        if (!isOfflineMode) {
          setConnectionStatus('connecting');
        }
        
        // First check if Supabase is configured
        if (!checkSupabaseConfig()) {
          if (!isOfflineMode) {
            setConnectionStatus('unconfigured');
          }
          setDiagnostics(prev => [...prev, "❌ Supabase is not configured"]);
          setIsLoading(false);
          
          // Show a toast to help users understand the issue
          toast({
            title: "Supabase Configuration Issue",
            description: "Supabase is not properly configured. Please check environment variables.",
            variant: "destructive",
            duration: 10000,
          });
          
          // Enable offline mode automatically
          enableOfflineMode();
          
          return;
        }
        
        // Try a simple ping to Supabase
        const isConnected = await checkConnection();
        
        if (!isConnected && !isOfflineMode) {
          // If we've reached max retries, enter offline mode
          if (retryCount >= MAX_RETRIES) {
            setDiagnostics(prev => [...prev, `⚠️ Maximum retry attempts (${MAX_RETRIES}) reached, entering offline mode`]);
            
            // Show recommendation to use offline mode
            toast({
              title: "Connection Failed",
              description: "Unable to connect to Supabase after multiple attempts. Recommend enabling offline mode.",
              variant: "destructive",
              duration: 8000,
            });
            
            // Don't automatically enable offline mode, but suggest it
            setError(new Error("Unable to connect to Supabase after multiple attempts"));
          } else {
            // Set a retry timeout with exponential backoff
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            setDiagnostics(prev => [...prev, `⏱️ Retry attempt ${retryCount + 1}/${MAX_RETRIES} in ${retryDelay}ms`]);
            
            retryTimeout = setTimeout(() => {
              setRetryCount(prevCount => prevCount + 1);
              initializeSupabase();
            }, retryDelay);
            
            return;
          }
        }
        
        // Initialize the sync service regardless of connection state
        syncService.start();
        
        // Start the reconnection manager for automatic recovery
        if (!isOfflineMode) {
          startReconnectionManager();
        }
        
        // Try to get auth session - from Supabase if connected, or from local storage if not
        try {
          setDiagnostics(prev => [...prev, "Fetching auth session..."]);
          
          let sessionData;
          let sessionError = null;
          
          if (isConnected) {
            // Get session from Supabase
            const result = await supabase.auth.getSession();
            sessionData = result.data;
            sessionError = result.error;
          } else {
            // Get session from local storage
            const result = await localAuth.getSession();
            sessionData = result.data;
            sessionError = result.error;
          }
          
          if (sessionError) {
            setDiagnostics(prev => [...prev, `❌ Auth session error: ${sessionError.message}`]);
            throw sessionError;
          }
          
          // Use the session if available
          if (sessionData.session) {
            setSession(sessionData.session);
            setUser(sessionData.session.user);
            
            // If we got a Supabase session, also store it locally for offline use
            if (isConnected) {
              localAuth.importSupabaseSession(sessionData.session);
            }
          } else {
            setSession(null);
            setUser(null);
          }
          
          setDiagnostics(prev => [...prev, `${sessionData.session ? '✅ User authenticated' : 'ℹ️ No authenticated user'}`]);
        } catch (authError) {
          setDiagnostics(prev => [...prev, `⚠️ Auth initialization error: ${authError instanceof Error ? authError.message : String(authError)}`]);
          setSession(null);
          setUser(null);
        }
        
        // Set up auth state listener
        try {
          setDiagnostics(prev => [...prev, "Setting up auth state listener..."]);
          
          if (isConnected) {
            // Listen for Supabase auth changes
            const { data: authListener } = supabase.auth.onAuthStateChange(
              (event, updatedSession) => {
                setDiagnostics(prev => [...prev, `🔄 Supabase auth state changed: ${event}`]);
                setSession(updatedSession);
                setUser(updatedSession?.user ?? null);
                
                // Also update local storage for offline use
                if (updatedSession) {
                  localAuth.importSupabaseSession(updatedSession);
                } else if (event === 'SIGNED_OUT') {
                  localAuth.signOut();
                }
              }
            );
            
            // Store cleanup function
            authUnsubscribe = () => {
              authListener?.subscription?.unsubscribe();
            };
          } else {
            // Listen for local auth changes
            const { data: authListener } = localAuth.onAuthStateChange(
              (event, updatedSession) => {
                setDiagnostics(prev => [...prev, `🔄 Local auth state changed: ${event}`]);
                if (updatedSession) {
                  setSession(updatedSession as any);
                  setUser(updatedSession.user as any);
                } else {
                  setSession(null);
                  setUser(null);
                }
              }
            );
            
            // Store cleanup function
            authUnsubscribe = () => {
              authListener?.subscription?.unsubscribe();
            };
          }
        } catch (listenerError) {
          setDiagnostics(prev => [...prev, `⚠️ Auth listener setup error: ${listenerError instanceof Error ? listenerError.message : String(listenerError)}`]);
        }
        
        setDiagnostics(prev => [...prev, "✅ Initialization complete"]);
      } catch (error) {
        if (!isOfflineMode) {
          setConnectionStatus('error');
        }
        
        if (error instanceof Error) {
          setError(error);
          setDiagnostics(prev => [...prev, `❌ Initialization error: ${error.message}`]);
          
          // Specific error handling
          const isAuthError = error.message.includes('auth') || 
                             error.message.includes('token') ||
                             error.message.includes('session');
                             
          // Show toast for specific errors
          if (isAuthError && process.env.NODE_ENV === 'production') {
            toast({
              title: "Authentication Error",
              description: error.message,
              variant: "destructive",
              duration: 8000,
            });
          } else if (process.env.NODE_ENV === 'production') {
            toast({
              title: "Connection Error",
              description: error.message || "Failed to initialize connection",
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
      
      // Stop sync service
      syncService.stop();
    };
  }, [
    retryCount, 
    checkConnection, 
    checkSupabaseConfig, 
    isOfflineMode, 
    enableOfflineMode
  ]);

  // Context value
  const value: EnhancedSupabaseContextType = {
    // Original Supabase context values
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
    
    // Enhanced offline values
    isOfflineMode,
    enableOfflineMode,
    disableOfflineMode,
    isSyncing,
    forceSync,
    lastSyncTime,
    pendingSyncChanges,
    isIndexedDBSupported
  };

  // Show offline mode indicator
  useEffect(() => {
    if (isOfflineMode && !isLoading) {
      // Only show in UI, not toast, to prevent spamming
      console.info('Working in offline mode');
    }
  }, [isOfflineMode, isLoading]);

  return (
    <EnhancedSupabaseContext.Provider value={value}>
      <SupabaseErrorBoundary showFallbackInitially={connectionStatus === 'error' && !isOfflineMode}>
        {children}
      </SupabaseErrorBoundary>
    </EnhancedSupabaseContext.Provider>
  );
};

export default EnhancedSupabaseProvider;