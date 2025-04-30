#!/bin/bash

# Get the data file path from args or use default
DATA_FILE="${1:-../sample/parcel_data.csv}"

# Check if the file exists
if [ ! -f "$DATA_FILE" ]; then
  echo "Error: File '$DATA_FILE' not found."
  exit 1
fi

# Import the sample data
echo "Importing data from $DATA_FILE..."
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "file=@$DATA_FILE" \
  http://localhost:5000/api/import/parcels

echo ""
echo "Done! Check the API response above for import results."