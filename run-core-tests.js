#!/usr/bin/env node

/**
 * Core Test Runner for Benton County Building Cost System
 * 
 * This script runs the core tests for the application to verify basic functionality.
 * It uses ES modules and supports running specific test files.
 * 
 * Usage:
 *   node run-core-tests.js [test_file]
 * 
 * Examples:
 *   node run-core-tests.js                    # Run all core tests
 *   node run-core-tests.js api-endpoints.test # Run API endpoint tests only
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupTestEnvironment, setupTestFixtures } from './test-config.js';

// Initialize test environment
setupTestEnvironment();
setupTestFixtures();

// Get current file and directory paths in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define core test directory and test pattern
const CORE_TEST_DIR = './tests/core';
const TEST_PATTERN = /.*\.test\.js$/;

// Skip specific test files that require special handling
const SKIP_FILES = [];

// Get specified test file from command line args, if any
const specifiedTest = process.argv[2];

// Config options for Mocha
const MOCHA_OPTS = [
  '--timeout', '10000',
  '--colors',
  '--reporter', 'spec',
  '--experimental-modules',
  '--no-warnings'
];

// Helper to check if a file is a test file
function isTestFile(filename) {
  return TEST_PATTERN.test(filename) && !SKIP_FILES.includes(filename);
}

// Get all test files to run
function getTestFiles() {
  const coreTestsDir = path.resolve(__dirname, CORE_TEST_DIR);
  
  if (!fs.existsSync(coreTestsDir)) {
    console.error(`Core test directory ${CORE_TEST_DIR} does not exist.`);
    return [];
  }
  
  // If a specific test was specified, only run that test
  if (specifiedTest) {
    const fullPattern = specifiedTest.endsWith('.js') ? specifiedTest : `${specifiedTest}.js`;
    const fullTestPath = path.join(coreTestsDir, fullPattern);
    
    if (fs.existsSync(fullTestPath)) {
      return [fullTestPath];
    }
    
    // Try with .test.js extension if not found
    const testPattern = specifiedTest.endsWith('.test.js') ? specifiedTest : `${specifiedTest}.test.js`;
    const testPath = path.join(coreTestsDir, testPattern);
    
    if (fs.existsSync(testPath)) {
      return [testPath];
    }
    
    console.error(`Specified test file ${specifiedTest} not found.`);
    return [];
  }
  
  // Otherwise, get all test files in the core test directory
  return fs.readdirSync(coreTestsDir)
    .filter(isTestFile)
    .map(file => path.join(coreTestsDir, file));
}

// Run Mocha with the specified test files
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