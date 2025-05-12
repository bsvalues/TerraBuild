import React, { useState } from 'react';
import { CostFactorTable } from '@/components/CostFactorTable';
import { CostSourceSelector } from '@/components/CostSourceSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function CostFactorTablesPage() {
  const [currentSource, setCurrentSource] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current source
  const currentSourceQuery = useQuery({
    queryKey: ['/api/cost-factors/source'],
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      if (data.data && !currentSource) {
        setCurrentSource(data.data);
      }
    }
  });

  // Mutation to update the current source
  const updateSourceMutation = useMutation({
    mutationFn: async (source: string) => {
      const response = await apiRequest('POST', '/api/cost-factors/source', { source });
      if (!response.ok) {
        throw new Error('Failed to update source');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Source Updated',
        description: `Cost factor source has been updated to ${formatSourceName(currentSource)}.`,
      });
      // Invalidate queries that depend on the current source
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factors/source'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update cost factor source.',
        variant: 'destructive',
      });
    },
  });

  // Handle source change
  const handleSourceChange = (source: string) => {
    setCurrentSource(source);
  };

  // Set as default source
  const handleSetAsDefault = () => {
    if (currentSource) {
      updateSourceMutation.mutate(currentSource);
    }
  };

  // Format source name for display
  const formatSourceName = (source: string) => {
    switch (source) {
      case 'marshallSwift':
        return 'Marshall & Swift';
      case 'rsMeans':
        return 'RS Means';
      case 'costFacto':
        return 'CostFacto';
      case 'bentonCounty':
        return 'Benton County';
      default:
        return source;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cost Factor Tables</h1>
        <Button 
          onClick={handleSetAsDefault}
          disabled={!currentSource || updateSourceMutation.isPending || currentSource === currentSourceQuery.data?.source}
        >
          {updateSourceMutation.isPending ? 'Updating...' : 'Set as Default Source'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Factor Sources</CardTitle>
            <CardDescription>
              Select a cost factor source to view and manage its data. The current system default is {' '}
              <span className="font-medium">
                {currentSourceQuery.isLoading 
                  ? 'Loading...' 
                  : currentSourceQuery.data?.data 
                    ? formatSourceName(currentSourceQuery.data.data)
                    : 'Not set'
                }
              </span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Cost factors are used to calculate building costs based on various characteristics. 
              Different sources may provide different values for these factors.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CostSourceSelector
                value={currentSource}
                onChange={handleSourceChange}
                label="Select Cost Data Source"
              />
              <div className="flex items-end">
                <Button 
                  onClick={handleSetAsDefault}
                  disabled={!currentSource || updateSourceMutation.isPending || currentSource === currentSourceQuery.data?.data}
                  className="w-full md:w-auto"
                >
                  {updateSourceMutation.isPending ? 'Updating...' : 'Set as Default Source'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <CostFactorTable 
          source={currentSource || currentSourceQuery.data?.source}
          onSourceChange={handleSourceChange}
        />
      </div>
    </div>
  );
}