import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type CostFactors = {
  version: string;
  source: string;
  year: number;
  lastUpdated: string;
  regionFactors: Record<string, number>;
  qualityFactors: Record<string, number>;
  conditionFactors: Record<string, number>;
  baseRates: Record<string, number>;
  complexityFactors: {
    STORIES: Record<string, number>;
    FOUNDATION: Record<string, number>;
    ROOF: Record<string, number>;
    HVAC: Record<string, number>;
  };
  agingFactors: Record<string, number>;
};

export type CostFactorResponse = {
  success: boolean;
  source: string;
  year: number;
  data: CostFactors;
};

export type FactorTypeResponse = {
  success: boolean;
  source: string;
  factorType: string;
  data: Record<string, number>;
};

export type SourcesResponse = {
  success: boolean;
  data: string[];
  current: string;
};

export function useCostFactors() {
  const {
    data,
    isLoading,
    error,
  } = useQuery<CostFactorResponse>({
    queryKey: ['/api/cost-factors'],
    refetchOnWindowFocus: false,
  });

  return {
    source: data?.source,
    year: data?.year,
    factors: data?.data,
    isLoading,
    error,
  };
}

export function useCostFactorsByType(factorType: string) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<FactorTypeResponse>({
    queryKey: ['/api/cost-factors/type', factorType],
    refetchOnWindowFocus: false,
  });

  let factors: Record<string, number> | Record<string, Record<string, number>> | null = null;

  if (data?.data) {
    if (factorType === 'complexity') {
      // For complexity factors, the structure is nested
      factors = data.data as unknown as Record<string, Record<string, number>>;
    } else {
      // For other factor types, it's a flat structure
      factors = data.data;
    }
  }

  return {
    factors,
    source: data?.source,
    isLoading,
    error,
  };
}

export function useCostFactorSources() {
  const {
    data,
    isLoading,
    error,
  } = useQuery<SourcesResponse>({
    queryKey: ['/api/cost-factors/sources'],
    refetchOnWindowFocus: false,
  });

  const queryClient = useQueryClient();

  const setCurrentSourceMutation = useMutation({
    mutationFn: async (source: string) => {
      const response = await apiRequest('POST', '/api/cost-factors/source', { source });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all cost factor queries when source changes
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factors/sources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factors/type'] });
    },
  });

  return {
    sources: data?.data || [],
    currentSource: data?.current,
    setCurrentSource: setCurrentSourceMutation.mutate,
    isLoading,
    error,
  };
}