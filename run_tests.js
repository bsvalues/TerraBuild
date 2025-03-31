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

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file and directory paths in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define test directory and available test suites
const TEST_DIR = './tests';
const DEFAULT_TEST_PATTERN = /^test_.*\.js$|^.*_tests\.js$/;

// Skip specific test files that require special handling
const SKIP_FILES = [];

// Get specified test file from command line args, if any
const specifiedTest = process.argv[2];

// Config options for Mocha
const MOCHA_OPTS = [
  '--timeout', '10000',
  '--colors',
  '--reporter', 'spec'
];

// Helper to check if a file is a test file
function isTestFile(filename) {
  return DEFAULT_TEST_PATTERN.test(filename) && !SKIP_FILES.includes(filename);
}

// Get all test files to run
function getTestFiles() {
  if (specifiedTest) {
    // If filename doesn't include .js extension, add it
    const testFile = specifiedTest.endsWith('.js') ? specifiedTest : `${specifiedTest}.js`;
    const testPath = path.join(TEST_DIR, testFile);
    
    if (fs.existsSync(testPath)) {
      return [testPath];
    } else {
      console.error(`Test file not found: ${testPath}`);
      process.exit(1);
    }
  } else {
    // Get all test files
    return fs.readdirSync(TEST_DIR)
      .filter(isTestFile)
      .map(file => path.join(TEST_DIR, file));
  }
}

// Run tests using the Mocha CLI
function runMochaTests(testFiles) {
  return new Promise((resolve, reject) => {
    // Create the command arguments
    const args = [...MOCHA_OPTS, ...testFiles];
    
    console.log(`Running Mocha with ${testFiles.length} test files`);
    console.log(`Mocha command: mocha ${args.join(' ')}\n`);
    
    const mochaProcess = spawn('./node_modules/.bin/mocha', args, {
      stdio: 'inherit',
      shell: true
    });
    
    mochaProcess.on('close', code => {
      if (code === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    mochaProcess.on('error', err => {
      console.error(`Error running Mocha: ${err.message}`);
      reject(err);
    });
  });
}

// Run all tests
async function runAllTests() {
  const testFiles = getTestFiles();
  
  if (testFiles.length === 0) {
    console.log('No test files found');
    return;
  }
  
  console.log(`Found ${testFiles.length} test files to run`);
  console.log('='.repeat(50));
  
  try {
    const success = await runMochaTests(testFiles);
    
    if (!success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test runner error:', error);
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});