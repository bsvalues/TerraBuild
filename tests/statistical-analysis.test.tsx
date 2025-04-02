/**
 * Tests for Statistical Analysis Dashboard Component
 * 
 * This suite tests the functionality of the statistical analysis
 * dashboard component that provides advanced metrics and insights
 * about building cost data.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VisualizationContextProvider } from '../client/src/contexts/visualization-context';
import { StatisticalAnalysisDashboard } from '../client/src/components/visualizations/StatisticalAnalysisDashboard';
import { 
  calculateSummaryStatistics, 
  detectOutliers, 
  calculateCorrelations 
} from '../client/src/utils/statistical-utils';

// Mock cost data for testing
const mockCostData = [
  { 
    id: 1, 
    region: 'North', 
    buildingType: 'residential', 
    baseCost: 100, 
    complexityFactor: 0.1, 
    qualityFactor: 0.2, 
    conditionFactor: 0.1,
    adjustedCost: 140
  },
  { 
    id: 2, 
    region: 'North', 
    buildingType: 'commercial', 
    baseCost: 200, 
    complexityFactor: 0.15, 
    qualityFactor: 0.25, 
    conditionFactor: 0.1,
    adjustedCost: 300
  },
  { 
    id: 3, 
    region: 'South', 
    buildingType: 'residential', 
    baseCost: 90, 
    complexityFactor: 0.1, 
    qualityFactor: 0.15, 
    conditionFactor: 0.05,
    adjustedCost: 117
  },
  { 
    id: 4, 
    region: 'South', 
    buildingType: 'commercial', 
    baseCost: 180, 
    complexityFactor: 0.15, 
    qualityFactor: 0.2, 
    conditionFactor: 0.05,
    adjustedCost: 252
  },
  { 
    id: 5, 
    region: 'East', 
    buildingType: 'residential', 
    baseCost: 110, 
    complexityFactor: 0.12, 
    qualityFactor: 0.22, 
    conditionFactor: 0.08,
    adjustedCost: 156.2
  },
  { 
    id: 6, 
    region: 'West', 
    buildingType: 'industrial', 
    baseCost: 250, 
    complexityFactor: 0.2, 
    qualityFactor: 0.3, 
    conditionFactor: 0.15,
    adjustedCost: 412.5
  },
];

// Mock cost data with outliers
const mockDataWithOutliers = [
  ...mockCostData,
  { 
    id: 7, 
    region: 'North', 
    buildingType: 'special', 
    baseCost: 500, 
    complexityFactor: 0.3, 
    qualityFactor: 0.4, 
    conditionFactor: 0.2,
    adjustedCost: 950
  }
];

// Setup test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock the fetch hook
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn().mockImplementation(({ queryKey }) => {
    if (queryKey.includes('/api/cost-matrix')) {
      return { data: mockCostData, isLoading: false, error: null };
    }
    return { data: null, isLoading: false, error: null };
  })
}));

describe('Statistical Analysis Dashboard Component', () => {
  test('Should calculate correct summary statistics', () => {
    const baseCosts = mockCostData.map(item => item.baseCost);
    const stats = calculateSummaryStatistics(baseCosts);
    
    expect(stats.mean).toBeCloseTo(155, 0);
    expect(stats.median).toBeCloseTo(145, 0);
    expect(stats.min).toBe(90);
    expect(stats.max).toBe(250);
    expect(stats.standardDeviation).toBeGreaterThan(0);
  });
  
  test('Should detect outliers correctly', () => {
    const baseCosts = mockDataWithOutliers.map(item => item.baseCost);
    const outliers = detectOutliers(baseCosts);
    
    expect(outliers).toContain(500);
    expect(outliers.length).toBe(1);
  });
  
  test('Should calculate correlations between factors', () => {
    const correlations = calculateCorrelations(mockCostData);
    
    // Complexity, quality, and condition factors should correlate with adjustedCost
    expect(correlations.complexityFactor.adjustedCost).toBeGreaterThan(0.5);
    expect(correlations.qualityFactor.adjustedCost).toBeGreaterThan(0.5);
    expect(correlations.conditionFactor.adjustedCost).toBeGreaterThan(0.5);
  });
  
  test('Should render all statistical metrics when data is loaded', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <VisualizationContextProvider>
          <StatisticalAnalysisDashboard />
        </VisualizationContextProvider>
      </QueryClientProvider>
    );
    
    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByTestId('statistics-card-mean')).toBeInTheDocument();
      expect(screen.getByTestId('statistics-card-median')).toBeInTheDocument();
      expect(screen.getByTestId('statistics-card-std-dev')).toBeInTheDocument();
      expect(screen.getByTestId('statistics-card-range')).toBeInTheDocument();
      expect(screen.getByTestId('outlier-detection')).toBeInTheDocument();
      expect(screen.getByTestId('correlation-matrix')).toBeInTheDocument();
    });
  });
  
  test('Should update statistics when filters are applied', async () => {
    const { getByRole, getByTestId } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <VisualizationContextProvider>
          <StatisticalAnalysisDashboard />
        </VisualizationContextProvider>
      </QueryClientProvider>
    );
    
    // Initial value
    const initialMean = getByTestId('statistics-value-mean').textContent;
    
    // Apply filter (mocked through the context)
    const filterButton = getByRole('button', { name: /filter/i });
    userEvent.click(filterButton);
    
    // Verify that statistics are recalculated
    await waitFor(() => {
      const updatedMean = getByTestId('statistics-value-mean').textContent;
      expect(updatedMean).not.toBe(initialMean);
    });
  });
  
  test('Should show distribution visualization', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <VisualizationContextProvider>
          <StatisticalAnalysisDashboard />
        </VisualizationContextProvider>
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('distribution-chart')).toBeInTheDocument();
    });
  });
  
  test('Should handle empty dataset gracefully', async () => {
    // Override the mock for this test to return empty data
    jest.spyOn(require('@tanstack/react-query'), 'useQuery')
      .mockImplementationOnce(() => ({
        data: [], 
        isLoading: false, 
        error: null
      }));
    
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <VisualizationContextProvider>
          <StatisticalAnalysisDashboard />
        </VisualizationContextProvider>
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });
  });
});