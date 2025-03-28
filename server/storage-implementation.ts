import { IStorage } from './storage';
import { PostgresStorage } from './pg-storage';

// Export the storage interface to use PostgresStorage implementation
export const storage = new PostgresStorage();