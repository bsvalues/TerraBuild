#!/bin/bash

# TerraBuild Backup and Disaster Recovery Script
# This script handles database backups, restoration, and general disaster recovery procedures

set -e

# Default values
ENVIRONMENT="dev"
ACTION="backup"
BACKUP_DIR="./backups"
BACKUP_RETENTION_DAYS=30
APP_NAME="terrabuild"
AWS_REGION="us-west-2"
AWS_PROFILE=""

# Help message
function show_help {
  echo "TerraBuild Backup and Disaster Recovery Script"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --env <environment>        Environment (dev or prod, default: dev)"
  echo "  --action <action>          Action to perform (backup, restore, test-restore)"
  echo "  --backup-file <file>       Backup file to restore (required for restore)"
  echo "  --profile <profile>        AWS CLI profile to use"
  echo "  --region <region>          AWS region (default: us-west-2)"
  echo "  --retention <days>         Backup retention in days (default: 30)"
  echo "  --help                     Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --env prod --action backup"
  echo "  $0 --env prod --action restore --backup-file backups/db-backup-20250101-120000.sql"
  echo "  $0 --env dev --action test-restore --backup-file backups/db-backup-20250101-120000.sql"
  exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --action)
      ACTION="$2"
      shift 2
      ;;
    --backup-file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --profile)
      AWS_PROFILE="$2"
      shift 2
      ;;
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --retention)
      BACKUP_RETENTION_DAYS="$2"
      shift 2
      ;;
    --help)
      show_help
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
  echo "Error: Environment must be 'dev' or 'prod'"
  exit 1
fi

# Configure AWS CLI with profile if provided
if [[ -n "$AWS_PROFILE" ]]; then
  AWS_ARGS="--profile $AWS_PROFILE"
else
  AWS_ARGS=""
fi

# Set up the timestamp for backup files
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE_NAME="db-backup-$ENVIRONMENT-$TIMESTAMP.sql"
S3_BUCKET="$APP_NAME-$ENVIRONMENT-backups"

# Make sure backup directory exists
mkdir -p "$BACKUP_DIR"

# Get database credentials from parameter store
get_db_credentials() {
  DB_USER=$(aws $AWS_ARGS ssm get-parameter --name "/$APP_NAME/$ENVIRONMENT/db/username" --with-decryption --query "Parameter.Value" --output text --region "$AWS_REGION")
  DB_PASSWORD=$(aws $AWS_ARGS ssm get-parameter --name "/$APP_NAME/$ENVIRONMENT/db/password" --with-decryption --query "Parameter.Value" --output text --region "$AWS_REGION")
  DB_HOST=$(aws $AWS_ARGS ssm get-parameter --name "/$APP_NAME/$ENVIRONMENT/db/host" --query "Parameter.Value" --output text --region "$AWS_REGION")
  DB_PORT=$(aws $AWS_ARGS ssm get-parameter --name "/$APP_NAME/$ENVIRONMENT/db/port" --query "Parameter.Value" --output text --region "$AWS_REGION")
  DB_NAME=$(aws $AWS_ARGS ssm get-parameter --name "/$APP_NAME/$ENVIRONMENT/db/name" --query "Parameter.Value" --output text --region "$AWS_REGION")
}

# Create a database backup
perform_backup() {
  echo "===== Backing up $ENVIRONMENT database ====="
  echo "Creating backup: $BACKUP_DIR/$BACKUP_FILE_NAME"
  
  # Export the database directly to a file
  PGPASSWORD="$DB_PASSWORD" pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=custom \
    --file="$BACKUP_DIR/$BACKUP_FILE_NAME" \
    --verbose
  
  if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_DIR/$BACKUP_FILE_NAME"
    
    # Compress the backup
    echo "Compressing backup..."
    gzip "$BACKUP_DIR/$BACKUP_FILE_NAME"
    BACKUP_FILE_NAME="$BACKUP_FILE_NAME.gz"
    
    # Upload to S3
    echo "Uploading backup to S3..."
    aws $AWS_ARGS s3 cp "$BACKUP_DIR/$BACKUP_FILE_NAME" "s3://$S3_BUCKET/$BACKUP_FILE_NAME" --region "$AWS_REGION"
    
    # Create a latest pointer
    echo "Updating latest backup pointer..."
    aws $AWS_ARGS s3 cp "s3://$S3_BUCKET/$BACKUP_FILE_NAME" "s3://$S3_BUCKET/latest.gz" --region "$AWS_REGION"
    
    echo "Cleaning up old backups (older than $BACKUP_RETENTION_DAYS days)..."
    find "$BACKUP_DIR" -name "db-backup-$ENVIRONMENT-*.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
    
    # Clean up old backups from S3
    OLD_BACKUPS=$(aws $AWS_ARGS s3api list-objects --bucket "$S3_BUCKET" --prefix "db-backup-$ENVIRONMENT-" --query "Contents[?LastModified<='$(date -d "$BACKUP_RETENTION_DAYS days ago" --iso-8601=seconds)'].[Key]" --output text --region "$AWS_REGION")
    if [ -n "$OLD_BACKUPS" ]; then
      echo "Cleaning up old backups from S3..."
      for file in $OLD_BACKUPS; do
        aws $AWS_ARGS s3 rm "s3://$S3_BUCKET/$file" --region "$AWS_REGION"
      done
    fi
    
    echo "Backup completed successfully"
  else
    echo "Error: Backup failed"
    exit 1
  fi
}

# Restore from a backup
perform_restore() {
  if [ -z "$BACKUP_FILE" ]; then
    echo "Error: --backup-file parameter is required for restore operation"
    exit 1
  fi
  
  # If the backup file is in S3, download it first
  if [[ "$BACKUP_FILE" == s3://* ]]; then
    echo "Downloading backup from S3..."
    S3_PATH="$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_DIR/$(basename "$S3_PATH")"
    aws $AWS_ARGS s3 cp "$S3_PATH" "$BACKUP_FILE" --region "$AWS_REGION"
  fi
  
  if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
  fi
  
  echo "===== Restoring $ENVIRONMENT database from $BACKUP_FILE ====="
  
  # Unzip if necessary
  TEMP_BACKUP_FILE="$BACKUP_FILE"
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
    TEMP_BACKUP_FILE="${BACKUP_FILE%.gz}"
  fi
  
  # Confirm before restoring production
  if [[ "$ENVIRONMENT" == "prod" && "$ACTION" == "restore" ]]; then
    read -p "WARNING: You are about to restore the PRODUCTION database. Are you sure? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Restoration cancelled"
      exit 0
    fi
  fi
  
  # Perform the restoration
  echo "Restoring database from backup..."
  PGPASSWORD="$DB_PASSWORD" pg_restore \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=custom \
    --clean \
    --if-exists \
    --verbose \
    "$TEMP_BACKUP_FILE"
  
  RESTORE_EXIT_CODE=$?
  
  # If we created a temporary uncompressed file, clean it up
  if [[ "$TEMP_BACKUP_FILE" != "$BACKUP_FILE" ]]; then
    echo "Cleaning up temporary files..."
    rm "$TEMP_BACKUP_FILE"
  fi
  
  if [ $RESTORE_EXIT_CODE -eq 0 ]; then
    echo "Restoration completed successfully"
  else
    echo "Warning: Restoration completed with warnings or errors (code $RESTORE_EXIT_CODE)"
    echo "Please check the database for consistency"
  fi
}

# Test a backup by restoring to a temporary database
test_restore() {
  if [ -z "$BACKUP_FILE" ]; then
    echo "Error: --backup-file parameter is required for test-restore operation"
    exit 1
  fi
  
  # If the backup file is in S3, download it first
  if [[ "$BACKUP_FILE" == s3://* ]]; then
    echo "Downloading backup from S3..."
    S3_PATH="$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_DIR/$(basename "$S3_PATH")"
    aws $AWS_ARGS s3 cp "$S3_PATH" "$BACKUP_FILE" --region "$AWS_REGION"
  fi
  
  if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
  fi
  
  echo "===== Testing backup restoration from $BACKUP_FILE ====="
  
  # Unzip if necessary
  TEMP_BACKUP_FILE="$BACKUP_FILE"
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
    TEMP_BACKUP_FILE="${BACKUP_FILE%.gz}"
  fi
  
  # Create a temporary database for testing
  TEST_DB_NAME="${DB_NAME}_test_${TIMESTAMP}"
  echo "Creating temporary database: $TEST_DB_NAME"
  
  PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="postgres" \
    -c "CREATE DATABASE $TEST_DB_NAME WITH TEMPLATE template0 OWNER $DB_USER;"
  
  # Test restore to the temporary database
  echo "Restoring backup to test database..."
  PGPASSWORD="$DB_PASSWORD" pg_restore \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$TEST_DB_NAME" \
    --format=custom \
    --verbose \
    "$TEMP_BACKUP_FILE"
  
  TEST_RESTORE_EXIT_CODE=$?
  
  # Run some validation queries
  echo "Validating restored database..."
  PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$TEST_DB_NAME" \
    -c "SELECT COUNT(*) as user_count FROM users;" \
    -c "SELECT COUNT(*) as property_count FROM properties;" \
    -c "SELECT COUNT(*) as cost_matrix_count FROM cost_matrix;" \
    -c "SELECT version();"
  
  # Drop the test database
  echo "Dropping test database..."
  PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="postgres" \
    -c "DROP DATABASE $TEST_DB_NAME;"
  
  # If we created a temporary uncompressed file, clean it up
  if [[ "$TEMP_BACKUP_FILE" != "$BACKUP_FILE" ]]; then
    echo "Cleaning up temporary files..."
    rm "$TEMP_BACKUP_FILE"
  fi
  
  if [ $TEST_RESTORE_EXIT_CODE -eq 0 ]; then
    echo "Test restoration completed successfully"
  else
    echo "Warning: Test restoration completed with warnings or errors (code $TEST_RESTORE_EXIT_CODE)"
  fi
}

# Main script execution
echo "=========================================="
echo "TerraBuild Database Management - $ENVIRONMENT Environment"
echo "=========================================="
echo "Action: $ACTION"
echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
if [ "$ACTION" == "restore" ] || [ "$ACTION" == "test-restore" ]; then
  echo "Backup File: $BACKUP_FILE"
fi
echo "=========================================="

# Ensure S3 bucket exists for backups
echo "Checking if S3 bucket exists..."
if ! aws $AWS_ARGS s3api head-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null; then
  echo "Creating S3 bucket for backups: $S3_BUCKET"
  aws $AWS_ARGS s3api create-bucket \
    --bucket "$S3_BUCKET" \
    --region "$AWS_REGION" \
    --create-bucket-configuration LocationConstraint="$AWS_REGION"
  
  # Enable versioning for additional safety
  aws $AWS_ARGS s3api put-bucket-versioning \
    --bucket "$S3_BUCKET" \
    --versioning-configuration Status=Enabled \
    --region "$AWS_REGION"
  
  # Set lifecycle policy for backup cleanup
  aws $AWS_ARGS s3api put-bucket-lifecycle-configuration \
    --bucket "$S3_BUCKET" \
    --lifecycle-configuration '{
      "Rules": [
        {
          "ID": "ExpireOldBackups",
          "Status": "Enabled",
          "Prefix": "db-backup-",
          "Expiration": {
            "Days": '"$BACKUP_RETENTION_DAYS"'
          }
        }
      ]
    }' \
    --region "$AWS_REGION"
  
  # Set bucket encryption
  aws $AWS_ARGS s3api put-bucket-encryption \
    --bucket "$S3_BUCKET" \
    --server-side-encryption-configuration '{
      "Rules": [
        {
          "ApplyServerSideEncryptionByDefault": {
            "SSEAlgorithm": "AES256"
          }
        }
      ]
    }' \
    --region "$AWS_REGION"
fi

# Get database credentials
echo "Retrieving database credentials..."
get_db_credentials

# Execute the requested action
case "$ACTION" in
  backup)
    perform_backup
    ;;
  restore)
    perform_restore
    ;;
  test-restore)
    test_restore
    ;;
  *)
    echo "Error: Unknown action '$ACTION'"
    echo "Valid actions are: backup, restore, test-restore"
    exit 1
    ;;
esac

echo "=========================================="
echo "Operation completed"
echo "=========================================="