/**
 * TerraBuild Storage Factory
 * 
 * This file provides a factory function to create the appropriate storage implementation
 * based on the configuration, aligned with TerraFusionMono repository structure.
 */

import { IStorage, MemStorage, DatabaseStorage } from './storage';
import { logger } from './utils/logger';

/**
 * Create a storage implementation based on the configuration
 * 
 * @returns {IStorage} The storage implementation
 */
export function createStorage(): IStorage {
  // We know we have a PostgreSQL database in this environment,
  // so we'll force using DatabaseStorage regardless of environment variables
  try {
    console.log('[Storage Factory] Forcing DatabaseStorage for properties lookup');
    const dbStorage = new DatabaseStorage();
    
    // Add a verification method to check which implementation is being used
    const originalGetPropertyById = dbStorage.getPropertyById;
    dbStorage.getPropertyById = async function(id: number) {
      console.log('[STORAGE DEBUG] DatabaseStorage.getPropertyById called with ID', id);
      return originalGetPropertyById.call(this, id);
    };
    
    return dbStorage;
  } catch (error) {
    console.error('[Storage Factory] Error initializing DatabaseStorage:', error);
    logger.error('[storage] Failed to initialize PostgreSQL storage:', error);
    throw new Error('Cannot initialize database storage. Application cannot start.');
  }
}

// Create and export the configured storage instance
export const storage = createStorage();