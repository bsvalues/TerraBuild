#!/bin/bash
# TerraFusion Database Backup and Restore Script

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/tmp/terrafusion/backups}"
S3_BUCKET="${S3_BUCKET:-terrafusion-backups}"
DATABASE_NAME="${DATABASE_NAME:-terrafusion}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/${DATABASE_NAME}_${ENVIRONMENT}_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Function to display help
function show_help {
  echo "TerraFusion Database Backup and Restore Tool"
  echo ""
  echo "Usage: $0 [OPTIONS] COMMAND"
  echo ""
  echo "Commands:"
  echo "  backup              Create a database backup"
  echo "  restore BACKUP_FILE Restore database from a backup file"
  echo "  list                List available backups"
  echo "  upload              Upload backups to S3"
  echo "  download FILE       Download a backup from S3"
  echo "  clean               Remove old backups (older than BACKUP_RETENTION_DAYS)"
  echo ""
  echo "Options:"
  echo "  -h, --help          Show this help message"
  echo "  -e, --environment   Set environment (dev, staging, prod)"
  echo "  -b, --bucket        Set S3 bucket name"
  echo "  -d, --database      Set database name"
  echo "  -r, --retention     Set backup retention days"
  echo ""
  echo "Environment Variables:"
  echo "  PGHOST              PostgreSQL host"
  echo "  PGPORT              PostgreSQL port"
  echo "  PGDATABASE          PostgreSQL database"
  echo "  PGUSER              PostgreSQL user"
  echo "  PGPASSWORD          PostgreSQL password"
  echo "  DATABASE_URL        PostgreSQL connection URL (alternative to individual vars)"
  echo "  BACKUP_DIR          Directory for backups"
  echo "  S3_BUCKET           S3 bucket name"
  echo "  ENVIRONMENT         Environment name (dev, staging, prod)"
  echo "  BACKUP_RETENTION_DAYS  Number of days to keep backups"
  echo ""
  echo "Examples:"
  echo "  $0 backup                             # Create a backup"
  echo "  $0 -e prod backup                     # Create a production backup"
  echo "  $0 restore backups/file.sql.gz        # Restore from file"
  echo "  $0 upload                             # Upload backups to S3"
  echo "  $0 download terrafusion_prod_2023.sql.gz  # Download backup from S3"
  echo "  $0 list                               # List local backups"
  echo "  $0 clean                              # Clean old backups"
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

# Function to create a backup
function create_backup {
  echo "Creating backup of ${DATABASE_NAME} (${ENVIRONMENT})..."
  check_db_connection
  
  # Export schema and data
  PGPASSWORD="${PGPASSWORD}" pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" \
    --format=custom --compress=9 --file="${BACKUP_FILE}"
  
  if [[ $? -eq 0 && -f "${BACKUP_FILE}" ]]; then
    echo "Backup created successfully: ${BACKUP_FILE}"
    echo "Backup size: $(du -h "${BACKUP_FILE}" | cut -f1)"
  else
    echo "Error: Backup failed."
    exit 1
  fi
}

# Function to restore from backup
function restore_from_backup {
  local backup_file="$1"
  
  if [[ ! -f "${backup_file}" ]]; then
    echo "Error: Backup file ${backup_file} not found."
    exit 1
  fi
  
  echo "WARNING: This will overwrite the current database!"
  echo "Database: ${DATABASE_NAME} (${ENVIRONMENT})"
  echo "Backup file: ${backup_file}"
  read -p "Are you sure you want to continue? [y/N] " confirm
  
  if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
    echo "Restore cancelled."
    exit 0
  fi
  
  echo "Restoring from backup..."
  check_db_connection
  
  # Drop connections to the database
  PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "postgres" \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${PGDATABASE}' AND pid <> pg_backend_pid();"
  
  # Drop and recreate the database
  PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "postgres" \
    -c "DROP DATABASE IF EXISTS ${PGDATABASE};"
  PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "postgres" \
    -c "CREATE DATABASE ${PGDATABASE} OWNER ${PGUSER};"
  
  # Restore from the backup
  PGPASSWORD="${PGPASSWORD}" pg_restore -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" \
    --no-owner --no-privileges "${backup_file}"
  
  if [[ $? -eq 0 ]]; then
    echo "Database restored successfully from ${backup_file}."
  else
    echo "Warning: Restore completed with some errors."
    exit 1
  fi
}

# Function to list backups
function list_backups {
  echo "Available backups for ${DATABASE_NAME} (${ENVIRONMENT}):"
  
  if [[ ! -d "${BACKUP_DIR}" ]]; then
    echo "No backups found. Backup directory does not exist."
    return
  fi
  
  local count=0
  
  for file in $(find "${BACKUP_DIR}" -name "${DATABASE_NAME}_${ENVIRONMENT}_*.sql.gz" -type f | sort -r); do
    echo "$(basename "${file}") ($(du -h "${file}" | cut -f1)) - $(date -r "${file}" "+%Y-%m-%d %H:%M:%S")"
    ((count++))
  done
  
  if [[ ${count} -eq 0 ]]; then
    echo "No backups found."
  else
    echo "${count} backup(s) found."
  fi
}

# Function to upload backups to S3
function upload_to_s3 {
  if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Cannot upload to S3."
    exit 1
  fi
  
  if [[ ! -d "${BACKUP_DIR}" ]]; then
    echo "No backups found. Backup directory does not exist."
    return
  fi
  
  echo "Uploading backups to S3 bucket: ${S3_BUCKET}/${ENVIRONMENT}/"
  
  for file in $(find "${BACKUP_DIR}" -name "${DATABASE_NAME}_${ENVIRONMENT}_*.sql.gz" -type f); do
    echo "Uploading $(basename "${file}")..."
    aws s3 cp "${file}" "s3://${S3_BUCKET}/${ENVIRONMENT}/$(basename "${file}")"
    
    if [[ $? -eq 0 ]]; then
      echo "Successfully uploaded $(basename "${file}")."
    else
      echo "Error uploading $(basename "${file}")."
    fi
  done
}

# Function to download a backup from S3
function download_from_s3 {
  local file="$1"
  
  if [[ -z "${file}" ]]; then
    echo "Error: No file specified for download."
    exit 1
  fi
  
  if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Cannot download from S3."
    exit 1
  fi
  
  mkdir -p "${BACKUP_DIR}"
  
  echo "Downloading ${file} from S3 bucket: ${S3_BUCKET}/${ENVIRONMENT}/"
  aws s3 cp "s3://${S3_BUCKET}/${ENVIRONMENT}/${file}" "${BACKUP_DIR}/${file}"
  
  if [[ $? -eq 0 ]]; then
    echo "Successfully downloaded ${file} to ${BACKUP_DIR}/${file}."
  else
    echo "Error downloading ${file}."
    exit 1
  fi
}

# Function to clean old backups
function clean_old_backups {
  if [[ ! -d "${BACKUP_DIR}" ]]; then
    echo "No backups found. Backup directory does not exist."
    return
  fi
  
  echo "Cleaning backups older than ${BACKUP_RETENTION_DAYS} days for ${DATABASE_NAME} (${ENVIRONMENT})..."
  
  local count=$(find "${BACKUP_DIR}" -name "${DATABASE_NAME}_${ENVIRONMENT}_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} | wc -l)
  
  if [[ ${count} -eq 0 ]]; then
    echo "No old backups to clean."
    return
  fi
  
  find "${BACKUP_DIR}" -name "${DATABASE_NAME}_${ENVIRONMENT}_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete
  echo "Cleaned ${count} old backup(s)."
}

# Parse command line arguments
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
    -b|--bucket)
      S3_BUCKET="$2"
      shift 2
      ;;
    -d|--database)
      DATABASE_NAME="$2"
      shift 2
      ;;
    -r|--retention)
      BACKUP_RETENTION_DAYS="$2"
      shift 2
      ;;
    backup)
      ACTION="backup"
      shift
      ;;
    restore)
      ACTION="restore"
      RESTORE_FILE="$2"
      shift 2
      ;;
    list)
      ACTION="list"
      shift
      ;;
    upload)
      ACTION="upload"
      shift
      ;;
    download)
      ACTION="download"
      DOWNLOAD_FILE="$2"
      shift 2
      ;;
    clean)
      ACTION="clean"
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
case "${ACTION}" in
  backup)
    create_backup
    ;;
  restore)
    if [[ -z "${RESTORE_FILE}" ]]; then
      echo "Error: No backup file specified for restore."
      exit 1
    fi
    restore_from_backup "${RESTORE_FILE}"
    ;;
  list)
    list_backups
    ;;
  upload)
    upload_to_s3
    ;;
  download)
    if [[ -z "${DOWNLOAD_FILE}" ]]; then
      echo "Error: No file specified for download."
      exit 1
    fi
    download_from_s3 "${DOWNLOAD_FILE}"
    ;;
  clean)
    clean_old_backups
    ;;
  *)
    echo "Error: No action specified."
    show_help
    exit 1
    ;;
esac

exit 0