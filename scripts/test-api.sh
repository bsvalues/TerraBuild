#!/bin/bash

# Test API Endpoints for TerraBuild Developer Kit
# This script performs basic tests against the API to verify functionality

API_URL="http://localhost:5000/api"
SUCCESS="\033[0;32m"
ERROR="\033[0;31m"
INFO="\033[0;34m"
RESET="\033[0m"

echo -e "${INFO}TerraBuild API Test Script${RESET}"
echo "============================="
echo ""

# Function to test an endpoint
test_endpoint() {
  local endpoint=$1
  local method=${2:-GET}
  local payload=$3
  local description=${4:-"Test $method $endpoint"}

  echo -e "${INFO}Testing: ${description}${RESET}"
  
  if [ "$method" == "GET" ]; then
    response=$(curl -s -X GET "$API_URL$endpoint")
  elif [ "$method" == "POST" ]; then
    response=$(curl -s -X POST "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$payload")
  fi
  
  if [ $? -eq 0 ] && [ "$response" != "" ]; then
    echo -e "${SUCCESS}✓ Success:${RESET} $method $endpoint"
    echo "$response" | jq . 2>/dev/null || echo "$response"
  else
    echo -e "${ERROR}✗ Failed:${RESET} $method $endpoint"
    echo "Response: $response"
  fi
  echo ""
}

# Test Health Endpoint
test_endpoint "/health" "GET" "" "Health Check Endpoint"

# Test Calculation Endpoint
calculation_payload='{
  "buildingType": "RES",
  "region": "BC-CENTRAL",
  "yearBuilt": 2010,
  "quality": "STANDARD",
  "condition": "GOOD",
  "complexity": "STANDARD",
  "squareFeet": 2000
}'
test_endpoint "/calculate" "POST" "$calculation_payload" "Cost Calculation Endpoint"

echo "============================="
echo -e "${INFO}Tests Completed${RESET}"