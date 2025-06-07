import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WhatIfScenariosPage from '../../client/src/pages/WhatIfScenariosPage';
import { server } from '../mocks/server';
import { rest } from 'msw';

// Create a new QueryClient for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
  },
});

// Setup mock data
const mockScenarios = [
  {
    id: 1,
    userId: 1,
    name: "Test Scenario 1",
    description: "Test description for scenario 1",
    baseCalculationId: null,
    parameters: {
      region: "Central",
      baseCost: 200000,
      complexity: 1,
      squareFootage: 2000
    },
    results: {
      totalCost: 235000,
      costPerSqft: 117.5,
      materialBreakdown: {
        framing: 70500,
        exterior: 47000,
        interior: 58750,
        foundation: 47000,
        mechanicals: 11750
      }
    },
    isSaved: false,
    createdAt: "2025-04-10T22:04:56.845Z",
    updatedAt: "2025-04-10T22:04:56.845Z"
  }
];

const mockVariations = [
  {
    id: 1,
    scenarioId: 1,
    name: "Increased Square Footage",
    parameterKey: "squareFootage",
    originalValue: 2000,
    newValue: 2500,
    impactValue: "50000.00",
    impactPercentage: "25.00",
    createdAt: "2025-04-10T22:05:03.958Z"
  }
];

const mockImpact = {
  totalImpact: 50000,
  variations: mockVariations
};

// Setup test component wrapper
function renderWithProviders(ui) {
  const testQueryClient = createTestQueryClient();
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={['/what-if-scenarios']}>
        <Routes>
          <Route path="/what-if-scenarios" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  
  return render(ui, { wrapper: Wrapper });
}

// Setup MSW handlers to mock API responses
beforeAll(() => {
  // Setup handlers
  server.use(
    rest.get('/api/what-if-scenarios', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockScenarios));
    }),
    rest.get('/api/what-if-scenarios/:id/variations', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockVariations));
    }),
    rest.get('/api/what-if-scenarios/:id/impact', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockImpact));
    })
  );
});

describe('WhatIfScenariosPage', () => {
  it('renders the scenario list correctly', async () => {
    renderWithProviders(<WhatIfScenariosPage />);
    
    // Wait for scenarios to load
    await waitFor(() => {
      expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
    });
    
    // Verify scenario card content
    expect(screen.getByText('Base Cost:')).toBeInTheDocument();
    expect(screen.getByText('Region:')).toBeInTheDocument();
    expect(screen.getByText('Central')).toBeInTheDocument();
  });
  
  it('should show scenario details when a scenario is clicked', async () => {
    renderWithProviders(<WhatIfScenariosPage />);
    
    // Wait for scenarios to load
    await waitFor(() => {
      expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
    });
    
    // Click the "View Details" button
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);
    
    // Verify that the details view is now shown
    await waitFor(() => {
      expect(screen.getByText('Base Parameters')).toBeInTheDocument();
      expect(screen.getByText('Impact Analysis')).toBeInTheDocument();
    });
    
    // Verify that variation data is displayed
    expect(screen.getByText('Increased Square Footage')).toBeInTheDocument();
  });
  
  it('should open the "Add Variation" dialog when the button is clicked', async () => {
    renderWithProviders(<WhatIfScenariosPage />);
    
    // Wait for scenarios to load
    await waitFor(() => {
      expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
    });
    
    // Click the "View Details" button
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);
    
    // Wait for the details view to load
    await waitFor(() => {
      expect(screen.getByText('Base Parameters')).toBeInTheDocument();
    });
    
    // Click the "Add Variation" button
    const addVariationButton = screen.getByRole('button', { name: /Add Variation/i });
    fireEvent.click(addVariationButton);
    
    // Verify that the dialog is shown
    expect(screen.getByText('Add Parameter Variation')).toBeInTheDocument();
    expect(screen.getByText('Create a parameter variation to see its impact on cost')).toBeInTheDocument();
  });
});