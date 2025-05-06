/**
 * TerraBuild Storage Factory
 * 
 * This file provides a factory function to create the appropriate storage implementation
 * based on the configuration.
 */

import { IStorage } from './storage';
import { MemStorage } from './storage';
import { DatabaseStorage } from './database-storage';

/**
 * Create a storage implementation based on the configuration
 * 
 * @returns {IStorage} The storage implementation
 */
export function createStorage(): IStorage {
  const storageType = process.env.STORAGE_TYPE?.toLowerCase() || 'file';
  
  if (storageType === 'postgres') {
    console.log('Using PostgreSQL database for storage');
    return new DatabaseStorage();
  } else {
    console.log('Using file-based storage (in-memory)');
    return new MemStorage();
  }
}

// Create and export the configured storage instance
export const storage = createStorage();