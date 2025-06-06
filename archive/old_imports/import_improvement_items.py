"""
Improvement Items Import Script

This script specifically imports improvement items from CSV files 
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

def main():
    """Main function to run the import process"""
    print("Starting improvement items import...")
    
    # Define file paths
    assets_dir = 'attached_assets'
    improvement_items_file = os.path.join(assets_dir, 'imprv_items.csv')
    
    # Verify file exists
    if not os.path.exists(improvement_items_file):
        print(f"File not found: {improvement_items_file}")
        return
    
    size_mb = os.path.getsize(improvement_items_file) / (1024 * 1024)
    print(f"Found file: {improvement_items_file} ({size_mb:.2f} MB)")
    
    try:
        # Connect to the database
        conn = connect_to_db()
        
        # Get existing property IDs
        existing_property_ids = get_existing_property_ids(conn)
        print(f"Found {len(existing_property_ids)} existing properties in the database")
        
        # Record start time
        start_time = datetime.now()
        print(f"Import started at {start_time}")
        
        # Import improvement items
        item_count = import_improvement_items(conn, improvement_items_file, existing_property_ids)
        
        # Record end time
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Print summary
        print("\nImport Summary:")
        print(f"Improvement Items: {item_count}")
        print(f"\nTotal duration: {duration}")
        print(f"Import completed at: {end_time}")
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        print(f"Error during import process: {e}")
        return

if __name__ == "__main__":
    main()