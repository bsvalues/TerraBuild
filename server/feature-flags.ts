/**
 * Feature Flag System for BCBS Application
 * 
 * This module provides functionality to manage feature flags,
 * enabling controlled feature rollouts, A/B testing, and
 * quick toggling of features in production.
 */

import { Request, Response } from 'express';
import { db } from './db';

// Feature flag definition
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  environment: string;
  percentage?: number; // For percentage rollouts
  rules?: Record<string, any>; // For conditional enabling
}

// Cache of feature flags to avoid database queries on every check
let featureFlagCache: Map<string, FeatureFlag> = new Map();
let lastCacheUpdate = Date.now();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize feature flags from the database
 */
export async function initializeFeatureFlags() {
  try {
    // This is a mock implementation - in a real app you'd fetch from database
    // await refreshFeatureFlagCache();
    
    // Mock data for demonstration - remove in production
    featureFlagCache.set('new-cost-calculator', {
      id: 'new-cost-calculator',
      name: 'New Cost Calculator',
      description: 'Enable the new version of the cost calculator with improved accuracy',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      environment: process.env.NODE_ENV || 'development'
    });
    
    featureFlagCache.set('advanced-analytics', {
      id: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Enable advanced analytics dashboard with predictive insights',
      enabled: false,
      percentage: 25, // Enable for 25% of users
      createdAt: new Date(),
      updatedAt: new Date(),
      environment: process.env.NODE_ENV || 'development'
    });
    
    featureFlagCache.set('geo-mapping', {
      id: 'geo-mapping',
      name: 'Geo Mapping Features',
      description: 'Enable geographic mapping visualization',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      environment: process.env.NODE_ENV || 'development'
    });
    
    console.log('Feature flags initialized with default values');
  } catch (error) {
    console.error('Failed to initialize feature flags:', error);
    // Initialize with empty cache rather than failing
  }
}

/**
 * Refresh the feature flag cache from the database
 */
async function refreshFeatureFlagCache() {
  try {
    // In a real implementation, fetch from database
    // const result = await db.select().from('feature_flags');
    
    // For now, we'll use our mock data
    lastCacheUpdate = Date.now();
    
    console.log('Feature flag cache refreshed');
  } catch (error) {
    console.error('Failed to refresh feature flag cache:', error);
    throw error;
  }
}

/**
 * Check if a feature is enabled
 * 
 * @param flagId - The ID of the feature flag
 * @param context - Optional context for conditional flags (e.g., user ID for percentage rollouts)
 * @returns boolean - Whether the feature is enabled
 */
export function isFeatureEnabled(flagId: string, context?: Record<string, any>): boolean {
  // Check if cache needs refreshing
  if (Date.now() - lastCacheUpdate > CACHE_TTL) {
    // Don't await, just trigger a refresh for next time
    refreshFeatureFlagCache().catch(err => console.error('Background cache refresh failed:', err));
  }
  
  const flag = featureFlagCache.get(flagId);
  
  // If flag doesn't exist, default to disabled
  if (!flag) {
    return false;
  }
  
  // If flag is not enabled, it's disabled regardless of other conditions
  if (!flag.enabled) {
    return false;
  }
  
  // Check percentage rollout if specified
  if (flag.percentage !== undefined && context?.userId) {
    // Use a hash of the user ID to consistently enable/disable for specific users
    const hash = simpleHash(context.userId);
    return (hash % 100) < flag.percentage;
  }
  
  // Check rules if specified
  if (flag.rules && context) {
    // Implement rule evaluation logic here
    // return evaluateRules(flag.rules, context);
  }
  
  // Default to the enabled state if no other conditions apply
  return flag.enabled;
}

/**
 * Get all feature flags
 * @returns Array<FeatureFlag> - All feature flags
 */
export function getAllFeatureFlags(): FeatureFlag[] {
  return Array.from(featureFlagCache.values());
}

/**
 * Update a feature flag
 * 
 * @param flagId - The ID of the flag to update
 * @param updates - The updates to apply
 * @returns FeatureFlag - The updated flag
 */
export async function updateFeatureFlag(
  flagId: string,
  updates: Partial<FeatureFlag>
): Promise<FeatureFlag | null> {
  const flag = featureFlagCache.get(flagId);
  
  if (!flag) {
    return null;
  }
  
  // In a real implementation, update the database
  // await db.update('feature_flags').set(updates).where('id', '=', flagId);
  
  // Update the cache
  const updatedFlag = {
    ...flag,
    ...updates,
    updatedAt: new Date()
  };
  
  featureFlagCache.set(flagId, updatedFlag);
  
  return updatedFlag;
}

/**
 * Create a new feature flag
 * 
 * @param flag - The feature flag to create
 * @returns FeatureFlag - The created flag
 */
export async function createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> {
  const id = flag.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  if (featureFlagCache.has(id)) {
    throw new Error(`Feature flag with ID ${id} already exists`);
  }
  
  const now = new Date();
  const newFlag: FeatureFlag = {
    id,
    createdAt: now,
    updatedAt: now,
    environment: process.env.NODE_ENV || 'development',
    ...flag
  };
  
  // In a real implementation, save to the database
  // await db.insert('feature_flags').values(newFlag);
  
  // Update the cache
  featureFlagCache.set(id, newFlag);
  
  return newFlag;
}

/**
 * Delete a feature flag
 * 
 * @param flagId - The ID of the flag to delete
 * @returns boolean - Whether the flag was deleted
 */
export async function deleteFeatureFlag(flagId: string): Promise<boolean> {
  if (!featureFlagCache.has(flagId)) {
    return false;
  }
  
  // In a real implementation, delete from the database
  // await db.delete('feature_flags').where('id', '=', flagId);
  
  // Update the cache
  featureFlagCache.delete(flagId);
  
  return true;
}

/**
 * Express middleware to attach feature flags to response locals
 */
export function featureFlagMiddleware(req: Request, res: Response, next: Function) {
  // Attach a function to check feature flags to res.locals
  res.locals.isFeatureEnabled = (flagId: string) => isFeatureEnabled(flagId, { 
    userId: req.headers['x-user-id'] || req.ip,
    userAgent: req.headers['user-agent'],
    route: req.path
  });
  
  next();
}

/**
 * Get feature flags for client-side use
 */
export function getClientFeatureFlags(req: Request, res: Response) {
  // Only expose non-sensitive flags to the client
  const clientFlags = Array.from(featureFlagCache.entries())
    .filter(([_, flag]) => !flag.rules) // Don't expose flags with complex rules
    .reduce((acc, [id, flag]) => {
      acc[id] = isFeatureEnabled(id, { 
        userId: req.headers['x-user-id'] || req.ip,
        userAgent: req.headers['user-agent'],
        route: req.path
      });
      return acc;
    }, {} as Record<string, boolean>);
  
  res.json(clientFlags);
}

/**
 * A simple hash function for percentage-based rollouts
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}