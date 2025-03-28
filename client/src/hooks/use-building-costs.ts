import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { BuildingCost, InsertBuildingCost } from "@shared/schema";

// Type for the calculation request
export interface CalculationRequest {
  region: string;
  buildingType: string;
  squareFootage: number;
  complexityMultiplier?: number;
}

// Type for the calculation response
export interface CalculationResponse {
  region: string;
  buildingType: string;
  squareFootage: number;
  baseCost: number;
  regionFactor: number;
  complexityFactor: number;
  costPerSqft: number;
  totalCost: number;
}

export function useBuildingCosts() {
  // Get all building costs
  const { data: buildingCosts, isLoading: isLoadingCosts, error: costsError } = useQuery({
    queryKey: ["/api/costs"],
  });

  // Get a specific building cost
  const getBuildingCost = (id: number) => {
    return useQuery({
      queryKey: ["/api/costs", id],
      enabled: !!id,
    });
  };

  // Create a new building cost
  const createBuildingCost = useMutation({
    mutationFn: (cost: InsertBuildingCost) => 
      apiRequest("POST", "/api/costs", cost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
    }
  });

  // Update a building cost
  const updateBuildingCost = useMutation({
    mutationFn: ({ id, cost }: { id: number, cost: Partial<InsertBuildingCost> }) => 
      apiRequest("PATCH", `/api/costs/${id}`, cost),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/costs", variables.id] });
    }
  });

  // Delete a building cost
  const deleteBuildingCost = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/costs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
    }
  });

  // Calculate a building cost estimate
  const calculateCost = useMutation({
    mutationFn: (params: CalculationRequest) => 
      apiRequest("POST", "/api/costs/calculate", params),
  });

  return {
    buildingCosts: buildingCosts as BuildingCost[] | undefined,
    isLoadingCosts,
    costsError,
    getBuildingCost,
    createBuildingCost,
    updateBuildingCost,
    deleteBuildingCost,
    calculateCost
  };
}