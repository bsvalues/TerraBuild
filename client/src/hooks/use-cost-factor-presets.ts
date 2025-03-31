import { useQuery, useMutation } from "@tanstack/react-query";
import { CostFactorPreset } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useCostFactorPresets() {
  const { toast } = useToast();
  
  // Get all cost factor presets
  const getAllPresets = useQuery<CostFactorPreset[]>({
    queryKey: ['/api/cost-factor-presets'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to fetch cost factor presets",
        variant: "destructive",
      });
      console.error("Failed to fetch cost factor presets:", error);
    }
  });
  
  // Get default presets
  const getDefaultPresets = useQuery<CostFactorPreset[]>({
    queryKey: ['/api/cost-factor-presets/defaults'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to fetch default cost factor presets",
        variant: "destructive",
      });
      console.error("Failed to fetch default presets:", error);
    }
  });
  
  // Get user presets
  const getUserPresets = (userId: number) => {
    return useQuery<CostFactorPreset[]>({
      queryKey: ['/api/cost-factor-presets/user', userId],
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to fetch user cost factor presets",
          variant: "destructive",
        });
        console.error("Failed to fetch user presets:", error);
      }
    });
  };
  
  // Get a single preset by ID
  const getPreset = (id: number) => {
    return useQuery<CostFactorPreset>({
      queryKey: ['/api/cost-factor-presets', id],
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to fetch cost factor preset",
          variant: "destructive",
        });
        console.error("Failed to fetch preset by ID:", error);
      }
    });
  };
  
  // Create a new preset
  const createPresetMutation = useMutation({
    mutationFn: (preset: Omit<CostFactorPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
      return apiRequest('POST', '/api/cost-factor-presets', preset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factor-presets'] });
      toast({
        title: "Success",
        description: "Cost factor preset created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create cost factor preset",
        variant: "destructive",
      });
      console.error("Failed to create preset:", error);
    }
  });
  
  // Update an existing preset
  const updatePresetMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Omit<CostFactorPreset, 'id' | 'createdAt' | 'updatedAt'>>) => {
      return apiRequest('PATCH', `/api/cost-factor-presets/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factor-presets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factor-presets', variables.id] });
      toast({
        title: "Success",
        description: "Cost factor preset updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update cost factor preset",
        variant: "destructive",
      });
      console.error("Failed to update preset:", error);
    }
  });
  
  // Delete a preset
  const deletePresetMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/cost-factor-presets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-factor-presets'] });
      toast({
        title: "Success",
        description: "Cost factor preset deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete cost factor preset",
        variant: "destructive",
      });
      console.error("Failed to delete preset:", error);
    }
  });
  
  // Wrapper functions for mutations to handle the async/await pattern
  const createPreset = async (preset: Omit<CostFactorPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createPresetMutation.mutateAsync(preset);
  };
  
  const updatePreset = async ({ id, ...data }: { id: number } & Partial<Omit<CostFactorPreset, 'id' | 'createdAt' | 'updatedAt'>>) => {
    return updatePresetMutation.mutateAsync({ id, ...data });
  };
  
  const deletePreset = async (id: number) => {
    return deletePresetMutation.mutateAsync(id);
  };
  
  return {
    // Queries
    getAllPresets,
    getDefaultPresets,
    getUserPresets,
    getPreset,
    
    // Mutations
    createPreset,
    updatePreset,
    deletePreset,
  };
}