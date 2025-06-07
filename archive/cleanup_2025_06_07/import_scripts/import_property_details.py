"""
Property Details Import Script

This script imports additional property details (improvement items and land details)
from CSV files directly into the PostgreSQL database. It handles both datasets
and ensures proper error handling, transaction management, and data validation.
"""
import os
import csv
import psycopg2
from datetime import datetime
import argparse

# Get database connection string from environment variable
DATABASE_URL = os.environ.get('DATABASE_URL')

# Maximum number of records to import from each file (can be overridden via command line)
DEFAULT_MAX_RECORDS = 150

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

def import_improvement_items(conn, file_path, existing_property_ids, max_records):
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
            if count >= max_records:
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
                halfbath = clean_value(row.get('halfbath', row.get('HALFBATH', None)))
                foundation = clean_value(row.get('foundation', row.get('FOUNDATION', None)))
                extwall_desc = clean_value(row.get('extwall_desc', row.get('EXTWALL_DESC', None)))
                roofcover_desc = clean_value(row.get('roofcover_desc', row.get('ROOFCOVER_DESC', None)))
                hvac_desc = clean_value(row.get('hvac_desc', row.get('HVAC_DESC', None)))
                fireplaces = clean_value(row.get('fireplaces', row.get('FIREPLACES', None)))
                sprinkler_val = clean_value(row.get('sprinkler', row.get('SPRINKLER', None)))
                # Convert sprinkler to boolean if not None
                sprinkler = None
                if sprinkler_val is not None:
                    if sprinkler_val.lower() in ('true', 't', 'yes', 'y', '1'):
                        sprinkler = True
                    elif sprinkler_val.lower() in ('false', 'f', 'no', 'n', '0'):
                        sprinkler = False
                framing_class = clean_value(row.get('framing_class', row.get('FRAMING_CLASS', None)))
                com_hvac = clean_value(row.get('com_hvac', row.get('COM_HVAC', None)))
                
                cursor.execute("""
                    INSERT INTO improvement_items (
                        imported_at,
                        updated_at,
                        prop_id,
                        imprv_id,
                        bedrooms,
                        baths,
                        halfbath,
                        foundation,
                        extwall_desc,
                        roofcover_desc,
                        hvac_desc,
                        fireplaces,
                        sprinkler,
                        framing_class,
                        com_hvac
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    now,
                    now,
                    prop_id_int,
                    imprv_id_int,
                    bedrooms,
                    baths,
                    halfbath,
                    foundation,
                    extwall_desc,
                    roofcover_desc,
                    hvac_desc,
                    fireplaces,
                    sprinkler,
                    framing_class,
                    com_hvac
                ))
                count += 1
                
                # Commit every 25 records
                if count % 25 == 0:
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

def import_land_details(conn, file_path, existing_property_ids, max_records):
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
            if count >= max_records:
                break
                
            now = datetime.now()
            
            # Default to lowercase column names if uppercase not found
            prop_id = row.get('prop_id', row.get('PROP_ID', '0'))
            
            # Skip if property ID doesn't exist in database
            if int(prop_id) not in existing_property_ids:
                continue
                
            # Skip if we already have a record for this property
            if int(prop_id) in existing_land_prop_ids:
                pass  # Don't skip - land details can have multiple entries per property
            
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
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Import property details to database')
    parser.add_argument('--improvement-items', action='store_true', help='Import improvement items')
    parser.add_argument('--land-details', action='store_true', help='Import land details')
    parser.add_argument('--all', action='store_true', help='Import all property details')
    parser.add_argument('--max-records', type=int, default=DEFAULT_MAX_RECORDS, 
                        help=f'Maximum records to import per file (default: {DEFAULT_MAX_RECORDS})')
    args = parser.parse_args()
    
    # If no specific import type specified, assume --all
    if not (args.improvement_items or args.land_details or args.all):
        args.all = True
    
    print("Starting property details import...")
    
    # Define file paths
    assets_dir = 'attached_assets'
    improvement_items_file = os.path.join(assets_dir, 'imprv_items.csv')
    land_details_file = os.path.join(assets_dir, 'land_detail.csv')
    
    # Verify files exist
    files_to_import = []
    if args.improvement_items or args.all:
        if os.path.exists(improvement_items_file):
            size_mb = os.path.getsize(improvement_items_file) / (1024 * 1024)
            print(f"Found file: {improvement_items_file} ({size_mb:.2f} MB)")
            files_to_import.append(('improvement_items', improvement_items_file))
        else:
            print(f"File not found: {improvement_items_file}")
            
    if args.land_details or args.all:
        if os.path.exists(land_details_file):
            size_mb = os.path.getsize(land_details_file) / (1024 * 1024)
            print(f"Found file: {land_details_file} ({size_mb:.2f} MB)")
            files_to_import.append(('land_details', land_details_file))
        else:
            print(f"File not found: {land_details_file}")
    
    if not files_to_import:
        print("No files found to import. Exiting.")
        return
    
    try:
        # Connect to the database
        conn = connect_to_db()
        
        # Get existing property IDs
        existing_property_ids = get_existing_property_ids(conn)
        print(f"Found {len(existing_property_ids)} existing properties in the database")
        
        # Record start time
        start_time = datetime.now()
        print(f"Import started at {start_time}")
        
        # Import data
        import_counts = {}
        for import_type, file_path in files_to_import:
            if import_type == 'improvement_items':
                count = import_improvement_items(conn, file_path, existing_property_ids, args.max_records)
                import_counts['improvement_items'] = count
            elif import_type == 'land_details':
                count = import_land_details(conn, file_path, existing_property_ids, args.max_records)
                import_counts['land_details'] = count
        
        # Record end time
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Print summary
        print("\nImport Summary:")
        for import_type, count in import_counts.items():
            print(f"{import_type.replace('_', ' ').title()}: {count}")
        print(f"\nTotal duration: {duration}")
        print(f"Import completed at: {end_time}")
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        print(f"Error during import process: {e}")
        return

if __name__ == "__main__":
    main()