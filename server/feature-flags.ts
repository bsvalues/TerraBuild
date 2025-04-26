/**
 * Feature Flags System
 * 
 * This module provides a simple feature flag system that can be used to enable or disable
 * features at runtime. Feature flags are controlled through environment variables,
 * but could be extended to use a database or external service.
 */

interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  enabledFor?: string[]; // List of user IDs, roles, etc.
  rolloutPercentage?: number; // Percentage of users who get the feature (0-100)
}

// Default feature flags
const defaultFlags: FeatureFlag[] = [
  {
    name: 'advanced_analytics',
    description: 'Enable advanced analytics features',
    enabled: process.env.FEATURE_ADVANCED_ANALYTICS === 'true',
    enabledFor: ['admin'],
  },
  {
    name: 'new_ui',
    description: 'Enable new UI components',
    enabled: process.env.FEATURE_NEW_UI === 'true',
    rolloutPercentage: process.env.FEATURE_NEW_UI_PERCENTAGE ? 
      parseInt(process.env.FEATURE_NEW_UI_PERCENTAGE, 10) : 0,
  },
  {
    name: 'api_v2',
    description: 'Use v2 API endpoints',
    enabled: process.env.FEATURE_API_V2 === 'true',
  },
  {
    name: 'experimental',
    description: 'Experimental features',
    enabled: process.env.NODE_ENV === 'development' || process.env.FEATURE_EXPERIMENTAL === 'true',
  },
];

// In-memory store for feature flags
let featureFlags: FeatureFlag[] = [...defaultFlags];

/**
 * Get all feature flags
 */
export function getFeatureFlags(): FeatureFlag[] {
  return featureFlags;
}

/**
 * Check if a feature flag is enabled
 * @param flagName Name of the feature flag
 * @param context Optional context (user, role, etc.)
 */
export function isFeatureEnabled(flagName: string, context?: { userId?: string; roles?: string[] }): boolean {
  const flag = featureFlags.find(f => f.name === flagName);
  
  if (!flag) {
    console.warn(`Feature flag "${flagName}" does not exist`);
    return false;
  }
  
  // If the flag is not enabled globally, check specific conditions
  if (!flag.enabled) {
    return false;
  }
  
  // Check if enabled for specific users
  if (flag.enabledFor && context?.userId && flag.enabledFor.includes(context.userId)) {
    return true;
  }
  
  // Check if enabled for specific roles
  if (flag.enabledFor && context?.roles) {
    for (const role of context.roles) {
      if (flag.enabledFor.includes(role)) {
        return true;
      }
    }
  }
  
  // Check rollout percentage if no specific enablements matched
  if (typeof flag.rolloutPercentage === 'number') {
    // Generate a consistent hash based on userId if available
    if (context?.userId) {
      const hash = simpleHash(context.userId);
      const normalizedHash = hash % 100;
      return normalizedHash < flag.rolloutPercentage;
    }
    
    // Fallback to random percentage if no userId
    return Math.random() * 100 < flag.rolloutPercentage;
  }
  
  // Default to the flag's enabled status
  return flag.enabled;
}

/**
 * Set a feature flag
 * @param flagName Name of the feature flag
 * @param enabled Whether the flag is enabled
 * @param options Additional flag options
 */
export function setFeatureFlag(
  flagName: string, 
  enabled: boolean, 
  options?: Partial<Omit<FeatureFlag, 'name' | 'enabled'>>
): void {
  const existingFlagIndex = featureFlags.findIndex(f => f.name === flagName);
  
  if (existingFlagIndex !== -1) {
    // Update existing flag
    featureFlags[existingFlagIndex] = {
      ...featureFlags[existingFlagIndex],
      enabled,
      ...options,
    };
  } else {
    // Create new flag
    featureFlags.push({
      name: flagName,
      description: options?.description || `Feature flag for ${flagName}`,
      enabled,
      ...options,
    });
  }
}

/**
 * Reset feature flags to default values
 */
export function resetFeatureFlags(): void {
  featureFlags = [...defaultFlags];
}

/**
 * Simple string hashing function
 * @param str String to hash
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Initialize feature flags
resetFeatureFlags();

export default {
  getFeatureFlags,
  isFeatureEnabled,
  setFeatureFlag,
  resetFeatureFlags,
};