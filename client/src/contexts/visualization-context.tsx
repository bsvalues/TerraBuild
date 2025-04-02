/**
 * Visualization Context
 * 
 * This context provides a central store for visualization filters and selected data points.
 * It allows for components to share visualization state, making it easier to
 * create coordinated views and interactive dashboards.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define filter types
export interface VisualizationFilters {
  buildingTypes?: string[];
  regions?: string[];
  year?: number;
  qualityLevels?: string[];
  minSquareFeet?: number;
  maxSquareFeet?: number;
  costRange?: [number, number];
  [key: string]: any; // Allow for additional filter types
}

// Define datapoint type (generic to accommodate different visualization data)
export interface Datapoint {
  id: number | string;
  [key: string]: any;
}

// Define context type
interface VisualizationContextType {
  filters: VisualizationFilters | null;
  selectedDatapoint: Datapoint | null;
  setFilters: (filters: VisualizationFilters | null) => void;
  addFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  setSelectedDatapoint: (datapoint: Datapoint | null) => void;
}

// Create context with default values
const VisualizationContext = createContext<VisualizationContextType | undefined>(undefined);

// Provider component
export function VisualizationContextProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<VisualizationFilters | null>(null);
  const [selectedDatapoint, setSelectedDatapoint] = useState<Datapoint | null>(null);

  // Add a single filter
  const addFilter = (key: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...(prev || {}) };
      newFilters[key] = value;
      return newFilters;
    });
  };

  // Remove a single filter
  const removeFilter = (key: string) => {
    setFilters(prev => {
      if (!prev) return null;
      
      const newFilters = { ...prev };
      delete newFilters[key];
      
      // If no filters left, return null
      return Object.keys(newFilters).length === 0 ? null : newFilters;
    });
  };

  // Clear all filters
  const clearFilters = () => setFilters(null);

  const value = {
    filters,
    selectedDatapoint,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    setSelectedDatapoint
  };

  return (
    <VisualizationContext.Provider value={value}>
      {children}
    </VisualizationContext.Provider>
  );
}

// Custom hook to use the context
export function useVisualizationContext() {
  const context = useContext(VisualizationContext);
  
  if (context === undefined) {
    throw new Error('useVisualizationContext must be used within a VisualizationContextProvider');
  }
  
  return context;
}