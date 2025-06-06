/**
 * Benton County Property Data Import Script
 * 
 * This script imports the full Benton County property dataset with nearly 100k properties
 * directly into the PostgreSQL database through our API endpoint.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/properties/import-enhanced';
const ASSETS_DIR = path.join(__dirname, 'attached_assets');

// Files to import
const files = {
  improvementsFile: path.join(ASSETS_DIR, 'imprv.csv'),
  improvementDetailsFile: path.join(ASSETS_DIR, 'imprv_detail.csv'),
  improvementItemsFile: path.join(ASSETS_DIR, 'imprv_items.csv'),
  landDetailsFile: path.join(ASSETS_DIR, 'land_detail.csv'),
  propertiesFile: path.join(ASSETS_DIR, 'property_val.csv'),
};

// Main import function
async function importBentonProperties() {
  try {
    console.log('Starting Benton County property data import...');
    console.log('Files to import:');
    
    let totalSize = 0;
    
    // Verify files exist and get total size
    for (const [key, filePath] of Object.entries(files)) {
      const exists = fs.existsSync(filePath);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      totalSize += stats.size;
      
      console.log(`- ${key}: ${path.basename(filePath)} (${sizeMB} MB) ${exists ? '✓' : '✗'}`);
      if (!exists) {
        throw new Error(`File not found: ${filePath}`);
      }
    }
    
    console.log(`\nTotal import size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('Creating form data with files...');
    
    // Create form data with files
    const formData = new FormData();
    formData.append('userId', 1); // Admin user ID
    formData.append('batchSize', 100); // Process in batches of 100 records
    
    // Add files to form data
    for (const [key, filePath] of Object.entries(files)) {
      formData.append(key, fs.createReadStream(filePath));
    }
    
    console.log('\nSending import request to API...');
    console.log(`URL: ${API_URL}${API_ENDPOINT}`);
    
    const startTime = new Date();
    
    // Send import request to API
    const response = await axios.post(`${API_URL}${API_ENDPOINT}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    const endTime = new Date();
    const durationSeconds = (endTime - startTime) / 1000;
    
    console.log(`\nImport completed in ${durationSeconds.toFixed(2)} seconds`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.data && response.data.success) {
      console.log('\nImport successful!');
      console.log('Summary:');
      
      // Display results for each data type
      Object.entries(response.data.results || {}).forEach(([key, result]) => {
        console.log(`- ${key}: ${result.success} of ${result.processed} records processed`);
        
        if (result.errors && result.errors.length > 0) {
          console.log(`  Errors: ${result.errors.length}`);
          if (result.errors.length > 0) {
            console.log(`  First error: ${JSON.stringify(result.errors[0])}`);
          }
        }
      });
    } else {
      console.error('\nImport failed:', (response.data && response.data.error) ? response.data.error : 'Unknown error');
    }
    
  } catch (error) {
    console.error('Error during import:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the import
importBentonProperties();