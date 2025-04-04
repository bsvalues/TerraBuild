#!/usr/bin/env python
"""
Cost Matrix Data Extractor

This script extracts data from the Cost Matrix Excel file and formats it for import
into the BCBS database. It handles the specific structure of the provided Excel file
and creates a correctly formatted JSON output file.
"""

import pandas as pd
import numpy as np
import json
import sys
import re
import logging
import argparse
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('cost_matrix_extractor')

def extract_building_type_region(description):
    """
    Extract building type and region from matrix description.
    Example: "PC - C01-Bing - * - T1" -> ("Bing", "C01", "PC")
    """
    if not description or not isinstance(description, str):
        return None, None, None
    
    # PC - C01-Bing - * - T1
    # Format is generally: [PC/MH/etc] - [RegionCode]-[BuildingType] - * - [TypeCode]
    pattern = r'([A-Z]+)\s*-\s*([A-Z0-9]+)-([A-Za-z0-9\s]+)'
    match = re.search(pattern, description)
    
    if match:
        category = match.group(1).strip()  # PC, MH, etc.
        region_code = match.group(2).strip()  # C01, I03, etc.
        building_type = match.group(3).strip()  # Bing, Rainie, etc.
        
        # Map region codes to our system's region format
        region_mapping = {
            'C01': 'CENTRAL',
            'C02': 'CENTRAL',
            'C04': 'CENTRAL',
            'I03': 'INDUSTRIAL',
            'I04': 'INDUSTRIAL',
            'E': 'EASTERN',
            'W': 'WESTERN',
            'N': 'NORTHERN',
            'S': 'SOUTHERN',
            'NW': 'NORTHWEST',
            'SW': 'SOUTHWEST',
            'NE': 'NORTHEAST',
            'SE': 'SOUTHEAST'
        }
        
        # Clean up region code to match pattern
        region_pattern = re.compile(r'([A-Z]+)(\d+)')
        region_match = region_pattern.match(region_code)
        if region_match:
            region_prefix = region_match.group(1)
            if region_prefix in region_mapping:
                region = region_mapping[region_prefix]
            else:
                # Try the full code
                region = region_mapping.get(region_code, 'UNKNOWN')
        else:
            region = region_mapping.get(region_code, 'UNKNOWN')
            
        return building_type, region, category
    return None, None, None

def calculate_base_cost(matrix_df, detail_df, matrix_id):
    """
    Calculate base cost for a given matrix.
    Takes the average of valid cell values.
    """
    matrix_details = detail_df[detail_df['matrix_id'] == matrix_id]
    if matrix_details.empty:
        return 0
    
    # Filter out missing or invalid values
    valid_values = matrix_details['cell_value'].dropna()
    if len(valid_values) == 0:
        return 0
    
    # Calculate base cost - use median to avoid outliers
    base_cost = np.median(valid_values)
    return float(base_cost)

def extract_matrix_data(excel_file, output_file):
    """
    Extract matrix data from Excel file and save as JSON.
    """
    logger.info(f"Processing file: {excel_file}")
    
    try:
        # Load Excel sheets
        xlsx = pd.ExcelFile(excel_file)
        
        # We need these sheets
        required_sheets = ['matrix', 'matrix_detail']
        for sheet in required_sheets:
            if sheet not in xlsx.sheet_names:
                logger.error(f"Required sheet '{sheet}' not found in Excel file")
                return False
                
        # Read sheets
        matrix_df = pd.read_excel(xlsx, 'matrix')
        detail_df = pd.read_excel(xlsx, 'matrix_detail')
        
        # Get matrix year - assume it's same for all entries
        matrix_year = int(matrix_df['matrix_yr'].iloc[0])
        logger.info(f"Matrix year detected: {matrix_year}")
        
        # Results collection
        entries = []
        building_types = set()
        regions = set()
        
        # Process each matrix
        for _, matrix_row in matrix_df.iterrows():
            matrix_id = matrix_row['matrix_id']
            description = matrix_row['matrix_description']
            
            building_type, region, category = extract_building_type_region(description)
            
            if not building_type or not region:
                logger.debug(f"Skipping matrix_id {matrix_id}, couldn't extract building type/region from '{description}'")
                continue
                
            building_types.add(building_type)
            regions.add(region)
            
            # Calculate base cost
            base_cost = calculate_base_cost(matrix_df, detail_df, matrix_id)
            
            # Get data points count
            data_points = len(detail_df[detail_df['matrix_id'] == matrix_id])
            
            # Get min/max cost values
            matrix_details = detail_df[detail_df['matrix_id'] == matrix_id]
            min_cost = float(matrix_details['cell_value'].min()) if not matrix_details.empty else 0
            max_cost = float(matrix_details['cell_value'].max()) if not matrix_details.empty else 0
            
            # Create entry
            entry = {
                "region": region,
                "buildingType": building_type.upper().replace(' ', '_'),
                "buildingTypeDescription": f"{building_type} ({category})",
                "baseCost": base_cost,
                "matrixYear": matrix_year,
                "sourceMatrixId": int(matrix_id),
                "matrixDescription": description,
                "dataPoints": data_points,
                "minCost": min_cost,
                "maxCost": max_cost,
                "adjustmentFactors": {
                    "complexity": 1.0,
                    "quality": 1.0,
                    "condition": 1.0
                },
                "county": "Benton",
                "state": "WA"
            }
            entries.append(entry)
        
        # Create output
        result = {
            "data": entries,
            "metadata": {
                "fileProcessed": excel_file.split('/')[-1],
                "matrixYear": matrix_year,
                "processedAt": datetime.now().isoformat(),
                "buildingTypeCount": len(building_types),
                "regionCount": len(regions),
                "totalEntries": len(entries),
                "buildingTypes": list(building_types),
                "regions": list(regions)
            }
        }
        
        # Write to file
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
            
        logger.info(f"Extracted {len(entries)} entries from {len(building_types)} building types across {len(regions)} regions")
        logger.info(f"Results saved to {output_file}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Extract cost matrix data from Excel file')
    parser.add_argument('excel_file', help='Path to Excel file')
    parser.add_argument('--output', '-o', default='extracted_cost_matrix.json', help='Output JSON file path')
    
    args = parser.parse_args()
    
    success = extract_matrix_data(args.excel_file, args.output)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()