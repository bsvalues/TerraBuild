#!/bin/bash
# backup_and_restore.sh
# This script manages database backups and restores for the TerraBuild application

set -e

# Default values
ENV="dev"
ACTION="backup"
VERBOSE=0
BACKUP_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env=*)
      ENV="${1#*=}"
      shift
      ;;
    --action=*)
      ACTION="${1#*=}"
      shift
      ;;
    --file=*)
      BACKUP_FILE="${1#*=}"
      shift
      ;;
    --verbose)
      VERBOSE=1
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --env=ENVIRONMENT      Environment to use (dev, staging, prod) (default: dev)"
      echo "  --action=ACTION        Action to perform (backup, restore, list) (default: backup)"
      echo "  --file=FILENAME        Backup file to restore from (required for restore)"
      echo "  --verbose              Enable verbose output"
      echo "  --help                 Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 --env=dev --action=backup                # Create a backup of the dev database"
      echo "  $0 --env=staging --action=list              # List available backups for staging"
      echo "  $0 --env=prod --action=restore --file=prod_backup_20250430.sql.gz  # Restore from backup"
      exit 0
      ;;
    *)
      echo "Error: Unknown option $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Validate environment
if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "Error: Invalid environment. Must be one of: dev, staging, prod"
  exit 1
fi

# Validate action
if [[ ! "$ACTION" =~ ^(backup|restore|list)$ ]]; then
  echo "Error: Invalid action. Must be one of: backup, restore, list"
  exit 1
fi

# Check for required restore file
if [ "$ACTION" = "restore" ] && [ -z "$BACKUP_FILE" ]; then
  echo "Error: --file parameter is required for restore action"
  exit 1
fi

# Set backup directory
BACKUP_DIR="backups/$ENV"
mkdir -p "$BACKUP_DIR"

# Set database connection based on environment
case "$ENV" in
  dev)
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_NAME="terrabuild"
    DB_USER="postgres"
    DB_PASSWORD="postgres"
    ;;
  staging)
    # In CI/CD, these would be set by the pipeline
    DB_HOST="${STAGING_DB_HOST:-}"
    DB_PORT="${STAGING_DB_PORT:-5432}"
    DB_NAME="${STAGING_DB_NAME:-}"
    DB_USER="${STAGING_DB_USER:-}"
    DB_PASSWORD="${STAGING_DB_PASSWORD:-}"
    ;;
  prod)
    # In CI/CD, these would be set by the pipeline
    DB_HOST="${PROD_DB_HOST:-}"
    DB_PORT="${PROD_DB_PORT:-5432}"
    DB_NAME="${PROD_DB_NAME:-}"
    DB_USER="${PROD_DB_USER:-}"
    DB_PASSWORD="${PROD_DB_PASSWORD:-}"
    ;;
esac

# Check if database credentials are set
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
  echo "Error: Database connection details not set for $ENV environment"
  exit 1
fi

# Function to create database backup
create_backup() {
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local backup_file="${BACKUP_DIR}/terrabuild_${ENV}_${timestamp}.sql.gz"
  
  echo "Creating backup of $ENV database..."
  echo "Database: $DB_NAME"
  echo "Output file: $backup_file"
  
  PGPASSWORD="$DB_PASSWORD" pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=custom \
    --verbose \
    --file="${backup_file%.gz}" \
    --exclude-table-data="*_migrations" \
    --no-owner \
    --no-acl
  
  # Compress the backup
  gzip "${backup_file%.gz}"
  
  echo "Backup completed successfully: $backup_file"
  echo "Backup size: $(du -h "$backup_file" | cut -f1)"
}

# Function to restore database from backup
restore_from_backup() {
  local backup_path="$BACKUP_DIR/$BACKUP_FILE"
  
  # Check if backup file exists
  if [ ! -f "$backup_path" ]; then
    echo "Error: Backup file not found: $backup_path"
    exit 1
  fi
  
  echo "WARNING: This will REPLACE ALL DATA in the $ENV database with data from the backup."
  read -p "Are you sure you want to proceed? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
  fi
  
  echo "Restoring $ENV database from backup: $backup_path"
  
  # Extract if it's compressed
  if [[ "$backup_path" == *.gz ]]; then
    echo "Extracting compressed backup..."
    gunzip -c "$backup_path" > "${backup_path%.gz}"
    backup_path="${backup_path%.gz}"
  fi
  
  # Restore database
  PGPASSWORD="$DB_PASSWORD" pg_restore \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --verbose \
    "$backup_path"
  
  # Clean up extracted file if we decompressed it
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    rm "$backup_path"
  fi
  
  echo "Database restore completed successfully."
}

# Function to list available backups
list_backups() {
  echo "Available backups for $ENV environment:"
  
  if [ ! "$(ls -A "$BACKUP_DIR")" ]; then
    echo "No backups found in $BACKUP_DIR"
    return
  fi
  
  echo "-----------------------------------------------------"
  echo "Filename                                      Size"
  echo "-----------------------------------------------------"
  
  for backup in "$BACKUP_DIR"/*; do
    if [ -f "$backup" ]; then
      filename=$(basename "$backup")
      size=$(du -h "$backup" | cut -f1)
      printf "%-45s %s\n" "$filename" "$size"
    fi
  done
  
  echo "-----------------------------------------------------"
  echo "Restore command example:"
  echo "$0 --env=$ENV --action=restore --file=<filename>"
}

# Execute requested action
case "$ACTION" in
  backup)
    create_backup
    ;;
  restore)
    restore_from_backup
    ;;
  list)
    list_backups
    ;;
esac