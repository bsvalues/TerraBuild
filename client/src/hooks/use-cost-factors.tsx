import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Type for all cost factors
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
    queryKey: ["/api/cost-factors/factors"],
    queryFn: async ({ signal }) => {
      const res = await apiRequest(
        "GET", 
        "/api/cost-factors/factors", 
        undefined, 
        { 
          signal,
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        }
      );
      return await res.json();
    },
  });

  return {
    factors: data?.data,
    source: data?.source,
    year: data?.year,
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
    queryKey: ["/api/cost-factors/factors", factorType],
    queryFn: async ({ signal }) => {
      const res = await apiRequest(
        "GET", 
        `/api/cost-factors/factors/${factorType}`, 
        undefined, 
        { 
          signal,
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          } 
        }
      );
      return await res.json();
    },
  });

  return {
    factors: data?.data,
    source: data?.source,
    factorType: data?.factorType,
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
    queryKey: ["/api/cost-factors/sources"],
    queryFn: async ({ signal }) => {
      const res = await apiRequest(
        "GET", 
        "/api/cost-factors/sources", 
        undefined, 
        { 
          signal,
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          } 
        }
      );
      return await res.json();
    },
  });

  return {
    sources: data?.data,
    currentSource: data?.current,
    isLoading,
    error,
  };
}