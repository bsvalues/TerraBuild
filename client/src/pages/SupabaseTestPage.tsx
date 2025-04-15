/**
 * Supabase Connection Test Page
 * 
 * This page is used to test and demonstrate the connection status
 * with Supabase, including offline capabilities, reconnection 
 * mechanisms, and circuit breaker patterns.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedSupabase } from '@/components/supabase/EnhancedSupabaseProvider';
import { AlertTriangle, CheckCircle, Database, RefreshCw, Shield, WifiOff, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';
import { Badge } from '@/components/ui/badge';

const SupabaseTestPage: React.FC = () => {
  const { 
    isConfigured, 
    connectionStatus, 
    serviceStatus, 
    checkConnection, 
    verifyServices,
    diagnostics,
    isOfflineMode,
    enableOfflineMode,
    disableOfflineMode,
    pendingSyncChanges,
    forceSync,
    isSyncing,
    isIndexedDBSupported
  } = useEnhancedSupabase();
  
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Test database connection
  const refreshConnection = async () => {
    try {
      setIsRefreshing(true);
      await checkConnection();
      toast({
        title: 'Connection Refreshed',
        description: `Connection status: ${connectionStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check connection',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Verify all Supabase services
  const runServiceVerification = async () => {
    try {
      setIsRefreshing(true);
      await verifyServices();
      toast({
        title: 'Services Verified',
        description: 'Service status has been refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify services',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Color status badges
  const getStatusColor = (status: boolean | undefined) => {
    if (status === undefined) return 'bg-gray-500';
    return status ? 'bg-green-500' : 'bg-red-500';
  };

  // Connection status indicator
  const ConnectionStatus = () => {
    let title: string = '';
    let description: string = '';
    let icon: React.ReactNode = null;
    let variant: 'default' | 'destructive' | 'warning' = 'default';
    
    switch (connectionStatus) {
      case 'connected':
        title = 'Connected';
        description = 'Successfully connected to Supabase';
        icon = <CheckCircle className="h-4 w-4 text-green-500" />;
        variant = 'default';
        break;
      case 'partial':
        title = 'Partial Connection';
        description = 'Some Supabase services are available, but not all';
        icon = <AlertTriangle className="h-4 w-4 text-amber-500" />;
        variant = 'warning';
        break;
      case 'error':
        title = 'Connection Error';
        description = 'Failed to connect to Supabase';
        icon = <XCircle className="h-4 w-4 text-red-500" />;
        variant = 'destructive';
        break;
      case 'offline':
        title = 'Offline Mode';
        description = 'Working in offline mode with local storage';
        icon = <WifiOff className="h-4 w-4 text-gray-500" />;
        variant = 'default';
        break;
      case 'connecting':
        title = 'Connecting...';
        description = 'Attempting to connect to Supabase';
        icon = <RefreshCw className="h-4 w-4 animate-spin" />;
        variant = 'default';
        break;
      case 'unconfigured':
        title = 'Not Configured';
        description = 'Supabase credentials are not properly configured';
        icon = <AlertTriangle className="h-4 w-4 text-amber-500" />;
        variant = 'destructive';
        break;
    }
    
    return (
      <Alert variant={variant}>
        <div className="flex items-center">
          {icon}
          <div>
            <AlertTitle className="ml-2">{title}</AlertTitle>
            <AlertDescription>{description}</AlertDescription>
          </div>
        </div>
      </Alert>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Supabase Connection Test</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
          <Button 
            variant="outline" 
            disabled={isRefreshing} 
            onClick={refreshConnection}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          {!isOfflineMode ? (
            <Button 
              variant="default" 
              onClick={enableOfflineMode}
            >
              <WifiOff className="mr-2 h-4 w-4" />
              Enter Offline Mode
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              onClick={disableOfflineMode}
            >
              <Database className="mr-2 h-4 w-4" />
              Exit Offline Mode
            </Button>
          )}
        </div>
      </div>
      
      <ConnectionStatus />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Current status of your Supabase connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Connection:</span>
                <Badge className={connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'partial' ? 'bg-amber-500' : 'bg-red-500'}>
                  {connectionStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Configured:</span>
                <Badge className={isConfigured ? 'bg-green-500' : 'bg-red-500'}>
                  {isConfigured ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Offline Mode:</span>
                <Badge className={isOfflineMode ? 'bg-blue-500' : 'bg-gray-500'}>
                  {isOfflineMode ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>IndexedDB Support:</span>
                <Badge className={isIndexedDBSupported ? 'bg-green-500' : 'bg-red-500'}>
                  {isIndexedDBSupported ? 'Available' : 'Not Available'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Pending Sync Changes:</span>
                <Badge className={pendingSyncChanges > 0 ? 'bg-amber-500' : 'bg-green-500'}>
                  {pendingSyncChanges}
                </Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            {pendingSyncChanges > 0 && (
              <Button 
                onClick={() => forceSync()} 
                disabled={isSyncing || !pendingSyncChanges}
                variant="secondary"
                size="sm"
              >
                <RefreshCw className={`mr-2 h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Force Sync'}
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Service Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Service Status
            </CardTitle>
            <CardDescription>
              Status of individual Supabase services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Health Check:</span>
                <span className={`h-3 w-3 rounded-full ${getStatusColor(serviceStatus?.health)}`} />
              </div>
              <div className="flex justify-between">
                <span>Auth:</span>
                <span className={`h-3 w-3 rounded-full ${getStatusColor(serviceStatus?.auth)}`} />
              </div>
              <div className="flex justify-between">
                <span>Database:</span>
                <span className={`h-3 w-3 rounded-full ${getStatusColor(serviceStatus?.database)}`} />
              </div>
              <div className="flex justify-between">
                <span>Storage:</span>
                <span className={`h-3 w-3 rounded-full ${getStatusColor(serviceStatus?.storage)}`} />
              </div>
              <div className="flex justify-between">
                <span>Functions:</span>
                <span className={`h-3 w-3 rounded-full ${getStatusColor(serviceStatus?.functions)}`} />
              </div>
              <div className="flex justify-between">
                <span>Realtime:</span>
                <span className={`h-3 w-3 rounded-full ${getStatusColor(serviceStatus?.realtime)}`} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={runServiceVerification} 
              disabled={isRefreshing} 
              variant="outline" 
              className="w-full"
              size="sm"
            >
              <RefreshCw className={`mr-2 h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Verify All Services
            </Button>
          </CardFooter>
        </Card>
        
        {/* Available Tables Card */}
        <Card>
          <CardHeader>
            <CardTitle>Available Tables</CardTitle>
            <CardDescription>
              Detected tables in your Supabase project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serviceStatus?.tables && serviceStatus.tables.length > 0 ? (
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {serviceStatus.tables.map((table, index) => (
                  <div key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-sm">
                    {table}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <p className="mt-2 text-sm text-gray-500">No tables detected or database unavailable</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="diagnostics">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diagnostics">Connection Diagnostics</TabsTrigger>
          <TabsTrigger value="debug">Debug Information</TabsTrigger>
        </TabsList>
        
        <TabsContent value="diagnostics">
          <Card>
            <CardHeader>
              <CardTitle>Connection Diagnostics</CardTitle>
              <CardDescription>
                Detailed connection diagnostics and troubleshooting information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-md max-h-[200px] overflow-y-auto font-mono text-sm">
                {diagnostics.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>
                Technical details useful for debugging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto max-h-[200px] overflow-y-auto">
                <pre className="text-xs">
                  {JSON.stringify(serviceStatus, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Resilience</CardTitle>
            <CardDescription>
              Mechanisms for handling connection issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Offline Mode</h3>
              <p className="text-sm text-gray-500">
                When enabled, the app operates using local storage and IndexedDB to store data
                when Supabase is unavailable. Changes are synchronized when connection is restored.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Circuit Breaker</h3>
              <p className="text-sm text-gray-500">
                Prevents cascading failures by temporarily disabling calls to services that are
                consistently failing. Automatically attempts recovery after a cooldown period.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Reconnection Manager</h3>
              <p className="text-sm text-gray-500">
                Automatically attempts to reconnect to Supabase when connection is lost, using
                exponential backoff to avoid overwhelming the server.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Resilience Features</CardTitle>
            <CardDescription>
              Try out the resilience mechanisms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button 
                variant={isOfflineMode ? "destructive" : "default"} 
                onClick={isOfflineMode ? disableOfflineMode : enableOfflineMode}
                className="w-full"
              >
                {isOfflineMode ? 'Disable Offline Mode' : 'Enable Offline Mode'}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                {isOfflineMode
                  ? "Currently working offline. Data is stored locally."
                  : "Working online. Switch to offline mode to test local storage."}
              </p>
            </div>
            
            <div>
              <Button 
                variant="outline" 
                onClick={runServiceVerification}
                className="w-full"
              >
                Test Service Availability
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Checks each Supabase service to determine what's available
              </p>
            </div>
            
            <div>
              <Button 
                variant="outline" 
                onClick={() => forceSync()}
                className="w-full"
                disabled={!pendingSyncChanges}
              >
                Sync Pending Changes ({pendingSyncChanges})
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                {pendingSyncChanges > 0
                  ? `There are ${pendingSyncChanges} changes waiting to be synchronized`
                  : "No pending changes to synchronize"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupabaseTestPage;