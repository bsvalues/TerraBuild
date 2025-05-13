/**
 * Utility function to load cost factor data from costFactors.json
 */

import { queryClient } from '@/lib/queryClient';

export interface CostFactorsData {
  version: string;
  source: string;
  year: number;
  lastUpdated: string;
  regionFactors: Record<string, number>;
  qualityFactors: Record<string, number>;
  conditionFactors: Record<string, number>;
  baseRates: Record<string, number>;
  complexityFactors: {
    STORIES: Record<string, number>;
    FOUNDATION: Record<string, number>;
    ROOF: Record<string, number>;
    HVAC: Record<string, number>;
  };
  agingFactors: Record<string, number>;
}

/**
 * Load cost factors data from the API endpoint
 * @returns Promise with the cost factors data
 */
export async function loadCostFactorsData(): Promise<CostFactorsData | null> {
  try {
    // Try to load from the API endpoint first
    try {
      const response = await fetch('/api/cost-factors-file');
      if (response.ok) {
        const data = await response.json();
        return data as CostFactorsData;
      }
    } catch (apiError) {
      console.warn('Error loading from API, falling back to direct file access:', apiError);
    }
    
    // Fall back to direct file access if API fails
    const directResponse = await fetch('/data/costFactors.json');
    if (!directResponse.ok) {
      throw new Error(`Failed to load cost factors: ${directResponse.status} ${directResponse.statusText}`);
    }
    const data = await directResponse.json();
    return data as CostFactorsData;
  } catch (error) {
    console.error('Error loading cost factors data:', error);
    return null;
  }
}

/**
 * Use this function to initialize cost factors data
 * Caches the result for reuse throughout the app
 */
export async function initializeCostFactorsData(): Promise<CostFactorsData | null> {
  // Check if data is already in the cache
  const existingData = queryClient.getQueryData<CostFactorsData>(['costFactorsData']);
  if (existingData) {
    return existingData;
  }

  // Load data and cache it
  const data = await loadCostFactorsData();
  if (data) {
    queryClient.setQueryData(['costFactorsData'], data);
  }
  return data;
}