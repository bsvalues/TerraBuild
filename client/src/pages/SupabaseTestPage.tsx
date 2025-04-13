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
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const SupabaseTestPage: React.FC = () => {
  const { user, isLoading: authLoading } = useSupabase();
  const { getAllScenarios, createScenario } = useSupabaseScenarios();

  // Mock user ID for testing (normally would come from auth)
  const userId = 1;

  // Get all scenarios query
  const { data: scenarios, isLoading, isError, error } = getAllScenarios();

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

  // Create a test scenario
  const handleCreateScenario = async () => {
    try {
      await createScenario.mutateAsync({
        name: newScenario.name,
        description: newScenario.description,
        parameters: newScenario.parameters,
        baseCalculationId: null,
        results: null
      });
    } catch (error) {
      console.error('Failed to create scenario:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Integration Test</h1>
      
      <Tabs defaultValue="connection">
        <TabsList className="mb-4">
          <TabsTrigger value="connection">Connection Status</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="create">Create Scenario</TabsTrigger>
        </TabsList>
        
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
                  {authLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Checking connection...</span>
                    </div>
                  ) : (
                    <span className="text-green-600 font-medium">Connected</span>
                  )}
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
                  <p className="text-sm">{error?.message || 'Unknown error'}</p>
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
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateScenario} 
                disabled={createScenario.isPending}
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