import { IStorage } from './storage';
import { adaptiveStorage } from './adaptive-storage';

// Export the adaptive storage, which automatically selects between 
// Supabase and local PostgreSQL storage based on availability
export const storage = adaptiveStorage;