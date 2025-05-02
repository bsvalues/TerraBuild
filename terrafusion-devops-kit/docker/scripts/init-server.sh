#!/bin/bash
# Backend server initialization script
# This script handles database migrations and starts the server

set -e

echo "Starting TerraFusion Backend Server (v${BUILD_VERSION})"
echo "Environment: ${NODE_ENV}"

# Wait for the database to be available
echo "Checking database connection..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if node -e "
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
        pool.query('SELECT 1').then(() => {
            console.log('Database is available');
            process.exit(0);
        }).catch(err => {
            console.error('Database connection error:', err.message);
            process.exit(1);
        });
    "; then
        break
    fi
    
    attempt=$((attempt+1))
    echo "Waiting for database to be available... Attempt $attempt/$max_attempts"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "Error: Database is not available after $max_attempts attempts"
    exit 1
fi

# Run database migrations
echo "Running database migrations..."
if [ -f "./node_modules/.bin/drizzle-kit" ]; then
    npx drizzle-kit push
else
    echo "Warning: drizzle-kit not found, skipping migrations"
fi

# Initialize the MCP framework if enabled
if [ "$ENABLE_MCP" = "true" ]; then
    echo "Initializing MCP framework..."
    node ./server/mcp/init.js || echo "MCP initialization failed, continuing anyway"
fi

# Start the server
echo "Starting server..."
if [ -f "./dist/server/index.js" ]; then
    node ./dist/server/index.js
else
    node ./server/index.js
fi