#!/usr/bin/env python3
"""
Enhanced Excel Parser for Benton County, Washington Cost Matrix

This module provides an enhanced parser for Excel files containing cost matrix data.
Features include:
- Better error handling and validation
- Support for more complex Excel formats
- Progress tracking during import
- Detailed error reporting
"""

import os
import re
import json
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Callable, Optional, Any, Union


class EnhancedExcelParser:
    """Enhanced parser for Excel files containing cost matrix data"""
    
    # Required columns for different sheets
    REQUIRED_COLUMNS = {
        'matrix': ['matrix_id', 'matrix_description'],
        'matrix_detail': ['matrix_id', 'cell_value'],
    }
    
    def __init__(self, excel_file_path: str):
        """
        Initialize the parser with the Excel file path
        
        Args:
            excel_file_path: Path to the Excel file to parse
        """
        self.excel_file_path = excel_file_path
        self.matrix_year = self._extract_year_from_filename(excel_file_path)
        self.regions = []
        self.building_types = []
        self.matrix_data = []
        self.errors = []
        self.warnings = []
        self.progress = 0
        
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
        
    def _extract_year_from_filename(self, filename: str) -> int:
        """
        Extract year from filename if present, otherwise use current year.
        
        Args:
            filename: Path to the Excel file
            
        Returns:
            int: Year extracted from filename or current year
        """
        try:
            # Try to extract year from filename (e.g., "Cost Matrix 2025.xlsx")
            basename = os.path.basename(filename)
            # Find all numbers in the filename
            numbers = [int(s) for s in re.findall(r'\d+', basename)]
            if numbers and len(str(numbers[0])) == 4:  # Assume 4-digit number is a year
                return numbers[0]
        except Exception as e:
            self.warnings.append(f"Could not extract year from filename: {str(e)}")
        
        # Default to current year if extraction fails
        return datetime.now().year
        
    def _detect_sheets(self) -> List[str]:
        """
        Detect sheets in the Excel file
        
        Returns:
            List[str]: List of sheet names
        """
        try:
            xl = pd.ExcelFile(self.excel_file_path)
            return xl.sheet_names
        except Exception as e:
            self.errors.append(f"Failed to detect sheets: {str(e)}")
            return []
            
    def _extract_region_from_description(self, description: str) -> Optional[str]:
        """
        Try to extract a region from the description.
        
        Args:
            description: Matrix description string
            
        Returns:
            Optional[str]: Extracted region or None
        """
        # For Benton County format: "PC - C01-Bing - * - T1"
        # Assign default region if no specific region is found
        if description.startswith('PC -'):
            # For this example, we'll map all PC codes to the Central Benton region
            # This is a simplification - real implementation would map PC codes to actual regions
            return 'Central Benton'
        
        # Check for exact matches
        for region in self.region_mapping.keys():
            if region.lower() in description.lower():
                return region
        
        # Check for regional keywords
        region_keywords = {
            'north': 'North Benton',
            'central': 'Central Benton',
            'south': 'South Benton',
            'west': 'West Benton',
            'east': 'East Benton',
            'richland': 'North Benton',
            'kennewick': 'Central Benton',
            'prosser': 'South Benton',
            'benton city': 'West Benton',
            'finley': 'East Benton'
        }
        
        for keyword, region in region_keywords.items():
            if keyword.lower() in description.lower():
                return region
        
        # If no region is found, use a default region
        return 'Central Benton'  # Default region
        
    def _extract_building_type_from_description(self, description: str) -> Optional[str]:
        """
        Try to extract a building type code from the description.
        
        Args:
            description: Matrix description string
            
        Returns:
            Optional[str]: Extracted building type code or None
        """
        # For Benton County format: "PC - C01-Bing - * - T1"
        if description.startswith('PC -'):
            parts = description.split('-')
            if len(parts) >= 2:
                # Extract building type from the second part (e.g., "C01" from "PC - C01-Bing")
                building_code = parts[1].strip().split('-')[0].strip()
                if building_code.startswith('C'):
                    return 'C1'  # Commercial
                elif building_code.startswith('I'):
                    return 'I1'  # Industrial
                elif building_code.startswith('R'):
                    return 'R1'  # Residential
                elif building_code.startswith('A'):
                    return 'A1'  # Agricultural
                elif building_code.startswith('O'):
                    return 'C2'  # Office (map to Commercial Office)
                else:
                    # Default to commercial if we can't determine
                    return 'C1'
        
        # Check for building type codes in description
        match = self.description_pattern.search(description)
        if match:
            type_code = match.group(1)
            # Validate against known building type codes
            for code in self.building_type_mapping.keys():
                if code.startswith(type_code):
                    return code
        
        # Check for keywords
        type_keywords = {
            'residential': 'R1',
            'single family': 'R1',
            'multi-family': 'R2',
            'apartment': 'R2',
            'commercial': 'C1',
            'retail': 'C1',
            'office': 'C2',
            'restaurant': 'C3',
            'warehouse': 'C4',
            'industrial': 'I1',
            'manufacturing': 'I1',
            'processing': 'I2',
            'agricultural': 'A1',
            'farm': 'A1',
            'ranch': 'A2',
            'hospital': 'S1',
            'school': 'S2'
        }
        
        for keyword, code in type_keywords.items():
            if keyword.lower() in description.lower():
                return code
        
        # If we can't determine the building type, use a default
        return 'C1'  # Default to Commercial Retail
        
    def _validate_sheet_data(self, sheet_name: str, required_columns: List[str]) -> Dict:
        """
        Validate that a sheet contains the required columns
        
        Args:
            sheet_name: Name of the sheet to validate
            required_columns: List of required column names
            
        Returns:
            Dict: Validation result with 'valid' boolean and 'errors' list
        """
        result = {
            'valid': True,
            'errors': []
        }
        
        try:
            # Read just the header row to get column names
            df = pd.read_excel(self.excel_file_path, sheet_name=sheet_name, nrows=0)
            
            # Check for required columns
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                result['valid'] = False
                result['errors'].append(f"Missing required columns in {sheet_name} sheet: {', '.join(missing_columns)}")
                
        except Exception as e:
            result['valid'] = False
            result['errors'].append(f"Error validating {sheet_name} sheet: {str(e)}")
            
        return result
        
    def _update_progress(self, progress: float, callback: Optional[Callable] = None):
        """
        Update progress and call the progress callback if provided
        
        Args:
            progress: Progress value between 0 and 100
            callback: Optional callback function to call with progress
        """
        self.progress = min(100, max(0, progress))  # Clamp to 0-100
        if callback:
            callback(self.progress)
            
    def parse(self, progress_callback: Optional[Callable] = None) -> Dict:
        """
        Parse the Excel file and extract the cost matrix data
        
        Args:
            progress_callback: Optional callback function to report progress
            
        Returns:
            Dict: Result containing success status, data, and any errors
        """
        try:
            # Start progress at 0
            self._update_progress(0, progress_callback)
            
            # Check if file exists
            if not os.path.exists(self.excel_file_path):
                self.errors.append(f"File not found: {self.excel_file_path}")
                return self._build_result(False)
                
            # Detect sheets
            sheets = self._detect_sheets()
            if not sheets:
                self.errors.append("No sheets found in the Excel file")
                return self._build_result(False)
                
            self._update_progress(10, progress_callback)
            
            # Look for the main matrix sheets
            matrix_sheet = next((s for s in sheets if s.lower() == 'matrix'), None)
            matrix_detail_sheet = next((s for s in sheets if s.lower() == 'matrix_detail'), None)
            
            # If we can't find the expected sheets, try to detect them
            if not matrix_sheet or not matrix_detail_sheet:
                for sheet in sheets:
                    if any(keyword in sheet.lower() for keyword in ['matrix', 'cost', 'rate']):
                        if not matrix_sheet:
                            matrix_sheet = sheet
                        elif not matrix_detail_sheet:
                            matrix_detail_sheet = sheet
                            
            # Validate that we have the required sheets
            if not matrix_sheet:
                self.errors.append("Could not find matrix sheet in the Excel file")
                return self._build_result(False)
                
            if not matrix_detail_sheet:
                self.errors.append("Could not find matrix_detail sheet in the Excel file")
                return self._build_result(False)
                
            self._update_progress(20, progress_callback)
            
            # Validate sheet data
            matrix_validation = self._validate_sheet_data(matrix_sheet, self.REQUIRED_COLUMNS['matrix'])
            if not matrix_validation['valid']:
                self.errors.extend(matrix_validation['errors'])
                return self._build_result(False)
                
            matrix_detail_validation = self._validate_sheet_data(matrix_detail_sheet, self.REQUIRED_COLUMNS['matrix_detail'])
            if not matrix_detail_validation['valid']:
                self.errors.extend(matrix_detail_validation['errors'])
                return self._build_result(False)
                
            self._update_progress(30, progress_callback)
            
            # Read the matrix sheet to get the matrix definitions
            matrix_df = pd.read_excel(self.excel_file_path, sheet_name=matrix_sheet)
            
            # Read the matrix_detail sheet to get the cost values
            detail_df = pd.read_excel(self.excel_file_path, sheet_name=matrix_detail_sheet)
            
            self._update_progress(50, progress_callback)
            
            # Join the two dataframes on matrix_id
            try:
                joined_df = pd.merge(
                    detail_df, 
                    matrix_df[['matrix_id', 'matrix_description', 'axis_1', 'axis_2']], 
                    on='matrix_id', 
                    how='left'
                )
            except Exception as e:
                self.errors.append(f"Failed to join matrix sheets: {str(e)}")
                return self._build_result(False)
                
            self._update_progress(60, progress_callback)
            
            # Find all unique regions and building types from the data
            unique_descriptions = joined_df['matrix_description'].dropna().unique()
            
            # Extract potential regions and building types
            extracted_regions = set()
            extracted_building_types = set()
            
            for desc in unique_descriptions:
                if isinstance(desc, str):
                    region = self._extract_region_from_description(desc)
                    if region:
                        extracted_regions.add(region)
                    
                    building_type = self._extract_building_type_from_description(desc)
                    if building_type:
                        extracted_building_types.add(building_type)
            
            # Update the regions and building types properties
            self.regions = list(extracted_regions)
            self.building_types = list(extracted_building_types)
            
            self._update_progress(70, progress_callback)
            
            # Process each matrix
            total_matrices = len(unique_descriptions)
            for i, matrix_desc in enumerate(unique_descriptions):
                try:
                    if not isinstance(matrix_desc, str):
                        continue
                        
                    region = self._extract_region_from_description(matrix_desc)
                    building_type = self._extract_building_type_from_description(matrix_desc)
                    
                    if not region or not building_type:
                        self.warnings.append(f"Could not extract region or building type from description: {matrix_desc}")
                        continue
                    
                    # Get matrix data for this description
                    matrix_rows = joined_df[joined_df['matrix_description'] == matrix_desc]
                    
                    if matrix_rows.empty:
                        self.warnings.append(f"No data found for matrix: {matrix_desc}")
                        continue
                    
                    # Get matrix ID
                    matrix_id = matrix_rows['matrix_id'].iloc[0]
                    
                    # Extract min and max values for this matrix
                    valid_values = matrix_rows['cell_value'].dropna()
                    if not valid_values.empty:
                        min_cost = float(valid_values.min())
                        max_cost = float(valid_values.max())
                        base_cost = float(valid_values.mean())
                    else:
                        min_cost = 0.0
                        max_cost = 0.0
                        base_cost = 0.0
                    
                    # Create the matrix entry
                    matrix_entry = {
                        "region": region,
                        "buildingType": building_type,
                        "buildingTypeDescription": self.building_type_mapping.get(building_type, building_type),
                        "sourceMatrixId": int(matrix_id),
                        "matrixDescription": matrix_desc,
                        "matrixYear": self.matrix_year,
                        "baseCost": base_cost,
                        "minCost": min_cost,
                        "maxCost": max_cost,
                        "dataPoints": len(matrix_rows),
                        "adjustmentFactors": {
                            "complexity": 1.0,
                            "quality": 1.0,
                            "condition": 1.0
                        }
                    }
                    self.matrix_data.append(matrix_entry)
                    
                    # Update progress for each matrix processed
                    progress_pct = 70 + (i / total_matrices * 30)
                    self._update_progress(progress_pct, progress_callback)
                    
                except Exception as e:
                    self.errors.append(f"Error processing matrix {matrix_desc}: {str(e)}")
            
            # Final progress update
            self._update_progress(100, progress_callback)
            
            # Return the result
            return self._build_result(len(self.matrix_data) > 0)
            
        except Exception as e:
            self.errors.append(f"Failed to parse Excel file: {str(e)}")
            return self._build_result(False)
            
    def _build_result(self, success: bool) -> Dict:
        """
        Build the result dictionary
        
        Args:
            success: Whether the parsing was successful
            
        Returns:
            Dict: Result dictionary with all data
        """
        # Detect building types and regions before returning result
        descriptions = [item.get('description', '') for item in self.matrix_data if isinstance(item, dict)]
        detected_types = self.detect_building_types(descriptions)
        detected_regions = self.detect_regions(descriptions)
        
        return {
            "success": success,
            "data": self.matrix_data,
            "regions": self.regions,
            "buildingTypes": self.building_types,
            "matrixYear": self.matrix_year,
            "errors": self.errors,
            "warnings": self.warnings,
            "progress": self.progress,
            "rowCount": len(self.matrix_data),
            "detectedTypes": detected_types,
            "detectedRegions": detected_regions
        }
        
    def detect_building_types(self, descriptions: List[str]) -> List[str]:
        """
        Detect building types from matrix descriptions.
        
        Args:
            descriptions: List of matrix description strings
            
        Returns:
            List[str]: Detected building types
        """
        detected_types = set()
        
        # Try to extract from descriptions
        for description in descriptions:
            if description:
                building_type = self._extract_building_type_from_description(description)
                if building_type:
                    # Map to standard building type names for the application
                    type_map = {
                        'R1': 'RESIDENTIAL',
                        'R2': 'RESIDENTIAL',
                        'R3': 'RESIDENTIAL',
                        'C1': 'COMMERCIAL',
                        'C2': 'COMMERCIAL',
                        'C3': 'COMMERCIAL',
                        'C4': 'COMMERCIAL',
                        'I1': 'INDUSTRIAL',
                        'I2': 'INDUSTRIAL',
                        'A1': 'AGRICULTURAL',
                        'A2': 'AGRICULTURAL',
                        'S1': 'HEALTHCARE',
                        'S2': 'EDUCATIONAL'
                    }
                    standardized_type = type_map.get(building_type, 'COMMERCIAL')
                    detected_types.add(standardized_type)
                
        # If no types detected, use common defaults
        if not detected_types:
            detected_types = {'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'}
            
        return sorted(list(detected_types))
        
    def detect_regions(self, descriptions: List[str]) -> List[str]:
        """
        Detect regions from matrix descriptions.
        
        Args:
            descriptions: List of matrix description strings
            
        Returns:
            List[str]: Detected regions
        """
        detected_regions = set()
        
        # Try to extract from descriptions
        for description in descriptions:
            if description:
                region = self._extract_region_from_description(description)
                if region:
                    # Map to standard region names
                    region_map = {
                        'North Benton': 'Benton',
                        'Central Benton': 'Benton',
                        'South Benton': 'Benton',
                        'West Benton': 'Benton',
                        'East Benton': 'Benton',
                        'Richland': 'Richland',
                        'Kennewick': 'Kennewick',
                        'Prosser': 'Prosser',
                        'Benton City': 'Benton City'
                    }
                    standardized_region = region_map.get(region, 'Benton')
                    detected_regions.add(standardized_region)
                
        # If no regions detected, use Benton County defaults
        if not detected_regions:
            detected_regions = {
                'Benton', 'Richland', 'Kennewick', 
                'Pasco', 'West Richland', 'Prosser', 'Benton City'
            }
            
        return sorted(list(detected_regions))


def main():
    """Main function for command-line usage"""
    import sys
    
    # Check arguments
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <excel_file> [output_file]")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Progress callback
    def progress_callback(progress):
        print(f"Progress: {progress:.1f}%", end="\r")
    
    # Parse the Excel file
    parser = EnhancedExcelParser(excel_file)
    result = parser.parse(progress_callback=progress_callback)
    
    # Print summary
    print("\nProcessing complete:")
    print(f"  Success: {result['success']}")
    print(f"  Regions found: {len(result['regions'])}: {', '.join(result['regions'])}")
    print(f"  Building types found: {len(result['buildingTypes'])}: {', '.join(result['buildingTypes'])}")
    print(f"  Auto-detected regions: {', '.join(result['detectedRegions'])}")
    print(f"  Auto-detected building types: {', '.join(result['detectedTypes'])}")
    print(f"  Matrix entries: {result['rowCount']}")
    
    if result['errors']:
        print(f"  Errors: {len(result['errors'])}")
        for error in result['errors'][:5]:  # Show first 5 errors
            print(f"    - {error}")
        if len(result['errors']) > 5:
            print(f"    ... and {len(result['errors']) - 5} more errors")
            
    if result['warnings']:
        print(f"  Warnings: {len(result['warnings'])}")
        for warning in result['warnings'][:5]:  # Show first 5 warnings
            print(f"    - {warning}")
        if len(result['warnings']) > 5:
            print(f"    ... and {len(result['warnings']) - 5} more warnings")
    
    # Output the result
    if output_file:
        with open(output_file, 'w') as f:
            # Convert numpy and other non-serializable types
            def convert_to_serializable(obj):
                if isinstance(obj, (np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64)):
                    return int(obj)
                elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
                    return float(obj)
                elif isinstance(obj, np.ndarray):
                    return obj.tolist()
                else:
                    return obj
            
            # Use custom serializer for numpy types
            class NumpyEncoder(json.JSONEncoder):
                def default(self, obj):
                    return convert_to_serializable(obj)
            
            json.dump(result, f, indent=2, cls=NumpyEncoder)
        print(f"  Output written to: {output_file}")
    else:
        # Print the data to stdout if no output file specified
        print("\nExtracted data:")
        for i, entry in enumerate(result['data'][:3]):  # Show first 3 entries
            print(f"  [{i+1}] {entry['region']} / {entry['buildingType']}: ${entry['baseCost']:.2f}")
        if len(result['data']) > 3:
            print(f"  ... and {len(result['data']) - 3} more entries")


if __name__ == "__main__":
    main()