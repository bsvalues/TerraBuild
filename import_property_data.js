/**
 * Import Property Data Script
 * 
 * This script imports property data from CSV files in the attached_assets folder
 * directly into the PostgreSQL database using the property-data-import functionality.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';
import { PostgreSQLStorage } from './server/pg-storage.js';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a storage instance connected to the PostgreSQL database
const storage = new PostgreSQLStorage(db);

// Import function
import { importPropertyData } from './server/property-data-import.js';

async function main() {
  try {
    console.log('Starting property data import from attached_assets directory...');
    
    // Define file paths
    const assetsDir = path.join(__dirname, 'attached_assets');
    const propertiesFile = path.join(assetsDir, 'property_val.csv');
    const improvementsFile = path.join(assetsDir, 'imprv.csv');
    const improvementDetailsFile = path.join(assetsDir, 'imprv_detail.csv');
    const improvementItemsFile = path.join(assetsDir, 'imprv_items.csv');
    const landDetailsFile = path.join(assetsDir, 'land_detail.csv');
    
    // Verify that all files exist
    const files = [propertiesFile, improvementsFile, improvementDetailsFile, improvementItemsFile, landDetailsFile];
    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      console.log(`Found file: ${file} (${(fs.statSync(file).size / 1024 / 1024).toFixed(2)} MB)`);
    }
    
    // Read files into buffers
    console.log('Reading files into memory...');
    const propertiesBuffer = fs.readFileSync(propertiesFile);
    const improvementsBuffer = fs.readFileSync(improvementsFile);
    const improvementDetailsBuffer = fs.readFileSync(improvementDetailsFile);
    const improvementItemsBuffer = fs.readFileSync(improvementItemsFile);
    const landDetailsBuffer = fs.readFileSync(landDetailsFile);
    
    console.log('All files read successfully. Starting import process...');
    
    // Import options
    const importOptions = {
      userId: 1, // Admin user ID
      batchSize: 100, // Process in batches of 100 records
      propertiesFile: propertiesBuffer,
      improvementsFile: improvementsBuffer,
      improvementDetailsFile: improvementDetailsBuffer,
      improvementItemsFile: improvementItemsBuffer,
      landDetailsFile: landDetailsBuffer
    };
    
    // Perform the import
    const results = await importPropertyData(storage, importOptions);
    
    console.log('Import process completed:');
    console.log('Properties:', results.properties);
    console.log('Improvements:', results.improvements);
    console.log('Improvement Details:', results.improvementDetails);
    console.log('Improvement Items:', results.improvementItems);
    console.log('Land Details:', results.landDetails);
    
    // Clean up and exit
    console.log('Property data import completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during property data import:', error);
    process.exit(1);
  }
}

// Run the import as an async IIFE (Immediately Invoked Function Expression)
(async () => {
  try {
    await main();
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
})();