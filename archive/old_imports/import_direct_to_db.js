/**
 * Direct Database Import Script for Cost Matrix Data
 * 
 * This script bypasses the API and directly imports the data to the database
 * using the database connection and query functionality.
 */

import fs from 'fs';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuration
const CHUNK_SIZE = 20;  // Number of entries to send per batch
let DB_URL = process.env.DATABASE_URL;

// If no DATABASE_URL is set, use a default local connection string
if (!DB_URL) {
  DB_URL = 'postgresql://postgres:postgres@localhost:5432/bcbs';
  console.log(`No DATABASE_URL environment variable set, using default: ${DB_URL}`);
}

/**
 * Import cost matrix data directly to database from a JSON file
 * @param {string} jsonFilePath - Path to the JSON file
 * @returns {Promise<object>} - Summary of the import operation
 */
async function importDirectToDB(jsonFilePath) {
  // Create a new PostgreSQL client
  const client = new pg.Client({
    connectionString: DB_URL
  });
  
  try {
    console.log(`Connecting to database...`);
    await client.connect();
    console.log(`Connected to PostgreSQL database`);
    
    console.log(`Reading data from ${jsonFilePath}...`);
    const fileData = fs.readFileSync(jsonFilePath, 'utf8');
    const parsedData = JSON.parse(fileData);
    
    // Extract matrix entries
    let entries = [];
    if (parsedData.data && Array.isArray(parsedData.data)) {
      entries = parsedData.data;
    } else if (Array.isArray(parsedData)) {
      entries = parsedData;
    }
    
    console.log(`Found ${entries.length} entries to import`);
    
    if (entries.length === 0) {
      console.error('No valid matrix entries found in the file');
      await client.end();
      return { success: false, imported: 0, errors: ['No valid matrix entries found in the file'] };
    }
    
    // Split entries into chunks for better database performance
    const chunks = [];
    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      chunks.push(entries.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`Importing in ${chunks.length} batches...`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each batch
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing batch ${i + 1}/${chunks.length} (${chunk.length} entries)...`);
      
      // Start a transaction for this batch
      await client.query('BEGIN');
      
      try {
        // Process each entry in the chunk
        for (const entry of chunk) {
          try {
            // Prepare matrix data for insertion
            const matrixEntry = {
              region: entry.region || 'Unknown',
              buildingType: entry.buildingType || 'Unknown',
              buildingTypeDescription: entry.buildingTypeDescription || '',
              baseCost: parseFloat(entry.baseCost) || 0,
              matrixYear: parseInt(entry.matrixYear) || new Date().getFullYear(),
              sourceMatrixId: parseInt(entry.sourceMatrixId) || 0,
              matrixDescription: entry.matrixDescription || '',
              dataPoints: parseInt(entry.dataPoints) || 0,
              minCost: parseFloat(entry.minCost) || 0,
              maxCost: parseFloat(entry.maxCost) || 0,
              complexityFactorBase: parseFloat(entry.adjustmentFactors?.complexity) || 1.0,
              qualityFactorBase: parseFloat(entry.adjustmentFactors?.quality) || 1.0,
              conditionFactorBase: parseFloat(entry.adjustmentFactors?.condition) || 1.0,
              county: entry.county || 'Benton',
              state: entry.state || 'WA',
              isActive: true
            };
            
            // First check if a record with the same region, building_type and matrix_year exists
            const checkExisting = await client.query(
              `SELECT id FROM cost_matrix 
              WHERE region = $1 AND building_type = $2 AND matrix_year = $3`,
              [matrixEntry.region, matrixEntry.buildingType, matrixEntry.matrixYear]
            );

            let result;
            
            if (checkExisting.rows.length > 0) {
              // Update existing record
              const id = checkExisting.rows[0].id;
              result = await client.query(
                `UPDATE cost_matrix SET
                  building_type_description = $1,
                  base_cost = $2,
                  source_matrix_id = $3,
                  matrix_description = $4,
                  data_points = $5,
                  min_cost = $6,
                  max_cost = $7,
                  complexity_factor_base = $8,
                  quality_factor_base = $9,
                  condition_factor_base = $10,
                  county = $11,
                  state = $12,
                  is_active = $13,
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = $14
                RETURNING id`,
                [
                  matrixEntry.buildingTypeDescription,
                  matrixEntry.baseCost,
                  matrixEntry.sourceMatrixId,
                  matrixEntry.matrixDescription,
                  matrixEntry.dataPoints,
                  matrixEntry.minCost,
                  matrixEntry.maxCost,
                  matrixEntry.complexityFactorBase,
                  matrixEntry.qualityFactorBase,
                  matrixEntry.conditionFactorBase,
                  matrixEntry.county,
                  matrixEntry.state,
                  matrixEntry.isActive,
                  id
                ]
              );
              console.log(`Updated existing entry with ID ${id}`);
            } else {
              // Insert new record
              result = await client.query(
                `INSERT INTO cost_matrix (
                  region, building_type, building_type_description, base_cost, 
                  matrix_year, source_matrix_id, matrix_description, data_points,
                  min_cost, max_cost, complexity_factor_base, quality_factor_base,
                  condition_factor_base, county, state, is_active
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
                ) RETURNING id`,
                [
                  matrixEntry.region,
                  matrixEntry.buildingType,
                  matrixEntry.buildingTypeDescription,
                  matrixEntry.baseCost,
                  matrixEntry.matrixYear,
                  matrixEntry.sourceMatrixId,
                  matrixEntry.matrixDescription,
                  matrixEntry.dataPoints,
                  matrixEntry.minCost,
                  matrixEntry.maxCost,
                  matrixEntry.complexityFactorBase,
                  matrixEntry.qualityFactorBase,
                  matrixEntry.conditionFactorBase,
                  matrixEntry.county,
                  matrixEntry.state,
                  matrixEntry.isActive
                ]
              );
              console.log(`Inserted new entry with ID ${result.rows[0].id}`);
            }
            
            successCount++;
          } catch (entryError) {
            errorCount++;
            const errorMessage = entryError.message || 'Unknown error';
            console.error(`Error importing entry: ${errorMessage}`);
            errors.push({
              entry: JSON.stringify(entry).substring(0, 100),
              error: errorMessage
            });
          }
        }
        
        // Commit the transaction
        await client.query('COMMIT');
        console.log(`Batch ${i + 1} committed successfully`);
      } catch (batchError) {
        // Rollback if there's an error
        await client.query('ROLLBACK');
        
        const errorMessage = batchError.message || 'Unknown batch error';
        console.error(`Error processing batch ${i + 1}: ${errorMessage}`);
        
        errorCount += chunk.length;
        errors.push({
          batch: i + 1,
          error: errorMessage
        });
      }
    }
    
    // Log an activity record for the import
    if (successCount > 0) {
      try {
        // We'll just use a simpler approach
        await client.query(
          `INSERT INTO activities (action, icon, icon_color) 
           VALUES ($1, $2, $3)`,
          [
            `Processed ${successCount} cost matrix entries`,
            'ri-database-2-line',
            'success'
          ]
        );
        console.log('Activity record created');
      } catch (activityError) {
        console.error(`Error recording activity: ${activityError.message}`);
      }
    }
    
    console.log('\nImport Summary:');
    console.log(`Total entries: ${entries.length}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\nError Details:');
      errors.slice(0, 5).forEach((error, i) => {
        console.log(`${i + 1}. ${error.error}`);
      });
      
      if (errors.length > 5) {
        console.log(`... and ${errors.length - 5} more errors`);
      }
    }
    
    return { 
      success: successCount > 0, 
      imported: successCount, 
      errors: errors.map(e => e.error) 
    };
  } catch (error) {
    console.error(`Database error: ${error.message}`);
    return { 
      success: false, 
      imported: 0, 
      errors: [error.message] 
    };
  } finally {
    console.log('Closing database connection');
    await client.end();
  }
}

// Main execution
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('Usage: node import_direct_to_db.js <json_file_path>');
  process.exit(1);
}

importDirectToDB(jsonFilePath)
  .then(result => {
    console.log('Import process complete');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });