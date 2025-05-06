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
    queryKey: ["/cost-matrices"],
  });

  // Get cost matrix entry by ID
  const getById = (id: number) => {
    return useQuery({
      queryKey: ["/cost-matrices", id],
      enabled: !!id,
    });
  };

  // Get cost matrix entries by region
  const getByRegion = (region: string) => {
    return useQuery({
      queryKey: ["/cost-matrices"],
      queryFn: () => 
        apiRequest({ 
          method: "GET", 
          url: `/cost-matrices?region=${encodeURIComponent(region)}` 
        }),
      enabled: !!region,
    });
  };

  // Get cost matrix entries by building type
  const getByBuildingType = (buildingType: string) => {
    return useQuery({
      queryKey: ["/cost-matrices"],
      queryFn: () => 
        apiRequest({ 
          method: "GET", 
          url: `/cost-matrices?buildingType=${encodeURIComponent(buildingType)}` 
        }),
      enabled: !!buildingType,
    });
  };

  // Get cost matrix entry by region and building type
  const getByRegionAndBuildingType = (region: string, buildingType: string) => {
    return useQuery({
      queryKey: ["/cost-matrices"],
      queryFn: () => 
        apiRequest({ 
          method: "GET", 
          url: `/cost-matrices?region=${encodeURIComponent(region)}&buildingType=${encodeURIComponent(buildingType)}` 
        }),
      enabled: !!region && !!buildingType,
    });
  };

  // Import cost matrix entries from JSON
  const importFromJson = useMutation({
    mutationFn: async (data: any[]) => {
      return apiRequest({
        method: "POST", 
        url: "/cost-matrices/import", 
        body: { data }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/cost-matrices"] });
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
      return apiRequest({
        method: "PATCH", 
        url: `/cost-matrices/${id}`, 
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/cost-matrices"] });
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
      return apiRequest({
        method: "DELETE",
        url: `/cost-matrices/${id}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/cost-matrices"] });
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
      return apiRequest({
        method: "POST",
        url: "/cost-matrices",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/cost-matrices"] });
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
    getById,
    getByRegion,
    getByBuildingType,
    getByRegionAndBuildingType,
    importFromJson,
    create,
    update,
    remove,
  };
}