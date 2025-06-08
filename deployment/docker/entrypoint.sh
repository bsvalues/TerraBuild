#!/bin/bash
set -e

# TerraFusion Production Entrypoint Script
# Handles database migrations, health checks, and application startup

echo "🚀 TerraFusion Production Startup"
echo "================================="

# Wait for database to be ready
echo "Waiting for database connection..."
until pg_isready -h ${DATABASE_HOST:-db} -p ${DATABASE_PORT:-5432} -U ${DATABASE_USER:-postgres}; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
npm run db:push || {
  echo "Migration failed, attempting to create database..."
  npm run db:create 2>/dev/null || true
  npm run db:push
}

echo "Database migrations completed"

# Start the application
echo "Starting TerraFusion application..."
exec node server/index.js