import pandas as pd
import json

# Read the Excel file
try:
    excel_file = 'attached_assets/Cost Matrix 2025.xlsx'
    # Try to read all sheets from the file
    xls = pd.ExcelFile(excel_file)
    
    print(f"Available sheets: {xls.sheet_names}")
    
    # Store data from each sheet
    data = {}
    for sheet_name in xls.sheet_names:
        try:
            sheet_data = pd.read_excel(excel_file, sheet_name=sheet_name)
            # Convert to dictionary for easier inspection
            data[sheet_name] = sheet_data.head(10).to_dict(orient='records')
            print(f"\nSample data from sheet '{sheet_name}':")
            print(sheet_data.head(5))
            print(f"Columns in '{sheet_name}': {sheet_data.columns.tolist()}")
        except Exception as e:
            print(f"Error reading sheet '{sheet_name}': {e}")
    
    # Save a summary of the data structure
    with open('benton_county_data_summary.json', 'w') as f:
        # Convert DataFrame fragments to lists for JSON serialization
        json_data = {}
        for sheet, sheet_data in data.items():
            json_data[sheet] = sheet_data
        json.dump(json_data, f, indent=2, default=str)
        
except Exception as e:
    print(f"Error processing Excel file: {e}")