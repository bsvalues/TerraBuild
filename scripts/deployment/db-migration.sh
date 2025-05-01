#!/bin/bash
# TerraFusion Database Migration Script
# This script manages database migrations across environments using Drizzle ORM

set -e

# Default configuration
DEFAULT_ENV="dev"
MIGRATIONS_DIR="./migrations"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
  echo -e "${BLUE}TerraFusion Database Migration Script${NC}"
  echo ""
  echo "Usage: $0 [options] [command]"
  echo ""
  echo "Commands:"
  echo "  generate       Generate a new migration from schema changes"
  echo "  push           Push schema changes directly to the database (dev only)"
  echo "  apply          Apply pending migrations to the database"
  echo "  status         Show pending migrations"
  echo "  drop           Drop all tables and reset the database (dev only)"
  echo "  help           Show this help message"
  echo ""
  echo "Options:"
  echo "  -e, --environment ENV     Environment (dev, staging, prod) [default: $DEFAULT_ENV]"
  echo "  -d, --database URL        Database connection URL (alternatively use DATABASE_URL env var)"
  echo "  -v, --verbose             Enable verbose output"
  echo "  -f, --force               Force operation without confirmation (use with caution)"
  echo ""
  echo "Examples:"
  echo "  $0 generate                  # Generate a new migration"
  echo "  $0 -e dev push               # Push schema changes to dev database"
  echo "  $0 -e staging apply          # Apply pending migrations to staging"
  echo "  $0 -e prod status            # Check migration status on production"
  echo ""
}

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
  if [ "$VERBOSE" = true ]; then
    echo -e "${BLUE}[DEBUG]${NC} $1"
  fi
}

# Parse command line arguments
ENVIRONMENT=$DEFAULT_ENV
DATABASE_URL_ARG=""
VERBOSE=false
FORCE=false

COMMAND=""

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -d|--database)
      DATABASE_URL_ARG="$2"
      shift
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -f|--force)
      FORCE=true
      shift
      ;;
    generate|push|apply|status|drop|help)
      COMMAND="$1"
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [ -z "$COMMAND" ]; then
  log_error "No command specified"
  usage
  exit 1
fi

if [ "$COMMAND" = "help" ]; then
  usage
  exit 0
fi

# Use command line database URL if provided, otherwise use environment variable
if [ -n "$DATABASE_URL_ARG" ]; then
  export DATABASE_URL="$DATABASE_URL_ARG"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  log_error "DATABASE_URL is not set. Please provide it via -d option or set the environment variable."
  exit 1
fi

log_debug "Environment: $ENVIRONMENT"
log_debug "Database URL: ${DATABASE_URL:0:15}..."
log_debug "Command: $COMMAND"

# Check if we're in the project root
if [ ! -d "$MIGRATIONS_DIR" ]; then
  log_error "Migrations directory not found at $MIGRATIONS_DIR"
  log_error "Please run this script from the project root directory"
  exit 1
fi

# Check if required commands are installed
if ! command -v npm &> /dev/null; then
  log_error "npm is not installed or not in PATH"
  exit 1
fi

# Check if Drizzle is installed
if ! npm list -g | grep -q drizzle-kit; then
  log_warning "drizzle-kit is not installed globally"
  log_info "Installing drizzle-kit globally..."
  npm install -g drizzle-kit
fi

# Restrict certain commands to dev environment
if [ "$ENVIRONMENT" != "dev" ] && { [ "$COMMAND" = "push" ] || [ "$COMMAND" = "drop" ]; }; then
  log_error "$COMMAND command is only allowed in dev environment"
  exit 1
fi

# Confirm commands in production environment
if [ "$ENVIRONMENT" = "prod" ] && [ "$FORCE" != true ] && [ "$COMMAND" != "status" ]; then
  log_warning "You are running $COMMAND in PRODUCTION environment"
  read -p "Are you sure you want to continue? (y/n) " -n 1 -r
  echo ""
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Operation cancelled"
    exit 0
  fi
}

# Create a backup before making changes
create_backup() {
  log_info "Creating database backup before migrations..."
  
  BACKUP_SCRIPT="./scripts/deployment/backup_and_restore.sh"
  
  if [ -f "$BACKUP_SCRIPT" ]; then
    $BACKUP_SCRIPT -e "$ENVIRONMENT" backup
  else
    log_warning "Backup script not found at $BACKUP_SCRIPT, skipping backup"
  fi
}

# Generate a new migration
generate_migration() {
  log_info "Generating new migration from schema changes..."
  
  npx drizzle-kit generate:pg --schema=./shared/schema.ts --out=$MIGRATIONS_DIR
  
  log_info "Migration files generated in $MIGRATIONS_DIR"
}

# Push schema changes directly to database (dev only)
push_schema() {
  log_info "Pushing schema changes directly to database..."
  
  if [ "$ENVIRONMENT" != "dev" ]; then
    log_error "Push command is only allowed in dev environment"
    exit 1
  fi
  
  npx drizzle-kit push:pg --schema=./shared/schema.ts
  
  log_info "Schema changes pushed successfully"
}

# Apply pending migrations
apply_migrations() {
  log_info "Applying pending migrations to database..."
  
  # In production, create a backup first
  if [ "$ENVIRONMENT" = "prod" ]; then
    create_backup
  fi
  
  # Run migrations
  NODE_ENV=$ENVIRONMENT npm run db:migrate
  
  log_info "Migrations applied successfully"
}

# Show migration status
show_status() {
  log_info "Checking migration status..."
  
  NODE_ENV=$ENVIRONMENT npm run db:status
}

# Drop all tables and reset database (dev only)
drop_database() {
  log_info "Dropping all tables and resetting database..."
  
  if [ "$ENVIRONMENT" != "dev" ]; then
    log_error "Drop command is only allowed in dev environment"
    exit 1
  fi
  
  if [ "$FORCE" != true ]; then
    log_warning "This will delete all data in the database"
    read -p "Are you sure you want to continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_info "Operation cancelled"
      exit 0
    fi
  fi
  
  npx drizzle-kit drop --schema=./shared/schema.ts
  
  log_info "Database reset successfully"
}

# Execute the requested command
case "$COMMAND" in
  generate)
    generate_migration
    ;;
  push)
    push_schema
    ;;
  apply)
    apply_migrations
    ;;
  status)
    show_status
    ;;
  drop)
    drop_database
    ;;
esac