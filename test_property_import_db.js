/**
 * Test Script for Property Data Import with Database
 * 
 * This script tests importing property data directly using the API,
 * now that the property tables have been created in the database.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = 'http://localhost:5000';
const API_ENDPOINT = '/api/property-data/import';
const ASSETS_DIR = path.join(__dirname, 'attached_assets');

// Files to import
const files = {
  improvementsFile: path.join(ASSETS_DIR, 'imprv.csv'),
  improvementDetailsFile: path.join(ASSETS_DIR, 'imprv_detail.csv'),
  improvementItemsFile: path.join(ASSETS_DIR, 'imprv_items.csv'),
  landDetailsFile: path.join(ASSETS_DIR, 'land_detail.csv'),
  propertiesFile: path.join(ASSETS_DIR, 'property_val.csv'),
};

async function testPropertyImport() {
  try {
    console.log('Testing property data import with database...');
    console.log('Files to import:');
    
    // Verify files exist
    for (const [key, filePath] of Object.entries(files)) {
      const exists = fs.existsSync(filePath);
      console.log(`- ${key}: ${path.basename(filePath)} ${exists ? '✓' : '✗'}`);
      if (!exists) {
        throw new Error(`File not found: ${filePath}`);
      }
    }
    
    // Create form data with files
    const formData = new FormData();
    formData.append('userId', 1);
    formData.append('batchSize', 100);
    
    for (const [key, filePath] of Object.entries(files)) {
      formData.append(key, fs.createReadStream(filePath));
    }
    
    console.log('\nSending import request...');
    
    // Send import request
    const response = await axios.post(`${API_URL}${API_ENDPOINT}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('\nImport response:');
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    // Print the entire response for debugging
    console.log('\nComplete response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verify import results
    if (response.data && response.data.success) {
      console.log('\nImport successful!');
      console.log('Summary:');
      Object.entries(response.data.results || {}).forEach(([key, result]) => {
        console.log(`- ${key}: ${result.success} of ${result.processed} records processed`);
        if (result.errors && result.errors.length > 0) {
          console.log(`  Errors: ${result.errors.length}`);
          console.log(`  First error: ${JSON.stringify(result.errors[0])}`);
        }
      });
    } else {
      console.error('\nImport failed:', (response.data && response.data.error) ? response.data.error : 'Unknown error');
    }
    
  } catch (error) {
    console.error('Error during import test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testPropertyImport();