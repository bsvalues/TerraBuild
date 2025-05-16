import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

// Configure neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

/**
 * Initialize the database connection
 */
export function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }

  console.log('Initializing database connection...');

  try {
    // Create connection pool
    const poolInstance = new Pool({ 
      connectionString: process.env.DATABASE_URL 
    });
    
    // Create drizzle instance with schema
    const dbInstance = drizzle(poolInstance, { schema });

    console.log('Database connection initialized successfully');
    
    return { poolInstance, dbInstance };
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    throw error;
  }
}

// Initialize the database and export the connections
const { poolInstance, dbInstance } = initDatabase();

// Export the database connections
export const pool = poolInstance;
export const db = dbInstance;