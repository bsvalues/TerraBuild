#!/bin/bash
# TerraFusion Database Backup and Restore Script
# This script provides functionality to backup and restore PostgreSQL databases
# and upload/download the backups to/from S3

set -e

# Default configuration
DEFAULT_ENV="dev"
DEFAULT_S3_BUCKET_PREFIX="terrafusion-backup"
DEFAULT_BACKUP_PATH="./backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
  echo -e "${BLUE}TerraFusion Database Backup and Restore Script${NC}"
  echo ""
  echo "Usage: $0 [options] [command]"
  echo ""
  echo "Commands:"
  echo "  backup              Create a database backup"
  echo "  restore FILE        Restore database from a backup file"
  echo "  upload FILE         Upload a backup file to S3"
  echo "  download KEY        Download a backup file from S3"
  echo "  list                List backups in S3"
  echo "  help                Show this help message"
  echo ""
  echo "Options:"
  echo "  -e, --environment ENV       Environment (dev, staging, prod) [default: $DEFAULT_ENV]"
  echo "  -s, --s3-bucket BUCKET      S3 bucket for backups [default: $DEFAULT_S3_BUCKET_PREFIX-ENV]"
  echo "  -p, --backup-path PATH      Local path for backups [default: $DEFAULT_BACKUP_PATH]"
  echo "  -d, --db-name NAME          Database name"
  echo "  -h, --host HOST             Database host"
  echo "  -u, --user USER             Database user"
  echo "  -w, --password PASSWORD     Database password"
  echo "  -P, --port PORT             Database port"
  echo "  -v, --verbose               Enable verbose output"
  echo ""
  echo "Examples:"
  echo "  $0 backup                                   # Backup the database using env vars"
  echo "  $0 restore backups/terrafusion-20250501.dump  # Restore from a local file"
  echo "  $0 -e prod backup                           # Backup the production database"
  echo "  $0 -e prod upload backups/terrafusion-20250501.dump  # Upload backup to S3"
  echo "  $0 -e prod download terrafusion-20250501.dump         # Download backup from S3"
  echo "  $0 -e prod list                             # List backups in S3"
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
S3_BUCKET=""
BACKUP_PATH=$DEFAULT_BACKUP_PATH
VERBOSE=false
DB_NAME=""
DB_HOST=""
DB_USER=""
DB_PASSWORD=""
DB_PORT=""

COMMAND=""
COMMAND_ARG=""

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -s|--s3-bucket)
      S3_BUCKET="$2"
      shift
      shift
      ;;
    -p|--backup-path)
      BACKUP_PATH="$2"
      shift
      shift
      ;;
    -d|--db-name)
      DB_NAME="$2"
      shift
      shift
      ;;
    -h|--host)
      DB_HOST="$2"
      shift
      shift
      ;;
    -u|--user)
      DB_USER="$2"
      shift
      shift
      ;;
    -w|--password)
      DB_PASSWORD="$2"
      shift
      shift
      ;;
    -P|--port)
      DB_PORT="$2"
      shift
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    backup|restore|upload|download|list|help)
      COMMAND="$1"
      shift
      if [ $# -gt 0 ] && [[ "$1" != -* ]]; then
        COMMAND_ARG="$1"
        shift
      fi
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

# If S3 bucket not specified, use default naming convention
if [ -z "$S3_BUCKET" ]; then
  S3_BUCKET="${DEFAULT_S3_BUCKET_PREFIX}-${ENVIRONMENT}"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_PATH"

# Check if DB credentials are provided or in environment variables
if [ -z "$DB_NAME" ]; then
  DB_NAME=${PGDATABASE:-"terrafusion"}
fi

if [ -z "$DB_HOST" ]; then
  DB_HOST=${PGHOST:-"localhost"}
fi

if [ -z "$DB_USER" ]; then
  DB_USER=${PGUSER:-"postgres"}
fi

if [ -z "$DB_PASSWORD" ]; then
  DB_PASSWORD=${PGPASSWORD:-""}
fi

if [ -z "$DB_PORT" ]; then
  DB_PORT=${PGPORT:-"5432"}
fi

# Export PostgreSQL environment variables
export PGHOST=$DB_HOST
export PGUSER=$DB_USER
export PGPASSWORD=$DB_PASSWORD
export PGDATABASE=$DB_NAME
export PGPORT=$DB_PORT

log_debug "Environment: $ENVIRONMENT"
log_debug "S3 Bucket: $S3_BUCKET"
log_debug "Backup Path: $BACKUP_PATH"
log_debug "DB Name: $DB_NAME"
log_debug "DB Host: $DB_HOST"
log_debug "DB User: $DB_USER"
log_debug "DB Port: $DB_PORT"

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
  log_error "AWS CLI is not installed or not in PATH"
  exit 1
fi

# Check pg_dump and psql are installed
if ! command -v pg_dump &> /dev/null; then
  log_error "pg_dump is not installed or not in PATH"
  exit 1
fi

if ! command -v psql &> /dev/null; then
  log_error "psql is not installed or not in PATH"
  exit 1
fi

# Create S3 bucket if it doesn't exist
ensure_s3_bucket() {
  log_info "Checking if S3 bucket $S3_BUCKET exists..."
  
  if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
    log_info "S3 bucket $S3_BUCKET exists"
  else
    log_info "Creating S3 bucket $S3_BUCKET..."
    aws s3api create-bucket \
      --bucket "$S3_BUCKET" \
      --create-bucket-configuration LocationConstraint=$(aws configure get region) \
      --region $(aws configure get region)
    
    # Enable versioning
    aws s3api put-bucket-versioning \
      --bucket "$S3_BUCKET" \
      --versioning-configuration Status=Enabled
    
    # Enable encryption
    aws s3api put-bucket-encryption \
      --bucket "$S3_BUCKET" \
      --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'
    
    # Add lifecycle policy
    aws s3api put-bucket-lifecycle-configuration \
      --bucket "$S3_BUCKET" \
      --lifecycle-configuration '{
        "Rules": [
          {
            "ID": "expire-old-backups",
            "Status": "Enabled",
            "Prefix": "",
            "Expiration": {
              "Days": 365
            },
            "NoncurrentVersionExpiration": {
              "NoncurrentDays": 30
            }
          }
        ]
      }'
    
    log_info "S3 bucket $S3_BUCKET created successfully"
  fi
}

# Check database connection
check_db_connection() {
  log_info "Checking database connection..."
  
  if psql -c "SELECT 1" > /dev/null 2>&1; then
    log_info "Database connection successful"
  else
    log_error "Failed to connect to database"
    exit 1
  fi
}

# Backup database
backup_database() {
  local timestamp=$(date +%Y%m%d_%H%M%S)
  local backup_file="$BACKUP_PATH/${DB_NAME}_${ENVIRONMENT}_${timestamp}.dump"
  
  log_info "Creating backup of $DB_NAME database to $backup_file..."
  check_db_connection
  
  pg_dump -Fc -v -f "$backup_file"
  
  if [ $? -eq 0 ]; then
    log_info "Backup completed successfully: $backup_file"
    echo "$backup_file"
  else
    log_error "Backup failed"
    exit 1
  fi
}

# Restore database
restore_database() {
  local backup_file="$1"
  
  if [ ! -f "$backup_file" ]; then
    log_error "Backup file $backup_file not found"
    exit 1
  fi
  
  log_info "Restoring $DB_NAME database from $backup_file..."
  check_db_connection
  
  # Check if database exists
  if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    log_warning "Database $DB_NAME already exists"
    
    read -p "Do you want to drop and recreate the database? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      log_info "Dropping database $DB_NAME..."
      
      # Disconnect all users first
      psql -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$DB_NAME'
          AND pid <> pg_backend_pid();
      " postgres
      
      psql -c "DROP DATABASE $DB_NAME;" postgres
      psql -c "CREATE DATABASE $DB_NAME;" postgres
    else
      log_error "Restore cancelled"
      exit 1
    fi
  else
    log_info "Creating database $DB_NAME..."
    psql -c "CREATE DATABASE $DB_NAME;" postgres
  fi
  
  log_info "Restoring data..."
  pg_restore -v -d "$DB_NAME" "$backup_file"
  
  if [ $? -eq 0 ]; then
    log_info "Restore completed successfully"
  else
    log_warning "Restore completed with warnings (some errors may be expected)"
  fi
}

# Upload backup to S3
upload_backup() {
  local backup_file="$1"
  
  if [ ! -f "$backup_file" ]; then
    log_error "Backup file $backup_file not found"
    exit 1
  fi
  
  ensure_s3_bucket
  
  local backup_filename=$(basename "$backup_file")
  log_info "Uploading $backup_file to s3://$S3_BUCKET/$backup_filename..."
  
  aws s3 cp "$backup_file" "s3://$S3_BUCKET/$backup_filename"
  
  if [ $? -eq 0 ]; then
    log_info "Upload completed successfully"
  else
    log_error "Upload failed"
    exit 1
  fi
}

# Download backup from S3
download_backup() {
  local backup_key="$1"
  
  ensure_s3_bucket
  
  log_info "Downloading s3://$S3_BUCKET/$backup_key to $BACKUP_PATH/$backup_key..."
  
  aws s3 cp "s3://$S3_BUCKET/$backup_key" "$BACKUP_PATH/$backup_key"
  
  if [ $? -eq 0 ]; then
    log_info "Download completed successfully: $BACKUP_PATH/$backup_key"
    echo "$BACKUP_PATH/$backup_key"
  else
    log_error "Download failed"
    exit 1
  fi
}

# List backups in S3
list_backups() {
  ensure_s3_bucket
  
  log_info "Listing backups in s3://$S3_BUCKET/..."
  
  aws s3 ls "s3://$S3_BUCKET/" --human-readable
}

# Execute the requested command
case "$COMMAND" in
  backup)
    backup_file=$(backup_database)
    log_info "To upload the backup to S3, run:"
    echo "$0 -e $ENVIRONMENT upload $backup_file"
    ;;
  restore)
    if [ -z "$COMMAND_ARG" ]; then
      log_error "No backup file specified for restore"
      usage
      exit 1
    fi
    restore_database "$COMMAND_ARG"
    ;;
  upload)
    if [ -z "$COMMAND_ARG" ]; then
      log_error "No backup file specified for upload"
      usage
      exit 1
    fi
    upload_backup "$COMMAND_ARG"
    ;;
  download)
    if [ -z "$COMMAND_ARG" ]; then
      log_error "No backup key specified for download"
      usage
      exit 1
    fi
    download_backup "$COMMAND_ARG"
    ;;
  list)
    list_backups
    ;;
esac