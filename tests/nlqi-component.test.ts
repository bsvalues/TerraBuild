/**
 * Tests for Natural Language Query Interface (NLQI) Component
 * 
 * This suite tests the functionality of the NLQI component which will be
 * implemented to allow users to query building cost data using natural language.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NaturalLanguageQueryInterface } from '../client/src/components/visualizations/NaturalLanguageQueryInterface';

// Mock API responses
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn((url, options) => {
    if (url === '/api/nlp/query') {
      return Promise.resolve({
        results: [
          { id: 1, region: 'Eastern', buildingType: 'Residential', squareFeet: 2000, baseCost: 250000 },
          { id: 2, region: 'Western', buildingType: 'Commercial', squareFeet: 10000, baseCost: 1500000 }
        ],
        interpretation: {
          entities: ['Residential', 'Eastern'],
          timeRange: null,
          metric: 'baseCost',
          operation: 'average'
        },
        summary: 'Average base cost for Residential buildings in the Eastern region is $250,000'
      });
    }
    return Promise.resolve({});
  })
}));

// Mock context
jest.mock('@/contexts/visualization-context', () => ({
  useVisualizationContext: () => ({
    filters: null,
    setFilters: jest.fn(),
    addFilter: jest.fn(),
    removeFilter: jest.fn(),
    clearFilters: jest.fn(),
    selectedDatapoint: null,
    setSelectedDatapoint: jest.fn()
  })
}));

describe('Natural Language Query Interface', () => {
  test('renders the query input field', () => {
    render(<NaturalLanguageQueryInterface />);
    
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });
  
  test('suggests example queries', () => {
    render(<NaturalLanguageQueryInterface />);
    
    const exampleQueries = screen.getAllByRole('button', { name: /example:/i });
    expect(exampleQueries.length).toBeGreaterThan(0);
  });
  
  test('submits a query and displays results', async () => {
    render(<NaturalLanguageQueryInterface />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Type a query
    await userEvent.type(input, 'What is the average cost of residential buildings in the Eastern region?');
    
    // Submit the query
    fireEvent.click(submitButton);
    
    // Check for loading state
    expect(screen.getByText(/analyzing your query/i)).toBeInTheDocument();
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/average base cost for residential buildings/i)).toBeInTheDocument();
    });
    
    // Check for result visualization
    expect(screen.getByText(/results/i)).toBeInTheDocument();
    expect(screen.getByText(/eastern/i)).toBeInTheDocument();
    expect(screen.getByText(/residential/i)).toBeInTheDocument();
  });
  
  test('handles query errors gracefully', async () => {
    // Override mock for this test
    jest.spyOn(require('@/lib/queryClient'), 'apiRequest').mockRejectedValueOnce(new Error('Query failed'));
    
    render(<NaturalLanguageQueryInterface />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Type a query
    await userEvent.type(input, 'Show me invalid data');
    
    // Submit the query
    fireEvent.click(submitButton);
    
    // Check for error state
    await waitFor(() => {
      expect(screen.getByText(/unable to process your query/i)).toBeInTheDocument();
    });
  });
  
  test('shows interpretation of natural language query', async () => {
    render(<NaturalLanguageQueryInterface />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Type a query
    await userEvent.type(input, 'What is the average cost of residential buildings in the Eastern region?');
    
    // Submit the query
    fireEvent.click(submitButton);
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/interpretation/i)).toBeInTheDocument();
      expect(screen.getByText(/entities:/i)).toBeInTheDocument();
      expect(screen.getByText(/residential/i)).toBeInTheDocument();
      expect(screen.getByText(/eastern/i)).toBeInTheDocument();
      expect(screen.getByText(/operation: average/i)).toBeInTheDocument();
    });
  });
  
  test('remembers previous queries in history', async () => {
    render(<NaturalLanguageQueryInterface />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Type and submit first query
    await userEvent.type(input, 'What is the average cost of residential buildings?');
    fireEvent.click(submitButton);
    
    // Wait for results and clear input
    await waitFor(() => {
      expect(screen.getByText(/results/i)).toBeInTheDocument();
    });
    
    // Find history button and click it
    const historyButton = screen.getByRole('button', { name: /history/i });
    fireEvent.click(historyButton);
    
    // Check that history contains the query
    expect(screen.getByText(/what is the average cost of residential buildings/i)).toBeInTheDocument();
    
    // Click on history item
    fireEvent.click(screen.getByText(/what is the average cost of residential buildings/i));
    
    // Check that query is loaded into input
    expect(input).toHaveValue('What is the average cost of residential buildings?');
  });
});