/**
 * TerraBuild Storage Factory
 * 
 * This file provides a factory function to create the appropriate storage implementation
 * based on the configuration, aligned with TerraFusionMono repository structure.
 */

import { IStorage } from './storage';
import { MemStorage } from './storage';
import { DatabaseStorage } from './database-storage';
import { logger } from './utils/logger';

/**
 * Create a storage implementation based on the configuration
 * 
 * @returns {IStorage} The storage implementation
 */
export function createStorage(): IStorage {
  // Check for availability of PostgreSQL connection through environment variables
  const hasPostgresConfig = Boolean(process.env.DATABASE_URL);
  
  // Storage type configuration
  const storageType = process.env.STORAGE_TYPE?.toLowerCase();
  
  // Determine which storage implementation to use
  if (storageType === 'file' || (!storageType && !hasPostgresConfig)) {
    logger.info('[storage] Using file-based storage (in-memory)');
    return new MemStorage();
  } else if (storageType === 'postgres' || (!storageType && hasPostgresConfig)) {
    logger.info('[storage] Using PostgreSQL database for persistent storage');
    try {
      return new DatabaseStorage();
    } catch (error) {
      logger.error('[storage] Failed to initialize PostgreSQL storage:', error);
      logger.warn('[storage] Falling back to in-memory storage');
      return new MemStorage();
    }
  } else {
    logger.warn(`[storage] Unknown storage type: ${storageType}, using fallback to PostgreSQL`);
    try {
      return new DatabaseStorage();
    } catch (error) {
      logger.error('[storage] Failed to initialize PostgreSQL storage:', error);
      logger.warn('[storage] Falling back to in-memory storage');
      return new MemStorage();
    }
  }
}

// Create and export the configured storage instance
export const storage = createStorage();