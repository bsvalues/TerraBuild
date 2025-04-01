/**
 * Tests for ComparativeAnalysis Component
 * 
 * This suite tests the functionality of the comparative analysis
 * visualization component that allows side-by-side comparison of
 * building costs across multiple regions, types, or time periods.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComparativeAnalysis } from '../client/src/components/visualizations/ComparativeAnalysis';
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
              id: 1,
              region: 'Eastern',
              baseCost: 150000,
              complexityFactorBase: 0.2,
              qualityFactorBase: 0.1,
              conditionFactorBase: 0.05,
              buildingType: 'Residential'
            },
            {
              id: 2,
              region: 'Western',
              baseCost: 200000,
              complexityFactorBase: 0.15,
              qualityFactorBase: 0.15,
              conditionFactorBase: 0.1,
              buildingType: 'Commercial'
            },
            {
              id: 3,
              region: 'Northern',
              baseCost: 180000,
              complexityFactorBase: 0.18,
              qualityFactorBase: 0.12,
              conditionFactorBase: 0.07,
              buildingType: 'Residential'
            },
            {
              id: 4,
              region: 'Southern',
              baseCost: 165000,
              complexityFactorBase: 0.17,
              qualityFactorBase: 0.11,
              conditionFactorBase: 0.06,
              buildingType: 'Industrial'
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

describe('ComparativeAnalysis Component', () => {
  // Base functionality
  test('should render empty state when no items are selected for comparison', () => {
    createWrapper(<ComparativeAnalysis />);
    
    expect(screen.getByText('Select Items to Compare')).toBeInTheDocument();
    expect(screen.getByText('Add building cost data points to perform a side-by-side comparison')).toBeInTheDocument();
  });
  
  test('should add items to comparison when selected', async () => {
    createWrapper(<ComparativeAnalysis />);
    
    // Add an item to comparison
    fireEvent.click(screen.getByTestId('add-comparison-item'));
    
    // Select "Eastern" region from the dropdown
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a region'));
    });
    fireEvent.click(screen.getByText('Eastern'));
    
    // Select "Residential" building type
    fireEvent.click(screen.getByText('Select a building type'));
    fireEvent.click(screen.getByText('Residential'));
    
    // Add to comparison
    fireEvent.click(screen.getByText('Add to Comparison'));
    
    // Should now show the item in comparison view
    await waitFor(() => {
      expect(screen.getByText('Eastern Region')).toBeInTheDocument();
      expect(screen.getByText('Residential')).toBeInTheDocument();
      expect(screen.getByText('$150,000')).toBeInTheDocument();
    });
  });
  
  test('should remove items from comparison when requested', async () => {
    createWrapper(<ComparativeAnalysis />);
    
    // Add an item
    fireEvent.click(screen.getByTestId('add-comparison-item'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a region'));
    });
    fireEvent.click(screen.getByText('Eastern'));
    fireEvent.click(screen.getByText('Select a building type'));
    fireEvent.click(screen.getByText('Residential'));
    fireEvent.click(screen.getByText('Add to Comparison'));
    
    await waitFor(() => {
      expect(screen.getByText('Eastern Region')).toBeInTheDocument();
    });
    
    // Remove the item
    fireEvent.click(screen.getByTestId('remove-comparison-item-0'));
    
    // Should return to empty state
    await waitFor(() => {
      expect(screen.getByText('Select Items to Compare')).toBeInTheDocument();
    });
  });
  
  // Feature tests
  test('should calculate percentage differences correctly between compared items', async () => {
    createWrapper(<ComparativeAnalysis />);
    
    // Add two items for comparison
    // 1. Eastern Residential: $150,000
    fireEvent.click(screen.getByTestId('add-comparison-item'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a region'));
    });
    fireEvent.click(screen.getByText('Eastern'));
    fireEvent.click(screen.getByText('Select a building type'));
    fireEvent.click(screen.getByText('Residential'));
    fireEvent.click(screen.getByText('Add to Comparison'));
    
    // 2. Western Commercial: $200,000
    fireEvent.click(screen.getByTestId('add-comparison-item'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a region'));
    });
    fireEvent.click(screen.getByText('Western'));
    fireEvent.click(screen.getByText('Select a building type'));
    fireEvent.click(screen.getByText('Commercial'));
    fireEvent.click(screen.getByText('Add to Comparison'));
    
    // Should show percentage difference: (200000 - 150000) / 150000 = 33.33%
    await waitFor(() => {
      const differenceEl = screen.getByTestId('percentage-difference-0-1');
      expect(differenceEl).toHaveTextContent('33.3%');
    });
  });
  
  test('should display appropriate visualization based on selected type', async () => {
    createWrapper(<ComparativeAnalysis />);
    
    // Add comparison items first
    fireEvent.click(screen.getByTestId('add-comparison-item'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a region'));
    });
    fireEvent.click(screen.getByText('Eastern'));
    fireEvent.click(screen.getByText('Select a building type'));
    fireEvent.click(screen.getByText('Residential'));
    fireEvent.click(screen.getByText('Add to Comparison'));
    
    // Switch visualization type to line chart
    fireEvent.click(screen.getByTestId('viz-type-line'));
    
    await waitFor(() => {
      // LineChart should be in document
      expect(screen.getByTestId('comparison-line-chart')).toBeInTheDocument();
      // BarChart should not be in document
      expect(screen.queryByTestId('comparison-bar-chart')).not.toBeInTheDocument();
    });
    
    // Switch to bar chart
    fireEvent.click(screen.getByTestId('viz-type-bar'));
    
    await waitFor(() => {
      // BarChart should be in document
      expect(screen.getByTestId('comparison-bar-chart')).toBeInTheDocument();
      // LineChart should not be in document
      expect(screen.queryByTestId('comparison-line-chart')).not.toBeInTheDocument();
    });
  });
  
  // Edge cases
  test('should handle comparing items with missing data points', async () => {
    // Mock the query to return some incomplete data
    jest.mocked(require('@tanstack/react-query').useQuery).mockImplementationOnce(({ queryKey }) => {
      if (queryKey[0] === '/api/cost-matrix') {
        return {
          data: [
            {
              id: 1,
              region: 'Eastern',
              baseCost: 150000,
              // Missing complexity factor
              qualityFactorBase: 0.1,
              conditionFactorBase: 0.05,
              buildingType: 'Residential'
            },
            {
              id: 2,
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
    });
    
    createWrapper(<ComparativeAnalysis />);
    
    // Add incomplete data item
    fireEvent.click(screen.getByTestId('add-comparison-item'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a region'));
    });
    fireEvent.click(screen.getByText('Eastern'));
    fireEvent.click(screen.getByText('Select a building type'));
    fireEvent.click(screen.getByText('Residential'));
    fireEvent.click(screen.getByText('Add to Comparison'));
    
    // Should show warning for missing data
    await waitFor(() => {
      expect(screen.getByTestId('incomplete-data-warning')).toBeInTheDocument();
    });
  });
  
  test('should limit comparisons to maximum allowed items', async () => {
    createWrapper(<ComparativeAnalysis maxComparisons={2} />);
    
    // Add first item
    fireEvent.click(screen.getByTestId('add-comparison-item'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a region'));
    });
    fireEvent.click(screen.getByText('Eastern'));
    fireEvent.click(screen.getByText('Select a building type'));
    fireEvent.click(screen.getByText('Residential'));
    fireEvent.click(screen.getByText('Add to Comparison'));
    
    // Add second item
    fireEvent.click(screen.getByTestId('add-comparison-item'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a region'));
    });
    fireEvent.click(screen.getByText('Western'));
    fireEvent.click(screen.getByText('Select a building type'));
    fireEvent.click(screen.getByText('Commercial'));
    fireEvent.click(screen.getByText('Add to Comparison'));
    
    // Try to add third item - button should be disabled
    await waitFor(() => {
      const addButton = screen.getByTestId('add-comparison-item');
      expect(addButton).toBeDisabled();
      expect(screen.getByText('Maximum of 2 items can be compared')).toBeInTheDocument();
    });
  });
  
  // Integration tests
  test('should maintain comparison items when filter context changes', async () => {
    const { rerender } = createWrapper(
      <div>
        <button data-testid="add-region-filter" onClick={() => {
          // Directly updating context from outside component for testing
          document.dispatchEvent(new CustomEvent('add-region-filter', { detail: 'Eastern' }));
        }}>
          Add Eastern Region Filter
        </button>
        <ComparativeAnalysis />
      </div>
    );
    
    // Add an item to comparison
    fireEvent.click(screen.getByTestId('add-comparison-item'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Select a region'));
    });
    fireEvent.click(screen.getByText('Eastern'));
    fireEvent.click(screen.getByText('Select a building type'));
    fireEvent.click(screen.getByText('Residential'));
    fireEvent.click(screen.getByText('Add to Comparison'));
    
    // Verify item was added
    await waitFor(() => {
      expect(screen.getByText('Eastern Region')).toBeInTheDocument();
    });
    
    // Change filter context
    fireEvent.click(screen.getByTestId('add-region-filter'));
    
    // Item should still be in comparison
    await waitFor(() => {
      expect(screen.getByText('Eastern Region')).toBeInTheDocument();
    });
  });
});