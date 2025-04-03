/**
 * Core Test Runner for Benton County Building Cost System
 * 
 * This script runs the core tests for the application to verify basic functionality.
 * It uses tsx to run TypeScript files directly without requiring compilation.
 * 
 * Usage:
 *   node run-core-tests.js [test_file]
 * 
 * Examples:
 *   node run-core-tests.js                    # Run all core tests
 *   node run-core-tests.js api-endpoints.test # Run API endpoint tests only
 */

import { exec } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

// Configuration
const CORE_TESTS_DIR = './tests/core';
const TSX_BINARY = './node_modules/.bin/tsx';

// Determine whether a file is a test file
function isTestFile(filename) {
  return filename.endsWith('.test.js') || 
         filename.endsWith('.test.ts') || 
         filename.endsWith('.spec.js') ||
         filename.endsWith('.spec.ts');
}

// Get all core test files
function getTestFiles() {
  if (!existsSync(CORE_TESTS_DIR)) {
    console.error(`Error: Core tests directory not found: ${CORE_TESTS_DIR}`);
    process.exit(1);
  }
  
  return readdirSync(CORE_TESTS_DIR)
    .filter(isTestFile)
    .map(file => join(CORE_TESTS_DIR, file));
}

// Run tests with tsx for TypeScript support
function runTests(testFiles) {
  const specificTest = process.argv[2];
  let command;
  
  if (specificTest) {
    // If a specific test file is requested
    const testPath = specificTest.includes('/') 
      ? specificTest 
      : join(CORE_TESTS_DIR, specificTest);
    
    command = `${TSX_BINARY} ${testPath}`;
  } else {
    // Run all core tests sequentially
    command = testFiles.map(file => `${TSX_BINARY} ${file}`).join(' && ');
  }
  
  console.log(`Running core functionality tests...\n`);
  console.log(`Command: ${command}\n`);
  
  const child = exec(command);
  
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`\nError: Core tests failed with exit code ${code}`);
      process.exit(code);
    } else {
      console.log('\nCore functionality tests completed successfully!');
    }
  });
}

// Run all tests
async function runAllTests() {
  const testFiles = getTestFiles();
  if (testFiles.length === 0) {
    console.log('No core test files found.');
    return;
  }
  
  console.log(`Found ${testFiles.length} core test files:\n${testFiles.join('\n')}\n`);
  runTests(testFiles);
}

// Execute tests
runAllTests().catch(error => {
  console.error('Error running core tests:', error);
  process.exit(1);
});