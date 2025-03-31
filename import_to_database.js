#!/usr/bin/env node

/**
 * Benton County Cost Matrix Database Import Script
 * 
 * This script reads the JSON output from the Benton County Cost Matrix Parser
 * and imports it directly into the database using the pg client.
 * 
 * Usage:
 *   node import_to_database.js <json_file_path>
 * 
 * Example:
 *   node import_to_database.js benton_county_data.json
 */

import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a connection pool to the PostgreSQL database
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function importData() {
  // Get the JSON file path from command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node import_to_database.js <json_file_path>');
    process.exit(1);
  }
  
  const jsonFilePath = args[0];
  
  // Validate the file path
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`Error: File not found: ${jsonFilePath}`);
    process.exit(1);
  }
  
  console.log(`Importing data from ${jsonFilePath}...`);
  
  try {
    // Read the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    if (!jsonData.success) {
      console.error('Error in input data: The success flag is false');
      console.error('Error details:', jsonData.errors || 'No error details provided');
      process.exit(1);
    }
    
    const matrixData = jsonData.data;
    
    if (!Array.isArray(matrixData) || matrixData.length === 0) {
      console.error('Error: No valid data found in the input file');
      process.exit(1);
    }
    
    console.log(`Found ${matrixData.length} entries to import`);
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Ensure cost_matrix table exists
      const tableExists = await checkTableExists(client, 'cost_matrix');
      
      if (!tableExists) {
        console.log('Creating cost_matrix table...');
        await createCostMatrixTable(client);
      }
      
      // Import data
      const importResult = await importCostMatrixData(client, matrixData);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log('Import completed successfully!');
      console.log(`Imported: ${importResult.imported}`);
      console.log(`Updated: ${importResult.updated}`);
      console.log(`Errors: ${importResult.errors.length}`);
      
      if (importResult.errors.length > 0) {
        console.log('\nError details:');
        importResult.errors.forEach((error, i) => {
          console.log(`${i + 1}. ${error}`);
        });
      }
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error during import:', error.message);
      process.exit(1);
    } finally {
      // Release client
      client.release();
    }
    
  } catch (error) {
    console.error('Error processing input file:', error.message);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

async function checkTableExists(client, tableName) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )
  `, [tableName]);
  
  return result.rows[0].exists;
}

async function createCostMatrixTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS cost_matrix (
      id SERIAL PRIMARY KEY,
      region TEXT NOT NULL,
      building_type TEXT NOT NULL,
      building_type_description TEXT NOT NULL,
      base_cost NUMERIC NOT NULL,
      matrix_year INTEGER NOT NULL,
      source_matrix_id INTEGER,
      matrix_description TEXT,
      data_points INTEGER DEFAULT 0,
      min_cost NUMERIC,
      max_cost NUMERIC,
      complexity_factor_base NUMERIC DEFAULT 1.0,
      quality_factor_base NUMERIC DEFAULT 1.0,
      condition_factor_base NUMERIC DEFAULT 1.0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(region, building_type, matrix_year)
    )
  `);
  
  // Create indexes for performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_cost_matrix_region ON cost_matrix(region)
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_cost_matrix_building_type ON cost_matrix(building_type)
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_cost_matrix_matrix_year ON cost_matrix(matrix_year)
  `);
  
  console.log('Cost matrix table and indexes created successfully');
}

async function importCostMatrixData(client, matrixData) {
  let imported = 0;
  let updated = 0;
  const errors = [];
  
  for (let i = 0; i < matrixData.length; i++) {
    const entry = matrixData[i];
    
    try {
      // Check if the entry already exists
      const existingResult = await client.query(
        'SELECT id FROM cost_matrix WHERE region = $1 AND building_type = $2 AND matrix_year = $3',
        [entry.region, entry.buildingType, entry.matrixYear]
      );
      
      if (existingResult.rows.length > 0) {
        // Update existing entry
        const id = existingResult.rows[0].id;
        
        await client.query(`
          UPDATE cost_matrix SET
            base_cost = $1,
            building_type_description = $2,
            matrix_description = $3,
            source_matrix_id = $4,
            data_points = $5,
            min_cost = $6,
            max_cost = $7,
            complexity_factor_base = $8,
            quality_factor_base = $9,
            condition_factor_base = $10,
            updated_at = NOW()
          WHERE id = $11
        `, [
          entry.baseCost,
          entry.buildingTypeDescription,
          entry.matrixDescription,
          entry.sourceMatrixId || 0,
          entry.dataPoints || 0,
          entry.minCost || null,
          entry.maxCost || null,
          entry.complexityFactorBase || 1.0,
          entry.qualityFactorBase || 1.0,
          entry.conditionFactorBase || 1.0,
          id
        ]);
        
        updated++;
      } else {
        // Insert new entry
        await client.query(`
          INSERT INTO cost_matrix (
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
            condition_factor_base
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
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
          entry.conditionFactorBase || 1.0
        ]);
        
        imported++;
      }
      
      // Show progress in batches
      if ((i + 1) % 100 === 0 || i === matrixData.length - 1) {
        console.log(`Progress: ${i + 1}/${matrixData.length} entries processed`);
      }
    } catch (error) {
      const errorMessage = `Error importing entry for ${entry.region}, ${entry.buildingType}: ${error.message}`;
      console.error(errorMessage);
      errors.push(errorMessage);
    }
  }
  
  return {
    imported,
    updated,
    errors
  };
}

// Run the import process
importData().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});