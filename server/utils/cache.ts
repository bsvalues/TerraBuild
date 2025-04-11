/**
 * Cache Utility for BCBS Application
 * 
 * Provides in-memory caching for API responses to improve performance
 */

import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache store
const cacheStore: Map<string, { data: any; expiry: number }> = new Map();

// Default TTL in seconds
const DEFAULT_TTL = 60;

/**
 * Middleware to cache API responses
 * 
 * @param ttl Time to live in seconds
 */
export function cacheMiddleware(ttl = DEFAULT_TTL) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key from URL and query params
    const key = req.originalUrl || req.url;
    
    // Check if we have a cached response
    const cachedItem = cacheStore.get(key);
    const now = Date.now();
    
    if (cachedItem && cachedItem.expiry > now) {
      // Return cached response
      console.log(`Cache hit for ${key}`);
      return res.json(cachedItem.data);
    }
    
    // Cache miss or expired, remove if exists
    if (cachedItem) {
      cacheStore.delete(key);
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache the response
    res.json = function(body) {
      // Cache the response
      cacheStore.set(key, {
        data: body,
        expiry: now + (ttl * 1000)
      });
      
      // Log cache store size periodically
      if (cacheStore.size % 10 === 0) {
        console.log(`Cache store size: ${cacheStore.size} entries`);
      }
      
      // Restore original method and call it
      res.json = originalJson;
      return res.json(body);
    };
    
    next();
  };
}

/**
 * Clear cache for a specific key or pattern
 * 
 * @param pattern Key or pattern to match
 */
export function clearCache(pattern = '') {
  if (!pattern) {
    // Clear entire cache
    const size = cacheStore.size;
    cacheStore.clear();
    console.log(`Cleared entire cache (${size} entries)`);
    return size;
  }
  
  // Clear entries matching pattern
  let count = 0;
  
  // Convert keys to array before iterating
  const keys = Array.from(cacheStore.keys());
  
  for (const key of keys) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
      count++;
    }
  }
  
  if (count > 0) {
    console.log(`Cleared ${count} cache entries matching '${pattern}'`);
  }
  
  return count;
}

/**
 * Clean expired cache entries
 */
export function cleanExpiredCache() {
  const now = Date.now();
  let count = 0;
  
  // Convert entries to array before iterating
  const entries = Array.from(cacheStore.entries());
  
  for (const [key, item] of entries) {
    if (item.expiry <= now) {
      cacheStore.delete(key);
      count++;
    }
  }
  
  if (count > 0) {
    console.log(`Cleaned ${count} expired cache entries`);
  }
  
  return count;
}

// Set up periodic cache cleanup
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(cleanExpiredCache, CLEANUP_INTERVAL);