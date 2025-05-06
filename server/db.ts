import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { logger } from './utils/logger';

// Configure neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

/**
 * Initialize the database connection
 */
export function initDatabase() {
  // Check for DATABASE_URL environment variable
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?"
    );
  }

  logger.info('Initializing database connection');

  // Create a connection pool
  const poolInstance = new Pool({ connectionString: process.env.DATABASE_URL });

  // Create a drizzle instance with the schema
  const dbInstance = drizzle(poolInstance, { schema });

  logger.debug('Database connection initialized');
  
  return { poolInstance, dbInstance };
}

// Initialize the database and export the connections
const { poolInstance, dbInstance } = initDatabase();

// Export the database connections
export const pool = poolInstance;
export const db = dbInstance;