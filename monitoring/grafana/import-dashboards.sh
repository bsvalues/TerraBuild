#!/bin/bash

# Grafana Dashboard Import Script
# This script imports dashboards into Grafana via its API

set -e

# Default values
GRAFANA_URL=${GRAFANA_URL:-http://localhost:3000}
GRAFANA_USER=${GRAFANA_USER:-admin}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-admin}
DASHBOARD_DIR=${DASHBOARD_DIR:-$(dirname "$0")/provisioning/dashboards}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Grafana Dashboard Import Tool${NC}"
echo "This script will import dashboards from $DASHBOARD_DIR into Grafana at $GRAFANA_URL"
echo ""

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not found${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. Response parsing may be limited.${NC}"
    HAS_JQ=false
else
    HAS_JQ=true
fi

# Check if the dashboard directory exists
if [ ! -d "$DASHBOARD_DIR" ]; then
    echo -e "${RED}Error: Dashboard directory not found: $DASHBOARD_DIR${NC}"
    exit 1
fi

# Get list of JSON files in dashboard directory
JSON_FILES=$(find "$DASHBOARD_DIR" -name "*.json")
if [ -z "$JSON_FILES" ]; then
    echo -e "${RED}Error: No dashboard JSON files found in $DASHBOARD_DIR${NC}"
    exit 1
fi

# Import each dashboard
echo "Found $(echo "$JSON_FILES" | wc -l | xargs) dashboards to import"
echo ""

for file in $JSON_FILES; do
    filename=$(basename "$file")
    echo -e "${YELLOW}Importing dashboard: $filename${NC}"
    
    # Prepare the import payload
    # We need to wrap the dashboard JSON in a request object with metadata
    if [ "$HAS_JQ" = true ]; then
        # Use jq for proper JSON manipulation
        DASHBOARD_JSON=$(jq '. | {dashboard: ., overwrite: true, inputs: []}' "$file")
    else
        # Fallback method without jq
        # This is a simplistic approach - a proper solution would use a JSON parser
        DASHBOARD_JSON=$(cat "$file")
        DASHBOARD_JSON="{\"dashboard\": $DASHBOARD_JSON, \"overwrite\": true, \"inputs\": []}"
    fi
    
    # Import the dashboard via API
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
        -d "$DASHBOARD_JSON" \
        "$GRAFANA_URL/api/dashboards/db")
    
    # Check result
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✓ Successfully imported dashboard: $filename${NC}"
    else
        echo -e "${RED}✗ Failed to import dashboard: $filename (HTTP $HTTP_STATUS)${NC}"
        # Try to show detailed error
        curl -s \
            -X POST \
            -H "Content-Type: application/json" \
            -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
            -d "$DASHBOARD_JSON" \
            "$GRAFANA_URL/api/dashboards/db"
        echo ""
    fi
done

echo ""
echo -e "${GREEN}Dashboard import completed!${NC}"
echo "You can now access your dashboards at $GRAFANA_URL"