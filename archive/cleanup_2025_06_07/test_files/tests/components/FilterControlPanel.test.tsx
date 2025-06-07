import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterControlPanel } from '@/components/visualizations/FilterControlPanel';
import { VisualizationContextProvider } from '@/contexts/visualization-context';

describe('FilterControlPanel Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it('renders correctly with default props', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <VisualizationContextProvider>
          <FilterControlPanel />
        </VisualizationContextProvider>
      </QueryClientProvider>
    );
    
    // Check for filter section headings
    expect(screen.getByText(/Region Filters/i)).toBeInTheDocument();
    expect(screen.getByText(/Building Type Filters/i)).toBeInTheDocument();
    expect(screen.getByText(/Cost Range/i)).toBeInTheDocument();
  });

  it('renders only allowed filters when specified', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <VisualizationContextProvider>
          <FilterControlPanel allowedFilters={['regions']} />
        </VisualizationContextProvider>
      </QueryClientProvider>
    );
    
    // Should only have regions filter
    expect(screen.getByText(/Region Filters/i)).toBeInTheDocument();
    
    // Should not have these filters
    expect(screen.queryByText(/Building Type Filters/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cost Range/i)).not.toBeInTheDocument();
  });

  it('displays the clear button when specified', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <VisualizationContextProvider>
          <FilterControlPanel showClearButton={true} />
        </VisualizationContextProvider>
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Clear All Filters/i)).toBeInTheDocument();
  });

  it('applies compact styling when specified', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <VisualizationContextProvider>
          <FilterControlPanel compact={true} />
        </VisualizationContextProvider>
      </QueryClientProvider>
    );
    
    // Check for appropriate spacing classes (this is an implementation detail, may need adjustment)
    expect(container.firstChild).toHaveClass('space-y-3');
  });
});