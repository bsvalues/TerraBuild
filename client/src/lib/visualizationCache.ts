/**
 * Visualization Data Cache
 * 
 * Provides a client-side caching mechanism for visualization data
 * to improve performance and reduce unnecessary API calls.
 */

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Cache interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheData {
  [key: string]: CacheEntry<any>;
}

// Initialize the cache
const cache: CacheData = {};

/**
 * Get data from cache if available, otherwise fetch from API
 * @param cacheKey Unique key for caching
 * @param fetchFn Function to call if cache miss
 * @returns Promise resolving to data
 */
export async function getCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  
  // Check if data exists in cache and is still valid
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_EXPIRY) {
    return cache[cacheKey].data;
  }
  
  // Cache miss or expired, fetch new data
  const data = await fetchFn();
  
  // Store in cache
  cache[cacheKey] = {
    data,
    timestamp: now
  };
  
  return data;
}

/**
 * Manually invalidate a cache entry
 * @param cacheKey Key to invalidate
 */
export function invalidateCache(cacheKey: string): void {
  delete cache[cacheKey];
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
}

// Export cache key generators for consistent key creation
export const cacheKeys = {
  regionalCosts: (region: string, buildingType: string) => 
    `regionalCosts_${region}_${buildingType}`,
    
  hierarchicalCosts: (region: string, buildingType: string) => 
    `hierarchicalCosts_${region}_${buildingType}`,
    
  statisticalData: (region: string, buildingType: string) => 
    `statisticalData_${region}_${buildingType}`
};