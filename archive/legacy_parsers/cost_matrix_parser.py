#!/usr/bin/env python3
"""
Cost Matrix Parser for Benton County, Washington Building Cost Assessment System

This script parses the Cost Matrix Excel file and extracts the data in a format
that can be imported into the database.

Usage:
    python cost_matrix_parser.py <excel_file> [output_file]

Example:
    python cost_matrix_parser.py attached_assets/Cost\ Matrix\ 2025.xlsx output.json
"""

import sys
import os
import json
import pandas as pd
from datetime import datetime

class CostMatrixParser:
    def __init__(self, excel_file_path):
        self.excel_file_path = excel_file_path
        self.matrix_year = self._extract_year_from_filename(excel_file_path)
        self.regions = []
        self.building_types = []
        self.matrix_data = []
        self.errors = []
    
    def _extract_year_from_filename(self, filename):
        """Extract year from filename if present, otherwise use current year."""
        try:
            # Try to extract year from filename (e.g., "Cost Matrix 2025.xlsx")
            basename = os.path.basename(filename)
            # Find all numbers in the filename
            numbers = [int(s) for s in basename.split() if s.isdigit()]
            if numbers and len(str(numbers[0])) == 4:  # Assume 4-digit number is a year
                return numbers[0]
        except Exception:
            pass
        
        # Default to current year if extraction fails
        return datetime.now().year
    
    def parse(self):
        """
        Parse the Excel file and extract the cost matrix data.
        
        Returns:
            dict: Result containing success status, data, and any errors
        """
        try:
            # Read the Excel file
            print(f"Reading Excel file: {self.excel_file_path}")
            
            # Try to determine if there are multiple sheets and which one has the data
            xl = pd.ExcelFile(self.excel_file_path)
            sheet_name = xl.sheet_names[0]  # Default to first sheet
            
            # If there's a sheet with 'matrix', 'cost', or similar in the name, use that
            for name in xl.sheet_names:
                lower_name = name.lower()
                if any(keyword in lower_name for keyword in ['matrix', 'cost', 'rate']):
                    sheet_name = name
                    break
            
            print(f"Using sheet: {sheet_name}")
            df = pd.read_excel(self.excel_file_path, sheet_name=sheet_name)
            
            # Clean up the DataFrame by removing empty rows and columns
            df = df.dropna(how='all').dropna(axis=1, how='all')
            
            # Extract column headers (potential building types)
            headers = df.columns.tolist()
            # The first column is likely labels, not a building type
            potential_building_types = headers[1:]
            
            # Filter out non-string or empty headers
            self.building_types = [str(bt) for bt in potential_building_types 
                                 if isinstance(bt, str) and str(bt).strip()]
            
            print(f"Detected building types: {self.building_types}")
            
            # Extract regions (usually in the first column)
            region_column = df.iloc[:, 0]
            self.regions = [str(r) for r in region_column.dropna().tolist() 
                          if isinstance(r, str) and str(r).strip()]
            
            print(f"Detected regions: {self.regions}")
            
            # Extract matrix data
            for region in self.regions:
                region_rows = df[df.iloc[:, 0] == region]
                
                for building_type in self.building_types:
                    try:
                        # Get the value from the intersection of region row and building type column
                        if building_type in df.columns:
                            cost_value = region_rows[building_type].values[0]
                            
                            # Handle different data types (string with $ signs, floats, etc.)
                            if isinstance(cost_value, str):
                                # Remove $ signs and commas from string values
                                cost_value = cost_value.replace('$', '').replace(',', '')
                                try:
                                    cost_value = float(cost_value)
                                except ValueError:
                                    self.errors.append(f"Could not convert value '{cost_value}' to number for {region}/{building_type}")
                                    continue
                            
                            matrix_entry = {
                                "region": region,
                                "buildingType": building_type,
                                "baseCost": float(cost_value),
                                "matrixYear": self.matrix_year,
                                "adjustmentFactors": {
                                    "complexity": 1.0,  # Default factor, actual values would be extracted if available
                                    "quality": 1.0,
                                    "condition": 1.0
                                }
                            }
                            self.matrix_data.append(matrix_entry)
                    except Exception as e:
                        self.errors.append(f"Error processing {region}/{building_type}: {str(e)}")
            
            return {
                "success": len(self.matrix_data) > 0,
                "data": self.matrix_data,
                "regions": self.regions,
                "buildingTypes": self.building_types,
                "matrixYear": self.matrix_year,
                "errors": self.errors,
                "rowCount": len(self.matrix_data)
            }
            
        except Exception as e:
            self.errors.append(f"Failed to parse Excel file: {str(e)}")
            return {
                "success": False,
                "data": [],
                "regions": [],
                "buildingTypes": [],
                "matrixYear": self.matrix_year,
                "errors": self.errors,
                "rowCount": 0
            }

def main():
    # Check arguments
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <excel_file> [output_file]")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Parse the Excel file
    parser = CostMatrixParser(excel_file)
    result = parser.parse()
    
    # Print summary
    print(f"Processing complete:")
    print(f"  Success: {result['success']}")
    print(f"  Regions found: {len(result['regions'])}")
    print(f"  Building types found: {len(result['buildingTypes'])}")
    print(f"  Matrix entries: {result['rowCount']}")
    
    if result['errors']:
        print(f"  Errors: {len(result['errors'])}")
        for error in result['errors'][:5]:  # Show first 5 errors
            print(f"    - {error}")
        if len(result['errors']) > 5:
            print(f"    ... and {len(result['errors']) - 5} more errors")
    
    # Output the result
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"  Output written to: {output_file}")
    else:
        # Print the data to stdout if no output file specified
        print("\nExtracted data:")
        print(json.dumps(result['data'][:5], indent=2))  # Show first 5 entries
        if len(result['data']) > 5:
            print(f"... and {len(result['data']) - 5} more entries")

if __name__ == "__main__":
    main()