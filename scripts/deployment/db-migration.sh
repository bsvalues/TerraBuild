#!/bin/bash
# TerraFusion Database Migration Script

set -e

# Configuration
ENVIRONMENT="${ENVIRONMENT:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "${SCRIPT_DIR}")")"
MIGRATIONS_DIR="${ROOT_DIR}/migrations"
LOG_DIR="${ROOT_DIR}/logs"
LOG_FILE="${LOG_DIR}/migration_${ENVIRONMENT}_$(date +%Y-%m-%d_%H-%M-%S).log"

# Create log directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Backup script path
BACKUP_SCRIPT="${SCRIPT_DIR}/backup_and_restore.sh"

# Function to display help
function show_help {
  echo "TerraFusion Database Migration Tool"
  echo ""
  echo "Usage: $0 [OPTIONS] COMMAND"
  echo ""
  echo "Commands:"
  echo "  create NAME      Create a new migration"
  echo "  status           Check migration status"
  echo "  up [N]           Apply N (or all) pending migrations"
  echo "  down [N]         Revert N (or 1) applied migrations"
  echo "  redo [N]         Revert and reapply N (or 1) migrations"
  echo "  new              Find all new schema changes and create migrations"
  echo "  reset            Revert all migrations"
  echo "  setup            Initialize the migrations table"
  echo ""
  echo "Options:"
  echo "  -h, --help           Show this help message"
  echo "  -e, --environment    Set environment (dev, staging, prod)"
  echo "  -s, --skip-backup    Skip database backup before migration"
  echo "  -d, --dry-run        Show what would be done without executing"
  echo ""
  echo "Environment Variables:"
  echo "  PGHOST              PostgreSQL host"
  echo "  PGPORT              PostgreSQL port"
  echo "  PGDATABASE          PostgreSQL database"
  echo "  PGUSER              PostgreSQL user"
  echo "  PGPASSWORD          PostgreSQL password"
  echo "  DATABASE_URL        PostgreSQL connection URL (alternative to individual vars)"
  echo "  ENVIRONMENT         Environment name (dev, staging, prod)"
  echo ""
  echo "Examples:"
  echo "  $0 create add_user_table          # Create a new migration"
  echo "  $0 up                             # Apply all pending migrations"
  echo "  $0 up 2                           # Apply next 2 pending migrations"
  echo "  $0 down                           # Revert the last applied migration"
  echo "  $0 -e prod up                     # Apply migrations in production"
  echo "  $0 new                            # Generate migrations for schema changes"
}

# Function to check database connection
function check_db_connection {
  echo "Checking database connection..."
  
  if [[ -n "${DATABASE_URL}" ]]; then
    # Parse DATABASE_URL if provided
    PGHOST=$(echo "${DATABASE_URL}" | sed -n 's/.*@\([^:]*\).*/\1/p')
    PGPORT=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    PGDATABASE=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    PGUSER=$(echo "${DATABASE_URL}" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    PGPASSWORD=$(echo "${DATABASE_URL}" | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
  fi

  if [[ -z "${PGHOST}" || -z "${PGPORT}" || -z "${PGDATABASE}" || -z "${PGUSER}" || -z "${PGPASSWORD}" ]]; then
    echo "Error: Database connection information is incomplete."
    echo "Please set PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD"
    echo "or set DATABASE_URL with a complete connection string."
    exit 1
  fi

  if ! pg_isready -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t 5; then
    echo "Error: Cannot connect to the database."
    exit 1
  fi

  echo "Database connection successful."
}

# Function to check for required tools
function check_requirements {
  if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
  fi
  
  if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not installed."
    exit 1
  }
  
  if ! command -v npx &> /dev/null; then
    echo "Error: npx is required but not installed."
    exit 1
  }
  
  if [[ ! -f "${ROOT_DIR}/node_modules/.bin/drizzle-kit" ]]; then
    echo "Error: drizzle-kit is not installed. Run 'npm install' in the project root."
    exit 1
  }
}

# Function to create a backup before migration
function backup_database {
  if [[ "${SKIP_BACKUP}" == "true" ]]; then
    echo "Skipping database backup (--skip-backup option specified)."
    return
  fi
  
  if [[ ! -f "${BACKUP_SCRIPT}" ]]; then
    echo "Warning: Backup script not found at ${BACKUP_SCRIPT}. Skipping backup."
    return
  fi
  
  echo "Creating database backup before migration..."
  "${BACKUP_SCRIPT}" -e "${ENVIRONMENT}" backup
  
  if [[ $? -ne 0 ]]; then
    echo "Warning: Database backup failed. Continuing with migration anyway."
  else
    echo "Database backup completed successfully."
  fi
}

# Function to execute SQL
function execute_sql {
  local sql="$1"
  
  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "DRY RUN: Would execute SQL:"
    echo "${sql}"
    return 0
  fi
  
  PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -c "${sql}"
}

# Function to setup migration table
function setup_migration_table {
  echo "Setting up migration table..."
  
  local sql="
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  "
  
  execute_sql "${sql}"
  echo "Migration table setup complete."
}

# Function to check current migration status
function migration_status {
  echo "Current migration status:"
  
  # Check if migration table exists
  local table_exists=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -c "
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations'
    );
  ")
  
  if [[ "${table_exists}" != *"t"* ]]; then
    echo "Migration table does not exist. Run 'setup' command first."
    return 1
  fi
  
  # Get all migration files
  local all_migrations=()
  local migration_files=($(find "${MIGRATIONS_DIR}" -name "*.sql" -type f | sort))
  
  for file in "${migration_files[@]}"; do
    local filename=$(basename "${file}")
    local version="${filename%.sql}"
    all_migrations+=("${version}")
  done
  
  # Get applied migrations
  local applied_migrations=($(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -c "
    SELECT version FROM schema_migrations ORDER BY version;
  " | tr -d ' '))
  
  echo "Found ${#all_migrations[@]} total migrations."
  
  # Show status of each migration
  local pending_count=0
  
  echo "---------------------------------------------------"
  echo "| Status  | Version           | Migration Name    |"
  echo "---------------------------------------------------"
  
  for version in "${all_migrations[@]}"; do
    local status="Pending"
    local name="${version#*_}"
    
    for applied in "${applied_migrations[@]}"; do
      if [[ "${version}" == "${applied}" ]]; then
        status="Applied"
        break
      fi
    done
    
    if [[ "${status}" == "Pending" ]]; then
      ((pending_count++))
    fi
    
    printf "| %-7s | %-17s | %-17s |\n" "${status}" "${version}" "${name}"
  done
  
  echo "---------------------------------------------------"
  echo "${pending_count} pending migrations."
  
  return 0
}

# Function to create a new migration
function create_migration {
  local name="$1"
  
  if [[ -z "${name}" ]]; then
    echo "Error: Migration name is required."
    exit 1
  fi
  
  # Sanitize name
  name=$(echo "${name}" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | sed 's/[^a-z0-9_]//g')
  
  if [[ -z "${name}" ]]; then
    echo "Error: Invalid migration name after sanitization."
    exit 1
  fi
  
  # Create migrations directory if it doesn't exist
  mkdir -p "${MIGRATIONS_DIR}"
  
  # Generate timestamp and filename
  local timestamp=$(date +%Y%m%d%H%M%S)
  local filename="${timestamp}_${name}.sql"
  local filepath="${MIGRATIONS_DIR}/${filename}"
  
  # Check if file already exists
  if [[ -f "${filepath}" ]]; then
    echo "Error: Migration file ${filename} already exists."
    exit 1
  fi
  
  # Create migration file
  cat > "${filepath}" << EOF
-- Migration: ${name}
-- Created at: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
-- Description: 

-- Up Migration
-- Write your UP SQL here

-- Down Migration (comment with -- down to separate)
-- down
-- Write your DOWN SQL here

EOF
  
  echo "Created new migration: ${filename}"
}

# Function to apply migrations
function apply_migrations {
  local limit="$1"
  
  # Check if migration table exists, if not create it
  local table_exists=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -c "
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations'
    );
  ")
  
  if [[ "${table_exists}" != *"t"* ]]; then
    setup_migration_table
  fi
  
  # Get applied migrations
  local applied_migrations=($(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -c "
    SELECT version FROM schema_migrations ORDER BY version;
  " | tr -d ' '))
  
  # Get all migration files
  local migration_files=($(find "${MIGRATIONS_DIR}" -name "*.sql" -type f | sort))
  local pending_migrations=()
  
  # Find pending migrations
  for file in "${migration_files[@]}"; do
    local filename=$(basename "${file}")
    local version="${filename%.sql}"
    local is_applied=false
    
    for applied in "${applied_migrations[@]}"; do
      if [[ "${version}" == "${applied}" ]]; then
        is_applied=true
        break
      fi
    done
    
    if [[ "${is_applied}" == "false" ]]; then
      pending_migrations+=("${file}")
    fi
  done
  
  if [[ ${#pending_migrations[@]} -eq 0 ]]; then
    echo "No pending migrations to apply."
    return 0
  fi
  
  echo "Found ${#pending_migrations[@]} pending migrations."
  
  # Apply limit if specified
  if [[ -n "${limit}" && "${limit}" -gt 0 && "${limit}" -lt ${#pending_migrations[@]} ]]; then
    pending_migrations=("${pending_migrations[@]:0:${limit}}")
    echo "Limiting to ${limit} migrations as requested."
  fi
  
  # Backup database before migrations
  backup_database
  
  # Apply each pending migration
  local applied_count=0
  
  for file in "${pending_migrations[@]}"; do
    local filename=$(basename "${file}")
    local version="${filename%.sql}"
    
    echo "Applying migration: ${filename}"
    
    # Extract the 'up' part of the migration (everything before '-- down')
    local up_sql=$(sed '/^-- down/,$d' "${file}")
    
    if [[ "${DRY_RUN}" == "true" ]]; then
      echo "DRY RUN: Would execute SQL from ${filename}"
      echo "---------------------------------------"
      echo "${up_sql}"
      echo "---------------------------------------"
    else
      # Apply the migration in a transaction
      echo "BEGIN;" > /tmp/migration.sql
      echo "${up_sql}" >> /tmp/migration.sql
      echo "INSERT INTO schema_migrations (version) VALUES ('${version}');" >> /tmp/migration.sql
      echo "COMMIT;" >> /tmp/migration.sql
      
      PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -f /tmp/migration.sql
      
      if [[ $? -ne 0 ]]; then
        echo "Error: Failed to apply migration ${filename}."
        rm -f /tmp/migration.sql
        exit 1
      fi
      
      rm -f /tmp/migration.sql
    fi
    
    ((applied_count++))
    echo "Successfully applied migration: ${filename}"
  done
  
  echo "Applied ${applied_count} migration(s)."
}

# Function to revert migrations
function revert_migrations {
  local limit="$1"
  
  # Default to 1 if not specified
  if [[ -z "${limit}" ]]; then
    limit=1
  fi
  
  # Check if migration table exists
  local table_exists=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -c "
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations'
    );
  ")
  
  if [[ "${table_exists}" != *"t"* ]]; then
    echo "Migration table does not exist. No migrations to revert."
    return 1
  fi
  
  # Get applied migrations
  local applied_migrations=($(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -c "
    SELECT version FROM schema_migrations ORDER BY version DESC;
  " | tr -d ' '))
  
  if [[ ${#applied_migrations[@]} -eq 0 ]]; then
    echo "No applied migrations to revert."
    return 0
  fi
  
  # Apply limit if needed
  if [[ "${limit}" -gt ${#applied_migrations[@]} ]]; then
    limit=${#applied_migrations[@]}
  fi
  
  echo "Reverting ${limit} of ${#applied_migrations[@]} applied migrations."
  
  # Backup database before reverting
  backup_database
  
  # Revert each migration
  local reverted_count=0
  
  for ((i=0; i<limit; i++)); do
    local version="${applied_migrations[$i]}"
    local filename="${version}.sql"
    local filepath="${MIGRATIONS_DIR}/${filename}"
    
    echo "Reverting migration: ${filename}"
    
    if [[ ! -f "${filepath}" ]]; then
      echo "Error: Migration file ${filename} not found."
      exit 1
    fi
    
    # Extract the 'down' part of the migration (everything after '-- down')
    local down_sql=$(sed -n '/^-- down/,$p' "${filepath}" | tail -n +2)
    
    if [[ -z "${down_sql}" ]]; then
      echo "Error: No down migration found in ${filename}."
      exit 1
    fi
    
    if [[ "${DRY_RUN}" == "true" ]]; then
      echo "DRY RUN: Would execute SQL from ${filename} (down part)"
      echo "---------------------------------------"
      echo "${down_sql}"
      echo "---------------------------------------"
    else
      # Apply the down migration in a transaction
      echo "BEGIN;" > /tmp/migration.sql
      echo "${down_sql}" >> /tmp/migration.sql
      echo "DELETE FROM schema_migrations WHERE version = '${version}';" >> /tmp/migration.sql
      echo "COMMIT;" >> /tmp/migration.sql
      
      PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -f /tmp/migration.sql
      
      if [[ $? -ne 0 ]]; then
        echo "Error: Failed to revert migration ${filename}."
        rm -f /tmp/migration.sql
        exit 1
      fi
      
      rm -f /tmp/migration.sql
    fi
    
    ((reverted_count++))
    echo "Successfully reverted migration: ${filename}"
  done
  
  echo "Reverted ${reverted_count} migration(s)."
}

# Function to redo migrations
function redo_migrations {
  local limit="$1"
  
  # Default to 1 if not specified
  if [[ -z "${limit}" ]]; then
    limit=1
  fi
  
  # First revert the specified number of migrations
  revert_migrations "${limit}"
  
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to revert migrations. Redo aborted."
    exit 1
  fi
  
  # Then apply the same number of migrations
  apply_migrations "${limit}"
  
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to apply migrations during redo."
    exit 1
  fi
  
  echo "Successfully redid ${limit} migration(s)."
}

# Function to create migrations for new schema changes
function create_new_migrations {
  check_requirements
  
  echo "Detecting schema changes and creating migrations..."
  
  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "DRY RUN: Would execute 'drizzle-kit generate'"
    return 0
  fi
  
  # Use Drizzle Kit to generate migrations
  cd "${ROOT_DIR}"
  npx drizzle-kit generate:pg --out="${MIGRATIONS_DIR}" --schema=./shared/schema.ts
  
  if [[ $? -ne 0 ]]; then
    echo "Error: Failed to generate migrations with drizzle-kit."
    exit 1
  fi
  
  echo "Successfully generated migrations for schema changes."
}

# Function to reset all migrations
function reset_all_migrations {
  # Check if migration table exists
  local table_exists=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -c "
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations'
    );
  ")
  
  if [[ "${table_exists}" != *"t"* ]]; then
    echo "Migration table does not exist. No migrations to reset."
    return 0
  fi
  
  # Get applied migrations
  local applied_migrations=($(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -c "
    SELECT version FROM schema_migrations ORDER BY version DESC;
  " | tr -d ' '))
  
  if [[ ${#applied_migrations[@]} -eq 0 ]]; then
    echo "No applied migrations to reset."
    return 0
  fi
  
  echo "WARNING: This will revert ALL ${#applied_migrations[@]} applied migrations!"
  read -p "Are you sure you want to continue? [y/N] " confirm
  
  if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
    echo "Reset cancelled."
    exit 0
  fi
  
  # Backup database before reset
  backup_database
  
  # Revert all migrations
  revert_migrations "${#applied_migrations[@]}"
}

# Parse command line arguments
SKIP_BACKUP="false"
DRY_RUN="false"
ACTION=""
PARAM=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -s|--skip-backup)
      SKIP_BACKUP="true"
      shift
      ;;
    -d|--dry-run)
      DRY_RUN="true"
      shift
      ;;
    create)
      ACTION="create"
      PARAM="$2"
      shift 2
      ;;
    status)
      ACTION="status"
      shift
      ;;
    up)
      ACTION="up"
      PARAM="$2"
      shift
      if [[ "${PARAM}" =~ ^[0-9]+$ ]]; then
        shift
      else
        PARAM=""
      fi
      ;;
    down)
      ACTION="down"
      PARAM="$2"
      shift
      if [[ "${PARAM}" =~ ^[0-9]+$ ]]; then
        shift
      else
        PARAM=""
      fi
      ;;
    redo)
      ACTION="redo"
      PARAM="$2"
      shift
      if [[ "${PARAM}" =~ ^[0-9]+$ ]]; then
        shift
      else
        PARAM=""
      fi
      ;;
    new)
      ACTION="new"
      shift
      ;;
    reset)
      ACTION="reset"
      shift
      ;;
    setup)
      ACTION="setup"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Execute the appropriate action
if [[ -z "${ACTION}" ]]; then
  echo "Error: No action specified."
  show_help
  exit 1
fi

# Check database connection for all actions except help
check_db_connection

# Redirect all output to console and log file
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "=== TerraFusion Database Migration Tool - $(date) ==="
echo "Environment: ${ENVIRONMENT}"
echo "Action: ${ACTION} ${PARAM}"
echo "Dry run: ${DRY_RUN}"
echo "Skip backup: ${SKIP_BACKUP}"
echo "----------------------------------------"

case "${ACTION}" in
  create)
    create_migration "${PARAM}"
    ;;
  status)
    migration_status
    ;;
  up)
    apply_migrations "${PARAM}"
    ;;
  down)
    revert_migrations "${PARAM}"
    ;;
  redo)
    redo_migrations "${PARAM}"
    ;;
  new)
    create_new_migrations
    ;;
  reset)
    reset_all_migrations
    ;;
  setup)
    setup_migration_table
    ;;
  *)
    echo "Error: Unknown action ${ACTION}."
    show_help
    exit 1
    ;;
esac

echo "----------------------------------------"
echo "Migration action '${ACTION}' completed successfully at $(date)."
echo "Log file: ${LOG_FILE}"

exit 0