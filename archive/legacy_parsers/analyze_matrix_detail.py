#!/usr/bin/env python3
"""
Matrix Detail Sheet Analyzer for Benton County, Washington Cost Matrix

This script analyzes the 'matrix_detail' sheet to understand the cost structure.
"""

import pandas as pd

def analyze_matrix_detail(file_path):
    """Analyze the matrix_detail sheet in the Excel file."""
    try:
        # Read the 'matrix_detail' sheet
        print(f"Reading 'matrix_detail' sheet from: {file_path}")
        df = pd.read_excel(file_path, sheet_name='matrix_detail')
        
        # Print basic information
        print(f"\nMatrix Detail Sheet Overview:")
        print(f"  Rows: {df.shape[0]}")
        print(f"  Columns: {df.shape[1]}")
        
        # Print column names
        print(f"\nColumns:")
        for col in df.columns:
            print(f"  - {col}")
        
        # Show sample data
        print(f"\nSample matrix detail data (5 rows):")
        sample = df.head(5).to_string()
        for line in sample.split('\n'):
            print(f"  {line}")
        
        # Analyze matrix_id distribution
        if 'matrix_id' in df.columns:
            matrix_ids = df['matrix_id'].unique()
            print(f"\nUnique matrix_id values: {len(matrix_ids)} ({matrix_ids[:10]}{'...' if len(matrix_ids) > 10 else ''})")
            
            # Count entries per matrix_id
            counts = df['matrix_id'].value_counts().head(10)
            print(f"\nEntries per matrix_id (top 10):")
            for matrix_id, count in counts.items():
                print(f"  matrix_id {matrix_id}: {count} entries")
        
        # Look for value columns
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        potential_value_cols = [col for col in numeric_cols if 'value' in str(col).lower()]
        
        if potential_value_cols:
            print(f"\nValue columns: {potential_value_cols}")
            for col in potential_value_cols:
                non_null = df[col].count()
                min_val = df[col].min()
                max_val = df[col].max()
                avg_val = df[col].mean()
                print(f"  {col}: {non_null} non-null values, range {min_val} to {max_val}, avg {avg_val:.2f}")
        
        # Check for regions and building types
        if 'axis_1_value' in df.columns and 'axis_2_value' in df.columns:
            print(f"\nSample axis values (first 10 rows):")
            print(df[['matrix_id', 'axis_1_value', 'axis_2_value', 'cell_value']].head(10))
            
            # Count unique axis value combinations
            print(f"\nUnique value combinations count: {df.groupby(['axis_1_value', 'axis_2_value']).ngroups}")
        
        # Now let's join with the matrix table to get more information
        print(f"\nJoining with matrix table for context...")
        try:
            matrix_df = pd.read_excel(file_path, sheet_name='matrix')
            merged = pd.merge(df, matrix_df[['matrix_id', 'matrix_description', 'axis_1', 'axis_2']], 
                             on='matrix_id', how='left')
            
            print(f"\nSample joined data (5 rows):")
            sample_cols = ['matrix_id', 'matrix_description', 'axis_1', 'axis_2', 
                          'axis_1_value', 'axis_2_value', 'cell_value']
            sample = merged[sample_cols].head(5).to_string()
            for line in sample.split('\n'):
                print(f"  {line}")
                
            # Let's find some specific examples for building types or regions
            print(f"\nLooking for building types and regions...")
            
            # Extract potential region/building info from descriptions
            if 'matrix_description' in merged.columns:
                descriptions = merged['matrix_description'].dropna().unique()
                
                # Look for patterns in descriptions
                print("\nUnique descriptions (first 20):")
                for desc in sorted(descriptions)[:20]:
                    print(f"  - {desc}")
                
                # Try to extract location codes
                location_codes = set()
                for desc in descriptions:
                    if isinstance(desc, str) and ' - ' in desc:
                        parts = desc.split(' - ')
                        if len(parts) > 1:
                            location = parts[1].strip()
                            if location and len(location) <= 15:  # Reasonable length for a code
                                location_codes.add(location)
                
                print(f"\nPotential location codes: {sorted(location_codes)}")
            
        except Exception as e:
            print(f"Error joining tables: {str(e)}")
        
    except Exception as e:
        print(f"Error analyzing matrix_detail sheet: {str(e)}")

if __name__ == "__main__":
    excel_file = "attached_assets/Cost Matrix 2025.xlsx"
    analyze_matrix_detail(excel_file)