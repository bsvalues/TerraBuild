import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { log } from "./vite";

// Database client setup
let client: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle>;

// Initialize database connection and verify it works
export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable not provided");
  }

  try {
    client = postgres(process.env.DATABASE_URL);
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