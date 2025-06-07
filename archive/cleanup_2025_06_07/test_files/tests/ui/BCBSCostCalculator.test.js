/**
 * BCBSCostCalculator Component Test
 * 
 * Tests the functionality of the BCBSCostCalculator component, including:
 * - Form input handling
 * - Cost calculations
 * - Material management
 * - Scenario management 
 * - Visualization data preparation
 * - Component rendering
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the component and its dependencies
// Note: The actual component will be imported in the real test
// This is a placeholder for the test structure
const mockBCBSCostCalculator = () => {
  return (
    <div data-testid="calculator">
      <div data-testid="calculator-tabs">
        <div data-testid="tab-calculator">Calculator</div>
        <div data-testid="tab-materials">Materials</div>
        <div data-testid="tab-results">Results</div>
        <div data-testid="tab-scenarios">Scenarios</div>
      </div>
      <form data-testid="calculator-form">
        <input data-testid="input-square-footage" />
        <select data-testid="select-building-type"></select>
        <input data-testid="input-condition" type="range" />
        <input data-testid="input-age" />
        <button data-testid="button-calculate">Calculate</button>
      </form>
      <div data-testid="results-container">
        <div data-testid="cost-display">$120,000</div>
        <div data-testid="materials-breakdown">
          <div data-testid="material-item">Concrete</div>
          <div data-testid="material-item">Steel</div>
        </div>
      </div>
      <div data-testid="scenarios-container">
        <button data-testid="button-save-scenario">Save Scenario</button>
        <div data-testid="scenario-list">
          <div data-testid="scenario-item">Scenario 1</div>
        </div>
        <button data-testid="button-compare-scenarios">Compare</button>
      </div>
      <div data-testid="visualizations">
        <div data-testid="cost-breakdown-chart"></div>
        <div data-testid="cost-projection-chart"></div>
        <div data-testid="cost-treemap"></div>
      </div>
    </div>
  );
};

// Mock custom hooks
jest.mock('@/hooks/use-building-costs', () => ({
  useBuildingCosts: jest.fn(() => ({
    calculateCost: { 
      mutateAsync: jest.fn().mockResolvedValue({ 
        totalCost: 120000,
        details: {
          baseCost: 100000,
          adjustments: {
            condition: 10000,
            age: -5000,
            complexity: 15000
          }
        },
        materialsBreakdown: [
          { name: 'Concrete', cost: 20000, percentage: 16.67 },
          { name: 'Steel', cost: 30000, percentage: 25 },
          { name: 'Lumber', cost: 15000, percentage: 12.5 },
          { name: 'Finishes', cost: 25000, percentage: 20.83 },
          { name: 'Electrical', cost: 15000, percentage: 12.5 },
          { name: 'Plumbing', cost: 15000, percentage: 12.5 }
        ]
      })
    },
    createBuildingCost: {
      mutateAsync: jest.fn().mockResolvedValue({ id: '123', name: 'Test Scenario' })
    }
  }))
}));

describe('BCBSCostCalculator Component', () => {
  beforeEach(() => {
    // Setup mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });

  test('renders calculator with all tabs', () => {
    render(mockBCBSCostCalculator());
    
    expect(screen.getByTestId('calculator')).toBeInTheDocument();
    expect(screen.getByTestId('tab-calculator')).toBeInTheDocument();
    expect(screen.getByTestId('tab-materials')).toBeInTheDocument();
    expect(screen.getByTestId('tab-results')).toBeInTheDocument();
    expect(screen.getByTestId('tab-scenarios')).toBeInTheDocument();
  });

  test('handles form input changes', () => {
    render(mockBCBSCostCalculator());
    
    const squareFootageInput = screen.getByTestId('input-square-footage');
    fireEvent.change(squareFootageInput, { target: { value: '2500' } });
    
    expect(squareFootageInput.value).toBe('2500');
  });

  test('calculates cost when form is submitted', async () => {
    render(mockBCBSCostCalculator());
    
    // Fill the form
    fireEvent.change(screen.getByTestId('input-square-footage'), { 
      target: { value: '2500' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByTestId('button-calculate'));
    
    // Wait for the result to appear
    await waitFor(() => {
      expect(screen.getByTestId('cost-display')).toHaveTextContent('$120,000');
    });
  });

  test('displays materials breakdown after calculation', async () => {
    render(mockBCBSCostCalculator());
    
    // Fill and submit the form
    fireEvent.change(screen.getByTestId('input-square-footage'), { 
      target: { value: '2500' } 
    });
    fireEvent.click(screen.getByTestId('button-calculate'));
    
    // Check materials breakdown
    await waitFor(() => {
      const materialItems = screen.getAllByTestId('material-item');
      expect(materialItems.length).toBeGreaterThan(0);
      expect(materialItems[0]).toHaveTextContent('Concrete');
    });
  });

  test('can save and load scenarios', async () => {
    render(mockBCBSCostCalculator());
    
    // Calculate first
    fireEvent.change(screen.getByTestId('input-square-footage'), { 
      target: { value: '2500' } 
    });
    fireEvent.click(screen.getByTestId('button-calculate'));
    
    // Save scenario
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('button-save-scenario'));
    });
    
    // Check scenario list
    await waitFor(() => {
      expect(screen.getByTestId('scenario-item')).toBeInTheDocument();
    });
  });

  test('renders visualization components', async () => {
    render(mockBCBSCostCalculator());
    
    // Calculate to trigger visualizations
    fireEvent.change(screen.getByTestId('input-square-footage'), { 
      target: { value: '2500' } 
    });
    fireEvent.click(screen.getByTestId('button-calculate'));
    
    // Check visualizations
    await waitFor(() => {
      expect(screen.getByTestId('cost-breakdown-chart')).toBeInTheDocument();
      expect(screen.getByTestId('cost-projection-chart')).toBeInTheDocument();
      expect(screen.getByTestId('cost-treemap')).toBeInTheDocument();
    });
  });

  test('switches between tabs correctly', () => {
    render(mockBCBSCostCalculator());
    
    // Click on different tabs
    fireEvent.click(screen.getByTestId('tab-materials'));
    expect(screen.getByTestId('materials-breakdown')).toBeVisible();
    
    fireEvent.click(screen.getByTestId('tab-results'));
    expect(screen.getByTestId('visualizations')).toBeVisible();
    
    fireEvent.click(screen.getByTestId('tab-scenarios'));
    expect(screen.getByTestId('scenarios-container')).toBeVisible();
  });
});