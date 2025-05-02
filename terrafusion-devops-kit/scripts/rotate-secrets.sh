#!/bin/bash
# TerraFusion Secret Rotation Script
# Securely rotates API keys and credentials in Vault, then triggers rolling updates

set -euo pipefail

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
SECRET_TYPE=""
SECRET_NAME=""
SKIP_ROLLOUT=false
SKIP_CONFIRMATION=false
VALUE_PROVIDED=false
NEW_VALUE=""

# Function to display usage information
function show_usage() {
  echo -e "${BLUE}TerraFusion Secret Rotation Script${NC}"
  echo -e "Safely rotate secrets and credentials in Vault"
  echo ""
  echo -e "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment ENV     Target environment: dev, staging, prod (default: dev)"
  echo "  -t, --type TYPE           Type of secret to rotate:"
  echo "                            ai-key, db-password, jwt, agent-key, oauth"
  echo "  -n, --name NAME           Name of the specific secret to rotate"
  echo "                            For ai-key: openai, anthropic, etc."
  echo "                            For agent-key: factor-tuner, benchmark-guard, etc."
  echo "  -v, --value VALUE         New value to set (omit to auto-generate)"
  echo "  --skip-rollout            Skip rolling out the update to affected services"
  echo "  -y, --yes                 Skip confirmation prompt"
  echo "  -h, --help                Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --type ai-key --name openai"
  echo "  $0 --type db-password --name terrafusion --value \"newpassword\""
  echo "  $0 --type agent-key --name factor-tuner"
}

# Function to generate secure passwords or keys
function generate_secure_value() {
  local type=$1
  
  case $type in
    db-password)
      # Generate a 24 character password with special chars
      openssl rand -base64 18 | tr -d "=/+"
      ;;
    jwt)
      # Generate a 64 character key
      openssl rand -hex 32
      ;;
    agent-key)
      # Generate a 48 character key
      openssl rand -base64 36 | tr -d "=/+"
      ;;
    oauth)
      # Generate a 32 character client secret
      openssl rand -hex 16
      ;;
    *)
      echo ""
      ;;
  esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -t|--type)
      SECRET_TYPE="$2"
      shift
      shift
      ;;
    -n|--name)
      SECRET_NAME="$2"
      shift
      shift
      ;;
    -v|--value)
      NEW_VALUE="$2"
      VALUE_PROVIDED=true
      shift
      shift
      ;;
    --skip-rollout)
      SKIP_ROLLOUT=true
      shift
      ;;
    -y|--yes)
      SKIP_CONFIRMATION=true
      shift
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option $key${NC}"
      show_usage
      exit 1
      ;;
  esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  echo -e "${RED}Error: Environment must be one of: dev, staging, prod${NC}"
  exit 1
fi

# Validate secret type
if [[ ! "$SECRET_TYPE" =~ ^(ai-key|db-password|jwt|agent-key|oauth)$ ]]; then
  echo -e "${RED}Error: Secret type must be one of: ai-key, db-password, jwt, agent-key, oauth${NC}"
  exit 1
fi

# Validate secret name is provided
if [ -z "$SECRET_NAME" ]; then
  echo -e "${RED}Error: Secret name must be provided with --name${NC}"
  exit 1
fi

# Set Vault path based on secret type and name
case $SECRET_TYPE in
  ai-key)
    VAULT_PATH="secret/terrafusion/ai-providers/${SECRET_NAME}"
    AFFECTED_SERVICES=("backend" "agent-pods")
    ;;
  db-password)
    VAULT_PATH="secret/terrafusion/databases/${SECRET_NAME}"
    AFFECTED_SERVICES=("backend")
    ;;
  jwt)
    VAULT_PATH="secret/terrafusion/auth/jwt"
    AFFECTED_SERVICES=("backend")
    ;;
  agent-key)
    VAULT_PATH="secret/terrafusion/agents/${SECRET_NAME}/api-key"
    AFFECTED_SERVICES=("${SECRET_NAME}-agent")
    ;;
  oauth)
    VAULT_PATH="secret/terrafusion/auth/oauth-clients/${SECRET_NAME}"
    AFFECTED_SERVICES=("backend")
    ;;
esac

# Generate a new value if not provided
if [ "$VALUE_PROVIDED" = false ]; then
  NEW_VALUE=$(generate_secure_value "$SECRET_TYPE")
  
  # If still empty (like for ai-key which can't be auto-generated)
  if [ -z "$NEW_VALUE" ]; then
    echo -e "${RED}Error: For ${SECRET_TYPE}, you must provide a value with --value${NC}"
    exit 1
  fi
fi

# Display rotation plan
echo -e "${BLUE}=== TerraFusion Secret Rotation Plan ===${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Secret Type: ${GREEN}$SECRET_TYPE${NC}"
echo -e "Secret Name: ${GREEN}$SECRET_NAME${NC}"
echo -e "Vault Path: ${GREEN}$VAULT_PATH${NC}"
echo -e "Value Source: ${GREEN}$([ "$VALUE_PROVIDED" = true ] && echo "User provided" || echo "Auto-generated")${NC}"
echo -e "Affected Services: ${GREEN}${AFFECTED_SERVICES[*]}${NC}"
echo -e "Rolling Restart: ${GREEN}$([ "$SKIP_ROLLOUT" = true ] && echo "Skipped" || echo "Yes")${NC}"

# Ask for confirmation unless skipped
if [ "$SKIP_CONFIRMATION" = false ]; then
  echo ""
  read -p "Continue with secret rotation? (y/n): " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Rotation aborted by user${NC}"
    exit 0
  fi
fi

# Set AWS region based on environment
case $ENVIRONMENT in
  dev)
    AWS_REGION=${AWS_REGION:-us-west-2}
    ;;
  staging)
    AWS_REGION=${AWS_REGION:-us-west-2}
    ;;
  prod)
    AWS_REGION=${AWS_REGION:-us-west-2}
    ;;
esac

# Configure kubectl for the right cluster
echo -e "${YELLOW}Configuring kubectl for EKS cluster...${NC}"
aws eks update-kubeconfig --name terrafusion-${ENVIRONMENT} --region ${AWS_REGION}

# Ensure Vault port-forward is active
echo -e "${YELLOW}Setting up port-forward to Vault...${NC}"
VAULT_POD=$(kubectl get pods -n vault -l app.kubernetes.io/name=vault -o jsonpath='{.items[0].metadata.name}')
kubectl port-forward -n vault $VAULT_POD 8200:8200 &
PORT_FORWARD_PID=$!

# Ensure port-forward is cleaned up on exit
function cleanup {
  echo -e "${YELLOW}Cleaning up port-forward...${NC}"
  kill $PORT_FORWARD_PID || true
}
trap cleanup EXIT

# Wait for port-forward to be ready
sleep 3

# Login to Vault using Kubernetes auth
echo -e "${YELLOW}Logging in to Vault...${NC}"
VAULT_ADDR="http://localhost:8200"
KUBE_TOKEN=$(kubectl create token vault-auth -n vault)
VAULT_TOKEN=$(curl -s --request POST --data "{\"jwt\": \"${KUBE_TOKEN}\", \"role\": \"admin\"}" ${VAULT_ADDR}/v1/auth/kubernetes/login | jq -r '.auth.client_token')

if [ -z "$VAULT_TOKEN" ] || [ "$VAULT_TOKEN" = "null" ]; then
  echo -e "${RED}Error: Failed to authenticate with Vault${NC}"
  exit 1
fi

# Update the secret in Vault
echo -e "${YELLOW}Updating secret in Vault...${NC}"

# Format differs based on secret type
case $SECRET_TYPE in
  ai-key)
    JSON_DATA="{\"key\": \"${NEW_VALUE}\", \"last_rotated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"
    ;;
  db-password)
    JSON_DATA="{\"password\": \"${NEW_VALUE}\", \"last_rotated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"
    ;;
  jwt)
    JSON_DATA="{\"secret\": \"${NEW_VALUE}\", \"last_rotated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"
    ;;
  agent-key)
    JSON_DATA="{\"key\": \"${NEW_VALUE}\", \"last_rotated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"
    ;;
  oauth)
    JSON_DATA="{\"client_secret\": \"${NEW_VALUE}\", \"last_rotated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}"
    ;;
esac

# Update the secret
curl -s \
  --header "X-Vault-Token: ${VAULT_TOKEN}" \
  --request POST \
  --data "{\"data\": ${JSON_DATA}}" \
  ${VAULT_ADDR}/v1/${VAULT_PATH}

echo -e "${GREEN}✓ Secret updated in Vault${NC}"

# Handle database password change if needed
if [ "$SECRET_TYPE" = "db-password" ]; then
  echo -e "${YELLOW}Updating database password...${NC}"
  
  # Get database connection info from Vault
  DB_INFO=$(curl -s \
    --header "X-Vault-Token: ${VAULT_TOKEN}" \
    --request GET \
    ${VAULT_ADDR}/v1/secret/terrafusion/databases/${SECRET_NAME})
  
  DB_HOST=$(echo $DB_INFO | jq -r '.data.data.host')
  DB_PORT=$(echo $DB_INFO | jq -r '.data.data.port')
  DB_USER=$(echo $DB_INFO | jq -r '.data.data.username')
  
  # Connect to database and update password
  PGPASSWORD=$(echo $DB_INFO | jq -r '.data.data.password') psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "ALTER USER \"$DB_USER\" WITH PASSWORD '$NEW_VALUE';"
  
  echo -e "${GREEN}✓ Database password updated${NC}"
fi

# Rolling restart of affected services if not skipped
if [ "$SKIP_ROLLOUT" = false ]; then
  echo -e "${YELLOW}Performing rolling restart of affected services...${NC}"
  
  for service in "${AFFECTED_SERVICES[@]}"; do
    case $service in
      backend)
        echo -e "${YELLOW}Restarting backend service...${NC}"
        kubectl rollout restart deployment/terrafusion-backend -n default
        kubectl rollout status deployment/terrafusion-backend -n default --timeout=300s
        ;;
      agent-pods)
        echo -e "${YELLOW}Restarting all agent pods...${NC}"
        kubectl rollout restart deployment -n terrafusion-agents
        kubectl rollout status deployment -n terrafusion-agents --timeout=300s
        ;;
      *-agent)
        agent=${service%-agent}
        echo -e "${YELLOW}Restarting ${agent} agent...${NC}"
        if kubectl get deployment ${agent} -n terrafusion-agents &>/dev/null; then
          kubectl rollout restart deployment/${agent} -n terrafusion-agents
          kubectl rollout status deployment/${agent} -n terrafusion-agents --timeout=300s
        else
          echo -e "${YELLOW}Warning: Agent deployment ${agent} not found${NC}"
        fi
        ;;
    esac
  done
  
  echo -e "${GREEN}✓ Services restarted successfully${NC}"
else
  echo -e "${YELLOW}Skipping service restart as requested${NC}"
  echo -e "${YELLOW}Note: Services will need to be restarted manually to pick up the new secret${NC}"
fi

echo -e "\n${GREEN}✓ Secret rotation completed successfully!${NC}"

# If this was an AI key, suggest testing
if [ "$SECRET_TYPE" = "ai-key" ]; then
  echo -e "\n${BLUE}=== Next Steps ===${NC}"
  echo -e "To verify the new AI key works correctly, run:"
  echo -e "kubectl exec -it deploy/terrafusion-backend -n default -- node ./scripts/test-ai-key.js --provider ${SECRET_NAME}"
fi