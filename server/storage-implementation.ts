import { IStorage } from './storage';
import { DatabaseStorage } from './database-storage';

// Use PostgreSQL storage directly for Tesla-level simplicity and reliability
export const storage: IStorage = new DatabaseStorage();