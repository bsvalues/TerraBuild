// Simple test to verify database connection

import { config } from 'dotenv';
import { db, pool } from './server/db';

// Load environment variables
config();

async function testDatabaseConnection() {
  try {
    console.log("Testing database connection...");
    
    // Test the pool with a simple query
    const result = await pool.query('SELECT NOW()');
    console.log("Database connection successful!");
    console.log("Current database time:", result.rows[0].now);
    
    // Close the connection
    await pool.end();
    console.log("Connection closed.");
  } catch (error: any) {
    console.error("Database connection failed:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testDatabaseConnection();