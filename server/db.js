/**
 * Database connection module for import scripts
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import pg from 'pg';

// Configure neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Create a connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a simplified DB interface for import scripts
const db = {
  /**
   * Execute a SQL query with parameters
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<pg.QueryResult>} - Query result
   */
  async execute(text, params = []) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error(`Error executing query: ${text}`);
      console.error(`Error details: ${error.message}`);
      throw error;
    }
  },

  /**
   * Execute a batch of queries in a transaction
   * @param {Array<{text: string, params: Array}>} queries - Array of query objects
   * @returns {Promise<Array<pg.QueryResult>>} - Array of results
   */
  async executeTransaction(queries) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const { text, params } of queries) {
        const result = await client.query(text, params);
        results.push(result);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

export { pool, db };