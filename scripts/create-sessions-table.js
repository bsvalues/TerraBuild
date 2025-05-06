/**
 * Script to create the sessions table for connect-pg-simple
 * This script creates the sessions table needed for Postgres session storage with connect-pg-simple
 */

import postgres from 'postgres';

// Create a direct connection to the database
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function createSessionsTable() {
  console.log('Creating sessions table if it doesn\'t exist...');
  
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS "sessions" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
  )`;
  
  try {
    await sql.unsafe(createTableQuery);
    console.log('Sessions table created or already exists.');
  } catch (error) {
    console.error('Error creating sessions table:', error);
    throw error;
  } finally {
    // Close the connection
    await sql.end();
  }
}

// Run the function
createSessionsTable()
  .then(() => {
    console.log('Session table setup completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Session table setup failed:', error);
    process.exit(1);
  });