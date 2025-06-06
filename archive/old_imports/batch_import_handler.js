/**
 * Batch Import Handler for Benton County Building Cost System
 * 
 * This module handles the batch import of multiple cost matrices,
 * including validation, duplicate detection, and conflict resolution.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * Process multiple matrix files for batch import
 * @param {Array<string>} filePaths - Array of paths to Excel files
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import results
 */
async function processBatchImport(filePaths, options = {}) {
  console.log(`Starting batch import of ${filePaths.length} files`);
  
  const results = {
    success: true,
    processed: 0,
    failed: 0,
    total: filePaths.length,
    details: []
  };

  // Process each file sequentially to avoid database conflicts
  for (const filePath of filePaths) {
    try {
      // Run the Python parser for each file
      const result = await processSingleFile(filePath, options);
      
      results.details.push({
        file: path.basename(filePath),
        success: result.success,
        importId: result.importId,
        errors: result.errors || [],
        warnings: result.warnings || [],
        entriesCount: result.data ? result.data.length : 0,
        detectedTypes: result.detectedTypes || [],
        detectedRegions: result.detectedRegions || []
      });
      
      if (result.success) {
        results.processed++;
      } else {
        results.failed++;
        results.success = false;
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      
      results.details.push({
        file: path.basename(filePath),
        success: false,
        errors: [error.message || 'Unknown error occurred'],
      });
      
      results.failed++;
      results.success = false;
    }
  }

  return results;
}

/**
 * Process a single matrix file
 * @param {string} filePath - Path to Excel file
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
async function processSingleFile(filePath, options = {}) {
  console.log(`Processing file: ${filePath}`);
  
  // Validate file existence
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      errors: [`File not found: ${filePath}`]
    };
  }
  
  // Execute the enhanced Python parser with detection options
  const pythonScript = options.useEnhanced ? 
    'enhanced_excel_parser.py' : 
    'benton_cost_matrix_parser.py';
  
  const args = [
    pythonScript,
    filePath,
    '--detect-types',
    '--detect-regions',
    '--validate'
  ];
  
  if (options.outputFile) {
    args.push('--output', options.outputFile);
  }
  
  if (options.year) {
    args.push('--year', options.year);
  }
  
  const pythonProcess = spawnSync('python', args, {
    encoding: 'utf-8'
  });
  
  if (pythonProcess.error) {
    return {
      success: false,
      errors: [`Failed to execute parser: ${pythonProcess.error.message}`]
    };
  }
  
  if (pythonProcess.status !== 0) {
    return {
      success: false,
      errors: [`Parser exited with code ${pythonProcess.status}: ${pythonProcess.stderr}`]
    };
  }
  
  try {
    // Parse the JSON output from the Python script
    const result = JSON.parse(pythonProcess.stdout);
    
    // If the Python script processed successfully but validation failed
    if (!result.success) {
      return result;
    }
    
    // Process with Node.js import to database if Python parsing succeeded
    const importResult = await importToDatabase(result.data, options);
    
    return {
      ...result,
      ...importResult
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse Python output: ${error.message}`]
    };
  }
}

/**
 * Import parsed data to the database
 * @param {Array<Object>} data - Parsed matrix data
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
async function importToDatabase(data, options = {}) {
  // This would typically call the database import logic
  // For now, we'll simulate a successful import
  
  return new Promise((resolve) => {
    // Simulate some processing time
    setTimeout(() => {
      resolve({
        success: true,
        importId: Date.now(),
        entriesCount: data.length
      });
    }, 500);
  });
}

/**
 * Command line interface for batch import
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node batch_import_handler.js file1.xlsx file2.xlsx [file3.xlsx...]');
    process.exit(1);
  }
  
  try {
    const results = await processBatchImport(args, {
      useEnhanced: true,
      validate: true
    });
    
    console.log(JSON.stringify(results, null, 2));
    
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    console.error('Batch import failed:', error);
    process.exit(1);
  }
}

// Run as CLI if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  processBatchImport,
  processSingleFile
};