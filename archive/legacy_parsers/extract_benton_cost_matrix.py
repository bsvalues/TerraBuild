#!/usr/bin/env python3
"""
Benton County Cost Matrix Extractor

This script extracts building cost data from the Benton County Cost Matrix Excel file
and outputs it in a format ready for database import.
"""

import pandas as pd
import json
import sys
import os
from datetime import datetime
import re

class BentonCostMatrixExtractor:
    def __init__(self, excel_file_path):
        """Initialize with path to Excel file"""
        self.excel_file_path = excel_file_path
        self.year = self._extract_year_from_filename(excel_file_path)
        self.data = []
        self.regions = ["Eastern", "Central", "Western"]  # Common regions in Benton County
        
    def _extract_year_from_filename(self, filename):
        """Extract year from filename or use current year"""
        # Try to find a year in the filename (e.g., "Cost Matrix 2025.xlsx")
        year_match = re.search(r'20\d{2}', os.path.basename(filename))
        if year_match:
            return int(year_match.group(0))
        else:
            return datetime.now().year
    
    def _clean_building_type(self, code):
        """Clean and standardize building type codes"""
        if not code or not isinstance(code, str):
            return "Unknown"
        
        # Remove any spaces and special characters
        code = re.sub(r'[^a-zA-Z0-9]', '', code)
        return code.upper()
    
    def _extract_description(self, desc):
        """Extract a clean description from the text"""
        if not desc or not isinstance(desc, str):
            return ""
        
        # Clean up the description
        desc = desc.strip()
        # Remove multiple spaces
        desc = re.sub(r'\s+', ' ', desc)
        return desc
    
    def _process_matrix_sheet(self, df):
        """Process the main matrix sheet with cost data"""
        # Find building types (columns) and regions (index values)
        building_types = []
        
        # Check if first row contains headers
        if df.iloc[0].notna().any():
            # Use first row for building type codes
            for col in df.columns[1:]:  # Skip first column which usually has labels
                if pd.notna(col) and str(col).strip():
                    building_types.append(str(col).strip())
        
        # Find region rows
        region_rows = {}
        for i, idx in enumerate(df.index):
            row_label = str(df.iloc[i, 0]).strip() if pd.notna(df.iloc[i, 0]) else ""
            if row_label and any(region.lower() in row_label.lower() for region in self.regions):
                # Determine which region this is
                for region in self.regions:
                    if region.lower() in row_label.lower():
                        region_rows[region] = i
                        break
        
        # Extract cost data from the matrix
        for region, row_idx in region_rows.items():
            for j, building_type in enumerate(building_types):
                col_idx = j + 1  # Add 1 to skip the first column
                
                # Get the cost value
                cost_value = df.iloc[row_idx, col_idx]
                
                if pd.notna(cost_value):
                    # Try to get a description from nearby cells if available
                    description = ""
                    if row_idx > 0 and pd.notna(df.iloc[row_idx-1, col_idx]):
                        description = str(df.iloc[row_idx-1, col_idx])
                    
                    # Create a data entry
                    entry = {
                        "region": region,
                        "buildingType": self._clean_building_type(building_type),
                        "buildingTypeDescription": self._extract_description(description),
                        "baseCost": float(cost_value) if isinstance(cost_value, (int, float)) else 0,
                        "matrixYear": self.year,
                        "sourceMatrixId": 0,
                        "matrixDescription": f"Benton County {region} Region - {building_type}",
                        "dataPoints": 1,
                        "minCost": 0,
                        "maxCost": 0,
                        "adjustmentFactors": {
                            "complexity": 1.0,
                            "quality": 1.0,
                            "condition": 1.0
                        },
                        "county": "Benton",
                        "state": "WA"
                    }
                    
                    self.data.append(entry)
    
    def extract(self):
        """Extract cost matrix data from the Excel file"""
        try:
            # Load the Excel file
            print(f"Loading Excel file: {self.excel_file_path}")
            xls = pd.ExcelFile(self.excel_file_path)
            
            # Get available sheets
            sheets = xls.sheet_names
            print(f"Available sheets: {sheets}")
            
            # Look for sheets that might contain the matrix data
            matrix_sheet_name = None
            for sheet in sheets:
                if "matrix" in sheet.lower() or "cost" in sheet.lower():
                    matrix_sheet_name = sheet
                    break
            
            if not matrix_sheet_name and sheets:
                # Use the first sheet if no specific matrix sheet found
                matrix_sheet_name = sheets[0]
            
            if matrix_sheet_name:
                print(f"Processing sheet: {matrix_sheet_name}")
                df = pd.read_excel(self.excel_file_path, sheet_name=matrix_sheet_name)
                self._process_matrix_sheet(df)
            else:
                print("No suitable sheet found in the Excel file")
                return False
            
            print(f"Extracted {len(self.data)} cost matrix entries")
            return len(self.data) > 0
            
        except Exception as e:
            print(f"Error extracting cost matrix data: {str(e)}")
            return False
    
    def save_to_json(self, output_file):
        """Save the extracted data to a JSON file"""
        try:
            with open(output_file, 'w') as f:
                json.dump(self.data, f, indent=2)
            
            print(f"Saved {len(self.data)} entries to {output_file}")
            return True
        except Exception as e:
            print(f"Error saving JSON file: {str(e)}")
            return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_benton_cost_matrix.py <excel_file> [output_json_file]")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "benton_cost_matrix_live.json"
    
    extractor = BentonCostMatrixExtractor(excel_file)
    if extractor.extract():
        if extractor.save_to_json(output_file):
            print(f"Successfully extracted cost matrix data to {output_file}")
            sys.exit(0)
    
    print("Failed to extract cost matrix data")
    sys.exit(1)

if __name__ == "__main__":
    main()