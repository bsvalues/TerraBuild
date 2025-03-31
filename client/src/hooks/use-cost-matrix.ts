import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { CostMatrix } from "@shared/schema";

/**
 * Hook for interacting with the cost matrix API
 */
export function useCostMatrix() {
  // Get all cost matrix entries
  const getAll = useQuery({
    queryKey: ["/api/cost-matrix"],
  });

  // Get cost matrix entries by region
  const getByRegion = (region: string) => {
    return useQuery({
      queryKey: ["/api/cost-matrix/region", region],
      enabled: !!region,
    });
  };

  // Get cost matrix entries by building type
  const getByBuildingType = (buildingType: string) => {
    return useQuery({
      queryKey: ["/api/cost-matrix/building-type", buildingType],
      enabled: !!buildingType,
    });
  };

  // Get cost matrix entry by region and building type
  const getByRegionAndBuildingType = (region: string, buildingType: string) => {
    return useQuery({
      queryKey: ["/api/cost-matrix/region", region, "building-type", buildingType],
      enabled: !!region && !!buildingType,
    });
  };

  // Import cost matrix entries from JSON
  const importFromJson = useMutation({
    mutationFn: async (data: any[]) => {
      return apiRequest("/api/cost-matrix/import", {
        method: "POST",
        data: { data },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-matrix"] });
      toast({
        title: "Cost matrix imported",
        description: "The cost matrix entries have been successfully imported.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import cost matrix entries.",
        variant: "destructive",
      });
    },
  });

  // Update cost matrix entry
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CostMatrix> }) => {
      return apiRequest(`/api/cost-matrix/${id}`, {
        method: "PATCH",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-matrix"] });
      toast({
        title: "Cost matrix updated",
        description: "The cost matrix entry has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update cost matrix entry.",
        variant: "destructive",
      });
    },
  });

  // Delete cost matrix entry
  const remove = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cost-matrix/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-matrix"] });
      toast({
        title: "Cost matrix deleted",
        description: "The cost matrix entry has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete cost matrix entry.",
        variant: "destructive",
      });
    },
  });

  // Create a new cost matrix entry
  const create = useMutation({
    mutationFn: async (data: Omit<CostMatrix, "id" | "createdAt" | "updatedAt">) => {
      return apiRequest("/api/cost-matrix", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-matrix"] });
      toast({
        title: "Cost matrix created",
        description: "A new cost matrix entry has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create cost matrix entry.",
        variant: "destructive",
      });
    },
  });

  return {
    getAll,
    getByRegion,
    getByBuildingType,
    getByRegionAndBuildingType,
    importFromJson,
    create,
    update,
    remove,
  };
}