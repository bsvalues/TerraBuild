import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { CalculationHistory } from '@shared/schema';

/**
 * Hook for interacting with calculation history API
 */
export function useCalculationHistory() {
  // Get all calculation history
  const getAll = useQuery({
    queryKey: ['/api/calculation-history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/calculation-history');
      return response.json();
    }
  });

  // Create a new calculation history entry
  const create = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/calculation-history', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calculation-history'] });
      toast({
        title: 'Calculation saved',
        description: 'Calculation has been saved to history.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save calculation to history.',
        variant: 'destructive',
      });
    }
  });

  // Delete a calculation history entry
  const remove = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/calculation-history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calculation-history'] });
      toast({
        title: 'Calculation deleted',
        description: 'Calculation has been removed from history.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete calculation from history.',
        variant: 'destructive',
      });
    }
  });

  // Get calculation history for a specific building type
  const getByBuildingType = (buildingType: string) => {
    return useQuery({
      queryKey: ['/api/calculation-history', 'buildingType', buildingType],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/calculation-history/building-type/${buildingType}`);
        return response.json();
      },
      enabled: !!buildingType,
    });
  };

  // Get calculation history for a specific region
  const getByRegion = (region: string) => {
    return useQuery({
      queryKey: ['/api/calculation-history', 'region', region],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/calculation-history/region/${region}`);
        return response.json();
      },
      enabled: !!region,
    });
  };

  // Format calculation data for display
  const formatCalculation = (calculation: CalculationHistory) => {
    return {
      ...calculation,
      formattedBaseCost: formatCurrency(parseFloat(calculation.baseCost)),
      formattedTotalCost: formatCurrency(parseFloat(calculation.totalCost)),
      formattedDate: new Date(calculation.createdAt).toLocaleDateString(),
    };
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return {
    getAll,
    create,
    remove,
    getByBuildingType,
    getByRegion,
    formatCalculation,
    formatCurrency,
  };
}