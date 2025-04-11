import { IStorage } from './storage';
import { PropertyPostgresStorage } from './property-storage';

// Export the storage interface to use PropertyPostgresStorage implementation
// which extends PostgresStorage with property data methods
export const storage = new PropertyPostgresStorage();