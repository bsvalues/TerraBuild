#!/usr/bin/env python3

"""
Benton County Cost Matrix Import Pipeline

This script runs the complete pipeline for importing the Benton County cost matrix data:
1. Parses the Excel file using the enhanced Excel parser
2. Generates the JSON data file
3. Imports the data into the database using the Node.js import script

Usage:
    python import_pipeline.py <excel_file_path>

Example:
    python import_pipeline.py attached_assets/Cost\ Matrix\ 2025.xlsx
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path

# Check if the benton_cost_matrix_parser.py file exists
if not os.path.exists("benton_cost_matrix_parser.py"):
    print("Error: benton_cost_matrix_parser.py not found.")
    print("Please ensure that all required scripts are in the same directory.")
    sys.exit(1)

# Import the parser
from benton_cost_matrix_parser import BentonCountyCostMatrixParser

def main():
    # Check command line arguments
    if len(sys.argv) < 2:
        print("Error: Excel file path not provided")
        print("Usage: python import_pipeline.py <excel_file_path>")
        sys.exit(1)
        
    excel_file_path = sys.argv[1]
    
    # Check if the Excel file exists
    if not os.path.exists(excel_file_path):
        print(f"Error: Excel file not found: {excel_file_path}")
        sys.exit(1)
    
    # Output file paths
    json_output_path = "benton_county_data.json"
    
    # Start pipeline
    print(f"Starting Benton County Cost Matrix Import Pipeline")
    print(f"Excel file: {excel_file_path}")
    print()
    
    # Phase 1: Parse Excel file
    print("Phase 1: Parsing Excel file...")
    start_time = time.time()
    
    # Create parser instance with progress callback
    parser = BentonCountyCostMatrixParser(excel_file_path)
    
    # Parse the Excel file
    try:
        # Parse with progress tracking
        result = parser.parse()
        
        # Handle progress updates manually
        print(f"  Processing... 100.0%")
        
        # Check if parsing was successful
        if not result["success"]:
            print("\nError: Failed to parse Excel file")
            for error in result.get("errors", []):
                print(f"  - {error}")
            sys.exit(1)
            
        # Save the results to a JSON file
        with open(json_output_path, "w") as f:
            json.dump(result, f, indent=2)
            
        parse_time = time.time() - start_time
        print(f"\nParsing completed in {parse_time:.2f} seconds")
        print(f"Found {len(result['data'])} matrix entries")
        print(f"Output saved to {json_output_path}")
        print()
        
    except Exception as e:
        print(f"\nError during Excel parsing: {str(e)}")
        sys.exit(1)
    
    # Phase 2: Import to database
    print("Phase 2: Importing data to database...")
    start_time = time.time()
    
    # Execute the import_to_database.js script
    try:
        # Run the Node.js script with ES module support
        process = subprocess.run(
            ["node", "--input-type=module", "import_to_database.js", json_output_path],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Print output from the script
        print(process.stdout)
        
        import_time = time.time() - start_time
        print(f"Database import completed in {import_time:.2f} seconds")
        
    except subprocess.CalledProcessError as e:
        print(f"Error during database import: {e}")
        print("Error output:")
        print(e.stderr)
        sys.exit(1)
        
    # Pipeline complete
    total_time = parse_time + import_time
    print(f"\nImport pipeline completed successfully!")
    print(f"Total execution time: {total_time:.2f} seconds")
    
if __name__ == "__main__":
    main()