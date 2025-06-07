import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

/**
 * Valid building types
 */
export const VALID_BUILDING_TYPES = [
  'residential',
  'commercial',
  'industrial',
  'agricultural',
  'institutional'
];

/**
 * Valid regions
 */
export const VALID_REGIONS = [
  'north',
  'south',
  'east',
  'west',
  'central'
];

/**
 * Valid building conditions
 */
export const VALID_CONDITIONS = [
  'excellent',
  'good',
  'average',
  'fair',
  'poor'
];

/**
 * Cost prediction request parameters
 */
interface CostPredictionParams {
  buildingType: string;
  squareFootage: number;
  region: string;
  yearBuilt?: number;
  condition?: string;
  complexity?: number;
  features?: string[];
}

/**
 * Cost prediction response
 */
export interface CostPredictionResponse {
  totalCost: number;
  costPerSquareFoot: number;
  confidenceScore: number;
  explanation: string;
  dataQualityScore?: number;
  anomalies?: string[];
  rawResponse?: string;
  
  // Additional fields to match the display
  baseCost?: number;
  regionFactor?: number | string;
  complexityFactor?: number | string;
  costPerSqft?: number;
}

/**
 * Matrix analysis request parameters
 */
interface MatrixAnalysisParams {
  matrixData: any;
}

/**
 * Calculation explanation request parameters
 */
interface CalculationExplanationParams {
  calculationData: any;
}

/**
 * MCP status response
 */
interface MCPStatusResponse {
  status: "ready" | "api_key_missing" | "error";
  message: string;
}

/**
 * MCP Agent status
 */
export type MCPAgentStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Hook for interacting with a specific MCP agent
 * 
 * This hook provides functions to invoke a specific MCP agent with a payload
 * and track its execution status.
 * 
 * @param agentId The ID of the agent to invoke
 * @param initialPayload Optional initial payload for the agent
 */
export function useMCPAgent(agentId: string, initialPayload?: any) {
  const [status, setStatus] = useState<MCPAgentStatus>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [payload, setPayload] = useState<any>(initialPayload);

  /**
   * Run the agent with the current payload
   */
  const runAgent = async () => {
    setStatus('loading');
    try {
      const response = await fetch(`/api/mcp/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentId, input: payload })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error running agent ${agentId}`);
      }

      const data = await response.json();
      setResult(data);
      setStatus('success');
      return data;
    } catch (err) {
      console.error(`Agent ${agentId} run failed:`, err);
      setError(err);
      setStatus('error');
      throw err;
    }
  };

  /**
   * Run the agent with a new payload
   * @param newPayload The new payload to use
   */
  const runAgentWithPayload = async (newPayload: any) => {
    setPayload(newPayload);
    setStatus('loading');
    try {
      const response = await fetch(`/api/mcp/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentId, input: newPayload })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error running agent ${agentId}`);
      }

      const data = await response.json();
      setResult(data);
      setStatus('success');
      return data;
    } catch (err) {
      console.error(`Agent ${agentId} run failed:`, err);
      setError(err);
      setStatus('error');
      throw err;
    }
  };

  /**
   * Reset the agent state
   */
  const reset = () => {
    setStatus('idle');
    setResult(null);
    setError(null);
  };

  return {
    status,
    result,
    error,
    payload,
    runAgent,
    runAgentWithPayload,
    reset,
    setPayload
  };
}

/**
 * Hook for interacting with the Model Content Protocol (MCP) API
 * 
 * This hook provides functions to interact with the MCP endpoints for
 * cost prediction, matrix analysis, and calculation explanation.
 */
export function useMCP() {
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Query for checking MCP status
   */
  const statusQuery = useQuery({
    queryKey: ['/api/mcp/status'],
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 60 * 1000, // 1 minute
  });
  
  /**
   * Mutation for cost prediction
   */
  const costPredictionMutation = useMutation({
    mutationFn: async (params: CostPredictionParams) => {
      setError(null);
      
      try {
        const response = await fetch('/api/mcp/predict-cost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error predicting cost');
        }
        
        return response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(message);
        throw error;
      }
    }
  });
  
  /**
   * Mutation for matrix analysis
   */
  const matrixAnalysisMutation = useMutation({
    mutationFn: async (params: MatrixAnalysisParams) => {
      setError(null);
      
      try {
        const response = await fetch('/api/mcp/analyze-matrix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error analyzing matrix');
        }
        
        return response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(message);
        throw error;
      }
    }
  });
  
  /**
   * Mutation for calculation explanation
   */
  const calculationExplanationMutation = useMutation({
    mutationFn: async (params: CalculationExplanationParams) => {
      setError(null);
      
      try {
        const response = await fetch('/api/mcp/explain-calculation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error explaining calculation');
        }
        
        return response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(message);
        throw error;
      }
    }
  });

  /**
   * Query for getting MCP agent definitions
   */
  const agentsQuery = useQuery({
    queryKey: ['/api/mcp/devops/agents'],
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    // Status
    mcpStatus: statusQuery.data as MCPStatusResponse | undefined,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError || !!error,
    error,
    
    // Mutations
    predictCost: costPredictionMutation.mutate,
    isPredicting: costPredictionMutation.isPending,
    
    analyzeMatrix: matrixAnalysisMutation.mutate,
    isAnalyzing: matrixAnalysisMutation.isPending,
    
    explainCalculation: calculationExplanationMutation.mutate,
    isExplaining: calculationExplanationMutation.isPending,

    // Agent definitions
    agents: (agentsQuery.data as { agents: any[] } | undefined)?.agents || [],
    isLoadingAgents: agentsQuery.isLoading,
    agentsError: agentsQuery.isError,
  };
}