# Property Data Import for Benton County Building Cost System

This document provides instructions for importing property data into the Benton County Building Cost System database.

## Overview

The property data import process involves importing several types of data from CSV files:

1. **Properties** - Basic property information
2. **Improvements** - Building improvements associated with properties
3. **Improvement Details** - Additional details about improvements
4. **Improvement Items** - Specific characteristics of improvements (bedrooms, baths, etc.)
5. **Land Details** - Information about land parcels (size, usage, etc.)

## Import Scripts

Several Python scripts are available for importing this data:

- `import_property_data.py` - Imports properties, improvements, and improvement details
- `import_improvement_items.py` - Imports improvement item details
- `import_land_details.py` - Imports land details
- `import_property_details.py` - Combined script that can import both improvement items and land details

## Data Files

The import scripts expect CSV files in the `attached_assets` directory:

- `property_val.csv` - Properties data
- `imprv.csv` - Improvements data
- `imprv_detail.csv` - Improvement details data
- `imprv_items.csv` - Improvement items data
- `land_detail.csv` - Land details data

## Database Schema

The imported data maps to the following database tables:

- `properties`
- `improvements`
- `improvement_details`
- `improvement_items`
- `land_details`

## Running the Import

### Using the Combined Script

The combined script provides a flexible way to import different data types:

```bash
# Import both improvement items and land details
python import_property_details.py --all

# Import only improvement items
python import_property_details.py --improvement-items

# Import only land details
python import_property_details.py --land-details

# Limit the number of records imported (for testing)
python import_property_details.py --all --max-records 10
```

### Using Individual Scripts

You can also use the individual scripts:

```bash
# Import improvement items
python import_improvement_items.py

# Import land details
python import_land_details.py

# Import property data (properties, improvements, and improvement details)
python import_property_data.py
```

## Import Process Details

1. The scripts establish a connection to the PostgreSQL database using the `DATABASE_URL` environment variable
2. They check for existing records to avoid duplicates
3. Data is imported in batches with transaction commits every 25 records
4. Error handling includes transaction rollbacks when errors occur
5. Empty values in the CSV files are converted to NULL in the database
6. The script ensures data consistency by checking foreign key relationships

## Constraints

- The scripts enforce data integrity by checking for existing property IDs
- Duplicate records are automatically skipped
- The `improvement_items` table has a unique constraint on (prop_id, imprv_id)
- The scripts can be configured to limit the number of imported records