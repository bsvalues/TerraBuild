import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCostMatrix } from '@/hooks/use-cost-matrix';
import { apiRequest } from '@/lib/queryClient';

// Mock ApiRequest
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

const mockApiRequest = apiRequest as jest.Mock;

describe('useCostMatrix Hook', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    });
    
    // Create a wrapper with the QueryClientProvider
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    // Reset mock implementation
    mockApiRequest.mockImplementation(() => Promise.resolve([]));
  });

  it('should fetch all cost matrices using the correct endpoint', async () => {
    // Render the hook
    const { result } = renderHook(() => useCostMatrix(), { wrapper });
    
    // Get the getAll function
    const getAll = result.current.getAll;
    
    // Call the function
    getAll();
    
    // Verify the API request was made correctly
    expect(mockApiRequest).toHaveBeenCalledWith({
      url: '/cost-matrices',
      method: 'GET'
    });
  });

  it('should fetch a single cost matrix by id using the correct endpoint', async () => {
    // Render the hook
    const { result } = renderHook(() => useCostMatrix(), { wrapper });
    
    // Get the getById function
    const getById = result.current.getById;
    
    // Call the function with an ID
    getById(123);
    
    // Verify the API request was made correctly
    expect(mockApiRequest).toHaveBeenCalledWith({
      url: '/cost-matrices/123',
      method: 'GET'
    });
  });

  it('should create cost matrices using the correct endpoint', async () => {
    // Render the hook
    const { result } = renderHook(() => useCostMatrix(), { wrapper });
    
    // Get the create function
    const create = result.current.create;
    
    // Mock data for creation
    const mockData = [
      { 
        buildingType: 'RES1', 
        region: 'Western', 
        year: 2023, 
        baseCost: 150.5 
      }
    ];
    
    // Call the function
    create(mockData);
    
    // Verify the API request was made correctly
    expect(mockApiRequest).toHaveBeenCalledWith({
      url: '/cost-matrices',
      method: 'POST',
      body: { data: mockData }
    });
  });

  it('should update cost matrices using the correct endpoint', async () => {
    // Render the hook
    const { result } = renderHook(() => useCostMatrix(), { wrapper });
    
    // Get the update function
    const update = result.current.update;
    
    // Mock data for update
    const mockData = { 
      id: 123,
      buildingType: 'RES1', 
      region: 'Western', 
      year: 2023, 
      baseCost: 175.0 
    };
    
    // Call the function
    update(mockData);
    
    // Verify the API request was made correctly
    expect(mockApiRequest).toHaveBeenCalledWith({
      url: '/cost-matrices/123',
      method: 'PATCH',
      body: mockData
    });
  });

  it('should delete cost matrices using the correct endpoint', async () => {
    // Render the hook
    const { result } = renderHook(() => useCostMatrix(), { wrapper });
    
    // Get the remove function
    const remove = result.current.remove;
    
    // Call the function with an ID
    remove(123);
    
    // Verify the API request was made correctly
    expect(mockApiRequest).toHaveBeenCalledWith({
      url: '/cost-matrices/123',
      method: 'DELETE'
    });
  });
});