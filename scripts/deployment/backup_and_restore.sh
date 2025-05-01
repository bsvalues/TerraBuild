#!/bin/bash
# Database Backup and Restore Script for TerraFusion
set -e

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/../.."
BACKUP_DIR="$PROJECT_ROOT/backups"
S3_BUCKET="terrafusion-backups"

# Parse command line arguments
ACTION=""
ENV="dev"
BACKUP_FILE=""

print_usage() {
  echo "Usage: $0 [backup|restore] --env [dev|staging|prod] [--file BACKUP_FILE]"
  echo ""
  echo "Options:"
  echo "  backup                 Create a database backup"
  echo "  restore                Restore from a database backup"
  echo "  --env ENV              Environment (dev, staging, prod)"
  echo "  --file BACKUP_FILE     Backup file to restore from (required for restore)"
  echo ""
  echo "Examples:"
  echo "  $0 backup --env prod                     # Create a backup of production database"
  echo "  $0 restore --env staging --file backup.gz   # Restore staging from backup file"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    backup)
      ACTION="backup"
      shift
      ;;
    restore)
      ACTION="restore"
      shift
      ;;
    --env)
      ENV="$2"
      shift 2
      ;;
    --file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
done

# Validate arguments
if [ -z "$ACTION" ]; then
  echo "Error: Action (backup or restore) is required."
  print_usage
  exit 1
fi

if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "Error: Environment must be one of: dev, staging, prod"
  print_usage
  exit 1
fi

if [ "$ACTION" == "restore" ] && [ -z "$BACKUP_FILE" ]; then
  echo "Error: --file parameter is required for restore action."
  print_usage
  exit 1
fi

# Load database credentials from environment or terraform
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not found in environment, attempting to load from Terraform output..."
  if command -v terraform &> /dev/null; then
    cd "$PROJECT_ROOT/terraform/environments/$ENV"
    DATABASE_URL=$(terraform output -raw database_url)
  else
    echo "Error: Neither DATABASE_URL environment variable nor terraform command found."
    exit 1
  fi
fi

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Function to create a backup
create_backup() {
  echo "Creating database backup for environment: $ENV"
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  BACKUP_PATH="$BACKUP_DIR/${ENV}-${TIMESTAMP}.dump"
  
  # Extract database name from connection string
  db_name=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  
  # Create backup
  echo "Running pg_dump..."
  pg_dump -Fc "$DATABASE_URL" > "$BACKUP_PATH"
  
  # Compress the backup
  echo "Compressing backup..."
  gzip "$BACKUP_PATH"
  COMPRESSED_PATH="${BACKUP_PATH}.gz"
  
  echo "Backup created: $COMPRESSED_PATH"
  
  # Upload to S3 if AWS CLI is available
  if command -v aws &> /dev/null; then
    echo "Uploading backup to S3..."
    aws s3 cp "$COMPRESSED_PATH" "s3://${S3_BUCKET}/${ENV}/$(basename ${COMPRESSED_PATH})"
    echo "Backup uploaded to S3 bucket: ${S3_BUCKET}"
  else
    echo "AWS CLI not found, skipping S3 upload."
  fi
  
  echo "Backup process completed successfully!"
}

# Function to restore from a backup
restore_from_backup() {
  local backup_file="$1"
  echo "Restoring database from backup: $backup_file"
  
  # Check if the backup file exists locally
  if [ ! -f "$backup_file" ]; then
    # If not local, check if it might be in the backup directory
    if [ -f "$BACKUP_DIR/$(basename $backup_file)" ]; then
      backup_file="$BACKUP_DIR/$(basename $backup_file)"
    else
      # Try to download from S3
      if command -v aws &> /dev/null; then
        echo "Backup not found locally, attempting to download from S3..."
        aws s3 cp "s3://${S3_BUCKET}/${ENV}/$(basename $backup_file)" "$BACKUP_DIR/$(basename $backup_file)"
        backup_file="$BACKUP_DIR/$(basename $backup_file)"
      else
        echo "Error: Backup file not found locally and AWS CLI not available to download from S3."
        exit 1
      fi
    fi
  fi
  
  # Extract if it's a gzipped file
  if [[ "$backup_file" == *.gz ]]; then
    echo "Extracting compressed backup..."
    gunzip -c "$backup_file" > "${backup_file%.gz}"
    backup_file="${backup_file%.gz}"
  fi
  
  # Extract database connection details
  db_name=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  
  # Restore database
  echo "Restoring database $db_name from backup..."
  pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$DATABASE_URL" "$backup_file"
  
  echo "Database restored successfully!"
}

# Execute the requested action
if [ "$ACTION" == "backup" ]; then
  create_backup
elif [ "$ACTION" == "restore" ]; then
  restore_from_backup "$BACKUP_FILE"
fi