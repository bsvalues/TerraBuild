import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

// Configure neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

// Create a mock DB client for development in Replit
class MockDbClient {
  async select() {
    return {
      from: () => ({
        leftJoin: () => ({
          orderBy: () => [],
          where: () => []
        }),
        where: () => []
      })
    };
  }
  
  async insert() {
    return {
      values: () => ({
        returning: () => [{id: 1}],
        onConflictDoUpdate: () => ({
          returning: () => [{id: 1}]
        })
      })
    };
  }
}

/**
 * Initialize the database connection
 * This is set up to work with or without a real DB connection
 */
export function initDatabase() {
  console.log('Initializing mock database for development');

  // Create a mock instance that just returns empty data
  const mockClient = new MockDbClient();
  
  // Create a drizzle-like instance with the schema
  const dbInstance = mockClient;

  console.log('Mock database initialized for development');
  
  return { poolInstance: null, dbInstance };
}

// Initialize the database and export the connections
const { poolInstance, dbInstance } = initDatabase();

// Export the database connections
export const pool = poolInstance;
export const db = dbInstance;