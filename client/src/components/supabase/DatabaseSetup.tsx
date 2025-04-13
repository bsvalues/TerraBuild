import React, { useState } from 'react';
import { useSupabase } from './SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { isSupabaseConfigured } from '@/lib/utils/supabaseClient';

/**
 * DatabaseSetup Component
 * 
 * This component displays the current Supabase connection status and provides
 * controls to test connectivity and configure the connection.
 */
export function DatabaseSetup() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { supabase, isLoading, error, isConfigured, connectionStatus } = useSupabase();

  // Function to test the Supabase connection
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Try to perform a simple query to verify connection
      const { error } = await supabase.from('scenarios').select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }

      setTestResult({
        success: true,
        message: 'Successfully connected to Supabase!'
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to connect to Supabase'
      });
    } finally {
      setTesting(false);
    }
  };

  // Render a different UI based on connection status
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Connected</AlertTitle>
            <AlertDescription>
              Supabase connection established successfully.
            </AlertDescription>
          </Alert>
        );
      case 'connecting':
        return (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Connecting...</AlertTitle>
            <AlertDescription className="flex items-center gap-2">
              Attempting to connect to Supabase
              <Skeleton className="h-4 w-24" />
            </AlertDescription>
          </Alert>
        );
      case 'error':
        return (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Failed to connect to Supabase. Please check your credentials and network connection.
            </AlertDescription>
          </Alert>
        );
      case 'unconfigured':
        return (
          <Alert className="mb-4 bg-amber-50 text-amber-700 border-amber-200">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Not Configured</AlertTitle>
            <AlertDescription>
              Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
            </AlertDescription>
          </Alert>
        );
    }
  };

  // Display test results if available
  const renderTestResult = () => {
    if (!testResult) return null;

    return (
      <Alert className={`mt-4 ${testResult.success ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
        {testResult.success ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>{testResult.success ? 'Test Successful' : 'Test Failed'}</AlertTitle>
        <AlertDescription>{testResult.message}</AlertDescription>
      </Alert>
    );
  };

  // Main render function
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Database Connection</CardTitle>
        <CardDescription>
          Status and configuration for the Supabase database connection
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderConnectionStatus()}

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="font-medium">Status:</div>
            <div>{isLoading ? 'Loading...' : connectionStatus}</div>
            
            <div className="font-medium">Configured:</div>
            <div>{isConfigured ? 'Yes' : 'No'}</div>
            
            <div className="font-medium">Environment:</div>
            <div>{import.meta.env.DEV ? 'Development' : 'Production'}</div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={testConnection} 
            disabled={testing || !isConfigured}
            className="mb-2"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>

          {renderTestResult()}

          {!isConfigured && (
            <Alert className="mt-4 bg-amber-50 text-amber-700 border-amber-200">
              <Info className="h-4 w-4" />
              <AlertTitle>Configuration Required</AlertTitle>
              <AlertDescription>
                Please set the following environment variables:
                <ul className="list-disc pl-6 mt-2">
                  <li>VITE_SUPABASE_URL</li>
                  <li>VITE_SUPABASE_ANON_KEY</li>
                  <li>VITE_SUPABASE_SERVICE_KEY (for server-side operations)</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DatabaseSetup;