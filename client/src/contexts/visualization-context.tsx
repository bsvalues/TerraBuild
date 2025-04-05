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
  
  // Region filter methods
  addRegionFilter?: (region: string) => void;
  removeRegionFilter?: (region: string) => void;
  clearRegionFilters?: () => void;
  isRegionFiltered?: (region: string) => boolean;
  
  // Building type filter methods
  addBuildingTypeFilter?: (buildingType: string) => void;
  removeBuildingTypeFilter?: (buildingType: string) => void;
  clearBuildingTypeFilters?: () => void;
  isBuildingTypeFiltered?: (buildingType: string) => boolean;
  
  // County filter methods
  addCountyFilter?: (county: string) => void;
  removeCountyFilter?: (county: string) => void;
  clearCountyFilters?: () => void;
  
  // Cost range filter methods
  setCostRange?: (range: [number, number]) => void;
  clearCostRange?: () => void;
  
  // Filter summary
  getFilterSummary?: () => string;
  
  // Clear all filters
  clearAllFilters?: () => void;
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
  
  // Region filter methods
  const addRegionFilter = (region: string) => {
    setFilters(prev => {
      const regions = prev?.regions ? [...prev.regions] : [];
      if (!regions.includes(region)) {
        regions.push(region);
      }
      return { ...(prev || {}), regions };
    });
  };
  
  const removeRegionFilter = (region: string) => {
    setFilters(prev => {
      if (!prev?.regions) return prev;
      const regions = prev.regions.filter((r: string) => r !== region);
      const newFilters = { ...prev, regions };
      if (regions.length === 0 && 'regions' in newFilters) {
        const { regions, ...rest } = newFilters;
        return Object.keys(rest).length === 0 ? null : rest;
      }
      return Object.keys(newFilters).length === 0 ? null : newFilters;
    });
  };
  
  const clearRegionFilters = () => {
    setFilters(prev => {
      if (!prev) return null;
      if (!('regions' in prev)) return prev;
      const { regions, ...rest } = prev;
      return Object.keys(rest).length === 0 ? null : rest;
    });
  };
  
  const isRegionFiltered = (region: string) => {
    return filters?.regions ? filters.regions.includes(region) : false;
  };
  
  // Building type filter methods
  const addBuildingTypeFilter = (buildingType: string) => {
    setFilters(prev => {
      const buildingTypes = prev?.buildingTypes ? [...prev.buildingTypes] : [];
      if (!buildingTypes.includes(buildingType)) {
        buildingTypes.push(buildingType);
      }
      return { ...(prev || {}), buildingTypes };
    });
  };
  
  const removeBuildingTypeFilter = (buildingType: string) => {
    setFilters(prev => {
      if (!prev?.buildingTypes) return prev;
      const buildingTypes = prev.buildingTypes.filter(bt => bt !== buildingType);
      const newFilters = { ...prev, buildingTypes };
      if (buildingTypes.length === 0 && 'buildingTypes' in newFilters) {
        const { buildingTypes, ...rest } = newFilters;
        return Object.keys(rest).length === 0 ? null : rest;
      }
      return Object.keys(newFilters).length === 0 ? null : newFilters;
    });
  };
  
  const clearBuildingTypeFilters = () => {
    setFilters(prev => {
      if (!prev) return null;
      if (!('buildingTypes' in prev)) return prev;
      const { buildingTypes, ...rest } = prev;
      return Object.keys(rest).length === 0 ? null : rest;
    });
  };
  
  const isBuildingTypeFiltered = (buildingType: string) => {
    return filters?.buildingTypes ? filters.buildingTypes.includes(buildingType) : false;
  };
  
  // County filter methods
  const addCountyFilter = (county: string) => {
    setFilters(prev => {
      const counties = prev?.counties ? [...prev.counties] : [];
      if (!counties.includes(county)) {
        counties.push(county);
      }
      return { ...(prev || {}), counties };
    });
  };
  
  const removeCountyFilter = (county: string) => {
    setFilters(prev => {
      if (!prev?.counties) return prev;
      const counties = prev.counties.filter((c: string) => c !== county);
      const newFilters = { ...prev, counties };
      if (counties.length === 0 && 'counties' in newFilters) {
        const { counties, ...rest } = newFilters;
        return Object.keys(rest).length === 0 ? null : rest;
      }
      return Object.keys(newFilters).length === 0 ? null : newFilters;
    });
  };
  
  const clearCountyFilters = () => {
    setFilters(prev => {
      if (!prev) return null;
      if (!('counties' in prev)) return prev;
      const { counties, ...rest } = prev;
      return Object.keys(rest).length === 0 ? null : rest;
    });
  };
  
  // Cost range filter methods
  const setCostRange = (range: [number, number]) => {
    setFilters(prev => {
      return { ...(prev || {}), costRange: range };
    });
  };
  
  const clearCostRange = () => {
    setFilters(prev => {
      if (!prev) return null;
      if (!('costRange' in prev)) return prev;
      const { costRange, ...rest } = prev;
      return Object.keys(rest).length === 0 ? null : rest;
    });
  };
  
  // Clear all filters
  const clearAllFilters = () => setFilters(null);
  
  // Get filter summary
  const getFilterSummary = () => {
    if (!filters) return 'No filters applied';
    
    const parts = [];
    if (filters.regions && filters.regions.length > 0) {
      parts.push(`${filters.regions.length} region${filters.regions.length > 1 ? 's' : ''}`);
    }
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      parts.push(`${filters.buildingTypes.length} building type${filters.buildingTypes.length > 1 ? 's' : ''}`);
    }
    if (filters.counties && filters.counties.length > 0) {
      parts.push(`${filters.counties.length} count${filters.counties.length > 1 ? 'ies' : 'y'}`);
    }
    if (filters.costRange) {
      parts.push('cost range');
    }
    
    return parts.length === 0 ? 'No filters applied' : `Filtered by: ${parts.join(', ')}`;
  };

  const value = {
    filters,
    selectedDatapoint,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    setSelectedDatapoint,
    
    // Region filter methods
    addRegionFilter,
    removeRegionFilter,
    clearRegionFilters,
    isRegionFiltered,
    
    // Building type filter methods
    addBuildingTypeFilter,
    removeBuildingTypeFilter,
    clearBuildingTypeFilters,
    isBuildingTypeFiltered,
    
    // County filter methods
    addCountyFilter,
    removeCountyFilter,
    clearCountyFilters,
    
    // Cost range filter methods
    setCostRange,
    clearCostRange,
    
    // Clear all filters
    clearAllFilters,
    
    // Get filter summary
    getFilterSummary
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