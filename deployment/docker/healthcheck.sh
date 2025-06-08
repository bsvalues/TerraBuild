#!/bin/bash

# TerraFusion Health Check Script
# Comprehensive application health verification

set -e

# Configuration
HEALTH_URL="http://localhost:${PORT:-3000}/api/health"
MAX_RETRIES=3
RETRY_DELAY=2

echo "Running TerraFusion health check..."

# Function to check HTTP endpoint
check_http() {
    local url=$1
    local expected_status=${2:-200}
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        echo "Health check failed: HTTP $response (expected $expected_status)"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    if [ -n "$DATABASE_URL" ]; then
        pg_isready -d "$DATABASE_URL" >/dev/null 2>&1
        return $?
    fi
    return 0
}

# Main health check with retries
for i in $(seq 1 $MAX_RETRIES); do
    if check_http "$HEALTH_URL" && check_database; then
        echo "Health check passed"
        exit 0
    fi
    
    if [ $i -lt $MAX_RETRIES ]; then
        echo "Health check attempt $i failed, retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
    fi
done

echo "Health check failed after $MAX_RETRIES attempts"
exit 1