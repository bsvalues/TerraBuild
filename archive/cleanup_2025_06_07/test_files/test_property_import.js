/**
 * Test script for property data import with memory buffers
 * 
 * This script uploads the property data CSV files and tests the in-memory buffer processing.
 */
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for API requests
const baseUrl = 'http://localhost:5000';

// Paths to CSV files
const files = {
  improvementsFile: path.join(__dirname, 'attached_assets/imprv.csv'),
  improvementDetailsFile: path.join(__dirname, 'attached_assets/imprv_detail.csv'),
  improvementItemsFile: path.join(__dirname, 'attached_assets/imprv_items.csv'),
  landDetailsFile: path.join(__dirname, 'attached_assets/land_detail.csv'),
  propertiesFile: path.join(__dirname, 'attached_assets/property_val.csv')
};

// Log start time
const startTime = new Date();
console.log(`Starting property data import test at ${startTime.toISOString()}`);
console.log('Testing in-memory buffer processing of property data import');

// Upload files and import property data
async function testPropertyImport() {
  try {
    // Create form data
    const formData = new FormData();
    
    // Add each file to form data
    for (const [fieldName, filePath] of Object.entries(files)) {
      console.log(`Reading file: ${fieldName} from ${filePath}`);
      const fileStats = fs.statSync(filePath);
      console.log(`File size: ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`);
      
      formData.append(fieldName, fs.createReadStream(filePath));
    }
    
    // Add batch size parameter
    formData.append('batchSize', '100');
    
    console.log('Uploading files and processing data...');
    
    // Send request to import API endpoint
    const response = await axios.post(`${baseUrl}/api/properties/import`, formData, {
      headers: formData.getHeaders()
    });
    
    // Calculate elapsed time
    const endTime = new Date();
    const elapsedSeconds = (endTime - startTime) / 1000;
    
    console.log('Import completed successfully!');
    console.log(`Time elapsed: ${elapsedSeconds.toFixed(2)} seconds`);
    console.log('Import results:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error during import:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Run the test
testPropertyImport()
  .then(results => {
    console.log('Test completed successfully');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });