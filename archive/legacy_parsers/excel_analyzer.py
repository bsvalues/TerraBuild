#!/usr/bin/env python3
"""
Excel Analyzer for Benton County, Washington Cost Matrix

This script analyzes the structure of an Excel file and prints information
about its sheets, columns, and data.
"""

import sys
import pandas as pd

def analyze_excel(file_path):
    """Analyze the structure of an Excel file."""
    try:
        # Read the Excel file to get sheet names
        print(f"Reading Excel file: {file_path}")
        xl = pd.ExcelFile(file_path)
        
        print(f"\nSheet names:")
        for sheet_name in xl.sheet_names:
            print(f"  - {sheet_name}")
        
        # Analyze each sheet
        for sheet_name in xl.sheet_names:
            print(f"\nAnalyzing sheet: {sheet_name}")
            
            # Read only the first few rows to get the structure
            df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=10)
            
            # Print column names
            print(f"  Columns ({len(df.columns)}):")
            for col in df.columns:
                print(f"    - {col}")
            
            # Print shape and types
            print(f"  Shape: {df.shape}")
            print(f"  Data types:")
            for col, dtype in df.dtypes.items():
                print(f"    - {col}: {dtype}")
            
            # Print sample data (first 3 rows)
            print(f"  Sample data (first 3 rows):")
            sample = df.head(3).to_string()
            for line in sample.split('\n'):
                print(f"    {line}")
            
            print("-" * 50)
            
    except Exception as e:
        print(f"Error analyzing Excel file: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <excel_file>")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    analyze_excel(excel_file)