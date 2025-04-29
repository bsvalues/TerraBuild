#!/bin/sh

# Start script for TerraBuild container
set -e

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Wait for the database to be available
echo "Waiting for database to be available..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if node -e "
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query('SELECT 1').then(() => {
      console.log('Database connection successful');
      process.exit(0);
    }).catch(err => {
      console.error('Database connection failed:', err.message);
      process.exit(1);
    });
  "; then
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Retrying database connection ($RETRY_COUNT/$MAX_RETRIES)..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "ERROR: Could not connect to the database after $MAX_RETRIES attempts"
  exit 1
fi

# Start the application
echo "Starting TerraBuild application..."
exec node server/index.js