/**
 * Visualization Context
 * 
 * This context provides shared state and functionality for visualization components,
 * enabling them to communicate and coordinate with each other.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Type for filters that can be applied to visualizations
export interface VisualizationFilters {
  buildingTypes?: string[];
  regions?: string[];
  year?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  [key: string]: any; // Allow for additional filters
}

// Interface for the context value
interface VisualizationContextType {
  filters: VisualizationFilters | null;
  setFilters: (filters: VisualizationFilters | null) => void;
  addFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  selectedDatapoint: any | null;
  setSelectedDatapoint: (datapoint: any | null) => void;
}

// Create context with default values
const defaultContextValue: VisualizationContextType = {
  filters: null,
  setFilters: () => {},
  addFilter: () => {},
  removeFilter: () => {},
  clearFilters: () => {},
  selectedDatapoint: null,
  setSelectedDatapoint: () => {}
};

const VisualizationContext = createContext<VisualizationContextType>(defaultContextValue);

// Props for provider component
interface VisualizationContextProviderProps {
  children: ReactNode;
}

// Provider component
export const VisualizationContextProvider = ({ children }: VisualizationContextProviderProps) => {
  const [filters, setFilters] = useState<VisualizationFilters | null>(null);
  const [selectedDatapoint, setSelectedDatapoint] = useState<any | null>(null);

  // Add a filter
  const addFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...(prev || {}),
      [key]: value,
    }));
  };
  
  // Remove a filter
  const removeFilter = (key: string) => {
    if (!filters) return;
    
    const newFilters = { ...filters };
    delete newFilters[key];
    
    if (Object.keys(newFilters).length === 0) {
      setFilters(null);
    } else {
      setFilters(newFilters);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters(null);
  };

  const value = {
    filters,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    selectedDatapoint,
    setSelectedDatapoint
  };

  return (
    <VisualizationContext.Provider value={value}>
      {children}
    </VisualizationContext.Provider>
  );
};

// Hook to use the visualization context
export const useVisualizationContext = () => useContext(VisualizationContext);