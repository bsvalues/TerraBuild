/**
 * Supabase Test Page
 * 
 * This page provides a UI for testing Supabase connectivity
 * and demonstrating the offline capabilities of the application.
 */

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  RefreshCw, 
  Shield, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useEnhancedSupabase } from '@/components/supabase/EnhancedSupabaseProvider';
import { isIndexedDBAvailable, localDB } from '@/lib/utils/localDatabase';
import { localAuth } from '@/lib/utils/localStorageAuth';
import { syncService } from '@/lib/utils/syncService';

/**
 * Supabase Test Page Component
 */
const SupabaseTestPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const { toast } = useToast();
  
  const { 
    supabase, 
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
    forceSync
  } = useEnhancedSupabase();

  /**
   * Run a full connection test
   */
  const runConnectionTest = async () => {
    try {
      setIsLoading(true);
      setTestResults([]);
      addTestResult('Starting Supabase connection tests...');
      
      // Test basic connection
      addTestResult('Testing Supabase connection to: ' + import.meta.env.VITE_SUPABASE_URL);
      const status = await checkConnection();
      addTestResult(`Connection status: ${status}`);
      
      // Verify all services
      addTestResult('Verifying Supabase services...');
      const services = await verifyServices();
      
      // Display service statuses
      addTestResult('Services status:');
      addTestResult(`- Health endpoint: ${services.health ? '✅ Connected' : '❌ Failed'}`);
      addTestResult(`- Auth service: ${services.auth ? '✅ Connected' : '❌ Failed'}`);
      addTestResult(`- Database: ${services.database ? '✅ Connected' : '❌ Failed'}`);
      addTestResult(`- Storage: ${services.storage ? '✅ Connected' : '❌ Failed'}`);
      addTestResult(`- Functions: ${services.functions ? '✅ Connected' : '❌ Failed'}`);
      addTestResult(`- Realtime: ${services.realtime ? '✅ Connected' : '❌ Failed'}`);
      
      if (services.tables && services.tables.length > 0) {
        addTestResult(`- Available tables: ${services.tables.join(', ')}`);
      }
      
      // Test local storage
      testLocalStorage();
      
      addTestResult('Connection tests completed.');
      
      toast({
        title: 'Tests completed',
        description: 'Connection tests have been completed successfully.',
      });
    } catch (error) {
      console.error('Error running connection tests:', error);
      addTestResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
      
      toast({
        title: 'Test Error',
        description: 'An error occurred while running connection tests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Test authentication
   */
  const testAuth = async () => {
    try {
      setIsTestingAuth(true);
      addTestResult('Testing Supabase authentication...');
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      
      if (session) {
        addTestResult(`✅ Authenticated as: ${session.user.email || session.user.id}`);
        addTestResult(`User ID: ${session.user.id}`);
        addTestResult(`Session expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
      } else {
        addTestResult('⚠️ Not authenticated');
        
        // In development, set up a test user (this is just for demonstration)
        if (import.meta.env.DEV) {
          addTestResult('Setting up mock admin user for development');
          
          // Create a local session
          const mockUser = {
            id: 'test-user-id',
            email: 'admin@example.com',
            role: 'admin',
            created_at: new Date().toISOString(),
          };
          
          await localAuth.signIn({
            id: 'local-session-id',
            user: mockUser,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
          
          addTestResult('✅ Created mock admin user for testing');
        }
      }
      
      toast({
        title: 'Auth Test Completed',
        description: session ? 'You are authenticated.' : 'You are not authenticated.',
      });
    } catch (error) {
      console.error('Error testing auth:', error);
      addTestResult(`Auth Error: ${error instanceof Error ? error.message : String(error)}`);
      
      toast({
        title: 'Auth Test Error',
        description: 'An error occurred while testing authentication.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingAuth(false);
    }
  };

  /**
   * Test local storage capabilities
   */
  const testLocalStorage = () => {
    try {
      addTestResult('Testing local storage capabilities...');
      
      // Check IndexedDB support
      const indexedDBSupported = isIndexedDBAvailable();
      addTestResult(`IndexedDB support: ${indexedDBSupported ? '✅ Supported' : '❌ Not supported'}`);
      
      // Check local authentication
      const localAuthAvailable = localAuth !== undefined;
      addTestResult(`Local auth: ${localAuthAvailable ? '✅ Available' : '❌ Not available'}`);
      
      // Check if we're in offline mode
      addTestResult(`Offline mode: ${isOfflineMode ? '✅ Enabled' : '❌ Disabled'}`);
      
      // Check sync service status
      addTestResult(`Pending sync changes: ${pendingSyncChanges || 0}`);
    } catch (error) {
      console.error('Error testing local storage:', error);
      addTestResult(`Local Storage Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * Test data storage
   */
  const testStorage = async () => {
    try {
      setIsTestingStorage(true);
      addTestResult('Testing data storage...');
      
      // Test writing to local database first
      if (isIndexedDBSupported) {
        addTestResult('Testing local database storage...');
        
        const testItem = {
          id: `test-item-${Date.now()}`,
          name: 'Test Item',
          created_at: new Date().toISOString(),
          value: Math.random()
        };
        
        // Store in local database
        const { data, error } = await localDB.storeWithSync('test_items', testItem);
        
        if (error) {
          throw error;
        }
        
        addTestResult(`✅ Successfully stored item in local database with ID: ${data?.id}`);
        
        // Retrieve from local database
        const { data: retrievedData, error: retrieveError } = await localDB.get('test_items', data?.id);
        
        if (retrieveError) {
          throw retrieveError;
        }
        
        if (retrievedData) {
          addTestResult('✅ Successfully retrieved item from local database');
        } else {
          addTestResult('❌ Failed to retrieve item from local database');
        }
      } else {
        addTestResult('❌ IndexedDB not supported in this browser');
      }
      
      // Test Supabase storage if online
      if (supabase && !isOfflineMode) {
        addTestResult('Testing Supabase storage...');
        
        // Get list of buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          throw bucketsError;
        }
        
        if (buckets && buckets.length > 0) {
          addTestResult(`✅ Storage buckets available: ${buckets.map(b => b.name).join(', ')}`);
        } else {
          addTestResult('⚠️ No storage buckets found');
        }
      } else if (isOfflineMode) {
        addTestResult('📱 Skipping Supabase storage test (offline mode)');
      } else {
        addTestResult('❌ Supabase client not initialized');
      }
      
      toast({
        title: 'Storage Test Completed',
        description: 'Data storage tests have been completed.',
      });
    } catch (error) {
      console.error('Error testing storage:', error);
      addTestResult(`Storage Error: ${error instanceof Error ? error.message : String(error)}`);
      
      toast({
        title: 'Storage Test Error',
        description: 'An error occurred while testing data storage.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingStorage(false);
    }
  };

  /**
   * Toggle offline mode
   */
  const toggleOfflineMode = () => {
    if (isOfflineMode) {
      disableOfflineMode();
      addTestResult('🌐 Attempting to disable offline mode...');
    } else {
      enableOfflineMode();
      addTestResult('📱 Enabling offline mode...');
    }
  };

  /**
   * Manually sync data
   */
  const syncData = async () => {
    try {
      addTestResult('🔄 Starting manual data sync...');
      
      const result = await forceSync();
      
      if (result) {
        addTestResult('✅ Data sync completed successfully');
        
        toast({
          title: 'Sync Completed',
          description: 'Data synchronization has completed successfully.',
        });
      } else {
        addTestResult('⚠️ Data sync completed with errors');
        
        toast({
          title: 'Sync Warning',
          description: 'Data synchronization completed but with some errors.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      addTestResult(`Sync Error: ${error instanceof Error ? error.message : String(error)}`);
      
      toast({
        title: 'Sync Error',
        description: 'An error occurred during data synchronization.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Add a test result
   */
  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, result]);
  };

  /**
   * Get color for connection status
   */
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'offline':
        return 'bg-blue-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  /**
   * Render the test page
   */
  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Supabase Connection Diagnostics
          </CardTitle>
          <CardDescription>
            This page allows you to test Supabase connectivity and offline features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Connection Status</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
                <span className="font-medium">
                  {connectionStatus === 'connected' && 'Connected'}
                  {connectionStatus === 'partial' && 'Partially Connected'}
                  {connectionStatus === 'error' && 'Connection Error'}
                  {connectionStatus === 'offline' && 'Offline Mode'}
                  {connectionStatus === 'connecting' && 'Connecting...'}
                  {connectionStatus === 'unconfigured' && 'Not Configured'}
                </span>
              </div>
              
              <Badge variant={isOfflineMode ? 'default' : 'outline'} className="ml-2">
                {isOfflineMode ? (
                  <WifiOff className="mr-1 h-3 w-3" />
                ) : (
                  <Wifi className="mr-1 h-3 w-3" />
                )}
                {isOfflineMode ? 'Offline' : 'Online'}
              </Badge>
              
              {pendingSyncChanges > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingSyncChanges} pending changes
                </Badge>
              )}
              
              {isSyncing && (
                <Badge variant="secondary" className="ml-2 animate-pulse">
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Syncing...
                </Badge>
              )}
            </div>
          </div>
          
          {/* Reconnection Status */}
          {reconnectionStatus && reconnectionStatus.isReconnecting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Reconnecting...</h3>
                <span className="text-xs text-gray-500">
                  Attempt {reconnectionStatus.attempt} of {reconnectionStatus.maxAttempts}
                </span>
              </div>
              <Progress 
                value={(reconnectionStatus.attempt / reconnectionStatus.maxAttempts) * 100} 
                className="h-2"
              />
              {reconnectionStatus.nextAttemptTime && (
                <p className="text-xs text-gray-500">
                  Next attempt: {new Date(reconnectionStatus.nextAttemptTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={runConnectionTest}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              <span>Test Connection</span>
            </Button>
            
            <Button 
              onClick={testAuth}
              disabled={isTestingAuth}
              variant="outline"
              className="flex items-center gap-1"
            >
              {isTestingAuth ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>Test Authentication</span>
            </Button>
            
            <Button 
              onClick={testStorage}
              disabled={isTestingStorage}
              variant="outline"
              className="flex items-center gap-1"
            >
              {isTestingStorage ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              <span>Test Storage</span>
            </Button>
            
            <Button 
              onClick={toggleOfflineMode}
              variant={isOfflineMode ? 'default' : 'secondary'}
              className="flex items-center gap-1"
            >
              {isOfflineMode ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              <span>{isOfflineMode ? 'Go Online' : 'Go Offline'}</span>
            </Button>
            
            {pendingSyncChanges > 0 && !isOfflineMode && (
              <Button 
                onClick={syncData}
                variant="secondary"
                className="flex items-center gap-1"
                disabled={isSyncing}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Data ({pendingSyncChanges})</span>
              </Button>
            )}
          </div>
          
          {/* Warning if not supported */}
          {!isIndexedDBSupported && (
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md border border-amber-200 dark:border-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  Offline mode not fully supported
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Your browser does not support IndexedDB, which is required for full offline functionality.
                  Some features may be limited.
                </p>
              </div>
            </div>
          )}
          
          {/* Service Status */}
          {serviceStatus && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Service Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="border rounded-md p-3">
                  <div className="flex items-center gap-2">
                    {serviceStatus.health ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">Health</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {serviceStatus.health ? 'Operational' : 'Service disruption'}
                  </p>
                </div>
                
                <div className="border rounded-md p-3">
                  <div className="flex items-center gap-2">
                    {serviceStatus.auth ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">Authentication</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {serviceStatus.auth ? 'Operational' : 'Service disruption'}
                  </p>
                </div>
                
                <div className="border rounded-md p-3">
                  <div className="flex items-center gap-2">
                    {serviceStatus.database ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">Database</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {serviceStatus.database ? 'Operational' : 'Service disruption'}
                  </p>
                </div>
                
                <div className="border rounded-md p-3">
                  <div className="flex items-center gap-2">
                    {serviceStatus.storage ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">Storage</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {serviceStatus.storage ? 'Operational' : 'Service disruption'}
                  </p>
                </div>
                
                <div className="border rounded-md p-3">
                  <div className="flex items-center gap-2">
                    {serviceStatus.functions ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">Functions</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {serviceStatus.functions ? 'Operational' : 'Service disruption'}
                  </p>
                </div>
                
                <div className="border rounded-md p-3">
                  <div className="flex items-center gap-2">
                    {serviceStatus.realtime ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">Realtime</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {serviceStatus.realtime ? 'Operational' : 'Service disruption'}
                  </p>
                </div>
              </div>
              
              {serviceStatus.lastChecked && (
                <p className="text-xs text-gray-500 mt-2">
                  Last checked: {new Date(serviceStatus.lastChecked).toLocaleString()}
                </p>
              )}
            </div>
          )}
          
          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <h3 className="text-lg font-medium">Test Results</h3>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border overflow-auto max-h-64">
                <pre className="text-sm">
                  {testResults.map((result, i) => (
                    <div key={i} className="py-0.5">
                      {result}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500">
            This diagnostic page is for testing Supabase connectivity and offline functionality.
          </p>
        </CardFooter>
      </Card>
      
      {/* Diagnostic Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Diagnostics</CardTitle>
          <CardDescription>
            Technical information about the connection status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border overflow-auto max-h-64">
            <pre className="text-xs">
              {diagnostics.map((line, i) => (
                <div key={i} className="py-0.5">
                  {line}
                </div>
              ))}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseTestPage;