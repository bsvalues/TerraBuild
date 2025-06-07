/**
 * Batch Import System Test Suite
 * 
 * These tests validate the functionality of the batch import system for the
 * Building Cost Building System (BCBS) application.
 */

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { validateExcelFile, validateBatchExcelFiles } from '../server/validators/excelValidator.cjs';
import { processBatchImport } from '../server/import/batchImporter.cjs';
import { standardizeMatrixData } from '../server/data/matrixStandardizer.cjs';
import { TEST_PATHS } from '../test-config.js';

// Test data paths
const VALID_EXCEL_PATH = TEST_PATHS.validExcel;
const INVALID_EXCEL_PATH = TEST_PATHS.invalidExcel;
const TEST_OUTPUT_DIR = './tests/output';

// Ensure test output directory exists
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// Create test fixture for invalid Excel file if needed
function createInvalidExcelFixture() {
  const fixturesDir = './tests/fixtures';
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  
  // Only create if it doesn't exist
  if (!fs.existsSync(INVALID_EXCEL_PATH)) {
    // Create a simple text file with .xlsx extension to simulate invalid Excel
    fs.writeFileSync(INVALID_EXCEL_PATH, 'This is not a valid Excel file');
  }
}

describe('Batch Import System', function() {
  before(function() {
    // Set up any prerequisites for tests
    createInvalidExcelFixture();
    
    // Increase timeout for batch operations
    this.timeout(10000);
    
    // Set the NODE_ENV to test to enable mock implementations
    process.env.NODE_ENV = 'test';
  });
  
  describe('Excel Validation', function() {
    it('should validate a valid Excel file', async function() {
      const result = await validateExcelFile(VALID_EXCEL_PATH);
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.lengthOf(0);
    });
    
    it('should reject an invalid Excel file', async function() {
      const result = await validateExcelFile(INVALID_EXCEL_PATH);
      expect(result.isValid).to.be.false;
      expect(result.errors).to.not.be.empty;
    });
    
    it('should validate multiple files in batch', async function() {
      const result = await validateBatchExcelFiles([VALID_EXCEL_PATH, INVALID_EXCEL_PATH]);
      expect(result.totalFiles).to.equal(2);
      expect(result.validFiles).to.equal(1);
      expect(result.invalidFiles).to.equal(1);
    });
  });
  
  describe('Data Standardization', function() {
    it('should standardize currency values', function() {
      const testData = [
        { cell_value: '$1,234.56' },
        { cell_value: '2,345.67' },
        { cell_value: '3456.78' }
      ];
      
      const standardized = standardizeMatrixData(testData);
      
      expect(standardized[0].cell_value).to.be.a('number');
      expect(standardized[0].cell_value).to.equal(1234.56);
      expect(standardized[1].cell_value).to.equal(2345.67);
      expect(standardized[2].cell_value).to.equal(3456.78);
    });
    
    it('should handle outlier detection when enabled', function() {
      const testData = [
        { cell_value: 100 },
        { cell_value: 110 },
        { cell_value: 105 },
        { cell_value: 95 },
        { cell_value: 1000 } // Outlier
      ];
      
      const standardized = standardizeMatrixData(testData, { detectOutliers: true });
      
      // The outlier should be marked but not changed
      expect(standardized[4].isOutlier).to.be.true;
      expect(standardized[4].cell_value).to.equal(1000);
      
      // With auto-correction
      const corrected = standardizeMatrixData(testData, { 
        detectOutliers: true, 
        autoCorrectOutliers: true 
      });
      
      expect(corrected[4].cell_value).to.not.equal(1000);
      expect(corrected[4].cell_value).to.be.lessThan(200);
    });
  });
  
  describe('Batch Processing', function() {
    it('should process a single valid file', async function() {
      // Skip this test if running in CI since it would attempt DB operations
      if (process.env.CI) this.skip();
      
      const result = await processBatchImport([VALID_EXCEL_PATH], { 
        useTransaction: false,
        detectDuplicates: false
      });
      
      expect(result.success).to.be.true;
      expect(result.totalFiles).to.equal(1);
      expect(result.processed).to.equal(1);
      expect(result.failed).to.equal(0);
    });
    
    it('should handle mixed valid and invalid files', async function() {
      // Skip this test if running in CI since it would attempt DB operations
      if (process.env.CI) this.skip();
      
      const result = await processBatchImport([VALID_EXCEL_PATH, INVALID_EXCEL_PATH], {
        useTransaction: false,
        detectDuplicates: false
      });
      
      expect(result.success).to.be.false;
      expect(result.totalFiles).to.equal(2);
      expect(result.processed).to.be.at.most(1);
      expect(result.failed).to.be.at.least(1);
    });
    
    it('should detect duplicate files', async function() {
      // Skip this test if running in CI since it would attempt DB operations
      if (process.env.CI) this.skip();
      
      const result = await processBatchImport([VALID_EXCEL_PATH, VALID_EXCEL_PATH], {
        useTransaction: false,
        detectDuplicates: true
      });
      
      expect(result.totalFiles).to.equal(2);
      expect(result.skipped).to.be.greaterThan(0);
    });
  });
  
  describe('Transaction Support', function() {
    it('should rollback all changes if any file fails in transaction mode', async function() {
      // Skip this test if running in CI since it would attempt DB operations
      if (process.env.CI) this.skip();
      
      // First modify the invalid Excel path to include an extension indicating it's invalid
      // but would otherwise pass validation
      const INVALID_TRANSACTION_PATH = TEST_PATHS.invalidExcel.replace('.xlsx', '_txfail.xlsx');
      
      // Create a copy of the invalid file with a different name to simulate a file that passes
      // validation but fails during transaction processing
      fs.copyFileSync(TEST_PATHS.invalidExcel, INVALID_TRANSACTION_PATH);
      
      // Create a special processed value that bypasses normal validation
      // Instead of validating files at the beginning, we need to enforce failure inside the transaction
      const result = await processBatchImport([VALID_EXCEL_PATH, INVALID_TRANSACTION_PATH], {
        useTransaction: true,
        detectDuplicates: false,
        skipPreValidation: true // Special flag to bypass validation for test
      });
      
      // Clean up the test file
      if (fs.existsSync(INVALID_TRANSACTION_PATH)) {
        fs.unlinkSync(INVALID_TRANSACTION_PATH);
      }
      
      expect(result.success).to.be.false;
      expect(result.processed).to.equal(0);
      expect(result.rollback).to.be.true;
    });
  });
});

// Mocha will handle running the tests when executed directly