/**
 * Batch Importer for Cost Matrix Data
 * 
 * This module provides functionality for processing multiple Excel files
 * in batch, with support for transactions, duplicate detection, and
 * detailed progress tracking.
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import crypto from 'crypto';
import { validateExcelFile } from '../validators/excelValidator';
import pkg from 'pg';
const { Pool } = pkg;

// Import configuration
const DB_CONFIG = {
  connectionString: process.env.DATABASE_URL
};

/**
 * Process multiple matrix files for batch import
 * @param {Array<string>} filePaths - Array of paths to Excel files
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import results
 */
async function processBatchImport(filePaths, options = {}) {
  console.log(`Starting batch import of ${filePaths.length} files`);
  
  const result = {
    success: true,
    totalFiles: filePaths.length,
    processed: 0,
    failed: 0,
    skipped: 0,
    details: [],
    startTime: Date.now(),
    endTime: null,
    elapsedTimeMs: null
  };
  
  // Validate all files first
  const validationResults = [];
  
  for (const filePath of filePaths) {
    const validation = await validateExcelFile(filePath, {
      strictMode: options.strictMode,
      checkDataTypes: true
    });
    
    validationResults.push({
      filePath,
      validation
    });
    
    if (!validation.isValid) {
      result.details.push({
        file: path.basename(filePath),
        status: 'failed',
        phase: 'validation',
        success: false,
        errors: validation.errors
      });
      result.failed++;
      result.success = false;
    }
  }
  
  // Check for duplicates
  const fileHashes = new Map();
  if (options.detectDuplicates) {
    for (const { filePath, validation } of validationResults.filter(r => r.validation.isValid)) {
      const fileContent = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
      
      if (fileHashes.has(hash)) {
        result.details.push({
          file: path.basename(filePath),
          status: 'skipped',
          reason: 'duplicate',
          duplicateOf: path.basename(fileHashes.get(hash))
        });
        result.skipped++;
      } else {
        fileHashes.set(hash, filePath);
      }
    }
  }
  
  // Process files that passed validation and aren't duplicates
  const filesToProcess = validationResults
    .filter(r => r.validation.isValid)
    .filter(r => !options.detectDuplicates || !result.details.some(d => 
      d.status === 'skipped' && d.file === path.basename(r.filePath)
    ))
    .map(r => r.filePath);
  
  // If we're using a transaction, process all files within a single transaction
  if (options.useTransaction && filesToProcess.length > 0) {
    try {
      await processFilesInTransaction(filesToProcess, options, result);
    } catch (error) {
      console.error('Transaction failed:', error);
      
      // Mark all files as failed
      for (const filePath of filesToProcess) {
        const fileDetail = result.details.find(d => d.file === path.basename(filePath));
        
        if (fileDetail) {
          fileDetail.status = 'failed';
          fileDetail.phase = 'transaction';
          fileDetail.success = false;
          fileDetail.errors = [error.message];
        } else {
          result.details.push({
            file: path.basename(filePath),
            status: 'failed',
            phase: 'transaction',
            success: false,
            errors: [error.message]
          });
        }
      }
      
      result.failed += filesToProcess.length;
      result.processed = 0;
      result.success = false;
      result.rollback = true;
    }
  } else {
    // Process each file individually
    for (const filePath of filesToProcess) {
      try {
        await processIndividualFile(filePath, options, result);
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        
        result.details.push({
          file: path.basename(filePath),
          status: 'failed',
          phase: 'processing',
          success: false,
          errors: [error.message]
        });
        
        result.failed++;
        result.success = false;
      }
    }
  }
  
  // Calculate elapsed time
  result.endTime = Date.now();
  result.elapsedTimeMs = result.endTime - result.startTime;
  
  return result;
}

/**
 * Process files in a single database transaction
 * @param {Array<string>} filePaths - Array of paths to Excel files
 * @param {Object} options - Import options
 * @param {Object} result - Result object to update
 */
async function processFilesInTransaction(filePaths, options, result) {
  const pool = new Pool(DB_CONFIG);
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const filePath of filePaths) {
      const fileResult = await parseAndImportFile(filePath, client, options);
      
      result.details.push({
        file: path.basename(filePath),
        status: 'processed',
        success: true,
        ...fileResult
      });
      
      result.processed++;
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Process an individual file without a transaction
 * @param {string} filePath - Path to Excel file
 * @param {Object} options - Import options
 * @param {Object} result - Result object to update
 */
async function processIndividualFile(filePath, options, result) {
  const pool = new Pool(DB_CONFIG);
  const client = await pool.connect();
  
  try {
    const fileResult = await parseAndImportFile(filePath, client, options);
    
    result.details.push({
      file: path.basename(filePath),
      status: 'processed',
      success: true,
      ...fileResult
    });
    
    result.processed++;
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Parse and import a single file
 * @param {string} filePath - Path to Excel file
 * @param {any} client - Database client
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result for the file
 */
async function parseAndImportFile(filePath, client, options) {
  // Run the Python parser
  const pythonScript = 'enhanced_excel_parser.py';
  
  const args = [
    pythonScript,
    filePath,
    '--output-json-only'
  ];
  
  if (options.standardizeData) {
    args.push('--standardize');
  }
  
  const pythonProcess = spawnSync('python', args, {
    encoding: 'utf-8'
  });
  
  if (pythonProcess.error || pythonProcess.status !== 0) {
    throw new Error(`Failed to parse file: ${pythonProcess.stderr || pythonProcess.error.message}`);
  }
  
  const parsedData = JSON.parse(pythonProcess.stdout);
  
  if (!parsedData.success) {
    throw new Error(`Parser returned failure: ${parsedData.errors.join(', ')}`);
  }
  
  // Import the data to the database
  const result = await importToDatabase(parsedData.data, client);
  
  return {
    importResult: result,
    matrices: parsedData.data.matrices?.length || 0,
    details: parsedData.data.details?.length || 0,
    year: parsedData.data.year,
    types: parsedData.data.buildingTypes,
    regions: parsedData.data.regions
  };
}

/**
 * Import data to the database
 * @param {Object} data - Parsed matrix data
 * @param {any} client - Database client
 * @returns {Promise<Object>} Import result
 */
async function importToDatabase(data, client) {
  // Import matrix table rows
  const matrixResults = [];
  
  if (data.matrices && data.matrices.length > 0) {
    for (const matrix of data.matrices) {
      const query = `
        INSERT INTO cost_matrices (
          matrix_id,
          matrix_yr,
          matrix_description,
          building_type,
          region,
          created_date
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [
        matrix.matrix_id,
        matrix.year || new Date().getFullYear(),
        matrix.matrix_description,
        matrix.building_type,
        matrix.region
      ];
      
      const result = await client.query(query, values);
      matrixResults.push(result.rows[0]);
    }
  }
  
  // Import matrix detail rows
  const detailResults = [];
  
  if (data.details && data.details.length > 0) {
    for (const detail of data.details) {
      const query = `
        INSERT INTO cost_matrix_details (
          matrix_id,
          row_id,
          col_id,
          row_value,
          col_value,
          cell_value
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        detail.matrix_id,
        detail.row_id,
        detail.col_id,
        detail.row_value,
        detail.col_value,
        detail.cell_value
      ];
      
      const result = await client.query(query, values);
      detailResults.push(result.rows[0]);
    }
  }
  
  return {
    matricesInserted: matrixResults.length,
    detailsInserted: detailResults.length
  };
}

export { processBatchImport };