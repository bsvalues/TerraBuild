import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { WhatIfScenario, ScenarioVariation } from "@shared/schema";

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

// Helper function for API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
    
    const contentType = response.headers.get('Content-Type') || '';
    console.log(`Response status: ${response.status}, Content-Type: ${contentType}`);
    
    // Check for appropriate content type before processing
    if (!response.ok) {
      // Get response text first to see if it's HTML or JSON
      const responseText = await response.text();
      console.log(`Error response: ${responseText.substring(0, 200)}...`);
      
      let errorMessage = "An unknown error occurred";
      try {
        // Try to parse as JSON if possible
        const errorJson = JSON.parse(responseText);
        
        // Check for validation errors from Zod
        if (Array.isArray(errorJson.message)) {
          // This is a Zod validation error
          const validationErrors = errorJson.message;
          // Format error message to be more user-friendly
          if (validationErrors.some((err: { path: string[] }) => err.path.includes('userId'))) {
            console.error("Authentication error: Missing userId. This might be due to running in dev mode.");
            errorMessage = "Authentication error - please retry your operation";
          } else {
            errorMessage = "Validation error: " + validationErrors.map((err: { path: string[]; message: string }) => 
              `${err.path.join('.')}: ${err.message}`).join(', ');
          }
        } else {
          errorMessage = errorJson.message || `API error: ${response.status}`;
        }
      } catch (parseError) {
        // Handle case where response is HTML (e.g., auth redirect)
        if (responseText.includes("<!DOCTYPE html>")) {
          errorMessage = "Received HTML instead of JSON - possible authentication redirect";
          console.error("Authentication error: API returned HTML instead of JSON. This might be due to requireAuth middleware redirecting to a login page.");
        } else {
          errorMessage = `API error (${response.status}): Not a valid JSON response`;
          console.error("Non-JSON response received from API:", responseText.substring(0, 500));
        }
      }
      throw new Error(errorMessage);
    }
    
    // Log potential issues even for successful responses
    if (!contentType.includes('application/json')) {
      console.warn(`Warning: Expected JSON response but received ${contentType}`);
    }

    // For DELETE operations that don't return content
    if (response.status === 204) {
      return {} as T;
    }

    // Get response text first for better error handling
    const responseText = await response.text();
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", responseText.substring(0, 200));
      throw new Error("Invalid JSON response from server");
    }
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// Helper to convert WhatIfScenario to TypedWhatIfScenario
export const asTypedScenario = (scenario: WhatIfScenario): TypedWhatIfScenario => {
  return {
    ...scenario,
    parameters: scenario.parameters as ScenarioParameters
  };
};

export function useWhatIfScenarios() {
  const queryClient = useQueryClient();

  // Get all scenarios (admin only)
  const getAllScenarios = () => 
    useQuery<TypedWhatIfScenario[]>({
      queryKey: ["/api/what-if-scenarios"],
      refetchOnWindowFocus: false,
      select: (data) => data.map(scenario => asTypedScenario(scenario)),
    });

  // Get user's scenarios
  const getUserScenarios = (userId: number) => 
    useQuery<TypedWhatIfScenario[]>({
      queryKey: ["/api/what-if-scenarios/user", userId],
      refetchOnWindowFocus: false,
      select: (data) => data.map(scenario => asTypedScenario(scenario)),
    });

  // Get a specific scenario by ID
  const getScenario = (scenarioId: number) => 
    useQuery<TypedWhatIfScenario>({
      queryKey: ["/api/what-if-scenarios", scenarioId],
      refetchOnWindowFocus: false,
      select: (data) => asTypedScenario(data),
    });

  // Get variations for a scenario
  const getScenarioVariations = (scenarioId: number) => 
    useQuery<ScenarioVariation[]>({
      queryKey: ["/api/what-if-scenarios", scenarioId, "variations"],
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
    useQuery<any>({
      queryKey: ["/api/what-if-scenarios", scenarioId, "impact"],
      refetchOnWindowFocus: false,
      // Skip invalid scenario IDs (like our -1 placeholder)
      enabled: scenarioId > 0,
      // Handle errors gracefully
      retry: 1,
      // TanStack Query v5 doesn't have onError in options (it's in the result)
      // Error handling happens in the component via .isError and .error
    });

  // Create a new scenario
  const createScenario = useMutation({
    mutationFn: (data: Omit<WhatIfScenario, "id" | "createdAt" | "updatedAt" | "userId" | "isSaved">) => {
      // In development mode, add a mock userId (since authentication is disabled)
      const payload = {
        ...data,
        userId: 1 // Using userId 1 for development as that's the mock admin user
      };
      
      return apiRequest<WhatIfScenario>("/api/what-if-scenarios", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "/api/what-if-scenarios"
      });
      return asTypedScenario(data);
    },
  });

  // Update a scenario
  const updateScenario = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<WhatIfScenario> }) => 
      apiRequest<WhatIfScenario>(`/api/what-if-scenarios/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "/api/what-if-scenarios" || 
          (query.queryKey[0] === "/api/what-if-scenarios" && query.queryKey[1] === variables.id)
      });
      return asTypedScenario(data);
    },
  });

  // Save a scenario (mark as saved)
  const saveScenario = useMutation({
    mutationFn: (id: number) => 
      apiRequest<WhatIfScenario>(`/api/what-if-scenarios/${id}/save`, {
        method: "POST",
      }),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "/api/what-if-scenarios" || 
          (query.queryKey[0] === "/api/what-if-scenarios" && query.queryKey[1] === id)
      });
      return asTypedScenario(data);
    },
  });

  // Delete a scenario
  const deleteScenario = useMutation({
    mutationFn: (id: number) => 
      apiRequest<void>(`/api/what-if-scenarios/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "/api/what-if-scenarios"
      });
    },
  });

  // Add a variation to a scenario
  const addVariation = useMutation({
    mutationFn: ({ scenarioId, data }: { 
      scenarioId: number, 
      data: Omit<ScenarioVariation, "id" | "createdAt" | "scenarioId">
    }) => 
      apiRequest<ScenarioVariation>(`/api/what-if-scenarios/${scenarioId}/variations`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          (query.queryKey[0] === "/api/what-if-scenarios" && 
           query.queryKey[1] === variables.scenarioId &&
           query.queryKey[2] === "variations") ||
          (query.queryKey[0] === "/api/what-if-scenarios" && 
           query.queryKey[1] === variables.scenarioId &&
           query.queryKey[2] === "impact")
      });
    },
  });

  // Delete a variation
  const deleteVariation = useMutation({
    mutationFn: ({ variationId, scenarioId }: { variationId: number, scenarioId: number }) => 
      apiRequest<void>(`/api/what-if-scenarios/variations/${variationId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        predicate: (query) => 
          (query.queryKey[0] === "/api/what-if-scenarios" && 
           query.queryKey[1] === variables.scenarioId &&
           query.queryKey[2] === "variations") ||
          (query.queryKey[0] === "/api/what-if-scenarios" && 
           query.queryKey[1] === variables.scenarioId &&
           query.queryKey[2] === "impact")
      });
    },
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
    asTypedScenario
  };
}