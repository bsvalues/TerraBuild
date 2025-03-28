import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ApiEndpoint, InsertApiEndpoint } from "@shared/schema";

export function useApiEndpoints() {
  const { data: apiEndpoints, isLoading, error } = useQuery({
    queryKey: ["/api/endpoints"],
  });

  const createEndpoint = useMutation({
    mutationFn: (endpoint: InsertApiEndpoint) => 
      apiRequest("POST", "/api/endpoints", endpoint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
    }
  });

  const updateEndpointStatus = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      apiRequest("PATCH", `/api/endpoints/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
    }
  });

  const deleteEndpoint = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/endpoints/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
    }
  });

  return {
    apiEndpoints: apiEndpoints as ApiEndpoint[] | undefined,
    isLoading,
    error,
    createEndpoint,
    updateEndpointStatus,
    deleteEndpoint
  };
}
