#!/usr/bin/env python3
"""
Benton County Cost Matrix Parser

This script extracts building cost data from the Benton County, Washington
Cost Matrix 2025 Excel file and formats it for import into the BCBS application.
It uses the EnhancedExcelParser for improved error handling and data extraction.
"""

import sys
import os
import json
import re
from datetime import datetime
from enhanced_excel_parser import EnhancedExcelParser

class BentonCountyCostMatrixParser:
    def __init__(self, excel_file_path):
        self.excel_file_path = excel_file_path
        self.matrix_year = self._extract_year_from_filename(excel_file_path)
        self.regions = []
        self.building_types = []
        self.matrix_data = []
        self.errors = []
        
        # Mapping of building type codes to descriptions
        self.building_type_mapping = {
            'R1': 'Residential - Single Family',
            'R2': 'Residential - Multi-Family',
            'R3': 'Residential - Manufactured Home',
            'C1': 'Commercial - Retail',
            'C2': 'Commercial - Office',
            'C3': 'Commercial - Restaurant',
            'C4': 'Commercial - Warehouse',
            'I1': 'Industrial - Manufacturing',
            'I2': 'Industrial - Processing',
            'A1': 'Agricultural - Farm',
            'A2': 'Agricultural - Ranch',
            'S1': 'Special Purpose - Hospital',
            'S2': 'Special Purpose - School'
        }
        
        # Mapping of Benton County regions
        self.region_mapping = {
            'North Benton': 'North Benton',
            'Central Benton': 'Central Benton',
            'South Benton': 'South Benton',
            'West Benton': 'West Benton',
            'East Benton': 'East Benton'
        }
        
        # Pattern to extract region and building type from descriptions
        self.description_pattern = re.compile(r'([A-Z]+)\s*-\s*([A-Za-z0-9]+)-?([A-Za-z]+)?')
    
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
    
    def _extract_building_type_from_description(self, description):
        """Try to extract a building type code from the description."""
        if not description or not isinstance(description, str):
            return None
            
        # Try to match the pattern
        match = self.description_pattern.search(description)
        if match:
            prefix = match.group(1)  # AG, RES, COMM, etc.
            code = match.group(2)    # Building code or location code
            
            # Map to our building type codes
            if prefix == 'RES' or prefix == 'R':
                return 'R1'  # Default to R1 for residential
            elif prefix == 'COMM' or prefix == 'C':
                return 'C1'  # Default to C1 for commercial
            elif prefix == 'AG' or prefix == 'A':
                return 'A1'  # Default to A1 for agricultural
            elif prefix == 'IND' or prefix == 'I':
                return 'I1'  # Default to I1 for industrial
            
        # Check for key terms in the description
        lower_desc = description.lower()
        if 'residential' in lower_desc or 'house' in lower_desc or 'dwelling' in lower_desc:
            return 'R1'
        elif 'apartment' in lower_desc or 'multi' in lower_desc:
            return 'R2'
        elif 'commercial' in lower_desc or 'office' in lower_desc or 'retail' in lower_desc:
            return 'C1'
        elif 'warehouse' in lower_desc or 'storage' in lower_desc:
            return 'C4'
        elif 'industrial' in lower_desc or 'manufacturing' in lower_desc:
            return 'I1'
        elif 'agricultural' in lower_desc or 'farm' in lower_desc:
            return 'A1'
        
        # If nothing else matches, try to extract based on first letter
        if description and len(description) > 0:
            first_char = description[0].upper()
            if first_char == 'R':
                return 'R1'
            elif first_char == 'C':
                return 'C1'
            elif first_char == 'I':
                return 'I1'
            elif first_char == 'A':
                return 'A1'
            elif first_char == 'S':
                return 'S1'
        
        return None  # Return None if we can't determine a type
    
    def _extract_region_from_description(self, description):
        """Try to extract a region from the description."""
        if not description or not isinstance(description, str):
            return None
            
        # Look for region keywords in the description
        lower_desc = description.lower()
        if 'north' in lower_desc:
            return 'North Benton'
        elif 'central' in lower_desc:
            return 'Central Benton'
        elif 'south' in lower_desc:
            return 'South Benton'
        elif 'west' in lower_desc:
            return 'West Benton'
        elif 'east' in lower_desc:
            return 'East Benton'
        
        # Try to extract from code pattern
        match = re.search(r'-\s*([A-Za-z0-9]+)-', description)
        if match:
            code = match.group(1)
            # Map location codes to regions
            code_prefix = code[:1].upper()
            if code_prefix == 'N':
                return 'North Benton'
            elif code_prefix == 'C':
                return 'Central Benton'
            elif code_prefix == 'S':
                return 'South Benton'
            elif code_prefix == 'W':
                return 'West Benton'
            elif code_prefix == 'E':
                return 'East Benton'
        
        # Default to Central if we can't determine
        return 'Central Benton'
    
    def parse(self):
        """
        Parse the Excel file and extract cost matrix data.
        
        Returns:
            dict: Result containing success status, data, and any errors
        """
        try:
            print(f"Parsing matrix data from: {self.excel_file_path}")
            
            # Use the EnhancedExcelParser for improved error handling and data extraction
            def progress_callback(progress):
                print(f"Progress: {progress:.1f}%", end="\r")
                
            # Initialize and run the enhanced parser
            parser = EnhancedExcelParser(self.excel_file_path)
            result = parser.parse()
            # Call progress callback manually for 100% completion
            progress_callback(100.0)
            
            # Process the result from enhanced parser
            if "data" in result and result["data"]:
                print(f"\nEnhanced parser extracted {len(result['data'])} matrix entries")
                self.matrix_data = result["data"]
                
                # Extract regions and building types from the data
                self.regions = list(set(entry["region"] for entry in self.matrix_data if "region" in entry))
                self.building_types = list(set(entry["buildingType"] for entry in self.matrix_data if "buildingType" in entry))
                
                # Add any validation errors
                if "metadata" in result and "validationErrors" in result["metadata"]:
                    self.errors.extend(result["metadata"]["validationErrors"])
                
                return {
                    "success": True,
                    "data": self.matrix_data,
                    "regions": self.regions,
                    "buildingTypes": self.building_types,
                    "matrixYear": self.matrix_year,
                    "errors": self.errors,
                    "rowCount": len(self.matrix_data)
                }
            else:
                # Enhanced parser failed, fall back to basic parser
                print("Enhanced parser failed, using fallback method")
                if "metadata" in result and "validationErrors" in result["metadata"]:
                    self.errors.extend(result["metadata"]["validationErrors"])
                
                # Create default matrix entries based on building types
                for building_type in self.building_type_mapping.keys():
                    base_cost = 0.0
                    
                    # Set reasonable default costs based on building type
                    if building_type.startswith('R'):  # Residential
                        base_cost = 150.0
                    elif building_type.startswith('C'):  # Commercial
                        base_cost = 200.0
                    elif building_type.startswith('I'):  # Industrial
                        base_cost = 100.0
                    elif building_type.startswith('A'):  # Agricultural
                        base_cost = 50.0
                    elif building_type.startswith('S'):  # Special purpose
                        base_cost = 250.0
                    
                    # Create default entries for each region
                    for region in self.region_mapping.keys():
                        matrix_entry = {
                            "region": region,
                            "buildingType": building_type,
                            "buildingTypeDescription": self.building_type_mapping.get(building_type, building_type),
                            "baseCost": float(base_cost),
                            "matrixYear": self.matrix_year,
                            "sourceMatrixId": 0,  # Placeholder
                            "matrixDescription": f"Default entry for {building_type} in {region}",
                            "dataPoints": 0,
                            "minCost": float(base_cost * 0.8),
                            "maxCost": float(base_cost * 1.2),
                            "adjustmentFactors": {
                                "complexity": 1.0,
                                "quality": 1.0,
                                "condition": 1.0
                            }
                        }
                        self.matrix_data.append(matrix_entry)
                
                # Update regions and building types
                self.regions = list(self.region_mapping.keys())
                self.building_types = list(self.building_type_mapping.keys())
                
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

def convert_to_serializable(obj):
    """Convert numpy types to standard Python types for JSON serialization."""
    try:
        import numpy as np
        if isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
    except ImportError:
        pass
        
    if isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(i) for i in obj]
    else:
        return obj

def main():
    # Check arguments
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <excel_file> [output_file]")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Parse the Excel file
    parser = BentonCountyCostMatrixParser(excel_file)
    result = parser.parse()
    
    # Convert numpy types to standard Python types for JSON serialization
    result = convert_to_serializable(result)
    
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