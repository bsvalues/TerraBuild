/**
 * Excel Validator for Benton County Cost Matrix Imports
 * 
 * This module provides comprehensive validation for Excel files
 * containing cost matrix data.
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

/**
 * Validate an Excel file to ensure it meets all requirements
 * @param {string|Buffer|any} filePathOrBuffer - Path to the Excel file or file buffer
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid flag and any errors
 */
async function validateExcelFile(filePathOrBuffer, options = {}) {
  console.log(`Validating Excel file: ${typeof filePathOrBuffer === 'string' ? filePathOrBuffer : 'from buffer'}`);
  
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    info: {}
  };
  
  let tempFilePath = null;
  let filePath = filePathOrBuffer;
  
  // If buffer is provided, write it to a temporary file
  if (Buffer.isBuffer(filePathOrBuffer)) {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      tempFilePath = path.join(tempDir, `temp-${Date.now()}.xlsx`);
      fs.writeFileSync(tempFilePath, filePathOrBuffer);
      filePath = tempFilePath;
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Failed to create temp file from buffer: ${error.message}`);
      return result;
    }
  }
  
  // Ensure file exists
  if (typeof filePath === 'string' && !fs.existsSync(filePath)) {
    result.isValid = false;
    result.errors.push(`File not found: ${filePath}`);
    return result;
  }
  
  // Use our Python validator for comprehensive checks
  // This leverages the existing enhanced_excel_parser.py with additional validation
  const pythonScript = 'enhanced_excel_parser.py';
  
  const args = [
    pythonScript,
    filePath,
    '--validate-only',
    '--detailed-errors'
  ];
  
  if (options.strictMode) {
    args.push('--strict');
  }
  
  if (options.checkDataTypes) {
    args.push('--check-data-types');
  }
  
  const pythonProcess = spawnSync('python', args, {
    encoding: 'utf-8'
  });
  
  if (pythonProcess.error) {
    result.isValid = false;
    result.errors.push(`Failed to execute validator: ${pythonProcess.error.message}`);
    return result;
  }
  
  if (pythonProcess.status !== 0) {
    result.isValid = false;
    result.errors.push(`Validator exited with code ${pythonProcess.status}: ${pythonProcess.stderr}`);
    return result;
  }
  
  try {
    // Parse the JSON output from the Python script
    const validationResult = JSON.parse(pythonProcess.stdout);
    
    // Combine results
    result.isValid = validationResult.success;
    
    if (validationResult.errors && validationResult.errors.length > 0) {
      result.errors = [...result.errors, ...validationResult.errors];
    }
    
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      result.warnings = [...result.warnings, ...validationResult.warnings];
    }
    
    // Add metadata
    result.info = {
      sheets: validationResult.sheets || [],
      rowCount: validationResult.rowCount || 0,
      detectedYear: validationResult.year,
      detectedTypes: validationResult.detectedTypes || [],
      detectedRegions: validationResult.detectedRegions || []
    };
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to parse validation result: ${error.message}`);
  } finally {
    // Clean up temporary file if we created one
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error(`Error cleaning up temp file: ${cleanupError.message}`);
      }
    }
  }
  
  return result;
}

/**
 * Validate multiple Excel files in batch
 * @param {Array<string>} filePaths - Array of paths to Excel files
 * @param {Object} options - Validation options
 * @returns {Object} Batch validation results
 */
async function validateBatchExcelFiles(filePaths, options = {}) {
  const results = {
    isValid: true,
    totalFiles: filePaths.length,
    validFiles: 0,
    invalidFiles: 0,
    details: []
  };
  
  for (const filePath of filePaths) {
    const fileResult = await validateExcelFile(filePath, options);
    
    results.details.push({
      file: path.basename(filePath),
      isValid: fileResult.isValid,
      errors: fileResult.errors,
      warnings: fileResult.warnings,
      info: fileResult.info
    });
    
    if (fileResult.isValid) {
      results.validFiles++;
    } else {
      results.invalidFiles++;
      results.isValid = false;
    }
  }
  
  return results;
}

export { validateExcelFile, validateBatchExcelFiles };