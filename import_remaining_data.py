"""
Remaining Property Data Import Script

This script imports property-related data (improvements, improvement details, etc.)
from CSV files in the attached_assets folder directly into the PostgreSQL database.
It skips properties that already exist and focuses on the related data.
"""
import os
import csv
import psycopg2
from datetime import datetime

# Get database connection string from environment variable
DATABASE_URL = os.environ.get('DATABASE_URL')

# Maximum number of records to import from each file
MAX_RECORDS = 500

def connect_to_db():
    """Connect to the PostgreSQL database"""
    print(f"Connecting to database...")
    return psycopg2.connect(DATABASE_URL)

def get_existing_property_ids(conn):
    """Get list of property IDs that already exist in the database"""
    cursor = conn.cursor()
    cursor.execute("SELECT prop_id FROM properties")
    return [row[0] for row in cursor.fetchall()]

def import_improvements(conn, file_path, existing_property_ids):
    """Import improvements from CSV file"""
    print(f"Importing improvements from {file_path}...")
    
    cursor = conn.cursor()
    count = 0
    
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            if count >= MAX_RECORDS:
                break
                
            now = datetime.now()
            
            # Default to lowercase column names if uppercase not found
            prop_id = row.get('prop_id', row.get('PROP_ID', '0'))
            imprv_id = row.get('imprv_id', row.get('IMPRV_ID', '0'))
            
            # Skip if property ID doesn't exist in database
            if int(prop_id) not in existing_property_ids:
                continue
            
            try:
                cursor.execute("""
                    INSERT INTO improvements (
                        imported_at,
                        updated_at,
                        prop_id,
                        imprv_id,
                        imprv_desc,
                        imprv_val,
                        living_area,
                        primary_use_cd,
                        stories,
                        actual_year_built,
                        total_area
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    ON CONFLICT (prop_id, imprv_id) DO NOTHING
                """, (
                    now,
                    now,
                    int(prop_id) if prop_id and prop_id.isdigit() else None,
                    int(imprv_id) if imprv_id and imprv_id.isdigit() else None,
                    row.get('imprv_desc', row.get('IMPRV_DESC', None)),
                    row.get('imprv_val', row.get('IMPRV_VAL', None)),
                    row.get('living_area', row.get('LIVING_AREA', None)),
                    row.get('primary_use_cd', row.get('PRIMARY_USE_CD', None)),
                    row.get('stories', row.get('STORIES', None)),
                    row.get('actual_year_built', row.get('ACTUAL_YEAR_BUILT', None)),
                    row.get('total_area', row.get('TOTAL_AREA', None))
                ))
                count += 1
                
                # Commit every 100 records
                if count % 100 == 0:
                    conn.commit()
                    print(f"Committed {count} improvements")
                    
            except Exception as e:
                print(f"Error importing improvement {imprv_id} for property {prop_id}: {e}")
                continue
    
    # Final commit
    conn.commit()
    print(f"Imported {count} improvements")
    return count

def import_improvement_details(conn, file_path, existing_property_ids):
    """Import improvement details from CSV file"""
    print(f"Importing improvement details from {file_path}...")
    
    cursor = conn.cursor()
    count = 0
    
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            if count >= MAX_RECORDS:
                break
                
            now = datetime.now()
            
            # Default to lowercase column names if uppercase not found
            prop_id = row.get('prop_id', row.get('PROP_ID', '0'))
            imprv_id = row.get('imprv_id', row.get('IMPRV_ID', '0'))
            
            # Skip if property ID doesn't exist in database
            if int(prop_id) not in existing_property_ids:
                continue
            
            try:
                cursor.execute("""
                    INSERT INTO improvement_details (
                        imported_at,
                        updated_at,
                        prop_id,
                        imprv_id,
                        living_area,
                        below_grade_living_area,
                        condition_cd,
                        imprv_det_sub_class_cd,
                        yr_built,
                        actual_age,
                        num_stories,
                        imprv_det_type_cd,
                        imprv_det_desc,
                        imprv_det_area,
                        imprv_det_class_cd
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    ON CONFLICT (prop_id, imprv_id) DO NOTHING
                """, (
                    now,
                    now,
                    int(prop_id) if prop_id and prop_id.isdigit() else None,
                    int(imprv_id) if imprv_id and imprv_id.isdigit() else None,
                    row.get('living_area', row.get('LIVING_AREA', None)),
                    row.get('below_grade_living_area', row.get('BELOW_GRADE_LIVING_AREA', None)),
                    row.get('condition_cd', row.get('CONDITION_CD', None)),
                    row.get('imprv_det_sub_class_cd', row.get('IMPRV_DET_SUB_CLASS_CD', None)),
                    row.get('yr_built', row.get('YR_BUILT', None)),
                    row.get('actual_age', row.get('ACTUAL_AGE', None)),
                    row.get('num_stories', row.get('NUM_STORIES', None)),
                    row.get('imprv_det_type_cd', row.get('IMPRV_DET_TYPE_CD', None)),
                    row.get('imprv_det_desc', row.get('IMPRV_DET_DESC', None)),
                    row.get('imprv_det_area', row.get('IMPRV_DET_AREA', None)),
                    row.get('imprv_det_class_cd', row.get('IMPRV_DET_CLASS_CD', None))
                ))
                count += 1
                
                # Commit every 100 records
                if count % 100 == 0:
                    conn.commit()
                    print(f"Committed {count} improvement details")
                    
            except Exception as e:
                print(f"Error importing improvement detail for {imprv_id}: {e}")
                continue
    
    # Final commit
    conn.commit()
    print(f"Imported {count} improvement details")
    return count

def import_improvement_items(conn, file_path, existing_property_ids):
    """Import improvement items from CSV file"""
    print(f"Importing improvement items from {file_path}...")
    
    cursor = conn.cursor()
    count = 0
    
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            if count >= MAX_RECORDS:
                break
                
            now = datetime.now()
            
            # Default to lowercase column names if uppercase not found
            prop_id = row.get('prop_id', row.get('PROP_ID', '0'))
            imprv_id = row.get('imprv_id', row.get('IMPRV_ID', '0'))
            
            # Skip if property ID doesn't exist in database
            if int(prop_id) not in existing_property_ids:
                continue
            
            try:
                cursor.execute("""
                    INSERT INTO improvement_items (
                        imported_at,
                        updated_at,
                        prop_id,
                        imprv_id,
                        bedrooms,
                        baths,
                        half_bath,
                        foundation,
                        ext_wall,
                        roof,
                        heat,
                        ac,
                        fireplaces,
                        com_hvac
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    ON CONFLICT (prop_id, imprv_id) DO NOTHING
                """, (
                    now,
                    now,
                    int(prop_id) if prop_id and prop_id.isdigit() else None,
                    int(imprv_id) if imprv_id and imprv_id.isdigit() else None,
                    row.get('bedrooms', row.get('BEDROOMS', None)),
                    row.get('baths', row.get('BATHS', None)),
                    row.get('half_bath', row.get('HALF_BATH', None)),
                    row.get('foundation', row.get('FOUNDATION', None)),
                    row.get('ext_wall', row.get('EXT_WALL', None)),
                    row.get('roof', row.get('ROOF', None)),
                    row.get('heat', row.get('HEAT', None)),
                    row.get('ac', row.get('AC', None)),
                    row.get('fireplaces', row.get('FIREPLACES', None)),
                    row.get('com_hvac', row.get('COM_HVAC', None))
                ))
                count += 1
                
                # Commit every 100 records
                if count % 100 == 0:
                    conn.commit()
                    print(f"Committed {count} improvement items")
                    
            except Exception as e:
                print(f"Error importing improvement item for {imprv_id}: {e}")
                continue
    
    # Final commit
    conn.commit()
    print(f"Imported {count} improvement items")
    return count

def import_land_details(conn, file_path, existing_property_ids):
    """Import land details from CSV file"""
    print(f"Importing land details from {file_path}...")
    
    cursor = conn.cursor()
    count = 0
    
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            if count >= MAX_RECORDS:
                break
                
            now = datetime.now()
            
            # Default to lowercase column names if uppercase not found
            prop_id = row.get('prop_id', row.get('PROP_ID', '0'))
            
            # Skip if property ID doesn't exist in database
            if int(prop_id) not in existing_property_ids:
                continue
            
            try:
                cursor.execute("""
                    INSERT INTO land_details (
                        imported_at,
                        updated_at,
                        prop_id,
                        primary_use_cd,
                        size_acres,
                        size_square_feet,
                        land_type_cd,
                        land_soil_code,
                        ag_use_cd
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    ON CONFLICT (prop_id) DO NOTHING
                """, (
                    now,
                    now,
                    int(prop_id) if prop_id and prop_id.isdigit() else None,
                    row.get('primary_use_cd', row.get('PRIMARY_USE_CD', None)),
                    row.get('size_acres', row.get('SIZE_ACRES', None)),
                    row.get('size_square_feet', row.get('SIZE_SQUARE_FEET', None)),
                    row.get('land_type_cd', row.get('LAND_TYPE_CD', None)),
                    row.get('land_soil_code', row.get('LAND_SOIL_CODE', None)),
                    row.get('ag_use_cd', row.get('AG_USE_CD', None))
                ))
                count += 1
                
                # Commit every 100 records
                if count % 100 == 0:
                    conn.commit()
                    print(f"Committed {count} land details")
                    
            except Exception as e:
                print(f"Error importing land detail for property {prop_id}: {e}")
                continue
    
    # Final commit
    conn.commit()
    print(f"Imported {count} land details")
    return count

def main():
    """Main function to run the import process"""
    print("Starting remaining property data import from attached_assets directory...")
    
    # Define file paths
    assets_dir = 'attached_assets'
    improvements_file = os.path.join(assets_dir, 'imprv.csv')
    improvement_details_file = os.path.join(assets_dir, 'imprv_detail.csv')
    improvement_items_file = os.path.join(assets_dir, 'imprv_items.csv')
    land_details_file = os.path.join(assets_dir, 'land_detail.csv')
    
    # Verify all files exist
    files = [improvements_file, improvement_details_file, improvement_items_file, land_details_file]
    for file in files:
        if not os.path.exists(file):
            print(f"File not found: {file}")
            return
        size_mb = os.path.getsize(file) / (1024 * 1024)
        print(f"Found file: {file} ({size_mb:.2f} MB)")
    
    try:
        # Connect to the database
        conn = connect_to_db()
        
        # Get existing property IDs
        existing_property_ids = get_existing_property_ids(conn)
        print(f"Found {len(existing_property_ids)} existing properties in the database")
        
        # Record start time
        start_time = datetime.now()
        print(f"Import started at {start_time}")
        
        # Import data for existing properties
        improvement_count = import_improvements(conn, improvements_file, existing_property_ids)
        improvement_detail_count = import_improvement_details(conn, improvement_details_file, existing_property_ids)
        improvement_item_count = import_improvement_items(conn, improvement_items_file, existing_property_ids)
        land_detail_count = import_land_details(conn, land_details_file, existing_property_ids)
        
        # Record end time
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Print summary
        print("\nImport Summary:")
        print(f"Improvements: {improvement_count}")
        print(f"Improvement Details: {improvement_detail_count}")
        print(f"Improvement Items: {improvement_item_count}")
        print(f"Land Details: {land_detail_count}")
        print(f"\nTotal duration: {duration}")
        print(f"Import completed at: {end_time}")
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        print(f"Error during import process: {e}")
        return

if __name__ == "__main__":
    main()