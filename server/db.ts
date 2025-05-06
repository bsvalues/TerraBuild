import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { log } from "./vite";

// Database client setup - initialize with default values
let connectionString = process.env.DATABASE_URL || '';
let client = postgres(connectionString);
let db = drizzle(client, { schema });

// Initialize database connection and verify it works
export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable not provided");
  }

  try {
    // Re-initialize with the proper connection string
    connectionString = process.env.DATABASE_URL;
    client = postgres(connectionString);
    db = drizzle(client, { schema });
    
    // Test the connection by executing a simple query
    await client`SELECT 1`;
    log("Database connection established successfully");
    
    return true;
  } catch (error) {
    log(`Database connection error: ${error}`, 'error');
    throw error;
  }
}

// Export initialized database client
export { db };