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
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An unknown error occurred" }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  // For DELETE operations that don't return content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
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
    });

  // Get impact analysis for a scenario
  const getScenarioImpact = (scenarioId: number) => 
    useQuery<any>({
      queryKey: ["/api/what-if-scenarios", scenarioId, "impact"],
      refetchOnWindowFocus: false,
    });

  // Create a new scenario
  const createScenario = useMutation({
    mutationFn: (data: Omit<WhatIfScenario, "id" | "createdAt" | "updatedAt" | "userId" | "isSaved">) => 
      apiRequest<WhatIfScenario>("/api/what-if-scenarios", {
        method: "POST",
        body: JSON.stringify(data),
      }),
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