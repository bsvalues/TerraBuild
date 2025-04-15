/**
 * Enhanced Supabase Provider Component
 * 
 * This component extends the basic Supabase provider with additional functionality:
 * - Connection status monitoring
 * - Service health checks
 * - Offline mode support
 * - Reconnection with exponential backoff
 * - Data synchronization
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, SupabaseClient, createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { isIndexedDBAvailable, localDB } from '@/lib/utils/localDatabase';
import { syncService } from '@/lib/utils/syncService';
import { reconnectionManager, ReconnectionStatus } from '@/lib/utils/reconnectionManager';
import { circuitBreakerFactory } from '@/lib/utils/circuitBreaker';
import { localAuth, LocalSession, LocalUser } from '@/lib/utils/localStorageAuth';

// Connection status types
export type ConnectionStatus = 
  'connected' | 
  'partial' | 
  'error' | 
  'offline' | 
  'connecting' | 
  'unconfigured';

// Service status
export interface ServiceStatus {
  health?: boolean;
  auth?: boolean;
  database?: boolean;
  storage?: boolean;
  functions?: boolean;
  realtime?: boolean;
  tables?: string[];
  lastChecked?: Date;
}

// Context type
interface EnhancedSupabaseContextType {
  supabase: SupabaseClient | null;
  session: Session | LocalSession | null;
  user: User | LocalUser | null;
  isConfigured: boolean;
  isInitialized: boolean;
  connectionStatus: ConnectionStatus;
  serviceStatus: ServiceStatus | null;
  isOfflineMode: boolean;
  isIndexedDBSupported: boolean;
  pendingSyncChanges: number;
  isSyncing: boolean;
  reconnectionStatus: ReconnectionStatus | null;
  diagnostics: string[];
  checkConnection: () => Promise<ConnectionStatus>;
  verifyServices: () => Promise<ServiceStatus>;
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  forceSync: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

// Default context value
const defaultContext: EnhancedSupabaseContextType = {
  supabase: null,
  session: null,
  user: null,
  isConfigured: false,
  isInitialized: false,
  connectionStatus: 'connecting',
  serviceStatus: null,
  isOfflineMode: false,
  isIndexedDBSupported: false,
  pendingSyncChanges: 0,
  isSyncing: false,
  reconnectionStatus: null,
  diagnostics: [],
  checkConnection: async () => 'error',
  verifyServices: async () => ({}),
  enableOfflineMode: () => {},
  disableOfflineMode: () => {},
  forceSync: async () => false,
  refreshSession: async () => {},
};

// Create context
const EnhancedSupabaseContext = createContext<EnhancedSupabaseContextType>(defaultContext);

// Props for the provider
interface EnhancedSupabaseProviderProps {
  children: ReactNode;
  supabaseUrl?: string;
  supabaseKey?: string;
  offlineMode?: boolean;
  autoConnect?: boolean;
}

/**
 * Enhanced Supabase Provider Component
 */
export const EnhancedSupabaseProvider: React.FC<EnhancedSupabaseProviderProps> = ({
  children,
  supabaseUrl,
  supabaseKey,
  offlineMode = false,
  autoConnect = true,
}) => {
  // Environment variables for Supabase
  const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const envSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Use provided values or fallback to environment variables
  const finalSupabaseUrl = supabaseUrl || envSupabaseUrl;
  const finalSupabaseKey = supabaseKey || envSupabaseKey;
  
  // State
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [session, setSession] = useState<Session | LocalSession | null>(null);
  const [user, setUser] = useState<User | LocalUser | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(offlineMode);
  const [pendingSyncChanges, setPendingSyncChanges] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [reconnectionStatus, setReconnectionStatus] = useState<ReconnectionStatus | null>(null);
  const [isIndexedDBSupported, setIsIndexedDBSupported] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  // Circuit breaker for health checks
  const healthBreaker = circuitBreakerFactory.getBreaker('supabase-health', {
    failureThreshold: 3,
    resetTimeout: 30000,
  });
  
  // Initialize Supabase client
  useEffect(() => {
    if (finalSupabaseUrl && finalSupabaseKey) {
      // Create Supabase client
      const client = createClient(finalSupabaseUrl, finalSupabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
      });
      
      setSupabase(client);
      setIsConfigured(true);
      addDiagnostics(`Supabase client initialized with URL: ${finalSupabaseUrl}`);
      
      // Initialize services
      initializeServices(client);
      
      // Check offline storage support
      const indexedDBSupported = isIndexedDBAvailable();
      setIsIndexedDBSupported(indexedDBSupported);
      addDiagnostics(`IndexedDB support: ${indexedDBSupported ? 'Available' : 'Not available'}`);
      
      // Set initial offline mode
      if (offlineMode) {
        enableOfflineMode();
      } else if (autoConnect) {
        // Test connection
        checkConnection().then((status) => {
          if (status === 'error' || status === 'partial') {
            addDiagnostics('Initial connection test failed, will retry automatically');
            startReconnection();
          }
        });
      }
      
      // Setup reconnection status listener
      const removeListener = reconnectionManager.addStatusListener((status) => {
        setReconnectionStatus(status);
      });
      
      // Setup sync status listener
      syncService.on('SYNC_START', () => {
        setIsSyncing(true);
      });
      
      syncService.on('SYNC_COMPLETE', () => {
        setIsSyncing(false);
        checkPendingChanges();
      });
      
      syncService.on('SYNC_ERROR', () => {
        setIsSyncing(false);
        checkPendingChanges();
      });
      
      // Check for pending changes
      checkPendingChanges();
      
      return () => {
        removeListener();
        syncService.dispose();
      };
    } else {
      setIsConfigured(false);
      setConnectionStatus('unconfigured');
      addDiagnostics('Supabase credentials not provided');
    }
  }, [finalSupabaseUrl, finalSupabaseKey, offlineMode]);
  
  // Auth state change listener
  useEffect(() => {
    if (!supabase) return;
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        addDiagnostics(`Auth state change: ${event}`);
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Backup session to local storage for offline use
          if (!isOfflineMode) {
            localAuth.importSupabaseSession(newSession);
          }
        } else {
          setSession(null);
          setUser(null);
        }
      }
    );
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        
        // Backup session to local storage for offline use
        localAuth.importSupabaseSession(initialSession);
      }
      
      setIsInitialized(true);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  
  // Local auth state change listener for offline mode
  useEffect(() => {
    if (!isOfflineMode) return;
    
    // Listen for local auth state changes
    const { data: { subscription } } = localAuth.onAuthStateChange(
      (event, localSession) => {
        addDiagnostics(`Local auth state change: ${event}`);
        
        if (localSession) {
          setSession(localSession);
          setUser(localSession.user);
        } else {
          setSession(null);
          setUser(null);
        }
      }
    );
    
    // Get initial local session
    localAuth.getSession().then(({ data, error }) => {
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      setIsInitialized(true);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [isOfflineMode]);
  
  // Initialize services
  const initializeServices = (client: SupabaseClient) => {
    // Initialize sync service
    syncService.initialize(client, true, 60000);
  };
  
  // Add diagnostic message
  const addDiagnostics = (message: string) => {
    setDiagnostics((prev) => [...prev, message]);
  };
  
  // Check connection status
  const checkConnection = async (): Promise<ConnectionStatus> => {
    if (!supabase || !isConfigured) {
      return 'unconfigured';
    }
    
    if (isOfflineMode) {
      return 'offline';
    }
    
    try {
      addDiagnostics(`Testing Supabase connection to: ${finalSupabaseUrl}`);
      
      // Try health check endpoint first (protected by circuit breaker)
      try {
        addDiagnostics('Attempting health check endpoint...');
        
        const healthResult = await healthBreaker.execute(async () => {
          const response = await fetch(`${finalSupabaseUrl}/health`);
          if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
          }
          return await response.json();
        });
        
        if (healthResult && healthResult.status === 'ok') {
          addDiagnostics('✅ Health check successful!');
          setConnectionStatus('connected');
          return 'connected';
        } else {
          addDiagnostics('⚠️ Health check returned unexpected response');
        }
      } catch (error) {
        addDiagnostics(`❌ Health check error: ${error instanceof Error ? error.message : String(error)}`);
        
        // Health check failed, try auth as fallback
        addDiagnostics('Attempting auth session check...');
        
        try {
          const { data } = await supabase.auth.getSession();
          addDiagnostics('✅ Auth session check successful!');
          
          // Auth is working, but health check failed - partial connection
          setConnectionStatus('partial');
          return 'partial';
        } catch (authError) {
          addDiagnostics(`❌ Auth session check error: ${authError instanceof Error ? authError.message : String(authError)}`);
          
          // Both health and auth failed
          setConnectionStatus('error');
          return 'error';
        }
      }
      
      // If we get here, something unexpected happened
      addDiagnostics('⚠️ Connection check inconclusive');
      setConnectionStatus('partial');
      return 'partial';
    } catch (error) {
      addDiagnostics(`❌ Connection check error: ${error instanceof Error ? error.message : String(error)}`);
      setConnectionStatus('error');
      return 'error';
    }
  };
  
  // Verify all Supabase services
  const verifyServices = async (): Promise<ServiceStatus> => {
    if (!supabase || !isConfigured) {
      return {};
    }
    
    const status: ServiceStatus = {
      lastChecked: new Date(),
    };
    
    addDiagnostics('Verifying Supabase services...');
    
    // Check health endpoint
    try {
      const response = await fetch(`${finalSupabaseUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        status.health = data.status === 'ok';
        addDiagnostics(`Health check: ${status.health ? 'OK' : 'Failed'}`);
      } else {
        status.health = false;
        addDiagnostics(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      status.health = false;
      addDiagnostics(`Health check error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check auth
    try {
      const { data } = await supabase.auth.getSession();
      status.auth = true;
      addDiagnostics('Auth check: OK');
    } catch (error) {
      status.auth = false;
      addDiagnostics(`Auth check error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check database
    try {
      const { data, error } = await supabase.from('_tables').select('*');
      
      if (error) {
        status.database = false;
        addDiagnostics(`Database check error: ${error.message}`);
      } else {
        status.database = true;
        status.tables = Array.isArray(data) ? data.map((table) => table.name) : [];
        addDiagnostics(`Database check: OK (${status.tables.length} tables)`);
      }
    } catch (error) {
      status.database = false;
      addDiagnostics(`Database check error: ${error instanceof Error ? error.message : String(error)}`);
      
      // Try an alternative approach
      try {
        const { data, error } = await supabase
          .rpc('get_schema_info')
          .select('*');
        
        if (error) {
          addDiagnostics(`Schema info check error: ${error.message}`);
        } else {
          status.database = true;
          status.tables = Array.isArray(data) ? data.map((table) => table.table_name) : [];
          addDiagnostics(`Schema info check: OK (${status.tables?.length} tables)`);
        }
      } catch (innerError) {
        addDiagnostics(`Schema info check error: ${innerError instanceof Error ? innerError.message : String(innerError)}`);
      }
    }
    
    // Check storage
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        status.storage = false;
        addDiagnostics(`Storage check error: ${error.message}`);
      } else {
        status.storage = true;
        addDiagnostics(`Storage check: OK (${data.length} buckets)`);
      }
    } catch (error) {
      status.storage = false;
      addDiagnostics(`Storage check error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check functions (if available)
    try {
      const { data, error } = await supabase.functions.listFunctions();
      
      if (error) {
        status.functions = false;
        addDiagnostics(`Functions check error: ${error.message}`);
      } else {
        status.functions = true;
        addDiagnostics(`Functions check: OK (${data.length} functions)`);
      }
    } catch (error) {
      status.functions = false;
      addDiagnostics(`Functions check error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check realtime (we can only verify the connection setup, not actual pub/sub)
    try {
      const channel = supabase.channel('test');
      const subscription = channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.unsubscribe();
        }
      });
      
      // Wait briefly for the subscription
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      status.realtime = true;
      addDiagnostics('Realtime check: OK');
    } catch (error) {
      status.realtime = false;
      addDiagnostics(`Realtime check error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Update connection status based on service checks
    if (status.health && status.auth && status.database) {
      setConnectionStatus('connected');
    } else if (status.auth || status.database) {
      setConnectionStatus('partial');
    } else {
      setConnectionStatus('error');
    }
    
    // Update service status state
    setServiceStatus(status);
    
    return status;
  };
  
  // Start reconnection process
  const startReconnection = async () => {
    reconnectionManager.startReconnection(async () => {
      const status = await checkConnection();
      return status === 'connected' || status === 'partial';
    });
  };
  
  // Enable offline mode
  const enableOfflineMode = () => {
    addDiagnostics('Enabling offline mode');
    setIsOfflineMode(true);
    setConnectionStatus('offline');
    toast({
      title: 'Offline Mode Enabled',
      description: 'Changes will be synchronized when connection is restored.',
    });
  };
  
  // Disable offline mode
  const disableOfflineMode = async () => {
    addDiagnostics('Disabling offline mode');
    setConnectionStatus('connecting');
    
    // Try to reconnect to Supabase
    const status = await checkConnection();
    
    if (status === 'connected' || status === 'partial') {
      setIsOfflineMode(false);
      toast({
        title: 'Online Mode Restored',
        description: 'Connection to Supabase has been restored.',
      });
      
      // Synchronize any offline changes
      syncService.synchronize().catch((error) => {
        console.error('Error synchronizing offline changes:', error);
      });
    } else {
      setIsOfflineMode(true);
      setConnectionStatus('offline');
      toast({
        title: 'Cannot Restore Online Mode',
        description: 'Connection to Supabase is still unavailable.',
        variant: 'destructive',
      });
    }
  };
  
  // Force sync offline changes
  const forceSync = async (): Promise<boolean> => {
    if (isOfflineMode) {
      toast({
        title: 'Cannot Sync',
        description: 'Disable offline mode first to synchronize changes.',
        variant: 'destructive',
      });
      return false;
    }
    
    setIsSyncing(true);
    
    try {
      const result = await syncService.synchronize();
      await checkPendingChanges();
      
      if (result) {
        toast({
          title: 'Sync Complete',
          description: 'All changes have been synchronized.',
        });
      } else {
        toast({
          title: 'Sync Incomplete',
          description: 'Some changes could not be synchronized.',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Error',
        description: error instanceof Error ? error.message : 'Failed to synchronize changes',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Check for pending changes to sync
  const checkPendingChanges = async () => {
    try {
      const count = await syncService.checkPendingChanges();
      setPendingSyncChanges(count);
      return count;
    } catch (error) {
      console.error('Error checking pending changes:', error);
      return 0;
    }
  };
  
  // Refresh the user session
  const refreshSession = async () => {
    if (!supabase || isOfflineMode) return;
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
      } else if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        
        // Backup to local storage
        localAuth.importSupabaseSession(data.session);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };
  
  // Context value
  const contextValue: EnhancedSupabaseContextType = {
    supabase,
    session,
    user,
    isConfigured,
    isInitialized,
    connectionStatus,
    serviceStatus,
    isOfflineMode,
    isIndexedDBSupported,
    pendingSyncChanges,
    isSyncing,
    reconnectionStatus,
    diagnostics,
    checkConnection,
    verifyServices,
    enableOfflineMode,
    disableOfflineMode,
    forceSync,
    refreshSession,
  };
  
  return (
    <EnhancedSupabaseContext.Provider value={contextValue}>
      {children}
    </EnhancedSupabaseContext.Provider>
  );
};

// Hook for using the enhanced Supabase context
export const useEnhancedSupabase = () => {
  const context = useContext(EnhancedSupabaseContext);
  
  if (!context) {
    throw new Error('useEnhancedSupabase must be used within an EnhancedSupabaseProvider');
  }
  
  return context;
};

export default EnhancedSupabaseProvider;