/**
 * Visualization Context Tests
 * 
 * This file contains tests for the visualization context provider to verify
 * proper state management and filter functionality.
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { VisualizationContextProvider, useVisualizationContext } from '../client/src/contexts/visualization-context';

// Test component that uses the context
const TestComponent = () => {
  const {
    filters,
    addRegionFilter,
    removeRegionFilter,
    addBuildingTypeFilter,
    removeBuildingTypeFilter,
    setCostRange,
    clearAllFilters,
    getFilterSummary
  } = useVisualizationContext();

  return (
    <div>
      <div data-testid="filter-summary">{getFilterSummary()}</div>
      <div data-testid="regions-count">{filters.regions.length}</div>
      <div data-testid="building-types-count">{filters.buildingTypes.length}</div>
      <div data-testid="cost-range">{filters.costRange ? 'set' : 'not-set'}</div>
      
      <button data-testid="add-region" onClick={() => addRegionFilter('Eastern')}>
        Add Region
      </button>
      <button data-testid="remove-region" onClick={() => removeRegionFilter('Eastern')}>
        Remove Region
      </button>
      
      <button data-testid="add-building-type" onClick={() => addBuildingTypeFilter('Residential')}>
        Add Building Type
      </button>
      <button data-testid="remove-building-type" onClick={() => removeBuildingTypeFilter('Residential')}>
        Remove Building Type
      </button>
      
      <button data-testid="set-cost-range" onClick={() => setCostRange([100000, 500000])}>
        Set Cost Range
      </button>
      
      <button data-testid="clear-all" onClick={clearAllFilters}>
        Clear All
      </button>
    </div>
  );
};

// Mock window.location and history
const mockLocation = {
  href: 'http://localhost/',
  search: ''
};

const mockHistory = {
  replaceState: jest.fn()
};

// Tests
describe('VisualizationContextProvider', () => {
  beforeEach(() => {
    // Reset mocks
    Object.defineProperty(window, 'location', {
      value: { ...mockLocation },
      writable: true
    });
    
    Object.defineProperty(window, 'history', {
      value: { ...mockHistory },
      writable: true
    });
    
    mockHistory.replaceState.mockClear();
  });
  
  test('should initialize with default state', () => {
    render(
      <VisualizationContextProvider>
        <TestComponent />
      </VisualizationContextProvider>
    );
    
    expect(screen.getByTestId('filter-summary').textContent).toBe('No filters applied');
    expect(screen.getByTestId('regions-count').textContent).toBe('0');
    expect(screen.getByTestId('building-types-count').textContent).toBe('0');
    expect(screen.getByTestId('cost-range').textContent).toBe('not-set');
  });
  
  test('should add and remove region filters', () => {
    render(
      <VisualizationContextProvider>
        <TestComponent />
      </VisualizationContextProvider>
    );
    
    // Initially no regions
    expect(screen.getByTestId('regions-count').textContent).toBe('0');
    
    // Add a region
    fireEvent.click(screen.getByTestId('add-region'));
    expect(screen.getByTestId('regions-count').textContent).toBe('1');
    expect(screen.getByTestId('filter-summary').textContent).toContain('Eastern');
    
    // Remove the region
    fireEvent.click(screen.getByTestId('remove-region'));
    expect(screen.getByTestId('regions-count').textContent).toBe('0');
    expect(screen.getByTestId('filter-summary').textContent).toBe('No filters applied');
  });
  
  test('should add and remove building type filters', () => {
    render(
      <VisualizationContextProvider>
        <TestComponent />
      </VisualizationContextProvider>
    );
    
    // Initially no building types
    expect(screen.getByTestId('building-types-count').textContent).toBe('0');
    
    // Add a building type
    fireEvent.click(screen.getByTestId('add-building-type'));
    expect(screen.getByTestId('building-types-count').textContent).toBe('1');
    expect(screen.getByTestId('filter-summary').textContent).toContain('Residential');
    
    // Remove the building type
    fireEvent.click(screen.getByTestId('remove-building-type'));
    expect(screen.getByTestId('building-types-count').textContent).toBe('0');
    expect(screen.getByTestId('filter-summary').textContent).toBe('No filters applied');
  });
  
  test('should set and clear cost range', () => {
    render(
      <VisualizationContextProvider>
        <TestComponent />
      </VisualizationContextProvider>
    );
    
    // Initially no cost range
    expect(screen.getByTestId('cost-range').textContent).toBe('not-set');
    
    // Set cost range
    fireEvent.click(screen.getByTestId('set-cost-range'));
    expect(screen.getByTestId('cost-range').textContent).toBe('set');
    expect(screen.getByTestId('filter-summary').textContent).toContain('Cost Range');
    
    // Clear all filters
    fireEvent.click(screen.getByTestId('clear-all'));
    expect(screen.getByTestId('cost-range').textContent).toBe('not-set');
    expect(screen.getByTestId('filter-summary').textContent).toBe('No filters applied');
  });
  
  test('should update URL when filters change', async () => {
    render(
      <VisualizationContextProvider>
        <TestComponent />
      </VisualizationContextProvider>
    );
    
    // Add a region
    fireEvent.click(screen.getByTestId('add-region'));
    
    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockHistory.replaceState).toHaveBeenCalled();
    });
    
    // Check that URL was updated with proper serialized filters
    const call = mockHistory.replaceState.mock.calls[0];
    const urlString = call[2];
    expect(urlString).toContain('filters=');
  });
  
  test('should restore filters from URL parameters', () => {
    // Set up URL with serialized filters
    const filters = {
      regions: ['Eastern'],
      buildingTypes: [],
      costRange: null,
      timeRange: null,
      counties: [],
      selectedDataPoints: []
    };
    const serialized = encodeURIComponent(JSON.stringify(filters));
    window.location.search = `?filters=${serialized}`;
    
    render(
      <VisualizationContextProvider>
        <TestComponent />
      </VisualizationContextProvider>
    );
    
    // Check that filters were restored
    expect(screen.getByTestId('regions-count').textContent).toBe('1');
    expect(screen.getByTestId('filter-summary').textContent).toContain('Eastern');
  });
});