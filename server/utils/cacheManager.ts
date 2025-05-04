/**
 * Cache Manager for TerraBuild
 * 
 * This module provides an in-memory cache with LRU (Least Recently Used) eviction policy
 * for caching frequently accessed data like geographic information.
 */

interface CacheItem<T> {
  value: T;
  expiry: number;
  lastAccessed: number;
}

export class CacheManager {
  private cache: Map<string, CacheItem<any>>;
  private maxSize: number;
  private defaultTTL: number; // Time-to-live in milliseconds
  
  constructor(maxSize = 1000, defaultTTL = 3600000) { // Default: 1000 items, 1 hour TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }
  
  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns The cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    // Return null if item doesn't exist or is expired
    if (!item || item.expiry < Date.now()) {
      if (item) {
        // Remove expired item
        this.cache.delete(key);
      }
      return null;
    }
    
    // Update last accessed time
    item.lastAccessed = Date.now();
    
    return item.value as T;
  }
  
  /**
   * Store an item in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL override (in milliseconds)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Check if we need to evict items
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    // Store the item
    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttl || this.defaultTTL),
      lastAccessed: Date.now()
    });
  }
  
  /**
   * Remove a specific item from the cache
   * @param key Cache key to delete
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Invalidate cache entries that match a pattern
   * @param pattern String or RegExp pattern to match against keys
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Invalidate all cache entries related to a specific entity type
   * @param entityType The entity type (e.g., 'region', 'municipality')
   */
  invalidateEntityType(entityType: string): void {
    this.invalidatePattern(`^${entityType}:`);
  }
  
  /**
   * Get cache statistics
   * @returns Statistics about the cache
   */
  getStats(): { size: number, maxSize: number, hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      // Additional stats could be added here (hit rate, etc.)
    };
  }
  
  /**
   * Evict the least recently used item from the cache
   * @private
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;
    
    let oldest: { key: string, lastAccessed: number } | null = null;
    
    // Find the least recently used item
    for (const [key, item] of this.cache.entries()) {
      if (!oldest || item.lastAccessed < oldest.lastAccessed) {
        oldest = { key, lastAccessed: item.lastAccessed };
      }
    }
    
    if (oldest) {
      this.cache.delete(oldest.key);
    }
  }
}

// Create a singleton instance for the application
export const globalCache = new CacheManager();