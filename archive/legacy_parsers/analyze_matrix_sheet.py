#!/usr/bin/env python3
"""
Matrix Sheet Analyzer for Benton County, Washington Cost Matrix

This script analyzes the 'matrix' sheet specifically to understand its structure and content.
"""

import pandas as pd

def analyze_matrix_sheet(file_path):
    """Analyze the matrix sheet in the Excel file."""
    try:
        # Read the 'matrix' sheet
        print(f"Reading 'matrix' sheet from: {file_path}")
        df = pd.read_excel(file_path, sheet_name='matrix')
        
        # Print basic information
        print(f"\nMatrix Sheet Overview:")
        print(f"  Rows: {df.shape[0]}")
        print(f"  Columns: {df.shape[1]}")
        
        # Show years in the matrix
        if 'matrix_yr' in df.columns:
            years = df['matrix_yr'].unique()
            print(f"\nYears in matrix: {sorted(years)}")
        
        # Show matrix types
        if 'matrix_type' in df.columns:
            types = df['matrix_type'].unique()
            print(f"Matrix types: {types}")
        
        # Show matrix labels
        if 'label' in df.columns:
            labels = df['label'].unique()
            print(f"Labels: {labels[:10]}{'...' if len(labels) > 10 else ''}")
        
        # Check for region information
        region_cols = [col for col in df.columns if 'region' in str(col).lower()]
        if region_cols:
            print(f"\nRegion columns: {region_cols}")
            for col in region_cols:
                values = df[col].unique()
                print(f"  {col} values: {values[:10]}{'...' if len(values) > 10 else ''}")
        
        # Check for building type information
        building_cols = [col for col in df.columns if any(term in str(col).lower() for term in ['building', 'type', 'class'])]
        if building_cols:
            print(f"\nBuilding type columns: {building_cols}")
            for col in building_cols:
                values = df[col].unique()
                print(f"  {col} values: {values[:10]}{'...' if len(values) > 10 else ''}")
        
        # Look for location information in descriptions
        if 'matrix_description' in df.columns:
            print(f"\nAnalyzing matrix descriptions for location information:")
            descriptions = df['matrix_description'].unique()
            locations = set()
            for desc in descriptions:
                if isinstance(desc, str):
                    parts = desc.split('-')
                    if len(parts) > 1:
                        locations.add(parts[1].strip())
            
            print(f"  Potential locations: {sorted(locations)}")
        
        # Show some sample rows
        print(f"\nSample matrix data (5 rows):")
        sample = df.head(5).to_string()
        for line in sample.split('\n'):
            print(f"  {line}")
        
        # Look for any column that might have cost values
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        potential_cost_cols = [col for col in numeric_cols if col not in ['matrix_id', 'matrix_yr', 'matrix_order']]
        
        if potential_cost_cols:
            print(f"\nPotential cost value columns: {potential_cost_cols}")
            for col in potential_cost_cols:
                min_val = df[col].min()
                max_val = df[col].max()
                print(f"  {col}: Range {min_val} to {max_val}")
        
        print("\nMatrix axis analysis:")
        if 'axis_1' in df.columns and 'axis_2' in df.columns:
            axis1_values = df['axis_1'].unique()
            axis2_values = df['axis_2'].unique()
            print(f"  axis_1 unique values: {axis1_values}")
            print(f"  axis_2 unique values: {axis2_values}")
        
        # Check related sheets
        print("\nRelated matrix sheets to check:")
        print("  - matrix_detail (likely contains the actual cost values)")
        print("  - matrix_axis_detail (contains axis information)")
        print("  - RES_base_feature_matrix_mapped (might contain residential building features)")
        
    except Exception as e:
        print(f"Error analyzing matrix sheet: {str(e)}")

if __name__ == "__main__":
    excel_file = "attached_assets/Cost Matrix 2025.xlsx"
    analyze_matrix_sheet(excel_file)