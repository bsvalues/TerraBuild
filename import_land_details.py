"""
Land Details Import Script

This script specifically imports land details from CSV files
directly into the PostgreSQL database. It uses the same error handling and
clean value functions from the main import script.
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
                
                # Commit every 25 records
                if count % 25 == 0:
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
    print("Starting land details import...")
    
    # Define file paths
    assets_dir = 'attached_assets'
    land_details_file = os.path.join(assets_dir, 'land_detail.csv')
    
    # Verify file exists
    if not os.path.exists(land_details_file):
        print(f"File not found: {land_details_file}")
        return
    
    size_mb = os.path.getsize(land_details_file) / (1024 * 1024)
    print(f"Found file: {land_details_file} ({size_mb:.2f} MB)")
    
    try:
        # Connect to the database
        conn = connect_to_db()
        
        # Get existing property IDs
        existing_property_ids = get_existing_property_ids(conn)
        print(f"Found {len(existing_property_ids)} existing properties in the database")
        
        # Record start time
        start_time = datetime.now()
        print(f"Import started at {start_time}")
        
        # Import land details
        detail_count = import_land_details(conn, land_details_file, existing_property_ids)
        
        # Record end time
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Print summary
        print("\nImport Summary:")
        print(f"Land Details: {detail_count}")
        print(f"\nTotal duration: {duration}")
        print(f"Import completed at: {end_time}")
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        print(f"Error during import process: {e}")
        return

if __name__ == "__main__":
    main()