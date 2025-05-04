import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { logger } from './utils/logger';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

logger.info('Initializing database connection');

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database connection check failed:', error);
    return false;
  }
}

// Initialize function to run on startup
export async function initDatabase(): Promise<void> {
  try {
    await checkDatabaseConnection();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  }
}