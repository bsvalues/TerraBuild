import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { SupabaseProvider, useSupabase } from '@/components/supabase/SupabaseProvider';
import DatabaseSetup from '@/components/supabase/DatabaseSetup';
import { AlertCircle, Database, Server, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

// Component to test the Supabase connection
const ConnectionTest: React.FC = () => {
  const { supabase, isLoading, isConfigured, error } = useSupabase();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const testConnection = async () => {
    if (!supabase) {
      setTestResult({
        success: false,
        message: 'Supabase client is not available'
      });
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Make a request to the test endpoint
      const response = await fetch('/api/supabase-test/config-status');
      const data = await response.json();
      
      setTestResult({
        success: data.configured,
        message: data.configured 
          ? 'Successfully connected to Supabase' 
          : `Connection failed: ${data.message || 'Unknown error'}`
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: `Test failed: ${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Connection Test
        </CardTitle>
        <CardDescription>
          Test the connection to your Supabase database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
            <p>Checking Supabase connection...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !isConfigured ? (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Configured</AlertTitle>
            <AlertDescription>
              Supabase is not properly configured. Make sure you have set the environment variables.
            </AlertDescription>
          </Alert>
        ) : testResult ? (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{testResult.success ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click the button below to test the connection to your Supabase database.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={testConnection} 
          disabled={isLoading || isTesting || !isConfigured}
        >
          {isTesting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin border-2 border-primary rounded-full border-t-transparent"></span>
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Component to display environment variable status
const EnvironmentStatus: React.FC = () => {
  const [envVars, setEnvVars] = useState<{[key: string]: string | null}>({
    SUPABASE_URL: null,
    SUPABASE_ANON_KEY: null,
    SUPABASE_SERVICE_KEY: null
  });
  
  useEffect(() => {
    // Check if environment variables are set in Vite
    setEnvVars({
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string || null,
      SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string || null,
      SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY as string || null
    });
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Environment Variables
        </CardTitle>
        <CardDescription>
          Status of required Supabase environment variables.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="font-mono text-sm">{key}</div>
              <div className="flex items-center">
                {value ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm text-green-600">Set</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm text-red-600">Not Set</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          These environment variables are required for the Supabase integration to work properly.
        </p>
      </CardFooter>
    </Card>
  );
};

// Component to display API endpoint status
const ApiStatus: React.FC = () => {
  const [endpoints, setEndpoints] = useState<{[key: string]: boolean | null}>({
    '/api/supabase-test/config-status': null,
    '/api/supabase-test/test-connection': null,
    '/api/supabase/scenarios': null
  });
  const [isChecking, setIsChecking] = useState(false);
  
  const checkEndpoints = async () => {
    setIsChecking(true);
    
    const results: {[key: string]: boolean} = {};
    
    for (const endpoint of Object.keys(endpoints)) {
      try {
        const response = await fetch(endpoint);
        results[endpoint] = response.ok;
      } catch (err) {
        results[endpoint] = false;
      }
    }
    
    setEndpoints(results);
    setIsChecking(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          API Endpoints
        </CardTitle>
        <CardDescription>
          Status of Supabase API endpoints.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(endpoints).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="font-mono text-sm">{key}</div>
              <div className="flex items-center">
                {value === null ? (
                  <span className="text-sm text-gray-400">Not checked</span>
                ) : value ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm text-green-600">Available</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm text-red-600">Unavailable</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={checkEndpoints} 
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin border-2 border-primary rounded-full border-t-transparent"></span>
              Checking...
            </>
          ) : (
            'Check Endpoints'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Main Supabase test page
const SupabaseTestPage: React.FC = () => {
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supabase Integration Test</h1>
          <p className="text-muted-foreground mt-2">
            Test and configure the Supabase integration for BCBS application.
          </p>
        </div>
        
        <SupabaseProvider>
          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="setup">Database Setup</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="connection" className="mt-4">
              <ConnectionTest />
            </TabsContent>
            
            <TabsContent value="setup" className="mt-4">
              <DatabaseSetup />
            </TabsContent>
            
            <TabsContent value="status" className="mt-4 space-y-6">
              <EnvironmentStatus />
              <ApiStatus />
            </TabsContent>
          </Tabs>
        </SupabaseProvider>
      </div>
    </div>
  );
};

export default SupabaseTestPage;