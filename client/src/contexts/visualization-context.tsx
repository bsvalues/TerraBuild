/**
 * Visualization Context Provider
 * 
 * This context provides a centralized state management system for visualizations,
 * enabling cross-visualization interactions, filtering, and data sharing.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for visualization context
export interface FilterState {
  regions: string[];
  buildingTypes: string[];
  costRange: [number, number] | null;
  timeRange: [string, string] | null;
  counties: string[];
  selectedDataPoints: Record<string, any>[];
}

export interface VisualizationContextType {
  // Filter state
  filters: FilterState;
  
  // Filter actions
  addRegionFilter: (region: string) => void;
  removeRegionFilter: (region: string) => void;
  
  addBuildingTypeFilter: (buildingType: string) => void;
  removeBuildingTypeFilter: (buildingType: string) => void;
  
  setCostRange: (range: [number, number] | null) => void;
  setTimeRange: (range: [string, string] | null) => void;
  
  addCountyFilter: (county: string) => void;
  removeCountyFilter: (county: string) => void;
  
  // Data point selection
  selectDataPoint: (dataPoint: Record<string, any>) => void;
  deselectDataPoint: (dataPointId: string) => void;
  
  // Reset actions
  clearAllFilters: () => void;
  clearRegionFilters: () => void;
  clearBuildingTypeFilters: () => void;
  clearCostRange: () => void;
  clearTimeRange: () => void;
  clearCountyFilters: () => void;
  clearSelectedDataPoints: () => void;
  
  // Filter state helpers
  isDataPointSelected: (id: string) => boolean;
  isRegionFiltered: (region: string) => boolean;
  isBuildingTypeFiltered: (buildingType: string) => boolean;
  isCountyFiltered: (county: string) => boolean;
  
  // Utility functions
  getFilterSummary: () => string;
  serializeFilters: () => string;
  deserializeFilters: (serialized: string) => void;
}

// Default filter state
const defaultFilterState: FilterState = {
  regions: [],
  buildingTypes: [],
  costRange: null,
  timeRange: null,
  counties: [],
  selectedDataPoints: []
};

// Create the context
const VisualizationContext = createContext<VisualizationContextType | undefined>(undefined);

// Provider component
export function VisualizationContextProvider({ children }: { children: ReactNode }) {
  // Initialize state
  const [filters, setFilters] = useState<FilterState>(() => {
    // Try to restore filters from URL if available
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const serializedFilters = urlParams.get('filters');
      if (serializedFilters) {
        return JSON.parse(decodeURIComponent(serializedFilters));
      }
    } catch (error) {
      console.error('Failed to parse filters from URL:', error);
    }
    return { ...defaultFilterState };
  });
  
  // Update URL when filters change
  useEffect(() => {
    try {
      const serialized = encodeURIComponent(JSON.stringify(filters));
      const url = new URL(window.location.href);
      url.searchParams.set('filters', serialized);
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.error('Failed to update URL with filters:', error);
    }
  }, [filters]);
  
  // Region filter actions
  const addRegionFilter = (region: string) => {
    if (!filters.regions.includes(region)) {
      setFilters(prev => ({
        ...prev,
        regions: [...prev.regions, region]
      }));
    }
  };
  
  const removeRegionFilter = (region: string) => {
    setFilters(prev => ({
      ...prev,
      regions: prev.regions.filter(r => r !== region)
    }));
  };
  
  // Building type filter actions
  const addBuildingTypeFilter = (buildingType: string) => {
    if (!filters.buildingTypes.includes(buildingType)) {
      setFilters(prev => ({
        ...prev,
        buildingTypes: [...prev.buildingTypes, buildingType]
      }));
    }
  };
  
  const removeBuildingTypeFilter = (buildingType: string) => {
    setFilters(prev => ({
      ...prev,
      buildingTypes: prev.buildingTypes.filter(bt => bt !== buildingType)
    }));
  };
  
  // Cost range filter actions
  const setCostRange = (range: [number, number] | null) => {
    setFilters(prev => ({
      ...prev,
      costRange: range
    }));
  };
  
  // Time range filter actions
  const setTimeRange = (range: [string, string] | null) => {
    setFilters(prev => ({
      ...prev,
      timeRange: range
    }));
  };
  
  // County filter actions
  const addCountyFilter = (county: string) => {
    if (!filters.counties.includes(county)) {
      setFilters(prev => ({
        ...prev,
        counties: [...prev.counties, county]
      }));
    }
  };
  
  const removeCountyFilter = (county: string) => {
    setFilters(prev => ({
      ...prev,
      counties: prev.counties.filter(c => c !== county)
    }));
  };
  
  // Data point selection actions
  const selectDataPoint = (dataPoint: Record<string, any>) => {
    if (!isDataPointSelected(dataPoint.id)) {
      setFilters(prev => ({
        ...prev,
        selectedDataPoints: [...prev.selectedDataPoints, dataPoint]
      }));
    }
  };
  
  const deselectDataPoint = (dataPointId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedDataPoints: prev.selectedDataPoints.filter(dp => dp.id !== dataPointId)
    }));
  };
  
  // Clear actions
  const clearAllFilters = () => {
    setFilters({ ...defaultFilterState });
  };
  
  const clearRegionFilters = () => {
    setFilters(prev => ({
      ...prev,
      regions: []
    }));
  };
  
  const clearBuildingTypeFilters = () => {
    setFilters(prev => ({
      ...prev,
      buildingTypes: []
    }));
  };
  
  const clearCostRange = () => {
    setFilters(prev => ({
      ...prev,
      costRange: null
    }));
  };
  
  const clearTimeRange = () => {
    setFilters(prev => ({
      ...prev,
      timeRange: null
    }));
  };
  
  const clearCountyFilters = () => {
    setFilters(prev => ({
      ...prev,
      counties: []
    }));
  };
  
  const clearSelectedDataPoints = () => {
    setFilters(prev => ({
      ...prev,
      selectedDataPoints: []
    }));
  };
  
  // Helper functions
  const isDataPointSelected = (id: string) => {
    return filters.selectedDataPoints.some(dp => dp.id === id);
  };
  
  const isRegionFiltered = (region: string) => {
    return filters.regions.length === 0 || filters.regions.includes(region);
  };
  
  const isBuildingTypeFiltered = (buildingType: string) => {
    return filters.buildingTypes.length === 0 || filters.buildingTypes.includes(buildingType);
  };
  
  const isCountyFiltered = (county: string) => {
    return filters.counties.length === 0 || filters.counties.includes(county);
  };
  
  // Utility functions
  const getFilterSummary = () => {
    const parts = [];
    
    if (filters.regions.length > 0) {
      parts.push(`Regions: ${filters.regions.join(', ')}`);
    }
    
    if (filters.buildingTypes.length > 0) {
      parts.push(`Building Types: ${filters.buildingTypes.join(', ')}`);
    }
    
    if (filters.costRange) {
      const [min, max] = filters.costRange;
      parts.push(`Cost Range: $${min.toLocaleString()} - $${max.toLocaleString()}`);
    }
    
    if (filters.counties.length > 0) {
      parts.push(`Counties: ${filters.counties.join(', ')}`);
    }
    
    if (parts.length === 0) {
      return 'No filters applied';
    }
    
    return parts.join(' | ');
  };
  
  const serializeFilters = () => {
    return encodeURIComponent(JSON.stringify(filters));
  };
  
  const deserializeFilters = (serialized: string) => {
    try {
      const parsed = JSON.parse(decodeURIComponent(serialized));
      setFilters(parsed);
    } catch (error) {
      console.error('Failed to deserialize filters:', error);
    }
  };
  
  // Context value
  const contextValue: VisualizationContextType = {
    filters,
    addRegionFilter,
    removeRegionFilter,
    addBuildingTypeFilter,
    removeBuildingTypeFilter,
    setCostRange,
    setTimeRange,
    addCountyFilter,
    removeCountyFilter,
    selectDataPoint,
    deselectDataPoint,
    clearAllFilters,
    clearRegionFilters,
    clearBuildingTypeFilters,
    clearCostRange,
    clearTimeRange,
    clearCountyFilters,
    clearSelectedDataPoints,
    isDataPointSelected,
    isRegionFiltered,
    isBuildingTypeFiltered,
    isCountyFiltered,
    getFilterSummary,
    serializeFilters,
    deserializeFilters
  };
  
  return (
    <VisualizationContext.Provider value={contextValue}>
      {children}
    </VisualizationContext.Provider>
  );
}

// Hook for using the visualization context
export function useVisualizationContext() {
  const context = useContext(VisualizationContext);
  
  if (context === undefined) {
    throw new Error('useVisualizationContext must be used within a VisualizationContextProvider');
  }
  
  return context;
}