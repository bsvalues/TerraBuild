/**
 * Tests for Visualization Context
 * 
 * This suite tests the functionality of the visualization context provider
 * and its associated hooks and state management.
 */

import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { 
  VisualizationContextProvider, 
  useVisualizationContext,
  VisualizationFilters
} from '../client/src/contexts/visualization-context';

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: ReactNode }) => (
  <VisualizationContextProvider>{children}</VisualizationContextProvider>
);

describe('Visualization Context', () => {
  test('should initialize with default values', () => {
    const { result } = renderHook(() => useVisualizationContext(), { wrapper });
    
    expect(result.current.filters).toBeNull();
    expect(result.current.selectedDatapoint).toBeNull();
    expect(typeof result.current.setFilters).toBe('function');
    expect(typeof result.current.addFilter).toBe('function');
    expect(typeof result.current.removeFilter).toBe('function');
    expect(typeof result.current.clearFilters).toBe('function');
    expect(typeof result.current.setSelectedDatapoint).toBe('function');
  });
  
  test('should set filters correctly', () => {
    const { result } = renderHook(() => useVisualizationContext(), { wrapper });
    
    const newFilters: VisualizationFilters = {
      buildingTypes: ['Residential', 'Commercial'],
      regions: ['Eastern', 'Western']
    };
    
    act(() => {
      result.current.setFilters(newFilters);
    });
    
    expect(result.current.filters).toEqual(newFilters);
  });
  
  test('should add filters correctly', () => {
    const { result } = renderHook(() => useVisualizationContext(), { wrapper });
    
    act(() => {
      result.current.addFilter('buildingTypes', ['Residential']);
    });
    
    expect(result.current.filters).toHaveProperty('buildingTypes');
    expect(result.current.filters?.buildingTypes).toEqual(['Residential']);
    
    act(() => {
      result.current.addFilter('regions', ['Eastern']);
    });
    
    expect(result.current.filters).toHaveProperty('regions');
    expect(result.current.filters?.regions).toEqual(['Eastern']);
    expect(result.current.filters?.buildingTypes).toEqual(['Residential']);
  });
  
  test('should remove filters correctly', () => {
    const { result } = renderHook(() => useVisualizationContext(), { wrapper });
    
    act(() => {
      result.current.setFilters({
        buildingTypes: ['Residential'],
        regions: ['Eastern']
      });
    });
    
    act(() => {
      result.current.removeFilter('buildingTypes');
    });
    
    expect(result.current.filters).not.toHaveProperty('buildingTypes');
    expect(result.current.filters).toHaveProperty('regions');
    
    act(() => {
      result.current.removeFilter('regions');
    });
    
    // Should be null when all filters are removed
    expect(result.current.filters).toBeNull();
  });
  
  test('should clear all filters', () => {
    const { result } = renderHook(() => useVisualizationContext(), { wrapper });
    
    act(() => {
      result.current.setFilters({
        buildingTypes: ['Residential'],
        regions: ['Eastern'],
        year: 2025
      });
    });
    
    act(() => {
      result.current.clearFilters();
    });
    
    expect(result.current.filters).toBeNull();
  });
  
  test('should set selected datapoint', () => {
    const { result } = renderHook(() => useVisualizationContext(), { wrapper });
    
    const datapoint = { id: 1, value: 100, label: 'Test' };
    
    act(() => {
      result.current.setSelectedDatapoint(datapoint);
    });
    
    expect(result.current.selectedDatapoint).toEqual(datapoint);
    
    act(() => {
      result.current.setSelectedDatapoint(null);
    });
    
    expect(result.current.selectedDatapoint).toBeNull();
  });
});