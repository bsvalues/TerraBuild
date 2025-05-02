#!/bin/bash
# TerraFusion Secret Rotation Script
# Securely rotates credentials and API keys in the platform

set -e

# Default values
ENVIRONMENT="dev"
SECRET_TYPE="all"
SKIP_CONFIRMATION=false
BACKUP_SECRETS=true
VAULT_AUTH_METHOD="token"

# Display help information
function show_help {
  echo "TerraFusion Secret Rotation Script"
  echo
  echo "Usage: $0 [options]"
  echo
  echo "Options:"
  echo "  -h, --help                 Show this help message"
  echo "  -e, --environment ENV      Target environment (dev, staging, prod) [default: dev]"
  echo "  -t, --type TYPE            Type of secrets to rotate (db, ai, jwt, all) [default: all]"
  echo "  -m, --vault-auth METHOD    HashiCorp Vault authentication method (token, aws, k8s) [default: token]"
  echo "  -n, --no-backup            Skip backing up secrets before rotation"
  echo "  -y, --yes                  Skip all confirmations"
  echo
  echo "Examples:"
  echo "  $0 --environment prod                # Rotate all secrets in production"
  echo "  $0 --environment dev --type db       # Rotate only database credentials in dev"
  echo "  $0 -e staging -t ai -y               # Rotate AI API keys in staging without confirmation"
  echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -t|--type)
      SECRET_TYPE="$2"
      shift 2
      ;;
    -m|--vault-auth)
      VAULT_AUTH_METHOD="$2"
      shift 2
      ;;
    -n|--no-backup)
      BACKUP_SECRETS=false
      shift
      ;;
    -y|--yes)
      SKIP_CONFIRMATION=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
  echo "Error: Invalid environment. Must be one of: dev, staging, prod"
  exit 1
fi

# Validate secret type
if [[ "$SECRET_TYPE" != "all" && 
      "$SECRET_TYPE" != "db" && 
      "$SECRET_TYPE" != "ai" && 
      "$SECRET_TYPE" != "jwt" ]]; then
  echo "Error: Invalid secret type. Must be one of: all, db, ai, jwt"
  exit 1
fi

# Validate Vault auth method
if [[ "$VAULT_AUTH_METHOD" != "token" && 
      "$VAULT_AUTH_METHOD" != "aws" && 
      "$VAULT_AUTH_METHOD" != "k8s" ]]; then
  echo "Error: Invalid Vault authentication method. Must be one of: token, aws, k8s"
  exit 1
fi

# Determine the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." &>/dev/null && pwd)"

# Confirm rotation
if [ "$SKIP_CONFIRMATION" = false ]; then
  echo "=========================================================="
  echo "TerraFusion Secret Rotation"
  echo "=========================================================="
  echo "Environment: $ENVIRONMENT"
  echo "Secret type: $SECRET_TYPE"
  echo "Backup secrets: $BACKUP_SECRETS"
  echo "Vault auth method: $VAULT_AUTH_METHOD"
  echo "=========================================================="
  echo "WARNING: This operation will rotate secrets and may cause"
  echo "temporary service disruption during the transition."
  echo "=========================================================="
  
  read -p "Do you want to proceed with secret rotation? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Secret rotation cancelled."
    exit 0
  fi
  
  if [ "$ENVIRONMENT" = "prod" ]; then
    echo
    echo "⚠️  WARNING: You are rotating secrets in PRODUCTION ⚠️"
    echo
    read -p "Type 'CONFIRM' to proceed with production secret rotation: " confirmation
    if [ "$confirmation" != "CONFIRM" ]; then
      echo "Secret rotation cancelled."
      exit 0
    fi
  fi
fi

# Set AWS region based on environment
case "$ENVIRONMENT" in
  "dev"|"staging")
    AWS_REGION="us-west-2"
    ;;
  "prod")
    AWS_REGION="us-west-2"
    ;;
esac

# Ensure AWS is configured correctly
echo "Validating AWS credentials..."
aws sts get-caller-identity >/dev/null || {
  echo "Error: AWS credentials not configured or insufficient permissions."
  exit 1
}

# Check if kubectl is configured for the target cluster
echo "Validating kubectl configuration..."
if ! kubectl config use-context "terrafusion-$ENVIRONMENT" 2>/dev/null; then
  echo "Configuring kubectl for terrafusion-$ENVIRONMENT..."
  aws eks update-kubeconfig --name "terrafusion-$ENVIRONMENT" --region "$AWS_REGION"
fi

# Backup secrets if requested
if [ "$BACKUP_SECRETS" = true ]; then
  echo "Backing up secrets..."
  BACKUP_DIR="$PROJECT_ROOT/backups/secrets/$ENVIRONMENT/$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  
  if [[ "$SECRET_TYPE" == "all" || "$SECRET_TYPE" == "db" ]]; then
    echo "Backing up database credentials..."
    kubectl get secret terrafusion-db-credentials -n default -o yaml > "$BACKUP_DIR/db-credentials.yaml"
  fi
  
  if [[ "$SECRET_TYPE" == "all" || "$SECRET_TYPE" == "ai" ]]; then
    echo "Backing up AI API credentials..."
    kubectl get secret terrafusion-ai-credentials -n terrafusion-agents -o yaml > "$BACKUP_DIR/ai-credentials.yaml"
  fi
  
  if [[ "$SECRET_TYPE" == "all" || "$SECRET_TYPE" == "jwt" ]]; then
    echo "Backing up JWT credentials..."
    kubectl get secret terrafusion-jwt-secret -n default -o yaml > "$BACKUP_DIR/jwt-secret.yaml"
  fi
  
  echo "Secrets backed up to $BACKUP_DIR"
fi

# Function to rotate database credentials
rotate_db_credentials() {
  echo "Rotating database credentials..."
  
  # Generate new password
  NEW_DB_PASSWORD=$(openssl rand -base64 20 | tr -dc 'a-zA-Z0-9' | head -c 16)
  
  # Get current database credentials
  DB_SECRET=$(kubectl get secret terrafusion-db-credentials -n default -o json)
  DB_HOST=$(echo "$DB_SECRET" | jq -r '.data.host' | base64 --decode)
  DB_PORT=$(echo "$DB_SECRET" | jq -r '.data.port' | base64 --decode)
  DB_NAME=$(echo "$DB_SECRET" | jq -r '.data.dbname' | base64 --decode)
  DB_USER=$(echo "$DB_SECRET" | jq -r '.data.username' | base64 --decode)
  
  echo "Updating RDS instance password..."
  aws rds modify-db-instance \
    --db-instance-identifier "terrafusion-$ENVIRONMENT" \
    --master-user-password "$NEW_DB_PASSWORD" \
    --apply-immediately \
    --region "$AWS_REGION"
  
  echo "Waiting for database password update to complete..."
  aws rds wait db-instance-available \
    --db-instance-identifier "terrafusion-$ENVIRONMENT" \
    --region "$AWS_REGION"
  
  # Update Kubernetes secret
  NEW_DB_URL="postgresql://$DB_USER:$NEW_DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
  
  echo "Updating Kubernetes secret with new credentials..."
  kubectl create secret generic terrafusion-db-credentials \
    --namespace default \
    --from-literal=username="$DB_USER" \
    --from-literal=password="$NEW_DB_PASSWORD" \
    --from-literal=host="$DB_HOST" \
    --from-literal=port="$DB_PORT" \
    --from-literal=dbname="$DB_NAME" \
    --from-literal=url="$NEW_DB_URL" \
    --dry-run=client -o yaml | kubectl apply -f -
  
  # Update HashiCorp Vault if configured
  if command -v vault &> /dev/null; then
    echo "Updating HashiCorp Vault with new database credentials..."
    
    # Authenticate with Vault
    vault_login
    
    # Update secrets in Vault
    vault kv put "secret/terrafusion/$ENVIRONMENT/db" \
      username="$DB_USER" \
      password="$NEW_DB_PASSWORD" \
      host="$DB_HOST" \
      port="$DB_PORT" \
      dbname="$DB_NAME" \
      url="$NEW_DB_URL"
  fi
  
  echo "Database credentials rotated successfully."
}

# Function to rotate AI API keys
rotate_ai_credentials() {
  echo "Rotating AI API credentials..."
  
  # Get current AI provider
  AI_SECRET=$(kubectl get secret terrafusion-ai-credentials -n terrafusion-agents -o json)
  AI_PROVIDER=$(echo "$AI_SECRET" | jq -r '.data.provider' | base64 --decode)
  
  echo "Current AI provider: $AI_PROVIDER"
  echo "Please generate a new API key from the AI provider's website."
  
  if [ "$SKIP_CONFIRMATION" = false ]; then
    read -p "Enter new API key for $AI_PROVIDER: " NEW_API_KEY
    
    if [ -z "$NEW_API_KEY" ]; then
      echo "Error: API key cannot be empty."
      exit 1
    fi
  else
    # In automated mode, we would typically fetch this from a secure source
    # For this script, we'll just demonstrate the pattern
    echo "Automated mode: Would fetch key from secure source."
    NEW_API_KEY="dummy-api-key-for-demo-only"
  fi
  
  # Update Kubernetes secret
  echo "Updating Kubernetes secret with new API key..."
  kubectl create secret generic terrafusion-ai-credentials \
    --namespace terrafusion-agents \
    --from-literal=provider="$AI_PROVIDER" \
    --from-literal=api_key="$NEW_API_KEY" \
    --dry-run=client -o yaml | kubectl apply -f -
  
  # Update HashiCorp Vault if configured
  if command -v vault &> /dev/null; then
    echo "Updating HashiCorp Vault with new AI API key..."
    
    # Authenticate with Vault
    vault_login
    
    # Update secrets in Vault
    vault kv put "secret/terrafusion/$ENVIRONMENT/ai" \
      provider="$AI_PROVIDER" \
      api_key="$NEW_API_KEY"
  fi
  
  echo "AI API credentials rotated successfully."
}

# Function to rotate JWT secret
rotate_jwt_secret() {
  echo "Rotating JWT signing secret..."
  
  # Generate new JWT secret
  NEW_JWT_SECRET=$(openssl rand -base64 48)
  
  # Update Kubernetes secret
  echo "Updating Kubernetes secret with new JWT signing secret..."
  kubectl create secret generic terrafusion-jwt-secret \
    --namespace default \
    --from-literal=secret="$NEW_JWT_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -
  
  # Update HashiCorp Vault if configured
  if command -v vault &> /dev/null; then
    echo "Updating HashiCorp Vault with new JWT signing secret..."
    
    # Authenticate with Vault
    vault_login
    
    # Update secrets in Vault
    vault kv put "secret/terrafusion/$ENVIRONMENT/jwt" \
      secret="$NEW_JWT_SECRET"
  fi
  
  echo "JWT signing secret rotated successfully."
}

# Function to authenticate with HashiCorp Vault
vault_login() {
  if [ "$VAULT_AUTH_METHOD" = "token" ]; then
    # Token auth method (usually used in dev)
    if [ -z "$VAULT_TOKEN" ]; then
      read -p "Enter Vault token: " VAULT_TOKEN
      export VAULT_TOKEN
    fi
  elif [ "$VAULT_AUTH_METHOD" = "aws" ]; then
    # AWS auth method
    echo "Authenticating to Vault using AWS IAM..."
    VAULT_ROLE="terrafusion-$ENVIRONMENT"
    vault_output=$(vault login -method=aws role="$VAULT_ROLE")
    export VAULT_TOKEN=$(echo "$vault_output" | grep "token " | awk '{print $2}')
  elif [ "$VAULT_AUTH_METHOD" = "k8s" ]; then
    # Kubernetes auth method
    echo "Authenticating to Vault using Kubernetes service account..."
    VAULT_ROLE="terrafusion-$ENVIRONMENT"
    JWT=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
    vault_output=$(vault write auth/kubernetes/login role="$VAULT_ROLE" jwt="$JWT")
    export VAULT_TOKEN=$(echo "$vault_output" | grep "token " | awk '{print $2}')
  fi
}

# Perform secret rotation based on selected type
if [[ "$SECRET_TYPE" == "all" || "$SECRET_TYPE" == "db" ]]; then
  rotate_db_credentials
fi

if [[ "$SECRET_TYPE" == "all" || "$SECRET_TYPE" == "ai" ]]; then
  rotate_ai_credentials
fi

if [[ "$SECRET_TYPE" == "all" || "$SECRET_TYPE" == "jwt" ]]; then
  rotate_jwt_secret
fi

# Restart affected deployments to pick up new secrets
echo "Restarting affected deployments to pick up new secrets..."

if [[ "$SECRET_TYPE" == "all" || "$SECRET_TYPE" == "db" || "$SECRET_TYPE" == "jwt" ]]; then
  echo "Restarting backend deployment..."
  kubectl rollout restart deployment/terrafusion-backend -n default
  kubectl rollout status deployment/terrafusion-backend -n default --timeout=120s
fi

if [[ "$SECRET_TYPE" == "all" || "$SECRET_TYPE" == "ai" ]]; then
  echo "Restarting agent deployments..."
  kubectl rollout restart deployment -l role=agent -n terrafusion-agents
  kubectl rollout status deployment -l role=agent -n terrafusion-agents --timeout=120s
fi

echo "Secret rotation completed successfully!"
echo "Verifying system health..."

# Verify system health
kubectl get pods -A | grep terrafusion
kubectl get pods -n terrafusion-agents -o wide

echo "Secret rotation process complete. Monitor logs for any issues."