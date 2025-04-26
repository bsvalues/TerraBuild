#!/bin/bash
# Smoke Test Runner for BCBS Application
# Performs basic health checks to verify the application is running

set -e

# Parse command line arguments
ENV="local"
URL="http://localhost:5000"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --env=*) ENV="${1#*=}" ;;
    --url=*) URL="${1#*=}" ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Set URL based on environment if not explicitly provided
if [[ "$URL" == "http://localhost:5000" && "$ENV" != "local" ]]; then
  case $ENV in
    dev) URL="https://dev.example.com" ;;
    staging) URL="https://staging.example.com" ;;
    prod) URL="https://app.example.com" ;;
  esac
fi

echo "Running smoke tests against $URL..."

# Test 1: Basic connectivity
echo "Test 1: Basic connectivity"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL)
if [[ $HTTP_STATUS -ge 200 && $HTTP_STATUS -lt 300 ]]; then
  echo "✅ Basic connectivity: OK (HTTP $HTTP_STATUS)"
else
  echo "❌ Basic connectivity: FAILED (HTTP $HTTP_STATUS)"
  exit 1
fi

# Test 2: Health check endpoint
echo "Test 2: Health check endpoint"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL/api/health || echo "000")
if [[ $HEALTH_STATUS -ge 200 && $HEALTH_STATUS -lt 300 ]]; then
  echo "✅ Health check: OK (HTTP $HEALTH_STATUS)"
  
  # Optional: Check health details
  HEALTH_DETAILS=$(curl -s $URL/api/health)
  echo "Health details: $HEALTH_DETAILS"
else
  echo "❌ Health check: FAILED (HTTP $HEALTH_STATUS)"
  # Continue even if health check fails
fi

# Test 3: Basic page load time
echo "Test 3: Basic load time check"
LOAD_TIME=$(curl -s -w "%{time_total}\n" -o /dev/null $URL)
if (( $(echo "$LOAD_TIME < 2.0" | bc -l) )); then
  echo "✅ Load time: OK ($LOAD_TIME seconds)"
else
  echo "⚠️ Load time: Slow ($LOAD_TIME seconds)"
  # Don't fail the test for slow load, just warn
fi

# Overall status
echo ""
echo "Smoke tests completed."