/**
 * Test Runner for Building Cost Building System
 * 
 * This script runs all or specific test suites for the BCBS application using Mocha.
 * 
 * Usage:
 *   node run_tests.js [test_file]
 * 
 * Examples:
 *   node run_tests.js                    # Run all tests
 *   node run_tests.js batch_import_tests # Run batch import tests only
 */

import { exec } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const CORE_TESTS_DIR = './tests/core';
const UI_TESTS_DIR = './tests/ui';
const RUN_CORE_SCRIPT = './run-core-tests.js';
const RUN_UI_SCRIPT = './run-ui-tests.js';

// Determine whether a file is a test file
function isTestFile(filename) {
  return filename.endsWith('.test.js') || 
         filename.endsWith('.test.ts') || 
         filename.endsWith('.spec.js') ||
         filename.endsWith('.spec.ts');
}

// Get all test files
function getTestFiles() {
  const files = [];
  
  if (existsSync(CORE_TESTS_DIR)) {
    const coreFiles = readdirSync(CORE_TESTS_DIR)
      .filter(isTestFile)
      .map(file => join(CORE_TESTS_DIR, file));
    files.push(...coreFiles);
  }
  
  if (existsSync(UI_TESTS_DIR)) {
    const uiFiles = readdirSync(UI_TESTS_DIR)
      .filter(isTestFile)
      .map(file => join(UI_TESTS_DIR, file));
    files.push(...uiFiles);
  }
  
  return files;
}

// Run tests
function runTests(testFiles) {
  // Run both core and UI tests
  console.log('Running all BCBS tests...\n');
  
  const commandCore = `node ${RUN_CORE_SCRIPT}`;
  const commandUi = `node ${RUN_UI_SCRIPT}`;
  
  console.log(`Running core tests with command: ${commandCore}\n`);
  
  const childCore = exec(commandCore);
  
  childCore.stdout.pipe(process.stdout);
  childCore.stderr.pipe(process.stderr);
  
  childCore.on('close', (codeCore) => {
    console.log(`Core tests completed with exit code: ${codeCore}`);
    console.log('\n-------------------------------------------\n');
    
    console.log(`Running UI tests with command: ${commandUi}\n`);
    
    const childUi = exec(commandUi);
    
    childUi.stdout.pipe(process.stdout);
    childUi.stderr.pipe(process.stderr);
    
    childUi.on('close', (codeUi) => {
      console.log(`UI tests completed with exit code: ${codeUi}`);
      
      const success = codeCore === 0 && codeUi === 0;
      if (success) {
        console.log('\n✅ All tests passed!');
      } else {
        console.error('\n❌ Some tests failed!');
      }
      
      process.exit(success ? 0 : 1);
    });
  });
}

// Run all tests
async function runAllTests() {
  const testFiles = getTestFiles();
  if (testFiles.length === 0) {
    console.log('No test files found.');
    return;
  }
  
  console.log(`Found ${testFiles.length} test files across test suites.\n`);
  runTests(testFiles);
}

// Execute tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});