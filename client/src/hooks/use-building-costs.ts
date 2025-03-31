import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { BuildingCost, InsertBuildingCost } from "@shared/schema";

// Type for the calculation request
export interface CalculationRequest {
  region: string;
  buildingType: string;
  propertyClass?: string;
  squareFootage: number;
  complexityMultiplier?: number;
  complexityFactor?: string;
  // Benton County, Washington specific fields
  taxLotId?: string;
  propertyId?: string;
  assessmentYear?: number;
  yearBuilt?: number;
  condition?: string;
}

// Type for the calculation response
export interface CalculationResponse {
  region: string;
  buildingType: string;
  propertyClass?: string;
  squareFootage: number;
  baseCost: number;
  regionFactor: number;
  complexityFactor: number;
  costPerSqft: number;
  totalCost: number;
  // Benton County, Washington specific fields
  taxLotId?: string;
  propertyId?: string;
  assessmentYear?: number;
  yearBuilt?: number;
  condition?: string;
  conditionFactor?: number;
  depreciationAmount?: number;
  assessedValue?: number;
}

// Material in a breakdown
export interface Material {
  id: number;
  materialTypeId: number;
  materialName: string;
  materialCode: string;
  percentage: number;
  costPerUnit: number;
  quantity: number;
  totalCost: number;
}

// Type for the materials breakdown response
export interface MaterialsBreakdownResponse {
  region: string;
  buildingType: string;
  propertyClass?: string;
  squareFootage: number;
  baseCost: number;
  regionFactor: number;
  complexityFactor: number;
  costPerSqft: number;
  totalCost: number;
  materials: Material[];
  // Benton County, Washington specific fields
  taxLotId?: string;
  propertyId?: string;
  assessmentYear?: number;
  yearBuilt?: number;
  condition?: string;
  conditionFactor?: number;
  depreciationAmount?: number;
  assessedValue?: number;
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

  // Calculate materials breakdown for a building cost
  const calculateMaterialsBreakdown = useMutation({
    mutationFn: (params: CalculationRequest) => 
      apiRequest("POST", "/api/costs/calculate-materials", params),
  });

  // Get materials for a specific building cost
  const getBuildingCostMaterials = (id: number) => {
    return useQuery({
      queryKey: ["/api/costs", id, "materials"],
      enabled: !!id,
    });
  };

  // Helper function to calculate and return building cost directly
  const calculateBuildingCost = async (params: CalculationRequest): Promise<any> => {
    try {
      const result = await calculateCost.mutateAsync(params);
      return result;
    } catch (error) {
      console.error("Error calculating building cost:", error);
      throw error;
    }
  };

  return {
    buildingCosts: buildingCosts as BuildingCost[] | undefined,
    isLoadingCosts,
    costsError,
    getBuildingCost,
    createBuildingCost,
    updateBuildingCost,
    deleteBuildingCost,
    calculateCost,
    calculateBuildingCost,
    calculateMaterialsBreakdown,
    getBuildingCostMaterials
  };
}