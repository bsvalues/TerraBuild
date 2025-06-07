/**
 * Test suite for batch import functionality
 * 
 * These tests verify that the batch import handler correctly processes multiple matrices,
 * validates their content, detects building types and regions, and handles errors properly.
 */

const { processBatchImport, processSingleFile } = require('../batch_import_handler');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Create temporary test directory and files
const TEST_DIR = './test_files';
const VALID_MATRIX = path.join(TEST_DIR, 'valid_matrix.xlsx');
const INVALID_MATRIX = path.join(TEST_DIR, 'invalid_matrix.xlsx');
const MISSING_MATRIX = path.join(TEST_DIR, 'missing_matrix.xlsx');

/**
 * Setup test environment
 */
function setup() {
  // Ensure test directory exists
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR);
  }

  // Mock a valid matrix file (we won't actually create a real Excel file, just check path existence)
  fs.writeFileSync(VALID_MATRIX, 'mock excel content');
  
  // Mock an invalid matrix file
  fs.writeFileSync(INVALID_MATRIX, 'invalid content');
}

/**
 * Teardown test environment
 */
function teardown() {
  // Clean up test files
  if (fs.existsSync(VALID_MATRIX)) {
    fs.unlinkSync(VALID_MATRIX);
  }
  
  if (fs.existsSync(INVALID_MATRIX)) {
    fs.unlinkSync(INVALID_MATRIX);
  }
  
  if (fs.existsSync(TEST_DIR)) {
    fs.rmdirSync(TEST_DIR);
  }
}

/**
 * Test helper to mock processSingleFile for testing processBatchImport
 */
function mockProcessSingleFile(path, options) {
  if (path.includes('valid')) {
    return Promise.resolve({
      success: true,
      importId: 12345,
      data: Array(10).fill({ region: 'Test', buildingType: 'Test' }),
      detectedTypes: ['RESIDENTIAL', 'COMMERCIAL'],
      detectedRegions: ['Benton', 'Franklin']
    });
  } else if (path.includes('invalid')) {
    return Promise.resolve({
      success: false,
      errors: ['Invalid file format']
    });
  } else {
    return Promise.resolve({
      success: false,
      errors: ['File not found']
    });
  }
}

/**
 * Tests for processBatchImport function
 */
async function testProcessBatchImport() {
  console.log('Testing processBatchImport...');
  
  // Store original implementation
  const originalProcessSingleFile = processSingleFile;
  
  try {
    // Replace with mock for testing
    global.processSingleFile = mockProcessSingleFile;
    
    // Test 1: Process a batch with a valid and an invalid file
    const batch1Result = await processBatchImport([
      VALID_MATRIX, 
      INVALID_MATRIX
    ]);
    
    assert.strictEqual(batch1Result.total, 2, 'Should have 2 total files');
    assert.strictEqual(batch1Result.processed, 1, 'Should have 1 processed file');
    assert.strictEqual(batch1Result.failed, 1, 'Should have 1 failed file');
    assert.strictEqual(batch1Result.success, false, 'Overall success should be false');
    assert.strictEqual(batch1Result.details.length, 2, 'Should have details for 2 files');
    
    // Test 2: Process a batch with only valid files
    const batch2Result = await processBatchImport([
      VALID_MATRIX, 
      VALID_MATRIX
    ]);
    
    assert.strictEqual(batch2Result.total, 2, 'Should have 2 total files');
    assert.strictEqual(batch2Result.processed, 2, 'Should have 2 processed files');
    assert.strictEqual(batch2Result.failed, 0, 'Should have 0 failed files');
    assert.strictEqual(batch2Result.success, true, 'Overall success should be true');
    
    // Test 3: Process an empty batch
    const batch3Result = await processBatchImport([]);
    
    assert.strictEqual(batch3Result.total, 0, 'Should have 0 total files');
    assert.strictEqual(batch3Result.processed, 0, 'Should have 0 processed files');
    assert.strictEqual(batch3Result.success, true, 'Empty batch should succeed');
    
    console.log('processBatchImport tests passed!');
  } catch (error) {
    console.error('processBatchImport tests failed:', error);
    throw error;
  } finally {
    // Restore original implementation
    global.processSingleFile = originalProcessSingleFile;
  }
}

/**
 * Tests for processSingleFile function
 */
async function testProcessSingleFile() {
  console.log('Testing processSingleFile...');
  
  try {
    // Mock spawnSync for testing
    const childProcess = require('child_process');
    const originalSpawnSync = childProcess.spawnSync;
    
    childProcess.spawnSync = (command, args, options) => {
      if (args[0].includes('parser') && args[1].includes('valid')) {
        return {
          status: 0,
          stdout: JSON.stringify({
            success: true,
            data: Array(10).fill({ region: 'Test', buildingType: 'Test' }),
            detectedTypes: ['RESIDENTIAL', 'COMMERCIAL'],
            detectedRegions: ['Benton', 'Franklin']
          }),
          stderr: ''
        };
      } else if (args[0].includes('parser') && args[1].includes('invalid')) {
        return {
          status: 1,
          stdout: '',
          stderr: 'Error: Invalid file format'
        };
      } else {
        return {
          error: new Error('Command failed'),
          status: -1
        };
      }
    };
    
    // Test 1: Process a valid file
    const result1 = await processSingleFile(VALID_MATRIX, { useEnhanced: true });
    
    assert.strictEqual(result1.success, true, 'Valid file should succeed');
    assert.ok(result1.data.length > 0, 'Should have data');
    assert.ok(Array.isArray(result1.detectedTypes), 'Should detect building types');
    assert.ok(result1.detectedTypes.includes('RESIDENTIAL'), 'Should include RESIDENTIAL type');
    
    // Test 2: Process an invalid file
    const result2 = await processSingleFile(INVALID_MATRIX, { useEnhanced: true });
    
    assert.strictEqual(result2.success, false, 'Invalid file should fail');
    assert.ok(result2.errors.length > 0, 'Should have errors');
    
    // Test 3: Process a missing file
    const result3 = await processSingleFile(MISSING_MATRIX, { useEnhanced: true });
    
    assert.strictEqual(result3.success, false, 'Missing file should fail');
    assert.ok(result3.errors.length > 0, 'Should have errors');
    assert.ok(result3.errors[0].includes('not found'), 'Error should mention file not found');
    
    // Restore original spawnSync
    childProcess.spawnSync = originalSpawnSync;
    
    console.log('processSingleFile tests passed!');
  } catch (error) {
    console.error('processSingleFile tests failed:', error);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    setup();
    
    await testProcessBatchImport();
    await testProcessSingleFile();
    
    console.log('All batch import tests passed!');
  } catch (error) {
    console.error('Tests failed:', error);
    process.exit(1);
  } finally {
    teardown();
  }
}

// Run tests
runTests();