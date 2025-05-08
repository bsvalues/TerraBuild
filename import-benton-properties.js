/**
 * Benton County Property Data Importer
 * 
 * This script imports property data directly into the database,
 * handling property records from CSV files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';
import { parse } from 'csv-parse/sync';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Import property data from a CSV file
 * @param {string} csvFilePath - Path to the CSV file with property data
 * @param {number} limit - Maximum number of records to import (0 for all)
 */
async function importProperties(csvFilePath, limit = 0) {
  console.log(`Importing property data from ${csvFilePath}`);
  
  try {
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    const totalRecords = limit > 0 ? Math.min(records.length, limit) : records.length;
    console.log(`Found ${totalRecords} property records to import`);
    
    if (totalRecords === 0) {
      console.error('No valid property records found in the file');
      return;
    }
    
    // Using upsert operation instead of clearing existing data
    console.log('Using upsert operation to update existing records and add new ones');
    
    // Insert the new data
    let imported = 0;
    let errors = [];
    
    for (let i = 0; i < totalRecords; i++) {
      const record = records[i];
      
      try {
        // Map CSV fields to database columns based on the actual schema
        // Use upsert (INSERT ... ON CONFLICT DO UPDATE) to handle duplicate keys
        const upsertQuery = `
          INSERT INTO properties (
            prop_id,
            geo_id,
            legal_desc,
            hood_cd,
            property_use_cd,
            property_use_desc,
            township_code,
            range_code,
            township_section,
            legal_acreage,
            assessed_val,
            appraised_val,
            township_q_section,
            is_active
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
          ON CONFLICT (prop_id) DO UPDATE SET
            geo_id = $2,
            legal_desc = $3,
            hood_cd = $4,
            property_use_cd = $5,
            property_use_desc = $6,
            township_code = $7,
            range_code = $8,
            township_section = $9,
            legal_acreage = $10,
            assessed_val = $11,
            appraised_val = $12,
            township_q_section = $13,
            is_active = $14,
            updated_at = NOW()
        `;
        
        const values = [
          parseInt(record.PROP_ID || '0'),
          record.GEO_ID || record.PARCEL_ID || null,
          record.LEGAL_DESC || null,
          record.HOOD_CD || record.NEIGHBORHOOD_CD || null,
          record.PROPERTY_USE_CD || null,
          record.PROPERTY_USE_DESC || null,
          record.TOWNSHIP || record.TOWNSHIP_CODE || null,
          record.RANGE || record.RANGE_CODE || null,
          record.SECTION || record.TOWNSHIP_SECTION || null,
          parseFloat(record.LEGAL_ACREAGE || '0'),
          parseFloat(record.ASSESSED_VAL || '0'),
          parseFloat(record.APPRAISED_VAL || '0'),
          record.TOWNSHIP_Q_SECTION || null,
          true
        ];
        
        // Execute the query
        await db.execute(upsertQuery, values);
        imported++;
        
        // Log progress periodically
        if (imported % 20 === 0) {
          console.log(`Imported ${imported} of ${totalRecords} properties...`);
        }
      } catch (error) {
        console.error(`Error importing property: ${error.message}`);
        errors.push({
          record: JSON.stringify(record).substring(0, 100),
          error: error.message
        });
      }
    }
    
    console.log(`\nProperty import completed:`);
    console.log(`- Total records: ${totalRecords}`);
    console.log(`- Imported: ${imported}`);
    console.log(`- Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. ${error.error} (Record: ${error.record}...)`);
      });
      
      if (errors.length > 5) {
        console.log(`... and ${errors.length - 5} more errors`);
      }
    }
    
    return imported;
  } catch (error) {
    console.error(`Failed to import properties: ${error.message}`);
    throw error;
  }
}

// Main function to execute the import
async function main() {
  // Check command line arguments
  const csvFilePath = process.argv[2] || 'attached_assets/property_val.csv';
  const limitStr = process.argv[3];
  const limit = limitStr ? parseInt(limitStr) : 1000; // Default to 1000 records
  
  try {
    console.log(`Starting Benton County property data import...`);
    console.log(`Using CSV file: ${csvFilePath}`);
    console.log(`Import limit: ${limit > 0 ? limit : 'All'} records`);
    
    await importProperties(csvFilePath, limit);
    
    console.log('Import process completed successfully.');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();