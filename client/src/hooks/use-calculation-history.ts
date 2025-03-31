import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { CalculationHistory } from '@shared/schema';

/**
 * Hook for managing calculation history operations
 */
export function useCalculationHistory() {
  const queryClient = useQueryClient();

  // Get all calculation history for the logged-in user
  const getCalculationHistory = useQuery({
    queryKey: ['/api/calculation-history'],
    refetchOnWindowFocus: false,
  });

  // Get a specific calculation history entry by ID
  const getCalculationHistoryById = (id: number) => {
    return useQuery({
      queryKey: ['/api/calculation-history', id],
      queryFn: async () => {
        const result = await fetch(`/api/calculation-history/${id}`);
        if (result.ok) {
          return await result.json() as CalculationHistory;
        }
        throw new Error('Failed to fetch calculation history');
      },
      enabled: !!id,
    });
  };

  // Delete a calculation history entry
  const deleteCalculationHistory = useMutation({
    mutationFn: async (id: number) => {
      const result = await fetch(`/api/calculation-history/${id}`, {
        method: 'DELETE',
      });
      
      if (!result.ok) {
        throw new Error('Failed to delete calculation history');
      }
      
      return id;
    },
    onSuccess: () => {
      // Invalidate the calculation history query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/calculation-history'] });
    },
  });

  return {
    calculationHistory: getCalculationHistory.data as CalculationHistory[] | undefined,
    isLoadingCalculationHistory: getCalculationHistory.isLoading,
    errorCalculationHistory: getCalculationHistory.error,
    getCalculationHistoryById,
    deleteCalculationHistory,
    refetchCalculationHistory: () => queryClient.invalidateQueries({ queryKey: ['/api/calculation-history'] }),
  };
}