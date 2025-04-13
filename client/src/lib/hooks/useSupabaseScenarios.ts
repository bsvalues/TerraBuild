import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { WhatIfScenario, ScenarioVariation, ScenarioImpact } from "@shared/schema";
import { Database } from "@/lib/types/supabase";
import { 
  mapSupabaseScenarioToAppScenario,
  mapAppScenarioToSupabaseScenario,
  mapSupabaseVariationToAppVariation,
  mapSupabaseImpactToAppImpact,
  mapToTypedScenario,
  mapToTypedScenarios
} from "@/lib/utils/supabaseMappers";
import supabase from "@/lib/utils/supabaseClient";

// ScenarioParameters type for strong typing
export interface ScenarioParameters {
  baseCost: number;
  squareFootage: number;
  complexity: number;
  region: string;
  [key: string]: any; // Allow for additional parameters
}

// Extended WhatIfScenario with typed parameters
export interface TypedWhatIfScenario extends Omit<WhatIfScenario, 'parameters'> {
  parameters: ScenarioParameters;
}

// Helper function for Supabase API requests with improved typing
const supabaseRequest = async <T>(
  tableName: keyof Database['public']['Tables'],
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  data?: any,
  options?: {
    id?: number;
    filters?: Record<string, any>;
    select?: string;
  }
): Promise<T> => {
  console.log(`Supabase Request: ${method} ${tableName} ${options?.id ? `id=${options.id}` : ''}`);
  
  try {
    let response;
    
    switch (method) {
      case 'GET':
        if (options?.id) {
          response = await supabase
            .from(tableName)
            .select(options.select || '*')
            .eq('id', options.id)
            .single();
        } else if (options?.filters) {
          let query = supabase.from(tableName).select(options.select || '*');
          
          // Apply filters
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
          
          response = await query;
        } else {
          response = await supabase
            .from(tableName)
            .select(options?.select || '*');
        }
        break;
        
      case 'POST':
        response = await supabase
          .from(tableName)
          .insert(data)
          .select();
        break;
        
      case 'PATCH':
        if (!options?.id) throw new Error('ID is required for PATCH operations');
        response = await supabase
          .from(tableName)
          .update(data)
          .eq('id', options.id)
          .select();
        break;
        
      case 'DELETE':
        if (!options?.id) throw new Error('ID is required for DELETE operations');
        response = await supabase
          .from(tableName)
          .delete()
          .eq('id', options.id);
        break;
        
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    if (response.error) {
      console.error(`Supabase error:`, response.error);
      throw new Error(response.error.message || 'An error occurred');
    }
    
    // For DELETE operations or operations that don't return data
    if (!response.data || method === 'DELETE') {
      return {} as T;
    }
    
    // Transform the data based on the table name
    if (tableName === 'scenarios') {
      if (Array.isArray(response.data)) {
        return response.data.map(mapSupabaseScenarioToAppScenario) as unknown as T;
      } else {
        return mapSupabaseScenarioToAppScenario(response.data) as unknown as T;
      }
    } else if (tableName === 'variations') {
      if (Array.isArray(response.data)) {
        return response.data.map(mapSupabaseVariationToAppVariation) as unknown as T;
      } else {
        return mapSupabaseVariationToAppVariation(response.data) as unknown as T;
      }
    } else if (tableName === 'impacts') {
      if (Array.isArray(response.data)) {
        return response.data.map(mapSupabaseImpactToAppImpact) as unknown as T;
      } else {
        return mapSupabaseImpactToAppImpact(response.data) as unknown as T;
      }
    }
    
    // For other tables, return data as is
    return (method === 'POST' && Array.isArray(response.data) ? response.data[0] : response.data) as T;
    
  } catch (error) {
    console.error("Supabase request failed:", error);
    throw error;
  }
};

export function useSupabaseScenarios() {
  const queryClient = useQueryClient();

  // Get all scenarios (admin only)
  const getAllScenarios = () => 
    useQuery<TypedWhatIfScenario[]>({
      queryKey: ["/api/supabase/scenarios"],
      queryFn: () => supabaseRequest<WhatIfScenario[]>('scenarios', 'GET'),
      refetchOnWindowFocus: false,
      select: (data) => mapToTypedScenarios(data),
    });

  // Get user's scenarios
  const getUserScenarios = (userId: number) => 
    useQuery<TypedWhatIfScenario[]>({
      queryKey: ["/api/supabase/scenarios/user", userId],
      queryFn: () => supabaseRequest<WhatIfScenario[]>('scenarios', 'GET', undefined, {
        filters: { user_id: userId }
      }),
      refetchOnWindowFocus: false,
      select: (data) => mapToTypedScenarios(data),
    });

  // Get a specific scenario by ID
  const getScenario = (scenarioId: number) => 
    useQuery<TypedWhatIfScenario>({
      queryKey: ["/api/supabase/scenarios", scenarioId],
      queryFn: () => supabaseRequest<WhatIfScenario>('scenarios', 'GET', undefined, { id: scenarioId }),
      refetchOnWindowFocus: false,
      select: (data) => mapToTypedScenario(data),
    });

  // Get variations for a scenario
  const getScenarioVariations = (scenarioId: number) => 
    useQuery<ScenarioVariation[]>({
      queryKey: ["/api/supabase/scenarios", scenarioId, "variations"],
      queryFn: () => supabaseRequest<ScenarioVariation[]>('variations', 'GET', undefined, {
        filters: { scenario_id: scenarioId }
      }),
      refetchOnWindowFocus: false,
      // Skip invalid scenario IDs (like our -1 placeholder)
      enabled: scenarioId > 0,
      // Handle errors gracefully
      retry: 1,
      // TanStack Query v5 doesn't have onError in options (it's in the result)
      // Error handling happens in the component via .isError and .error
    });

  // Get impact analysis for a scenario
  const getScenarioImpact = (scenarioId: number) => 
    useQuery<ScenarioImpact[]>({
      queryKey: ["/api/supabase/scenarios", scenarioId, "impact"],
      queryFn: () => supabaseRequest<ScenarioImpact[]>('impacts', 'GET', undefined, {
        filters: { scenario_id: scenarioId }
      }),
      refetchOnWindowFocus: false,
      // Skip invalid scenario IDs (like our -1 placeholder)
      enabled: scenarioId > 0,
      // Handle errors gracefully
      retry: 1,
    });

  // Create a new scenario
  const createScenario = useMutation({
    mutationFn: (data: Omit<WhatIfScenario, "id" | "createdAt" | "updatedAt" | "userId" | "isSaved">) => {
      // In development mode, add a mock userId (since authentication is disabled)
      const payload = {
        ...data,
        user_id: 1, // Using userId 1 for development as that's the mock admin user
        created_at: new Date().toISOString(),
        is_saved: false
      };
      
      return supabaseRequest<WhatIfScenario>('scenarios', 'POST', payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "/api/supabase/scenarios"
      });
      toast({
        title: "Scenario created",
        description: "Your scenario has been created successfully",
        variant: "default",
      });
      return mapToTypedScenario(data);
    },
    onError: (error) => {
      toast({
        title: "Error creating scenario",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Update a scenario
  const updateScenario = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<WhatIfScenario> }) => {
      // Convert to Supabase schema format
      const payload = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      return supabaseRequest<WhatIfScenario>('scenarios', 'PATCH', payload, { id });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "/api/supabase/scenarios" || 
          (query.queryKey[0] === "/api/supabase/scenarios" && query.queryKey[1] === variables.id)
      });
      return mapToTypedScenario(data);
    },
    onError: (error) => {
      toast({
        title: "Error updating scenario",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Save a scenario (mark as saved)
  const saveScenario = useMutation({
    mutationFn: (id: number) => 
      supabaseRequest<WhatIfScenario>('scenarios', 'PATCH', { is_saved: true }, { id }),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "/api/supabase/scenarios" || 
          (query.queryKey[0] === "/api/supabase/scenarios" && query.queryKey[1] === id)
      });
      toast({
        title: "Scenario saved",
        description: "Your scenario has been saved successfully",
        variant: "default",
      });
      return mapToTypedScenario(data);
    },
    onError: (error) => {
      toast({
        title: "Error saving scenario",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Delete a scenario
  const deleteScenario = useMutation({
    mutationFn: (id: number) => 
      supabaseRequest<void>('scenarios', 'DELETE', undefined, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "/api/supabase/scenarios"
      });
      toast({
        title: "Scenario deleted",
        description: "Your scenario has been deleted successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting scenario",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Add a variation to a scenario
  const addVariation = useMutation({
    mutationFn: ({ scenarioId, data }: { 
      scenarioId: number, 
      data: Omit<ScenarioVariation, "id" | "createdAt" | "scenarioId">
    }) => {
      const payload = {
        ...data,
        scenario_id: scenarioId,
        created_at: new Date().toISOString()
      };
      
      return supabaseRequest<ScenarioVariation>('variations', 'POST', payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          (query.queryKey[0] === "/api/supabase/scenarios" && 
           query.queryKey[1] === variables.scenarioId &&
           query.queryKey[2] === "variations") ||
          (query.queryKey[0] === "/api/supabase/scenarios" && 
           query.queryKey[1] === variables.scenarioId &&
           query.queryKey[2] === "impact")
      });
      toast({
        title: "Variation added",
        description: "Variation has been added to your scenario",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding variation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Delete a variation
  const deleteVariation = useMutation({
    mutationFn: ({ variationId, scenarioId }: { variationId: number, scenarioId: number }) => 
      supabaseRequest<void>('variations', 'DELETE', undefined, { id: variationId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          (query.queryKey[0] === "/api/supabase/scenarios" && 
           query.queryKey[1] === variables.scenarioId &&
           query.queryKey[2] === "variations") ||
          (query.queryKey[0] === "/api/supabase/scenarios" && 
           query.queryKey[1] === variables.scenarioId &&
           query.queryKey[2] === "impact")
      });
      toast({
        title: "Variation deleted",
        description: "Variation has been removed from your scenario",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting variation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  return {
    getAllScenarios,
    getUserScenarios,
    getScenario,
    getScenarioVariations,
    getScenarioImpact,
    createScenario,
    updateScenario,
    saveScenario,
    deleteScenario,
    addVariation,
    deleteVariation,
    mapToTypedScenario
  };
}