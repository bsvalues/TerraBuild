#!/usr/bin/env python3
"""
Enhanced Excel Parser for Benton County Cost Matrix

This script parses Excel files containing cost matrix data and outputs a standardized
JSON structure that can be imported into the application database.

Usage:
    python enhanced_excel_parser.py <path_to_excel_file> [--output <output_file>]

Example:
    python enhanced_excel_parser.py uploads/cost_matrix_2025.xlsx --output parsed_matrix.json
"""

import argparse
import json
import os
import sys
from datetime import datetime
import pandas as pd
import numpy as np
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("excel_parser.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("enhanced_excel_parser")

# Constants
MATRIX_SHEET = "matrix"
MATRIX_DETAIL_SHEET = "matrix_detail"
BUILDING_TYPES_SHEET = "building_types"
REGION_CODES_SHEET = "region_codes"

class EnhancedExcelParser:
    """Parser for Cost Matrix Excel files"""
    
    def __init__(self, file_path):
        """Initialize parser with file path"""
        self.file_path = file_path
        self.workbook = None
        self.matrix_year = None
        self.building_types = {}
        self.region_codes = {}
        self.validation_errors = []
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Excel file not found: {file_path}")
        
        # Extract year from filename if possible
        filename = os.path.basename(file_path)
        try:
            year_str = ''.join(filter(str.isdigit, filename))
            if len(year_str) >= 4:
                self.matrix_year = int(year_str[:4])
            else:
                # Default to current year if can't extract from filename
                self.matrix_year = datetime.now().year
        except:
            self.matrix_year = datetime.now().year
        
        logger.info(f"Processing file: {file_path}")
        logger.info(f"Matrix year detected: {self.matrix_year}")
        
        # Load Excel file
        try:
            if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
                self.workbook = pd.ExcelFile(file_path)
            else:
                raise ValueError("File must be an Excel file (.xlsx or .xls)")
        except Exception as e:
            logger.error(f"Error opening Excel file: {str(e)}")
            raise
            
        # Validate sheet structure
        self._validate_workbook_structure()
    
    def _validate_workbook_structure(self):
        """Validate that the workbook has the expected sheets"""
        required_sheets = [MATRIX_SHEET]
        for sheet in required_sheets:
            if sheet not in self.workbook.sheet_names:
                self.validation_errors.append(f"Required sheet '{sheet}' is missing")
                logger.error(f"Required sheet '{sheet}' is missing")
        
        # Check for additional sheets
        if MATRIX_DETAIL_SHEET in self.workbook.sheet_names:
            logger.info(f"Found matrix_detail sheet")
        
        if BUILDING_TYPES_SHEET in self.workbook.sheet_names:
            self._load_building_types()
        
        if REGION_CODES_SHEET in self.workbook.sheet_names:
            self._load_region_codes()
    
    def _load_building_types(self):
        """Load building type codes and descriptions"""
        try:
            df = self.workbook.parse(BUILDING_TYPES_SHEET)
            # Standardize column names
            df.columns = [col.lower().strip() for col in df.columns]
            
            # Try to find code and description columns
            code_col = next((col for col in df.columns if 'code' in col or 'type' in col), df.columns[0])
            desc_col = next((col for col in df.columns if 'desc' in col or 'name' in col), df.columns[1] if len(df.columns) > 1 else None)
            
            if desc_col:
                self.building_types = dict(zip(df[code_col], df[desc_col]))
            else:
                # If no description column, use the code as the description
                self.building_types = dict(zip(df[code_col], df[code_col]))
                
            logger.info(f"Loaded {len(self.building_types)} building types")
        except Exception as e:
            logger.error(f"Error loading building types: {str(e)}")
    
    def _load_region_codes(self):
        """Load region codes and names"""
        try:
            df = self.workbook.parse(REGION_CODES_SHEET)
            # Standardize column names
            df.columns = [col.lower().strip() for col in df.columns]
            
            # Try to find code and name columns
            code_col = next((col for col in df.columns if 'code' in col or 'id' in col), df.columns[0])
            name_col = next((col for col in df.columns if 'name' in col or 'desc' in col or 'region' in col), df.columns[1] if len(df.columns) > 1 else None)
            
            if name_col:
                self.region_codes = dict(zip(df[code_col], df[name_col]))
            else:
                # If no name column, use the code as the name
                self.region_codes = dict(zip(df[code_col], df[code_col]))
                
            logger.info(f"Loaded {len(self.region_codes)} region codes")
        except Exception as e:
            logger.error(f"Error loading region codes: {str(e)}")
    
    def parse_matrix(self):
        """Parse the main matrix sheet to extract cost matrix data"""
        logger.info("Parsing matrix sheet...")
        
        try:
            # Load the matrix sheet
            df = self.workbook.parse(MATRIX_SHEET)
            
            # Basic data cleaning - remove NaN values and blank rows/columns
            df = df.replace([np.inf, -np.inf], np.nan)
            df = df.dropna(how='all')
            
            # Find header row - typically row that has "Building Type" or similar
            header_row = 0
            for i, row in df.iterrows():
                if any(str(cell).lower().strip() in ["building type", "buildingtype", "building types", "type"] 
                       for cell in row if cell is not None and str(cell).strip()):
                    header_row = i
                    break
            
            # Create a new DataFrame starting from the header row
            header = df.iloc[header_row].values
            data = df.iloc[header_row+1:].reset_index(drop=True)
            data.columns = range(len(header))
            
            # Find the building type column
            building_type_col = None
            for i, h in enumerate(header):
                if h is not None and isinstance(h, str) and any(x in h.lower() for x in ["building type", "buildingtype", "building", "type"]):
                    building_type_col = i
                    break
            
            if building_type_col is None:
                logger.error("Could not find building type column")
                self.validation_errors.append("Could not find building type column in matrix sheet")
                return []
            
            # Process the data to extract cost matrix entries
            matrix_entries = []
            
            for i, row in data.iterrows():
                building_type = str(row[building_type_col]).strip()
                if not building_type or building_type.lower() in ["nan", "none", ""]:
                    continue
                
                # Try to find a better description from the building_types dictionary
                building_type_description = self.building_types.get(building_type, building_type)
                
                # Process each region column (all columns except building type)
                for j, cell_value in enumerate(row):
                    if j == building_type_col or j >= len(header) or header[j] is None:
                        continue
                    
                    # Skip non-numeric values
                    if not isinstance(cell_value, (int, float)) or pd.isna(cell_value):
                        continue
                    
                    region = str(header[j]).strip()
                    
                    # If we have a region code mapping, use it
                    region_name = self.region_codes.get(region, region)
                    
                    # Create matrix entry
                    matrix_entry = {
                        "region": region_name,
                        "buildingType": building_type,
                        "buildingTypeDescription": building_type_description,
                        "baseCost": str(cell_value),
                        "matrixYear": self.matrix_year,
                        "sourceMatrixId": 1,  # Default ID, will be replaced on import
                        "isActive": True,
                        "complexityFactorBase": "1.0",
                        "stories": "1",
                        "squareFeet": "1000",
                        "qualityGrade": "Average",
                        "occupancyType": "Standard",
                        "conditionFactorBase": "1.0"
                    }
                    
                    matrix_entries.append(matrix_entry)
            
            logger.info(f"Extracted {len(matrix_entries)} matrix entries")
            return matrix_entries
            
        except Exception as e:
            logger.error(f"Error parsing matrix sheet: {str(e)}")
            self.validation_errors.append(f"Error parsing matrix sheet: {str(e)}")
            return []
    
    def parse_matrix_detail(self):
        """
        Parse the matrix_detail sheet for more detailed cost information
        Returns a list of detail entries
        """
        if MATRIX_DETAIL_SHEET not in self.workbook.sheet_names:
            logger.info("No matrix_detail sheet found")
            return []
            
        logger.info("Parsing matrix_detail sheet...")
        
        try:
            # Load the matrix_detail sheet
            df = self.workbook.parse(MATRIX_DETAIL_SHEET)
            
            # Basic data cleaning
            df = df.replace([np.inf, -np.inf], np.nan)
            df = df.dropna(how='all')
            
            # Standardize column names if present
            if not df.empty:
                df.columns = [str(col).lower().strip() for col in df.columns]
                
                # Map standard column names
                column_mapping = {
                    'matrix_id': ['matrix_id', 'matrix id', 'id', 'matrix'],
                    'matrix_yr': ['matrix_yr', 'matrix year', 'year', 'yr'],
                    'building_type': ['building_type', 'buildingtype', 'building', 'type'],
                    'region': ['region', 'region_code', 'region code', 'location', 'area'],
                    'quality_grade': ['quality_grade', 'quality', 'grade'],
                    'stories': ['stories', 'story', 'floors'],
                    'condition': ['condition', 'condition_factor', 'condition factor'],
                    'base_cost': ['base_cost', 'basecost', 'cost', 'base'],
                    'occupancy_type': ['occupancy_type', 'occupancy', 'use_type', 'use type']
                }
                
                # Create a mapping from actual column names to standardized names
                actual_mapping = {}
                for std_col, possible_names in column_mapping.items():
                    for col in df.columns:
                        if any(name in col for name in possible_names):
                            actual_mapping[col] = std_col
                            break
                
                # Rename columns based on the mapping
                if actual_mapping:
                    df = df.rename(columns=actual_mapping)
            
            detail_entries = []
            
            # Process each row into a detail entry
            for _, row in df.iterrows():
                try:
                    # Create a basic detail entry with defaults
                    entry = {
                        "matrixId": 1,  # Default ID, will be replaced on import
                        "matrixYear": self.matrix_year,
                        "buildingType": "",
                        "region": "",
                        "qualityGrade": "Average",
                        "stories": "1",
                        "condition": "Average",
                        "baseCost": "0",
                        "occupancyType": "Standard",
                        "adjustmentFactor": "1.0"
                    }
                    
                    # Update with available data
                    for col in df.columns:
                        std_col = actual_mapping.get(col, col)
                        if pd.notna(row[col]):
                            value = row[col]
                            
                            # Map column to entry field
                            if std_col == 'matrix_id':
                                entry["matrixId"] = int(value) if isinstance(value, (int, float)) else 1
                            elif std_col == 'matrix_yr':
                                entry["matrixYear"] = int(value) if isinstance(value, (int, float)) else self.matrix_year
                            elif std_col == 'building_type':
                                entry["buildingType"] = str(value).strip()
                            elif std_col == 'region':
                                region = str(value).strip()
                                entry["region"] = self.region_codes.get(region, region)
                            elif std_col == 'quality_grade':
                                entry["qualityGrade"] = str(value).strip()
                            elif std_col == 'stories':
                                entry["stories"] = str(int(value)) if isinstance(value, (int, float)) else str(value).strip()
                            elif std_col == 'condition':
                                entry["condition"] = str(value).strip()
                            elif std_col == 'base_cost':
                                entry["baseCost"] = str(value)
                            elif std_col == 'occupancy_type':
                                entry["occupancyType"] = str(value).strip()
                    
                    # Only include rows that have at least building type and region
                    if entry["buildingType"] and entry["region"]:
                        detail_entries.append(entry)
                    
                except Exception as e:
                    logger.warning(f"Error processing detail row: {str(e)}")
                    continue
            
            logger.info(f"Extracted {len(detail_entries)} detail entries")
            return detail_entries
                
        except Exception as e:
            logger.error(f"Error parsing matrix_detail sheet: {str(e)}")
            self.validation_errors.append(f"Error parsing matrix_detail sheet: {str(e)}")
            return []
    
    def parse(self):
        """Parse the Excel file and return a structured dataset"""
        if self.validation_errors:
            logger.warning(f"Validation errors found: {len(self.validation_errors)}")
        
        # Parse main matrix for base cost data
        matrix_entries = self.parse_matrix()
        
        # Parse detailed matrix if available
        detail_entries = self.parse_matrix_detail()
        
        # Combine entries if both available
        if matrix_entries and detail_entries:
            # Use matrix entries as base and enhance with detail data where available
            for entry in matrix_entries:
                matching_details = [
                    d for d in detail_entries 
                    if d["buildingType"] == entry["buildingType"] and 
                    d["region"] == entry["region"]
                ]
                
                if matching_details:
                    # Update with the first matching detail's additional fields
                    detail = matching_details[0]
                    for key, value in detail.items():
                        if key not in ["buildingType", "region"] and value:
                            entry[key] = value
        
        # Return matrix_entries if available, otherwise use detail_entries
        result = matrix_entries if matrix_entries else detail_entries
        
        logger.info(f"Parsing complete. Extracted {len(result)} total entries")
        
        return {
            "data": result,
            "metadata": {
                "fileProcessed": os.path.basename(self.file_path),
                "matrixYear": self.matrix_year,
                "processedAt": datetime.now().isoformat(),
                "buildingTypeCount": len(set(entry["buildingType"] for entry in result)),
                "regionCount": len(set(entry["region"] for entry in result)),
                "totalEntries": len(result),
                "validationErrors": self.validation_errors
            }
        }

def main():
    parser = argparse.ArgumentParser(description="Parse Excel files containing cost matrix data")
    parser.add_argument("file_path", help="Path to Excel file")
    parser.add_argument("--output", help="Output file path (defaults to stdout)")
    parser.add_argument("--validate-only", action="store_true", help="Only validate the file without parsing")
    parser.add_argument("--detailed-errors", action="store_true", help="Include detailed error information")
    parser.add_argument("--strict", action="store_true", help="Apply stricter validation rules")
    parser.add_argument("--check-data-types", action="store_true", help="Validate data types in each column")
    
    args = parser.parse_args()
    
    try:
        # Parse the Excel file
        excel_parser = EnhancedExcelParser(args.file_path)
        
        if args.validate_only:
            # Only perform validation
            excel_parser._validate_workbook_structure()
            validation_result = {
                "success": len(excel_parser.validation_errors) == 0,
                "errors": excel_parser.validation_errors,
                "warnings": [],
                "sheets": list(excel_parser.workbook.sheet_names) if excel_parser.workbook else [],
                "rowCount": 0,
                "year": excel_parser.matrix_year,
                "detectedTypes": list(excel_parser.building_types.keys()) if excel_parser.building_types else [],
                "detectedRegions": list(excel_parser.region_codes.keys()) if excel_parser.region_codes else []
            }
            print(json.dumps(validation_result))
            sys.exit(0 if validation_result["success"] else 1)
        else:
            # Full parsing
            result = excel_parser.parse()
            
            # Output the result
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(result, f, indent=2)
                logger.info(f"Output written to {args.output}")
            else:
                print(json.dumps(result, indent=2))
                
            if excel_parser.validation_errors:
                logger.warning(f"Completed with {len(excel_parser.validation_errors)} validation errors")
                sys.exit(1)
            else:
                logger.info("Parsing completed successfully")
                sys.exit(0)
            
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error: {error_msg}")
        
        if args.validate_only:
            error_result = {
                "success": False,
                "errors": [error_msg],
                "warnings": []
            }
            print(json.dumps(error_result))
            
        sys.exit(1)

if __name__ == "__main__":
    main()