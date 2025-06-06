/**
 * API-based Import Script for Cost Matrix
 * This script uses the running BCBS server's API to import cost matrix data
 */

import fs from 'fs';
import http from 'http';

// Configuration
const API_HOST = 'localhost';
const API_PORT = 5000;  // Match the server port (5000)
const ADMIN_ID = 1;     // Default admin user ID for attribution
const CHUNK_SIZE = 10;  // Number of entries to send per API request

/**
 * Import data from a JSON file using the API
 * @param {string} jsonFilePath - Path to the JSON file
 */
async function importViaApi(jsonFilePath) {
  try {
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
      process.exit(1);
    }
    
    // Split entries into chunks for better API performance
    const chunks = [];
    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      chunks.push(entries.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`Importing in ${chunks.length} batches...`);
    
    let successCount = 0;
    let errorCount = 0;
    let errors = [];
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        console.log(`Processing batch ${i + 1}/${chunks.length} (${chunk.length} entries)...`);
        const result = await sendToApi('/api/cost-matrix/batch', {
          entries: chunk,
          userId: ADMIN_ID
        });
        
        successCount += result.imported || 0;
        errorCount += result.errors?.length || 0;
        
        if (result.errors && result.errors.length > 0) {
          errors = errors.concat(result.errors);
        }
        
        console.log(`Batch ${i + 1} complete: ${result.imported || 0} imported`);
      } catch (error) {
        console.error(`Error processing batch ${i + 1}: ${error.message}`);
        errorCount += chunk.length;
      }
    }
    
    console.log('\nImport Summary:');
    console.log(`Total entries: ${entries.length}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\nError Details:');
      errors.slice(0, 5).forEach((error, i) => {
        console.log(`${i + 1}. ${error.message || error}`);
      });
      
      if (errors.length > 5) {
        console.log(`... and ${errors.length - 5} more errors`);
      }
    }
    
  } catch (error) {
    console.error(`Failed to import data: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Send data to API endpoint
 * @param {string} path - API endpoint path
 * @param {object} data - Data to send
 * @returns {Promise<object>} - API response
 */
function sendToApi(path, data) {
  return new Promise((resolve, reject) => {
    // Prepare the request
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    // Create the request
    const req = http.request(options, (res) => {
      let responseData = '';
      
      // Collect response data
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      // Process the complete response
      res.on('end', () => {
        try {
          const parsedResponse = JSON.parse(responseData);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedResponse);
          } else {
            reject(new Error(`API Error: ${parsedResponse.message || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    // Send the data
    req.write(postData);
    req.end();
  });
}

// Run the import
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('Usage: node import_api.js <json_file_path>');
  process.exit(1);
}

importViaApi(jsonFilePath)
  .then(() => {
    console.log('Import process complete');
  })
  .catch((error) => {
    console.error(`Import failed: ${error.message}`);
    process.exit(1);
  });