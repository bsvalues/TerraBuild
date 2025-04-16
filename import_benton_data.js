/**
 * Benton County Live Cost Matrix Importer
 * 
 * This script imports the real Benton County cost matrix data from a JSON file
 * directly into the PostgreSQL database.
 */

import { db } from './server/db.js';
import fs from 'fs';

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
    
    // Insert data into the database using raw SQL for simplicity
    let imported = 0;
    let errors = [];
    
    // First, clear existing data for Benton County, 2025
    try {
      const deleteQuery = `
        DELETE FROM cost_matrix 
        WHERE county = 'Benton' 
        AND state = 'WA' 
        AND matrix_year = 2025
      `;
      await db.execute(deleteQuery);
      console.log('Cleared existing Benton County 2025 data');
    } catch (error) {
      console.error(`Error clearing existing data: ${error.message}`);
    }
    
    // Insert the new data
    for (const entry of entries) {
      try {
        // Prepare the data for insertion
        const insertQuery = `
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
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          )
        `;
        
        // Get adjustment factors
        const complexity = parseFloat(entry.adjustmentFactors?.complexity) || 1.0;
        const quality = parseFloat(entry.adjustmentFactors?.quality) || 1.0;
        const condition = parseFloat(entry.adjustmentFactors?.condition) || 1.0;
        
        const values = [
          entry.region || 'Unknown',
          entry.buildingType || 'Unknown',
          entry.buildingTypeDescription || '',
          parseFloat(entry.baseCost) || 0,
          parseInt(entry.matrixYear) || new Date().getFullYear(),
          parseInt(entry.sourceMatrixId) || 0,
          entry.matrixDescription || '',
          parseInt(entry.dataPoints) || 0,
          parseFloat(entry.minCost) || 0,
          parseFloat(entry.maxCost) || 0,
          complexity,
          quality,
          condition,
          entry.county || 'Benton',
          entry.state || 'WA',
          true
        ];
        
        // Execute the query
        await db.execute(insertQuery, values);
        imported++;
        
        // Log progress periodically
        if (imported % 10 === 0) {
          console.log(`Imported ${imported} of ${entries.length} entries...`);
        }
      } catch (error) {
        console.error(`Error importing entry: ${error.message}`);
        errors.push({
          entry: JSON.stringify(entry).substring(0, 100),
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
        console.log(`${index + 1}. ${error.error} (Entry: ${error.entry}...)`);
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
    console.log('Usage: node import_benton_data.js <json_file_path>');
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