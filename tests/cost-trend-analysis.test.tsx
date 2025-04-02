/**
 * Tests for Cost Trend Analysis Component
 * 
 * This suite tests the functionality of the cost trend analysis component
 * that visualizes and detects trends in building cost data over time.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CostTrendAnalysis } from '../client/src/components/visualizations/CostTrendAnalysis';
import { detectTrends, detectSeasonality, forecastValues, calculateGrowthRate } from '../client/src/utils/trend-utils';

// Mock data
const mockTimeSeriesData = [
  { year: '2020', quarter: 'Q1', date: '2020-03-31', baseCost: 120000, adjustedCost: 122500, buildingType: 'Residential' },
  { year: '2020', quarter: 'Q2', date: '2020-06-30', baseCost: 122000, adjustedCost: 124050, buildingType: 'Residential' },
  { year: '2020', quarter: 'Q3', date: '2020-09-30', baseCost: 124000, adjustedCost: 126500, buildingType: 'Residential' },
  { year: '2020', quarter: 'Q4', date: '2020-12-31', baseCost: 127000, adjustedCost: 129550, buildingType: 'Residential' },
  { year: '2021', quarter: 'Q1', date: '2021-03-31', baseCost: 128000, adjustedCost: 130500, buildingType: 'Residential' },
  { year: '2021', quarter: 'Q2', date: '2021-06-30', baseCost: 130000, adjustedCost: 133900, buildingType: 'Residential' },
  { year: '2021', quarter: 'Q3', date: '2021-09-30', baseCost: 131500, adjustedCost: 135450, buildingType: 'Residential' },
  { year: '2021', quarter: 'Q4', date: '2021-12-31', baseCost: 134000, adjustedCost: 138020, buildingType: 'Residential' },
  { year: '2022', quarter: 'Q1', date: '2022-03-31', baseCost: 137000, adjustedCost: 141110, buildingType: 'Residential' },
  { year: '2022', quarter: 'Q2', date: '2022-06-30', baseCost: 140000, adjustedCost: 144900, buildingType: 'Residential' },
  { year: '2022', quarter: 'Q3', date: '2022-09-30', baseCost: 141000, adjustedCost: 145230, buildingType: 'Residential' },
  { year: '2022', quarter: 'Q4', date: '2022-12-31', baseCost: 142500, adjustedCost: 147200, buildingType: 'Residential' },
  { year: '2023', quarter: 'Q1', date: '2023-03-31', baseCost: 146000, adjustedCost: 150380, buildingType: 'Residential' },
  { year: '2023', quarter: 'Q2', date: '2023-06-30', baseCost: 149000, adjustedCost: 154500, buildingType: 'Residential' },
  { year: '2023', quarter: 'Q3', date: '2023-09-30', baseCost: 150200, adjustedCost: 156208, buildingType: 'Residential' },
  { year: '2023', quarter: 'Q4', date: '2023-12-31', baseCost: 152000, adjustedCost: 158080, buildingType: 'Residential' },
  { year: '2024', quarter: 'Q1', date: '2024-03-31', baseCost: 153500, adjustedCost: 160000, buildingType: 'Residential' },
  { year: '2024', quarter: 'Q2', date: '2024-06-30', baseCost: 155000, adjustedCost: 162000, buildingType: 'Residential' }
];

// Mock the API response for cost data
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn().mockImplementation(({ queryKey }) => {
    if (queryKey[0] === '/api/cost-matrix/trends') {
      return { data: mockTimeSeriesData, isLoading: false, error: null };
    }
    return { data: null, isLoading: false, error: 'Unknown query key' };
  })
}));

// Set up the query client for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithQueryClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('CostTrendAnalysis Component', () => {
  test('renders the component with chart and controls', async () => {
    renderWithQueryClient(<CostTrendAnalysis />);
    
    // Check that main elements are rendered
    expect(screen.getByText(/Cost Trend Analysis/i)).toBeInTheDocument();
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('trend-filters')).toBeInTheDocument();
    expect(screen.getByTestId('trend-metrics')).toBeInTheDocument();
  });
  
  test('allows switching between different metrics', async () => {
    renderWithQueryClient(<CostTrendAnalysis />);
    
    // Get the metric selector
    const metricSelector = screen.getByTestId('metric-selector');
    expect(metricSelector).toBeInTheDocument();
    
    // Default should be Base Cost
    expect(screen.getByText(/Base Cost/i)).toBeInTheDocument();
    
    // Switch to Adjusted Cost
    userEvent.click(metricSelector);
    userEvent.click(screen.getByText('Adjusted Cost'));
    
    // Should update the chart title
    expect(screen.getByText(/Adjusted Cost Trends/i)).toBeInTheDocument();
  });
  
  test('displays trend detection indicators', async () => {
    renderWithQueryClient(<CostTrendAnalysis />);
    
    // Check for trend indicators
    await waitFor(() => {
      expect(screen.getByTestId('trend-indicator')).toBeInTheDocument();
      expect(screen.getByText(/Upward Trend Detected/i)).toBeInTheDocument();
      expect(screen.getByTestId('growth-rate')).toBeInTheDocument();
    });
  });

  test('shows correct date range in the filter', async () => {
    renderWithQueryClient(<CostTrendAnalysis />);
    
    // Check the date range shows the full span of data
    const dateFilter = screen.getByTestId('date-range-filter');
    expect(dateFilter).toBeInTheDocument();
    
    // Should show at least the start and end years
    expect(dateFilter.textContent).toContain('2020');
    expect(dateFilter.textContent).toContain('2024');
  });

  test('allows forecasting future values', async () => {
    renderWithQueryClient(<CostTrendAnalysis />);
    
    // Get the forecast toggle
    const forecastToggle = screen.getByTestId('forecast-toggle');
    expect(forecastToggle).toBeInTheDocument();
    
    // Enable forecasting
    userEvent.click(forecastToggle);
    
    // Should show forecast data
    await waitFor(() => {
      expect(screen.getByTestId('forecast-data')).toBeInTheDocument();
      expect(screen.getByText(/Forecast/i)).toBeInTheDocument();
    });
  });
});

// Test the utility functions
describe('Trend Utility Functions', () => {
  test('detectTrends correctly identifies upward trends', () => {
    const data = [100, 105, 110, 115, 120, 125];
    const result = detectTrends(data);
    
    expect(result.trend).toBe('upward');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
  
  test('detectTrends correctly identifies downward trends', () => {
    const data = [125, 120, 115, 110, 105, 100];
    const result = detectTrends(data);
    
    expect(result.trend).toBe('downward');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
  
  test('detectTrends correctly identifies flat/neutral trends', () => {
    const data = [100, 101, 99, 100, 102, 101];
    const result = detectTrends(data);
    
    expect(result.trend).toBe('neutral');
    expect(result.confidence).toBeGreaterThan(0.5);
  });
  
  test('detectSeasonality identifies seasonal patterns', () => {
    // Data with quarterly seasonality
    const data = [
      100, 110, 105, 95, // Year 1
      105, 115, 110, 100, // Year 2
      110, 120, 115, 105  // Year 3
    ];
    
    const result = detectSeasonality(data, 4); // 4 periods per cycle (quarterly)
    
    expect(result.hasSeasonal).toBe(true);
    expect(result.period).toBe(4);
    expect(result.seasonalStrength).toBeGreaterThan(0.5);
  });
  
  test('forecastValues predicts future values within reasonable bounds', () => {
    const historicalData = [100, 105, 110, 115, 120, 125];
    const periodsToForecast = 3;
    
    const forecast = forecastValues(historicalData, periodsToForecast);
    
    expect(forecast.length).toBe(periodsToForecast);
    expect(forecast[0]).toBeGreaterThan(125); // Should continue the trend
    expect(forecast[forecast.length - 1]).toBeGreaterThan(forecast[0]); // Should continue to increase
  });
  
  test('calculateGrowthRate computes the correct growth rate', () => {
    const data = [100, 102, 105, 107, 110];
    const growthRate = calculateGrowthRate(data);
    
    // Expected growth rate: (110/100)^(1/4) - 1 = approximately 0.0244 or 2.44%
    expect(growthRate).toBeCloseTo(0.0244, 2);
  });
});