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
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './shared/schema.js';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a drizzle instance using the PostgreSQL pool
const db = drizzle(pool, { schema });

/**
 * Import cost matrix data from a JSON file
 * @param {string} jsonFilePath - Path to the JSON file containing cost matrix data
 */
async function importCostMatrix(jsonFilePath) {
  console.log(`Importing cost matrix data from ${jsonFilePath}`);
  
  try {
    // Read and parse the JSON file
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    const matrixData = JSON.parse(fileContent);
    
    // Extract the matrix entries from the data
    let entries = [];
    if (matrixData.data && Array.isArray(matrixData.data)) {
      entries = matrixData.data;
    } else if (Array.isArray(matrixData)) {
      entries = matrixData;
    }
    
    console.log(`Found ${entries.length} matrix entries to import`);
    
    if (entries.length === 0) {
      console.error('No valid matrix entries found in the file');
      process.exit(1);
    }
    
    // Insert data into the database
    let imported = 0;
    let errors = [];
    
    for (const entry of entries) {
      try {
        // Prepare the data for insertion
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
        
        // Insert into database
        await db.insert(schema.costMatrix).values(matrixEntry);
        imported++;
        
        // Log progress periodically
        if (imported % 10 === 0) {
          console.log(`Imported ${imported} of ${entries.length} entries...`);
        }
      } catch (error) {
        console.error(`Error importing entry: ${error.message}`);
        errors.push({
          entry: JSON.stringify(entry),
          error: error.message
        });
      }
    }
    
    console.log(`\nImport completed:`);
    console.log(`- Total entries: ${entries.length}`);
    console.log(`- Imported: ${imported}`);
    console.log(`- Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. ${error.error} (Entry: ${error.entry.substring(0, 50)}...)`);
      });
      
      if (errors.length > 5) {
        console.log(`... and ${errors.length - 5} more errors`);
      }
    }
    
  } catch (error) {
    console.error(`Failed to import cost matrix: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  // Check command line arguments
  if (process.argv.length < 3) {
    console.log('Usage: node import_cost_matrix.js <json_file_path>');
    process.exit(1);
  }
  
  const jsonFilePath = process.argv[2];
  
  try {
    await importCostMatrix(jsonFilePath);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();