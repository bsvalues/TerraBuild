/**
 * Shared Constants
 * 
 * This file contains constants that are shared between the server and client.
 */

// Application version (should be updated with each release)
export const APP_VERSION = '1.0.0';

// Feature flag names (used by both server and client)
export const FEATURE_FLAGS = {
  ADVANCED_ANALYTICS: 'advanced_analytics',
  NEW_UI: 'new_ui',
  API_V2: 'api_v2',
  EXPERIMENTAL: 'experimental',
};

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  METRICS: '/api/health/metrics',
  LIVENESS: '/api/health/liveness',
  READINESS: '/api/health/readiness',
};

// Environment names
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

// Deployment-related constants
export const DEPLOYMENT = {
  MIN_NODE_VERSION: '18.0.0',
  REQUIRED_ENV_VARS: [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
  ],
};

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// Default pagination settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Rate limiting settings
export const RATE_LIMITS = {
  STANDARD_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  STANDARD_MAX_REQUESTS: 100, // 100 requests per window
};

// WebSocket events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  WELCOME: 'welcome',
  ERROR: 'error',
  UPDATE: 'update',
};

// Monitoring thresholds
export const MONITORING = {
  HIGH_CPU_THRESHOLD: 80, // CPU usage percentage
  HIGH_MEMORY_THRESHOLD: 80, // Memory usage percentage
  SLOW_RESPONSE_THRESHOLD: 500, // milliseconds
};

export default {
  APP_VERSION,
  FEATURE_FLAGS,
  API_ENDPOINTS,
  ENVIRONMENTS,
  DEPLOYMENT,
  CACHE_TTL,
  PAGINATION,
  RATE_LIMITS,
  SOCKET_EVENTS,
  MONITORING,
};