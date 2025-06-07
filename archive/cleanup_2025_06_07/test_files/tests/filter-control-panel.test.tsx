/**
 * Filter Control Panel Tests
 * 
 * This file contains tests for the filter control panel component to verify
 * proper rendering and interaction with the visualization context.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilterControlPanel } from '../client/src/components/visualizations/FilterControlPanel';
import { VisualizationContextProvider } from '../client/src/contexts/visualization-context';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Mock the cost matrix data
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  
  return {
    ...originalModule,
    useQuery: jest.fn().mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/cost-matrix') {
        return {
          data: [
            {
              region: 'Eastern',
              baseCost: 150000,
              complexityFactorBase: 0.2,
              qualityFactorBase: 0.1,
              conditionFactorBase: 0.05,
              buildingType: 'Residential'
            },
            {
              region: 'Western',
              baseCost: 200000,
              complexityFactorBase: 0.15,
              qualityFactorBase: 0.15,
              conditionFactorBase: 0.1,
              buildingType: 'Commercial'
            }
          ],
          isLoading: false,
          error: null
        };
      }
      
      return {
        data: null,
        isLoading: false,
        error: null
      };
    })
  };
});

// Create a wrapper with necessary providers
const createWrapper = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <VisualizationContextProvider>
        {ui}
      </VisualizationContextProvider>
    </QueryClientProvider>
  );
};

describe('FilterControlPanel', () => {
  test('should render correctly with default props', () => {
    createWrapper(<FilterControlPanel />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Filter visualizations by region, building type, and more')).toBeInTheDocument();
    
    // Check that all filter sections are present
    expect(screen.getByText('Regions')).toBeInTheDocument();
    expect(screen.getByText('Building Types')).toBeInTheDocument();
    expect(screen.getByText('Cost Range')).toBeInTheDocument();
    expect(screen.getByText('Counties')).toBeInTheDocument();
    
    // Check that clear all button is present
    expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
  });
  
  test('should render compact version when specified', () => {
    createWrapper(<FilterControlPanel compact={true} />);
    
    // In compact mode, the component should be collapsed by default
    expect(screen.getByText('Filters')).toBeInTheDocument();
    
    // Filter sections should not be visible until expanded
    expect(screen.queryByText('Regions')).not.toBeVisible();
    
    // Expand the panel
    fireEvent.click(screen.getByText('Filters'));
    
    // Now filter sections should be visible
    expect(screen.getByText('Regions')).toBeVisible();
  });
  
  test('should allow filtering of displayed filter types', () => {
    createWrapper(<FilterControlPanel allowedFilters={['regions', 'buildingTypes']} />);
    
    // These filter types should be present
    expect(screen.getByText('Regions')).toBeInTheDocument();
    expect(screen.getByText('Building Types')).toBeInTheDocument();
    
    // These filter types should not be present
    expect(screen.queryByText('Cost Range')).not.toBeInTheDocument();
    expect(screen.queryByText('Counties')).not.toBeInTheDocument();
  });
  
  test('should display active filters and allow removing them', async () => {
    const { rerender } = createWrapper(
      <VisualizationContextProvider>
        <div>
          <button data-testid="add-region" onClick={() => {
            // Directly updating context from outside component for testing
            document.dispatchEvent(new CustomEvent('add-region-filter', { detail: 'Eastern' }));
          }}>
            Add Eastern Region
          </button>
          <FilterControlPanel />
        </div>
      </VisualizationContextProvider>
    );
    
    // Initially no region filters
    expect(screen.getByText('No region filters applied')).toBeInTheDocument();
    
    // Add a region filter
    fireEvent.click(screen.getByTestId('add-region'));
    
    // Re-render to reflect changes
    rerender(
      <VisualizationContextProvider>
        <FilterControlPanel />
      </VisualizationContextProvider>
    );
    
    // Region filter should now be displayed
    await waitFor(() => {
      expect(screen.queryByText('No region filters applied')).not.toBeInTheDocument();
      expect(screen.getByText('Eastern')).toBeInTheDocument();
    });
    
    // Clear regions button should be visible
    const clearButton = screen.getByText('Clear');
    expect(clearButton).toBeInTheDocument();
    
    // Click clear button
    fireEvent.click(clearButton);
    
    // Region filter should be removed
    await waitFor(() => {
      expect(screen.getByText('No region filters applied')).toBeInTheDocument();
    });
  });
  
  test('should update cost range when slider is moved', async () => {
    createWrapper(<FilterControlPanel />);
    
    // Find the slider
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    
    // Move the slider
    fireEvent.change(slider, { target: { value: 300000 } });
    
    // Cost should be updated
    await waitFor(() => {
      const costLabels = screen.getAllByText(/\$[0-9]+(\.[0-9]+)?[KM]?/);
      expect(costLabels.length).toBeGreaterThan(0);
    });
  });
  
  test('should clear all filters when clear all button is clicked', async () => {
    const { rerender } = createWrapper(
      <VisualizationContextProvider>
        <div>
          <button data-testid="add-region" onClick={() => {
            // Directly updating context from outside component for testing
            document.dispatchEvent(new CustomEvent('add-region-filter', { detail: 'Eastern' }));
          }}>
            Add Eastern Region
          </button>
          <FilterControlPanel />
        </div>
      </VisualizationContextProvider>
    );
    
    // Add a region filter
    fireEvent.click(screen.getByTestId('add-region'));
    
    // Re-render to reflect changes
    rerender(
      <VisualizationContextProvider>
        <FilterControlPanel />
      </VisualizationContextProvider>
    );
    
    // Region filter should now be displayed
    await waitFor(() => {
      expect(screen.getByText('Eastern')).toBeInTheDocument();
    });
    
    // Click clear all button
    const clearAllButton = screen.getByText('Clear All Filters');
    fireEvent.click(clearAllButton);
    
    // All filters should be removed
    await waitFor(() => {
      expect(screen.getByText('No region filters applied')).toBeInTheDocument();
    });
  });
});