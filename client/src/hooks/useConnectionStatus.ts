/**
 * useConnectionStatus Hook
 * 
 * A custom hook for fetching and managing database connection status.
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Database connection status interface
 */
export interface ConnectionStatus {
  supabase: {
    available: boolean;
    configured: boolean;
    lastChecked: Date | null;
  };
  postgres: {
    available: boolean;
    configured: boolean;
    lastChecked: Date | null;
  };
  activeProvider: 'supabase' | 'postgres';
}

/**
 * Hook for accessing and managing database connection status
 */
export function useConnectionStatus() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    data: status, 
    isLoading, 
    isError, 
    refetch,
    isFetching
  } = useQuery<ConnectionStatus>({
    queryKey: ['/api/system/connection-status'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
  
  /**
   * Handle manual refresh of connection status
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };
  
  /**
   * Format a date in a user-friendly way
   */
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString();
  };
  
  return {
    status,
    isLoading: isLoading || isFetching,
    isError,
    isRefreshing,
    handleRefresh,
    formatDate
  };
}

export default useConnectionStatus;