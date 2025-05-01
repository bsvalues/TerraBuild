#!/bin/bash
# Database Migration Script for TerraFusion
set -e

# Configuration
ENV=${1:-dev}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/../.."
MIGRATIONS_DIR="$PROJECT_ROOT/migrations"

# Load database credentials from environment
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable not set"
  exit 1
fi

# Create migrations directory if it doesn't exist
if [ ! -d "$MIGRATIONS_DIR" ]; then
  mkdir -p "$MIGRATIONS_DIR"
  echo "Created migrations directory at $MIGRATIONS_DIR"
fi

# Function to run migrations
run_migrations() {
  echo "Running database migrations for environment: $ENV"
  cd "$PROJECT_ROOT"
  
  # Use drizzle-kit for schema migrations
  echo "Running Drizzle migrations..."
  npm run db:migrate
  
  # Apply any custom SQL migrations
  if [ -d "$MIGRATIONS_DIR/custom" ]; then
    echo "Applying custom SQL migrations..."
    for sql_file in $(ls $MIGRATIONS_DIR/custom/*.sql | sort); do
      echo "Applying migration: $(basename $sql_file)"
      psql "$DATABASE_URL" -f "$sql_file"
    done
  fi
  
  echo "Database migrations completed successfully."
}

# Function to create a database backup before migrations
backup_database() {
  echo "Creating database backup before migrations..."
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  BACKUP_DIR="$PROJECT_ROOT/backups"
  mkdir -p "$BACKUP_DIR"
  
  backup_file="$BACKUP_DIR/$ENV-$TIMESTAMP"
  
  # Create backup using pg_dump
  pg_dump -Fc "$DATABASE_URL" > "${backup_file}.dump"
  echo "Backup completed: ${backup_file}.dump"
  
  # Compress the backup
  gzip "${backup_file}.dump"
  echo "Backup compressed: ${backup_file}.dump.gz"
}

# Main script execution
echo "TerraFusion Database Migration Utility"
echo "Environment: $ENV"

# Create backup first
backup_database

# Run migrations
run_migrations

echo "Database migration process completed successfully!"