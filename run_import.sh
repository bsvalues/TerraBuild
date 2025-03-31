#!/bin/bash

# Run the Benton County Cost Matrix Import Pipeline
# 
# This script runs the complete pipeline for importing the Benton County cost matrix data
# 
# Usage:
#   ./run_import.sh <excel_file_path>
# 
# Example:
#   ./run_import.sh attached_assets/Cost\ Matrix\ 2025.xlsx

# Check if file path is provided
if [ $# -lt 1 ]; then
  echo "Error: Excel file path not provided"
  echo "Usage: ./run_import.sh <excel_file_path>"
  exit 1
fi

EXCEL_FILE="$1"

# Check if file exists
if [ ! -f "$EXCEL_FILE" ]; then
  echo "Error: File not found: $EXCEL_FILE"
  exit 1
fi

# Make scripts executable
chmod +x import_pipeline.py
chmod +x import_to_database.js
chmod +x import_cost_matrix.js

# Run the import pipeline
echo "Starting Benton County Cost Matrix Import Pipeline"
echo "------------------------------------------------"
echo "Excel file: $EXCEL_FILE"
echo ""

# Run the Python import pipeline
python import_pipeline.py "$EXCEL_FILE"

# Check if the import was successful
if [ $? -eq 0 ]; then
  echo ""
  echo "Import pipeline executed successfully!"
  echo ""
  echo "You can now use the Cost Matrix in the web application."
else
  echo ""
  echo "Import pipeline failed. Please check the error messages above."
  exit 1
fi