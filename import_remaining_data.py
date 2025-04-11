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
MAX_RECORDS = 150

def connect_to_db():
    """Connect to the PostgreSQL database"""
    print(f"Connecting to database...")
    return psycopg2.connect(DATABASE_URL)

def get_existing_property_ids(conn):
    """Get list of property IDs that already exist in the database"""
    cursor = conn.cursor()
    cursor.execute("SELECT prop_id FROM properties")
    return [row[0] for row in cursor.fetchall()]

def clean_value(value):
    """Clean value to handle empty strings and convert to appropriate format"""
    if value is None or value == '':
        return None
    return value


def import_improvements(conn, file_path, existing_property_ids):
    """Import improvements from CSV file"""
    print(f"Importing improvements from {file_path}...")
    
    # First, let's roll back any pending transactions
    conn.rollback()
    
    cursor = conn.cursor()
    count = 0
    errors = 0
    
    # Get existing improvements to avoid duplicate inserts
    cursor.execute("SELECT prop_id, imprv_id FROM improvements")
    existing_improvements = [(row[0], row[1]) for row in cursor.fetchall()]
    print(f"Found {len(existing_improvements)} existing improvement records")
    
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
                
            # Skip if we already have a record for this property/improvement combo
            prop_id_int = int(prop_id) if prop_id and prop_id.isdigit() else None 
            imprv_id_int = int(imprv_id) if imprv_id and imprv_id.isdigit() else None
            if (prop_id_int, imprv_id_int) in existing_improvements:
                continue
            
            try:
                # Clean values
                imprv_desc = clean_value(row.get('imprv_desc', row.get('IMPRV_DESC', None)))
                imprv_val = clean_value(row.get('imprv_val', row.get('IMPRV_VAL', None)))
                living_area = clean_value(row.get('living_area', row.get('LIVING_AREA', None)))
                primary_use_cd = clean_value(row.get('primary_use_cd', row.get('PRIMARY_USE_CD', None)))
                stories = clean_value(row.get('stories', row.get('STORIES', None)))
                actual_year_built_str = clean_value(row.get('actual_year_built', row.get('ACTUAL_YEAR_BUILT', None)))
                
                # Convert year to integer if not None
                if actual_year_built_str is not None and actual_year_built_str.strip() != '':
                    try:
                        actual_year_built = int(float(actual_year_built_str))
                    except (ValueError, TypeError):
                        actual_year_built = None
                else:
                    actual_year_built = None
                    
                total_area = clean_value(row.get('total_area', row.get('TOTAL_AREA', None)))
                
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
                """, (
                    now,
                    now,
                    prop_id_int,
                    imprv_id_int,
                    imprv_desc,
                    imprv_val,
                    living_area,
                    primary_use_cd,
                    stories,
                    actual_year_built,
                    total_area
                ))
                count += 1
                
                # Commit every 100 records
                if count % 100 == 0:
                    conn.commit()
                    print(f"Committed {count} improvements")
                    
            except Exception as e:
                # Rollback the transaction on error
                conn.rollback()
                print(f"Error importing improvement {imprv_id} for property {prop_id}: {e}")
                errors += 1
                if errors > 10:
                    conn.rollback()
                    print("Too many errors, aborting.")
                    break
                continue
    
    # Final commit
    conn.commit()
    print(f"Imported {count} improvements with {errors} errors")
    return count

def import_improvement_details(conn, file_path, existing_property_ids):
    """Import improvement details from CSV file"""
    print(f"Importing improvement details from {file_path}...")
    
    # First, let's roll back any pending transactions
    conn.rollback()
    
    cursor = conn.cursor()
    count = 0
    errors = 0
    
    # Get existing improvement details to avoid duplicate inserts
    cursor.execute("SELECT prop_id, imprv_id FROM improvement_details")
    existing_imprv_details = [(row[0], row[1]) for row in cursor.fetchall()]
    print(f"Found {len(existing_imprv_details)} existing improvement detail records")
    
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
                
            # Skip if we already have a record for this property/improvement combo
            prop_id_int = int(prop_id) if prop_id and prop_id.isdigit() else None 
            imprv_id_int = int(imprv_id) if imprv_id and imprv_id.isdigit() else None
            if (prop_id_int, imprv_id_int) in existing_imprv_details:
                continue
            
            try:
                # Clean values
                living_area = clean_value(row.get('living_area', row.get('LIVING_AREA', None)))
                below_grade_living_area = clean_value(row.get('below_grade_living_area', row.get('BELOW_GRADE_LIVING_AREA', None)))
                condition_cd = clean_value(row.get('condition_cd', row.get('CONDITION_CD', None)))
                imprv_det_sub_class_cd = clean_value(row.get('imprv_det_sub_class_cd', row.get('IMPRV_DET_SUB_CLASS_CD', None)))
                yr_built = clean_value(row.get('yr_built', row.get('YR_BUILT', None)))
                actual_age = clean_value(row.get('actual_age', row.get('ACTUAL_AGE', None)))
                num_stories = clean_value(row.get('num_stories', row.get('NUM_STORIES', None)))
                imprv_det_type_cd = clean_value(row.get('imprv_det_type_cd', row.get('IMPRV_DET_TYPE_CD', None)))
                imprv_det_desc = clean_value(row.get('imprv_det_desc', row.get('IMPRV_DET_DESC', None)))
                imprv_det_area = clean_value(row.get('imprv_det_area', row.get('IMPRV_DET_AREA', None)))
                imprv_det_class_cd = clean_value(row.get('imprv_det_class_cd', row.get('IMPRV_DET_CLASS_CD', None)))
                
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
                """, (
                    now,
                    now,
                    prop_id_int,
                    imprv_id_int,
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
                ))
                count += 1
                
                # Commit every 100 records
                if count % 100 == 0:
                    conn.commit()
                    print(f"Committed {count} improvement details")
                    
            except Exception as e:
                # Rollback the transaction on error
                conn.rollback()
                print(f"Error importing improvement detail for {imprv_id}: {e}")
                errors += 1
                if errors > 10:
                    conn.rollback()
                    print("Too many errors, aborting.")
                    break
                continue
    
    # Final commit
    conn.commit()
    print(f"Imported {count} improvement details with {errors} errors")
    return count

def import_improvement_items(conn, file_path, existing_property_ids):
    """Import improvement items from CSV file"""
    print(f"Importing improvement items from {file_path}...")
    
    # First, let's roll back any pending transactions
    conn.rollback()
    
    cursor = conn.cursor()
    count = 0
    errors = 0
    
    # Get existing improvement items to avoid duplicate inserts
    cursor.execute("SELECT prop_id, imprv_id FROM improvement_items")
    existing_imprv_items = [(row[0], row[1]) for row in cursor.fetchall()]
    print(f"Found {len(existing_imprv_items)} existing improvement item records")
    
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
                
            # Skip if we already have a record for this property/improvement combo
            prop_id_int = int(prop_id) if prop_id and prop_id.isdigit() else None 
            imprv_id_int = int(imprv_id) if imprv_id and imprv_id.isdigit() else None
            if (prop_id_int, imprv_id_int) in existing_imprv_items:
                continue
            
            try:
                # Clean values
                bedrooms = clean_value(row.get('bedrooms', row.get('BEDROOMS', None)))
                baths = clean_value(row.get('baths', row.get('BATHS', None)))
                half_bath = clean_value(row.get('half_bath', row.get('HALF_BATH', None)))
                foundation = clean_value(row.get('foundation', row.get('FOUNDATION', None)))
                ext_wall = clean_value(row.get('ext_wall', row.get('EXT_WALL', None)))
                roof = clean_value(row.get('roof', row.get('ROOF', None)))
                heat = clean_value(row.get('heat', row.get('HEAT', None)))
                ac = clean_value(row.get('ac', row.get('AC', None)))
                fireplaces = clean_value(row.get('fireplaces', row.get('FIREPLACES', None)))
                com_hvac = clean_value(row.get('com_hvac', row.get('COM_HVAC', None)))
                
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
                """, (
                    now,
                    now,
                    prop_id_int,
                    imprv_id_int,
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
                ))
                count += 1
                
                # Commit every 100 records
                if count % 100 == 0:
                    conn.commit()
                    print(f"Committed {count} improvement items")
                    
            except Exception as e:
                # Rollback the transaction on error
                conn.rollback()
                print(f"Error importing improvement item for {imprv_id}: {e}")
                errors += 1
                if errors > 10:
                    conn.rollback()
                    print("Too many errors, aborting.")
                    break
                continue
    
    # Final commit
    conn.commit()
    print(f"Imported {count} improvement items with {errors} errors")
    return count

def import_land_details(conn, file_path, existing_property_ids):
    """Import land details from CSV file"""
    print(f"Importing land details from {file_path}...")
    
    # First, let's roll back any pending transactions
    conn.rollback()
    
    cursor = conn.cursor()
    count = 0
    errors = 0
    
    # Get existing land details to avoid duplicate inserts
    cursor.execute("SELECT prop_id FROM land_details")
    existing_land_prop_ids = [row[0] for row in cursor.fetchall()]
    print(f"Found {len(existing_land_prop_ids)} existing land detail records")
    
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
                
            # Skip if we already have a record for this property
            if int(prop_id) in existing_land_prop_ids:
                continue
            
            try:
                # Clean values
                prop_id_int = int(prop_id) if prop_id and prop_id.isdigit() else None
                primary_use_cd = clean_value(row.get('primary_use_cd', row.get('PRIMARY_USE_CD', None)))
                size_acres = clean_value(row.get('size_acres', row.get('SIZE_ACRES', None)))
                size_square_feet = clean_value(row.get('size_square_feet', row.get('SIZE_SQUARE_FEET', None)))
                land_type_cd = clean_value(row.get('land_type_cd', row.get('LAND_TYPE_CD', None)))
                land_soil_code = clean_value(row.get('land_soil_code', row.get('LAND_SOIL_CODE', None)))
                ag_use_cd = clean_value(row.get('ag_use_cd', row.get('AG_USE_CD', None)))
                
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
                """, (
                    now,
                    now,
                    prop_id_int,
                    primary_use_cd,
                    size_acres,
                    size_square_feet,
                    land_type_cd,
                    land_soil_code,
                    ag_use_cd
                ))
                count += 1
                
                # Commit every 100 records
                if count % 100 == 0:
                    conn.commit()
                    print(f"Committed {count} land details")
                    
            except Exception as e:
                # Rollback the transaction on error
                conn.rollback()
                print(f"Error importing land detail for property {prop_id}: {e}")
                errors += 1
                if errors > 10:
                    conn.rollback()
                    print("Too many errors, aborting.")
                    break
                continue
    
    # Final commit
    conn.commit()
    print(f"Imported {count} land details with {errors} errors")
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