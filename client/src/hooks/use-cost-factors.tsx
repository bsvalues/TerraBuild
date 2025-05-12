import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { queryClient, getQueryFn, apiRequest } from '@/lib/queryClient';

// Cost factor types
export interface CostFactor {
  id: number;
  source: string;
  year: number;
  category: string;
  name: string;
  code: string;
  qualityGrade: string;
  region: string;
  buildingType: string;
  value: number;
  description?: string;
}

export interface CostFactorSource {
  id: string;
  name: string;
  year: number;
  description: string;
}

export interface RatingTable {
  id: string;
  name: string;
  values: Record<string, number>;
  description?: string;
}

/**
 * Hook for accessing cost factor data
 * Provides methods for fetching, creating, updating, and deleting cost factors
 */
export function useCostFactors() {
  // Fetch all cost factors
  const {
    data: costFactors,
    isLoading: isLoadingFactors,
    error: factorsError,
  } = useQuery<{ data: CostFactor[] }>({
    queryKey: ['/api/cost-factors/all'],
    queryFn: getQueryFn(),
    select: (response) => response?.data,
  });

  // Get cost factor by region and type
  const getCostFactorByRegionAndType = (region: string, buildingType: string): UseQueryResult<CostFactor[]> => {
    return useQuery<CostFactor[]>({
      queryKey: ['/api/cost-factors/region-type', region, buildingType],
      queryFn: getQueryFn(),
      enabled: !!region && !!buildingType,
      select: (data) => data.data,
    });
  };

  // Create a new cost factor
  const createCostFactor = useMutation({
    mutationFn: async (costFactor: Omit<CostFactor, 'id'>) => {
      const response = await apiRequest('POST', '/api/cost-factors', costFactor);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factors/all'] });
    },
  });

  // Update an existing cost factor
  const updateCostFactor = useMutation({
    mutationFn: async (costFactor: CostFactor) => {
      const response = await apiRequest('PUT', `/api/cost-factors/${costFactor.id}`, costFactor);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factors/all'] });
    },
  });

  // Delete a cost factor
  const deleteCostFactor = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/cost-factors/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factors/all'] });
    },
  });

  return {
    costFactors,
    isLoadingFactors,
    factorsError,
    getCostFactorByRegionAndType,
    createCostFactor,
    updateCostFactor,
    deleteCostFactor,
  };
}

/**
 * Hook for accessing cost factor sources
 */
export function useCostFactorSources() {
  const {
    data: sources,
    isLoading,
    error,
  } = useQuery<CostFactorSource[]>({
    queryKey: ['/api/cost-factors/sources'],
    queryFn: getQueryFn(),
    select: (data) => data.data,
  });

  return {
    sources,
    isLoading,
    error,
  };
}

/**
 * Hook for accessing cost factors by building type
 */
export function useCostFactorsByType(buildingType: string) {
  const {
    data: factors,
    isLoading,
    error,
  } = useQuery<CostFactor[]>({
    queryKey: [`/api/cost-factors/type/${buildingType}`],
    queryFn: getQueryFn(),
    enabled: !!buildingType,
    select: (data) => data.data,
  });

  return {
    factors,
    isLoading,
    error,
  };
}

/**
 * Hook for accessing rating tables (quality grades, condition ratings, etc.)
 */
export function useRatingTable(tableType: string) {
  const {
    data: table,
    isLoading,
    error,
  } = useQuery<RatingTable>({
    queryKey: [`/api/cost-factors/rating-table/${tableType}`],
    queryFn: getQueryFn(),
    enabled: !!tableType,
    select: (data) => data.data,
  });

  return {
    table,
    isLoading,
    error,
  };
}