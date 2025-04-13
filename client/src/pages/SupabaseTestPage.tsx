/**
 * Supabase Test Page
 * 
 * This page provides a simple interface to test the Supabase integration.
 * It demonstrates how to use the Supabase context and hooks for data access.
 */

import React, { useState } from 'react';
import { useSupabase } from '@/components/supabase/SupabaseProvider';
import { useSupabaseScenarios } from '@/lib/hooks/useSupabaseScenarios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { DatabaseSetup } from '@/components/supabase/DatabaseSetup';

const SupabaseTestPage: React.FC = () => {
  const { user, isLoading: authLoading, connectionStatus, isConfigured } = useSupabase();
  const { getAllScenarios, createScenario } = useSupabaseScenarios();

  // State for new scenario form
  const [newScenario, setNewScenario] = useState({
    name: 'Test Scenario',
    description: 'This is a test scenario created from the Supabase test page',
    parameters: {
      baseCost: 100000,
      squareFootage: 2000,
      complexity: 1.2,
      region: 'East',
      buildingType: 'residential'
    }
  });

  // Get all scenarios query with proper enabling based on connection status
  const { 
    data: scenarios, 
    isLoading, 
    isError, 
    error,
    refetch: refetchScenarios 
  } = getAllScenarios({
    enabled: connectionStatus === 'connected' && isConfigured
  });

  // Create a test scenario
  const handleCreateScenario = async () => {
    if (!isConfigured || connectionStatus !== 'connected') {
      toast({
        title: 'Connection Required',
        description: 'Please configure and connect to Supabase before creating scenarios',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createScenario.mutateAsync({
        name: newScenario.name,
        description: newScenario.description,
        parameters: newScenario.parameters,
        baseCalculationId: null,
        results: null
      });
      
      toast({
        title: 'Success',
        description: 'Scenario created successfully',
        variant: 'default',
      });
      
      // Refresh the scenarios list
      refetchScenarios();
      
    } catch (error) {
      console.error('Failed to create scenario:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Display connection status
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return <span className="text-green-600 font-medium">Connected</span>;
      case 'connecting':
        return (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Connecting...</span>
          </div>
        );
      case 'error':
        return <span className="text-red-600 font-medium">Connection Error</span>;
      case 'unconfigured':
        return <span className="text-amber-600 font-medium">Not Configured</span>;
      default:
        return <span className="text-gray-600 font-medium">Unknown</span>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Integration Test</h1>
      
      <Tabs defaultValue="setup">
        <TabsList className="mb-4">
          <TabsTrigger value="setup">Setup & Configuration</TabsTrigger>
          <TabsTrigger value="connection">Connection Status</TabsTrigger>
          <TabsTrigger value="scenarios" disabled={!isConfigured || connectionStatus !== 'connected'}>Scenarios</TabsTrigger>
          <TabsTrigger value="create" disabled={!isConfigured || connectionStatus !== 'connected'}>Create Scenario</TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup">
          <DatabaseSetup />
        </TabsContent>
        
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle>Supabase Connection</CardTitle>
              <CardDescription>Check if the Supabase connection is working</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Connection Status:</span>
                  {renderConnectionStatus()}
                </div>
                
                <div>
                  <span className="font-medium mr-2">User Authentication:</span>
                  {authLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading user...</span>
                    </div>
                  ) : user ? (
                    <span className="text-green-600 font-medium">Authenticated as {user.email}</span>
                  ) : (
                    <span className="text-amber-600 font-medium">Not authenticated (Development Mode)</span>
                  )}
                </div>
                
                <div>
                  <span className="font-medium mr-2">Configuration Status:</span>
                  {isConfigured ? (
                    <span className="text-green-600 font-medium">Configured</span>
                  ) : (
                    <span className="text-amber-600 font-medium">Not Configured</span>
                  )}
                </div>

                {!isConfigured && (
                  <Alert variant="warning" className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Configuration Required</AlertTitle>
                    <AlertDescription>
                      Please set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_SUPABASE_SERVICE_KEY in your environment variables.
                    </AlertDescription>
                  </Alert>
                )}
                
                {connectionStatus === 'error' && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>
                      Failed to connect to Supabase. Please check your credentials and network connection.
                    </AlertDescription>
                  </Alert>
                )}
                
                {connectionStatus === 'connected' && (
                  <Alert variant="success" className="mt-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Connected</AlertTitle>
                    <AlertDescription>
                      Successfully connected to Supabase!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scenarios">
          <Card>
            <CardHeader>
              <CardTitle>Scenarios</CardTitle>
              <CardDescription>List of scenarios from Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading scenarios...</span>
                </div>
              ) : isError ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                  <p className="font-medium">Error loading scenarios</p>
                  <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
                </div>
              ) : scenarios && scenarios.length > 0 ? (
                <div className="space-y-4">
                  {scenarios.map((scenario) => (
                    <div key={scenario.id} className="border p-4 rounded-md">
                      <h3 className="font-medium text-lg">{scenario.name}</h3>
                      <p className="text-gray-600">{scenario.description}</p>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Base Cost:</span> ${scenario.parameters.baseCost}
                        </div>
                        <div>
                          <span className="font-medium">Square Footage:</span> {scenario.parameters.squareFootage} sq ft
                        </div>
                        <div>
                          <span className="font-medium">Region:</span> {scenario.parameters.region}
                        </div>
                        <div>
                          <span className="font-medium">Complexity:</span> {scenario.parameters.complexity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <p>No scenarios found</p>
                  <p className="text-sm">Try creating a new scenario</p>
                </div>
              )}
              
              <div className="mt-4">
                <Button 
                  onClick={() => refetchScenarios()} 
                  disabled={isLoading || !isConfigured || connectionStatus !== 'connected'}
                  variant="outline"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Refresh Scenarios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create Test Scenario</CardTitle>
              <CardDescription>Create a sample scenario to test Supabase integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    This will create a test scenario with the following data:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(newScenario, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {(!isConfigured || connectionStatus !== 'connected') && (
                  <Alert variant="warning" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Required</AlertTitle>
                    <AlertDescription>
                      Please ensure Supabase is configured and connected before creating scenarios.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateScenario} 
                disabled={createScenario.isPending || !isConfigured || connectionStatus !== 'connected'}
              >
                {createScenario.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Test Scenario
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupabaseTestPage;