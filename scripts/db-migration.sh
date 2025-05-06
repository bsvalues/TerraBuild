#!/bin/bash
# db-migration.sh
# Database migration script for TerraBuild application

set -e

# Default values
ENV="dev"
ACTION="status"
VERBOSE=0

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
    --verbose)
      VERBOSE=1
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --env=ENVIRONMENT      Environment to use (dev, staging, prod) (default: dev)"
      echo "  --action=ACTION        Migration action (status, up, down, create) (default: status)"
      echo "  --verbose              Enable verbose output"
      echo "  --help                 Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 --env=dev --action=status"
      echo "  $0 --env=staging --action=up"
      echo "  $0 --env=prod --action=create --name='add_user_roles'"
      exit 0
      ;;
    --name=*)
      MIGRATION_NAME="${1#*=}"
      shift
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
if [[ ! "$ACTION" =~ ^(status|up|down|create)$ ]]; then
  echo "Error: Invalid action. Must be one of: status, up, down, create"
  exit 1
fi

# If action is create, check for migration name
if [ "$ACTION" = "create" ] && [ -z "$MIGRATION_NAME" ]; then
  echo "Error: Migration name is required for create action"
  echo "Example: $0 --env=$ENV --action=create --name='add_user_roles'"
  exit 1
fi

# Set database connection based on environment
case "$ENV" in
  dev)
    export DATABASE_URL="${DEV_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/terrabuild}"
    ;;
  staging)
    # In CI/CD, this would be set by the pipeline
    if [ -z "$STAGING_DATABASE_URL" ]; then
      echo "Error: STAGING_DATABASE_URL environment variable not set"
      exit 1
    fi
    export DATABASE_URL="$STAGING_DATABASE_URL"
    ;;
  prod)
    # In CI/CD, this would be set by the pipeline
    if [ -z "$PROD_DATABASE_URL" ]; then
      echo "Error: PROD_DATABASE_URL environment variable not set"
      exit 1
    fi
    export DATABASE_URL="$PROD_DATABASE_URL"
    ;;
esac

echo "=== Database Migration: $ACTION ($ENV environment) ==="

# Execute requested action
case "$ACTION" in
  status)
    echo "Checking migration status..."
    npx drizzle-kit studio
    ;;
  up)
    echo "Applying pending migrations..."
    npx drizzle-kit push:pg
    echo "Migrations applied successfully."
    ;;
  down)
    echo "WARNING: Rolling back migrations is a destructive operation."
    read -p "Are you sure you want to proceed? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "Rollback cancelled."
      exit 0
    fi
    
    echo "Rolling back migrations..."
    # Custom rollback logic would be implemented here
    echo "Migration rollback is not automated for safety reasons."
    echo "Please restore from a database backup or apply a rollback migration script."
    ;;
  create)
    echo "Creating new migration: $MIGRATION_NAME"
    npx drizzle-kit generate:pg --name=$MIGRATION_NAME
    echo "Migration created successfully."
    echo "Please edit the generated SQL file in the migrations folder."
    ;;
esac

echo "=== Database Migration completed ==="