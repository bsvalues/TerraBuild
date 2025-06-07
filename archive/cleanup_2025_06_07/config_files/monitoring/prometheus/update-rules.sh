#!/bin/bash

# Prometheus Alert Rules Update Script
# This script loads Prometheus alert rules from YAML files and updates the configuration

set -e

# Default values
PROMETHEUS_URL=${PROMETHEUS_URL:-http://localhost:9090}
RULES_DIR=${RULES_DIR:-$(dirname "$0")/rules}
PROMETHEUS_CONFIG=${PROMETHEUS_CONFIG:-/etc/prometheus/prometheus.yml}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Prometheus Alert Rules Update Tool${NC}"
echo "This script will update alert rules from $RULES_DIR"
echo ""

# Check if the rules directory exists
if [ ! -d "$RULES_DIR" ]; then
    echo -e "${RED}Error: Rules directory not found: $RULES_DIR${NC}"
    exit 1
fi

# Get list of YAML files in rules directory
RULE_FILES=$(find "$RULES_DIR" -name "*.yml" -o -name "*.yaml")
if [ -z "$RULE_FILES" ]; then
    echo -e "${RED}Error: No rule YAML files found in $RULES_DIR${NC}"
    exit 1
fi

# Determine how to update Prometheus rules
echo "Found $(echo "$RULE_FILES" | wc -l | xargs) rule files to process"
echo ""

# Check if we're running inside Docker/K8s
if [ -n "$KUBERNETES_SERVICE_HOST" ] || [ -f "/.dockerenv" ]; then
    echo "Running in container environment..."
    
    # Check if Prometheus config is writable
    if [ -w "$PROMETHEUS_CONFIG" ]; then
        echo "Updating Prometheus configuration directly..."
        
        # Backup the existing config
        cp "$PROMETHEUS_CONFIG" "${PROMETHEUS_CONFIG}.bak"
        
        # Update rule_files section in the config
        RULE_FILES_CONFIG=""
        for file in $RULE_FILES; do
            RULE_FILES_CONFIG="${RULE_FILES_CONFIG}  - \"${file}\"\n"
        done
        
        # Use sed to update the rule_files section
        sed -i '/^rule_files:/,/^[a-z]/ s/^  - .*$//' "$PROMETHEUS_CONFIG"
        sed -i "/^rule_files:/ a\\${RULE_FILES_CONFIG}" "$PROMETHEUS_CONFIG"
        
        echo -e "${GREEN}✓ Updated Prometheus configuration${NC}"
        echo "Reloading Prometheus configuration..."
        
        # Reload Prometheus configuration via API
        if curl -s -X POST "${PROMETHEUS_URL}/-/reload"; then
            echo -e "${GREEN}✓ Prometheus configuration reloaded${NC}"
        else
            echo -e "${RED}✗ Failed to reload Prometheus configuration${NC}"
            echo "Manual reload may be required"
        fi
    else
        # Config not writable, just copy rules to expected location
        echo "Prometheus config not writable, copying rules to rules directory..."
        
        # Determine rules directory from config
        PROM_RULES_DIR=$(grep -oP 'rule_files:\s*\n\s*-\s*"\K[^"]*' "$PROMETHEUS_CONFIG" | head -1 | xargs dirname)
        
        if [ -n "$PROM_RULES_DIR" ] && [ -d "$PROM_RULES_DIR" ]; then
            cp $RULE_FILES "$PROM_RULES_DIR/"
            echo -e "${GREEN}✓ Copied rules to Prometheus rules directory${NC}"
        else
            echo -e "${RED}Cannot determine Prometheus rules directory${NC}"
        fi
    fi
else
    # Running outside of container, use Docker Compose approach
    echo "Running in local environment..."
    
    # Check if prometheus is running via Docker Compose
    if docker-compose ps 2>/dev/null | grep -q prometheus; then
        echo "Updating rules for Docker Compose Prometheus..."
        
        # Copy rules to a volume or local directory mapped to Prometheus
        if [ -d "monitoring/prometheus/config" ]; then
            mkdir -p monitoring/prometheus/config/rules
            cp $RULE_FILES monitoring/prometheus/config/rules/
            echo -e "${GREEN}✓ Copied rules to Prometheus config directory${NC}"
            
            # Reload config if possible
            if docker-compose exec prometheus kill -HUP 1 2>/dev/null; then
                echo -e "${GREEN}✓ Sent reload signal to Prometheus${NC}"
            else
                echo -e "${YELLOW}⚠ Could not send reload signal, restart Prometheus manually${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ No config directory found, creating one...${NC}"
            mkdir -p monitoring/prometheus/config/rules
            cp $RULE_FILES monitoring/prometheus/config/rules/
            echo "You may need to update your docker-compose.yml to mount this directory"
        fi
    else
        # Just print rules for examination
        echo -e "${YELLOW}Prometheus not running via Docker Compose${NC}"
        echo "Here are the rules that would be applied:"
        
        for file in $RULE_FILES; do
            echo -e "${GREEN}File: $file${NC}"
            cat "$file"
            echo ""
        done
        
        echo -e "${YELLOW}Add these rules to your Prometheus configuration manually${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Alert rules update completed!${NC}"
echo "You can view your alert rules in the Prometheus UI at $PROMETHEUS_URL/alerts"