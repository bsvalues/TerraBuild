#!/usr/bin/env node

/**
 * Benton County Cost Matrix Importer
 * 
 * This script imports the cost matrix data from a JSON file into the database.
 * It handles validation, transformation, and database operations.
 * 
 * Usage:
 *   node import_cost_matrix.js <json_file_path>
 * 
 * Example:
 *   node import_cost_matrix.js benton_county_data.json
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a connection pool to the PostgreSQL database
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Import cost matrix data from a JSON file
 * @param {string} jsonFilePath - Path to the JSON file containing cost matrix data
 */
async function importCostMatrix(jsonFilePath) {
  console.log(`Importing cost matrix data from ${jsonFilePath}...`);
  
  try {
    // Read the JSON file
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const data = JSON.parse(jsonData);
    
    if (!data.success) {
      console.error('Error in JSON data: The success flag is false');
      process.exit(1);
    }
    
    const matrixEntries = data.data;
    console.log(`Found ${matrixEntries.length} matrix entries to import`);
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // First check if the cost_matrix table exists
      const tableExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'cost_matrix'
        )
      `);
      
      if (!tableExistsResult.rows[0].exists) {
        console.error('Error: cost_matrix table does not exist');
        await client.query('ROLLBACK');
        process.exit(1);
      }
      
      // Track progress
      let imported = 0;
      let skipped = 0;
      let errors = [];
      
      // Process each matrix entry
      for (const entry of matrixEntries) {
        try {
          // Check if this matrix entry already exists
          const existingResult = await client.query(
            'SELECT id FROM cost_matrix WHERE region = $1 AND building_type = $2 AND matrix_year = $3',
            [entry.region, entry.buildingType, entry.matrixYear]
          );
          
          if (existingResult.rows.length > 0) {
            // Entry already exists, update it
            const id = existingResult.rows[0].id;
            await client.query(
              `UPDATE cost_matrix SET 
                base_cost = $1,
                building_type_description = $2,
                matrix_description = $3,
                data_points = $4,
                min_cost = $5,
                max_cost = $6,
                complexity_factor_base = $7,
                quality_factor_base = $8,
                condition_factor_base = $9,
                source_matrix_id = $10,
                updated_at = NOW()
              WHERE id = $11`,
              [
                entry.baseCost,
                entry.buildingTypeDescription,
                entry.matrixDescription,
                entry.dataPoints || 0,
                entry.minCost || null,
                entry.maxCost || null,
                entry.complexityFactorBase || 1.0,
                entry.qualityFactorBase || 1.0,
                entry.conditionFactorBase || 1.0,
                entry.sourceMatrixId || 0,
                id
              ]
            );
            
            skipped++;
          } else {
            // Insert new entry
            await client.query(
              `INSERT INTO cost_matrix (
                region, 
                building_type, 
                building_type_description, 
                base_cost, 
                matrix_year, 
                source_matrix_id, 
                matrix_description, 
                data_points, 
                min_cost,
                max_cost,
                complexity_factor_base, 
                quality_factor_base, 
                condition_factor_base,
                is_active,
                created_at,
                updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
              [
                entry.region,
                entry.buildingType,
                entry.buildingTypeDescription,
                entry.baseCost,
                entry.matrixYear,
                entry.sourceMatrixId || 0,
                entry.matrixDescription,
                entry.dataPoints || 0,
                entry.minCost || null,
                entry.maxCost || null,
                entry.complexityFactorBase || 1.0,
                entry.qualityFactorBase || 1.0,
                entry.conditionFactorBase || 1.0,
                true
              ]
            );
            
            imported++;
          }
          
          // Log progress at regular intervals
          if ((imported + skipped) % 100 === 0 || (imported + skipped) === matrixEntries.length) {
            console.log(`Progress: ${imported + skipped}/${matrixEntries.length} (${imported} imported, ${skipped} updated)`);
          }
        } catch (err) {
          console.error(`Error processing entry for ${entry.region}, ${entry.buildingType}: ${err.message}`);
          errors.push({
            region: entry.region,
            buildingType: entry.buildingType,
            error: err.message
          });
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('\nImport summary:');
      console.log(`Total entries: ${matrixEntries.length}`);
      console.log(`Successfully imported: ${imported}`);
      console.log(`Updated existing entries: ${skipped}`);
      console.log(`Errors: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log('\nError details:');
        errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.region}, ${error.buildingType}: ${error.error}`);
        });
      }
      
    } catch (err) {
      // Roll back transaction in case of error
      await client.query('ROLLBACK');
      throw err;
    } finally {
      // Release the client
      client.release();
    }
    
  } catch (err) {
    console.error('Error importing cost matrix data:', err);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Main execution
async function main() {
  // Get the JSON file path from command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node import_cost_matrix.js <json_file_path>');
    process.exit(1);
  }
  
  const jsonFilePath = args[0];
  
  // Validate the file path
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`Error: File not found: ${jsonFilePath}`);
    process.exit(1);
  }
  
  // Run the import process
  await importCostMatrix(jsonFilePath);
  console.log('Cost matrix import completed successfully!');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});