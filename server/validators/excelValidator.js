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
 * @param {string} filePath - Path to the Excel file
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid flag and any errors
 */
async function validateExcelFile(filePath, options = {}) {
  console.log(`Validating Excel file: ${filePath}`);
  
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    info: {}
  };
  
  // Ensure file exists
  if (!fs.existsSync(filePath)) {
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