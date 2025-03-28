import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { CostFactor, InsertCostFactor } from "@shared/schema";

export function useCostFactors() {
  // Get all cost factors
  const { data: costFactors, isLoading: isLoadingFactors, error: factorsError } = useQuery({
    queryKey: ["/api/cost-factors"],
  });

  // Get a specific cost factor by region and building type
  const getCostFactorByRegionAndType = (region: string, buildingType: string) => {
    return useQuery({
      queryKey: ["/api/cost-factors", region, buildingType],
      queryFn: () => apiRequest("GET", `/api/cost-factors/${region}/${buildingType}`),
      enabled: !!(region && buildingType),
    });
  };

  // Create a new cost factor
  const createCostFactor = useMutation({
    mutationFn: (factor: InsertCostFactor) => 
      apiRequest("POST", "/api/cost-factors", factor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-factors"] });
    }
  });

  // Update a cost factor
  const updateCostFactor = useMutation({
    mutationFn: ({ id, factor }: { id: number, factor: Partial<InsertCostFactor> }) => 
      apiRequest("PATCH", `/api/cost-factors/${id}`, factor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-factors"] });
    }
  });

  // Delete a cost factor
  const deleteCostFactor = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/cost-factors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-factors"] });
    }
  });

  return {
    costFactors: costFactors as CostFactor[] | undefined,
    isLoadingFactors,
    factorsError,
    getCostFactorByRegionAndType,
    createCostFactor,
    updateCostFactor,
    deleteCostFactor
  };
}