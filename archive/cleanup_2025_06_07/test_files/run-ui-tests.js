/**
 * UI Component Test Runner for Benton County Building Cost System
 * 
 * This script runs UI component tests using JSDOM and testing-library
 * to verify that UI components work correctly.
 * 
 * Usage:
 *   node run-ui-tests.js [test_file]
 * 
 * Examples:
 *   node run-ui-tests.js                                # Run all UI tests
 *   node run-ui-tests.js BCBSCostCalculator.test        # Run specific test
 */

import { exec } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

// Configuration
const UI_TESTS_DIR = './tests/ui';
const JEST_CONFIG_PATH = './jest.config.js';
const JEST_BINARY = './node_modules/.bin/jest';

// Determine whether a file is a test file
function isTestFile(filename) {
  return filename.endsWith('.test.js') || filename.endsWith('.spec.js');
}

// Get all UI test files
function getTestFiles() {
  if (!existsSync(UI_TESTS_DIR)) {
    console.error(`Error: UI tests directory not found: ${UI_TESTS_DIR}`);
    process.exit(1);
  }
  
  return readdirSync(UI_TESTS_DIR)
    .filter(isTestFile)
    .map(file => join(UI_TESTS_DIR, file));
}

// Run tests with Jest
function runTests(testFiles) {
  const specificTest = process.argv[2];
  let command;
  
  if (specificTest) {
    // If a specific test file is requested
    const testPath = specificTest.includes('/') 
      ? specificTest 
      : join(UI_TESTS_DIR, specificTest);
    
    command = `${JEST_BINARY} --config=${JEST_CONFIG_PATH} ${testPath}`;
  } else {
    // Run all UI tests
    command = `${JEST_BINARY} --config=${JEST_CONFIG_PATH} ${UI_TESTS_DIR}`;
  }
  
  console.log(`Running UI component tests...\n`);
  console.log(`Command: ${command}\n`);
  
  const child = exec(command);
  
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`\nError: UI tests failed with exit code ${code}`);
      process.exit(code);
    } else {
      console.log('\nUI component tests completed successfully!');
    }
  });
}

// Run all tests
async function runAllTests() {
  const testFiles = getTestFiles();
  if (testFiles.length === 0) {
    console.log('No UI test files found.');
    return;
  }
  
  console.log(`Found ${testFiles.length} UI test files:\n${testFiles.join('\n')}\n`);
  runTests(testFiles);
}

// Execute tests
runAllTests().catch(error => {
  console.error('Error running UI tests:', error);
  process.exit(1);
});