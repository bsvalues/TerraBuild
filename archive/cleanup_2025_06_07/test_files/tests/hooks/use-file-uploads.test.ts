import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFileUploads } from '@/hooks/use-file-uploads';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Mock ApiRequest and queryClient
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

const mockApiRequest = apiRequest as jest.Mock;
const mockInvalidateQueries = queryClient.invalidateQueries as jest.Mock;

describe('useFileUploads Hook', () => {
  let wrapper: React.FC<{ children: React.ReactNode }>;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a new QueryClient for each test
    const queryClient = new QueryClient({
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

  it('should invalidate the correct endpoint when import is successful', async () => {
    // Render the hook
    const { result } = renderHook(() => useFileUploads(), { wrapper });
    
    // Get the importExcel mutation
    const { importExcel } = result.current;
    
    // Setup success response
    mockApiRequest.mockResolvedValueOnce({ imported: 5, updated: 2 });
    
    // Call the mutate function with an ID
    await importExcel.mutateAsync(123);
    
    // Verify the API request was made correctly
    expect(mockApiRequest).toHaveBeenCalledWith(`/api/cost-matrix/import-excel/123`, {
      method: 'POST'
    });
    
    // Verify the correct cache invalidation
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ 
      queryKey: ['/cost-matrices'] 
    });
  });

  it('should invalidate correct endpoint after property data import', async () => {
    // Render the hook
    const { result } = renderHook(() => useFileUploads(), { wrapper });
    
    // Get the importPropertyData mutation
    const { importPropertyData } = result.current;
    
    // Setup success response
    mockApiRequest.mockResolvedValueOnce({
      properties: { success: 10 },
      improvements: { success: 5 },
      improvementDetails: { success: 15 },
      improvementItems: { success: 20 },
      landDetails: { success: 8 },
    });
    
    // Call the mutate function with import details
    await importPropertyData.mutateAsync({
      propertiesFile: 1,
      improvementsFile: 2,
      improvementDetailsFile: 3,
      improvementItemsFile: 4,
      landDetailsFile: 5,
    });
    
    // Verify the API request was made correctly
    expect(mockApiRequest).toHaveBeenCalledWith('/api/properties/import', {
      method: 'POST',
      data: {
        propertiesFile: 1,
        improvementsFile: 2,
        improvementDetailsFile: 3,
        improvementItemsFile: 4,
        landDetailsFile: 5,
      }
    });
    
    // Verify the correct cache invalidation
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ 
      queryKey: ['/api/properties'] 
    });
  });
});