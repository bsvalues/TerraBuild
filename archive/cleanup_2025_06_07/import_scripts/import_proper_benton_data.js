#!/usr/bin/env node
/**
 * Benton County Proper Cost Matrix Importer
 * 
 * This script imports the proper Benton County cost matrix data with correct
 * regions and building types directly into the PostgreSQL database.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Connect to PostgreSQL
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Import cost matrix data from a JSON file with proper regions and building types
 * @param {string} jsonFilePath - Path to the JSON file containing cost matrix data
 */
async function importProperBentonData(jsonFilePath) {
  console.log(`Importing proper Benton County data from ${jsonFilePath}...`);
  
  try {
    // Read and parse the JSON file
    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    console.log(`Found ${data.length} cost matrix entries to import`);
    
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First clear existing cost matrix data to avoid conflicts
      console.log('Clearing existing cost matrix data...');
      await client.query('DELETE FROM cost_matrix');
      
      // Import new data
      let inserted = 0;
      let errors = [];
      
      for (const entry of data) {
        try {
          // Required fields for cost_matrix table
          const sql = `
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
              condition_factor_base,
              county,
              state,
              is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING id
          `;
          
          const values = [
            entry.region,
            entry.buildingType,
            entry.buildingTypeDescription,
            entry.baseCost,
            entry.matrixYear,
            entry.sourceMatrixId,
            entry.matrixDescription,
            entry.dataPoints,
            entry.minCost,
            entry.maxCost,
            entry.adjustmentFactors?.complexity || 1.0,
            entry.adjustmentFactors?.quality || 1.0,
            entry.adjustmentFactors?.condition || 1.0,
            entry.county,
            entry.state,
            true
          ];
          
          const result = await client.query(sql, values);
          console.log(`Inserted cost matrix entry for ${entry.region} - ${entry.buildingType} with ID ${result.rows[0].id}`);
          inserted++;
        } catch (err) {
          console.error(`Error inserting entry for ${entry.region} - ${entry.buildingType}:`, err.message);
          errors.push({
            entry: `${entry.region} - ${entry.buildingType}`,
            error: err.message
          });
        }
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log(`Import completed: ${inserted} entries inserted, ${errors.length} errors`);
      
      if (errors.length > 0) {
        console.log('Errors encountered:');
        errors.forEach((err, i) => {
          console.log(`  ${i+1}. ${err.entry}: ${err.error}`);
        });
      }
      
      return {
        success: true,
        imported: inserted,
        errors: errors
      };
      
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Transaction failed:', err.message);
      throw err;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Import failed:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

async function main() {
  try {
    // Default to the proper cost matrix JSON file
    const jsonFilePath = process.argv[2] || 'benton_cost_matrix_proper.json';
    
    // Import the data
    const result = await importProperBentonData(jsonFilePath);
    
    if (result.success) {
      console.log(`Successfully imported ${result.imported} entries`);
      process.exit(0);
    } else {
      console.error(`Import failed: ${result.error}`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled error:', err.message);
    process.exit(1);
  }
}

main();