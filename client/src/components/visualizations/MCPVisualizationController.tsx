/**
 * MCP-Enhanced Visualization Controller
 * 
 * This component implements a visualization controller that follows the
 * Model Content Protocol (MCP) principles for standardized data processing
 * and visualization generation.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

// MCP-compliant interfaces
interface MCPSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

interface MCPFunction {
  name: string;
  description: string;
  execute: (input: any) => Promise<any>;
}

interface MCPWorkflowStep {
  name: string;
  execute: (input: any, state: Map<string, any>) => Promise<any>;
}

interface MCPWorkflow {
  name: string;
  steps: MCPWorkflowStep[];
  execute: (input: any) => Promise<any>;
}

// Visualization input schema
const visualizationInputSchema: MCPSchema = {
  type: 'object',
  properties: {
    buildingType: { type: 'string' },
    regions: { type: 'array', items: { type: 'string' } },
    counties: { type: 'array', items: { type: 'string' } },
    states: { type: 'array', items: { type: 'string' } },
    startYear: { type: 'number' },
    endYear: { type: 'number' }
  },
  required: ['buildingType']
};

// Visualization filters
export interface VisualizationFilters {
  buildingType: string;
  regions: string[];
  counties: string[];
  states: string[];
  startYear: number;
  endYear: number;
}

// Default filter values
const defaultFilters: VisualizationFilters = {
  buildingType: 'residential',
  regions: [],
  counties: [],
  states: [],
  startYear: 2020,
  endYear: 2025
};

// Create a context for the visualization state
interface MCPVisualizationContextType {
  filters: VisualizationFilters;
  setFilters: (filters: Partial<VisualizationFilters>) => void;
  regionalCostsQuery: any;
  hierarchicalCostsQuery: any;
  statisticalDataQuery: any;
  isProcessing: boolean;
  exportData: (format: string) => Promise<void>;
}

const MCPVisualizationContext = createContext<MCPVisualizationContextType | undefined>(undefined);

// MCP-compliant workflow steps
const perceptionStep: MCPWorkflowStep = {
  name: 'perception',
  execute: async (input, state) => {
    // Process and validate input data
    console.log('Executing perception step with input:', input);
    
    // Store original input for reference
    state.set('originalInput', input);
    
    // Validate required fields
    if (!input.buildingType) {
      throw new Error('Building type is required');
    }
    
    return {
      ...input,
      perception: {
        timestamp: new Date().toISOString(),
        validInput: true,
        processingStage: 'input_validation_complete'
      }
    };
  }
};

const reasoningStep: MCPWorkflowStep = {
  name: 'reasoning',
  execute: async (input, state) => {
    console.log('Executing reasoning step with input:', input);
    
    // Analyze what data needs to be fetched
    const queryKeys = [];
    
    if (input.regions?.length > 0 || input.counties?.length > 0 || input.states?.length > 0) {
      queryKeys.push('regionalCosts');
    }
    
    if (input.buildingType) {
      queryKeys.push('hierarchicalCosts');
      queryKeys.push('statisticalData');
    }
    
    return {
      ...input,
      reasoning: {
        timestamp: new Date().toISOString(),
        queryKeys,
        processingStage: 'data_requirements_analyzed'
      }
    };
  }
};

const actionStep: MCPWorkflowStep = {
  name: 'action',
  execute: async (input, state) => {
    console.log('Executing action step with input:', input);
    
    // Define API endpoints based on reasoning
    const endpoints = {
      regionalCosts: '/api/analytics/regional-costs',
      hierarchicalCosts: '/api/analytics/hierarchical-costs',
      statisticalData: '/api/analytics/statistical-correlations'
    };
    
    // Create query parameters
    const params = new URLSearchParams();
    params.append('buildingType', input.buildingType);
    
    if (input.regions?.length > 0) {
      input.regions.forEach((region: string) => params.append('regions', region));
    }
    
    if (input.counties?.length > 0) {
      input.counties.forEach((county: string) => params.append('counties', county));
    }
    
    if (input.states?.length > 0) {
      input.states.forEach((state: string) => params.append('states', state));
    }
    
    if (input.startYear) {
      params.append('startYear', input.startYear.toString());
    }
    
    if (input.endYear) {
      params.append('endYear', input.endYear.toString());
    }
    
    return {
      ...input,
      action: {
        timestamp: new Date().toISOString(),
        endpoints: input.reasoning.queryKeys.map((key: string) => endpoints[key as keyof typeof endpoints]),
        queryParams: params.toString(),
        processingStage: 'api_requests_configured'
      }
    };
  }
};

// Create a visualization workflow
const visualizationWorkflow: MCPWorkflow = {
  name: 'visualizationWorkflow',
  steps: [perceptionStep, reasoningStep, actionStep],
  execute: async (input) => {
    const state = new Map<string, any>();
    let currentInput = input;
    
    for (const step of visualizationWorkflow.steps) {
      currentInput = await step.execute(currentInput, state);
    }
    
    return currentInput;
  }
};

// Create a provider component
export function MCPVisualizationProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<VisualizationFilters>(defaultFilters);
  const [workflow, setWorkflow] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Process filter changes through MCP workflow
  useEffect(() => {
    const processFilters = async () => {
      setIsProcessing(true);
      try {
        const result = await visualizationWorkflow.execute(filters);
        setWorkflow(result);
      } catch (error) {
        console.error('Error in visualization workflow:', error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    processFilters();
  }, [filters]);
  
  // Update filters
  const setFilters = (newFilters: Partial<VisualizationFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters
    }));
  };
  
  // Queries using React Query
  const regionalCostsQuery = useQuery({
    queryKey: ['regionalCosts', filters.buildingType, filters.regions, filters.counties, filters.states],
    queryFn: async () => {
      if (!workflow?.action?.endpoints?.includes('/api/analytics/regional-costs')) return null;
      
      const params = new URLSearchParams();
      params.append('buildingType', filters.buildingType);
      // Required parameters for regional-costs endpoint
      params.append('year', new Date().getFullYear().toString()); // Current year
      params.append('squareFootage', '2000'); // Default value
      
      if (filters.regions.length > 0) {
        filters.regions.forEach(region => params.append('regions', region));
      }
      
      if (filters.counties.length > 0) {
        filters.counties.forEach(county => params.append('counties', county));
      }
      
      if (filters.states.length > 0) {
        filters.states.forEach(state => params.append('states', state));
      }
      
      const response = await fetch(`/api/analytics/regional-costs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch regional costs data');
      }
      return response.json();
    },
    enabled: !!workflow?.action?.endpoints?.includes('/api/analytics/regional-costs')
  });
  
  const hierarchicalCostsQuery = useQuery({
    queryKey: ['hierarchicalCosts', filters.buildingType],
    queryFn: async () => {
      if (!workflow?.action?.endpoints?.includes('/api/analytics/hierarchical-costs')) return null;
      
      const params = new URLSearchParams();
      params.append('buildingType', filters.buildingType);
      // Required parameters for hierarchical-costs endpoint
      params.append('region', 'Central Benton'); // Default region
      params.append('year', new Date().getFullYear().toString()); // Current year
      params.append('squareFootage', '2000'); // Default value
      
      const response = await fetch(`/api/analytics/hierarchical-costs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hierarchical costs data');
      }
      return response.json();
    },
    enabled: !!workflow?.action?.endpoints?.includes('/api/analytics/hierarchical-costs')
  });
  
  const statisticalDataQuery = useQuery({
    queryKey: ['statisticalData', filters.buildingType, filters.startYear, filters.endYear],
    queryFn: async () => {
      if (!workflow?.action?.endpoints?.includes('/api/analytics/statistical-correlations')) return null;
      
      const params = new URLSearchParams();
      params.append('buildingType', filters.buildingType);
      params.append('startYear', filters.startYear.toString());
      params.append('endYear', filters.endYear.toString());
      // Required parameters for statistical-correlations endpoint
      params.append('region', 'Central Benton'); // Default region
      
      const response = await fetch(`/api/analytics/statistical-correlations?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch statistical data');
      }
      return response.json();
    },
    enabled: !!workflow?.action?.endpoints?.includes('/api/analytics/statistical-correlations')
  });
  
  // Export data function
  const exportData = async (format: string) => {
    console.log(`Exporting data in ${format} format`);
    // Implementation will be added in future
  };
  
  const contextValue: MCPVisualizationContextType = {
    filters,
    setFilters,
    regionalCostsQuery,
    hierarchicalCostsQuery,
    statisticalDataQuery,
    isProcessing,
    exportData
  };
  
  return (
    <MCPVisualizationContext.Provider value={contextValue}>
      {children}
    </MCPVisualizationContext.Provider>
  );
}

// Hook for using the visualization context
export function useMCPVisualization() {
  const context = useContext(MCPVisualizationContext);
  if (context === undefined) {
    throw new Error('useMCPVisualization must be used within a MCPVisualizationProvider');
  }
  return context;
}

// MCP Visualization component that provides context for its children
export function MCPVisualizationController({ children }: { children: ReactNode }) {
  return (
    <MCPVisualizationProvider>
      {children}
    </MCPVisualizationProvider>
  );
}