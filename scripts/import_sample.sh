#!/bin/bash

# Import Sample Data Script for TerraBuild Developer Kit
# This script automates the process of importing sample data into the system

API_URL="http://localhost:5000/api"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}TerraBuild Sample Data Import${RESET}"
echo "=============================="
echo ""

# Function to check if the API is available
check_api() {
  echo -e "${YELLOW}Checking if API is available...${RESET}"
  response=$(curl -s "$API_URL/health")
  
  if [[ $response == *"ok"* ]]; then
    echo -e "${GREEN}API is available${RESET}"
    return 0
  else
    echo -e "${RED}API is not available. Please ensure the server is running.${RESET}"
    return 1
  fi
}

# Function to import cost factors
import_factors() {
  echo -e "${YELLOW}Importing cost factors...${RESET}"
  
  response=$(curl -s -X POST "$API_URL/import/factors" \
    -F "file=@data/factors-2025.json")
  
  if [[ $response == *"success\":true"* ]] || [[ $response == *"Success"* ]]; then
    echo -e "${GREEN}Cost factors imported successfully${RESET}"
    return 0
  else
    echo -e "${RED}Failed to import cost factors${RESET}"
    echo "Response: $response"
    return 1
  fi
}

# Function to import property data
import_properties() {
  echo -e "${YELLOW}Importing property data...${RESET}"
  
  response=$(curl -s -X POST "$API_URL/import/parcels" \
    -F "file=@sample/parcel_data.csv")
  
  if [[ $response == *"success\":true"* ]] || [[ $response == *"imported"* ]]; then
    echo -e "${GREEN}Property data imported successfully${RESET}"
    echo "Response: $response"
    return 0
  else
    echo -e "${RED}Failed to import property data${RESET}"
    echo "Response: $response"
    return 1
  fi
}

# Main execution flow
main() {
  # Check if API is available
  if ! check_api; then
    exit 1
  fi
  
  echo ""
  
  # Import cost factors
  if ! import_factors; then
    echo -e "${YELLOW}Continuing despite factor import issues...${RESET}"
  fi
  
  echo ""
  
  # Import property data
  if ! import_properties; then
    echo -e "${RED}Property import failed. Exiting.${RESET}"
    exit 1
  fi
  
  echo ""
  echo -e "${GREEN}Sample data import completed successfully!${RESET}"
  echo "You can now use the TerraBuild Developer Kit with the imported data."
}

# Run the main function
main