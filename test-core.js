#!/usr/bin/env node

/**
 * Core Test Runner for Benton County Building Cost System
 * 
 * This script runs the core tests for the application directly using tsx,
 * which supports TypeScript files without requiring separate compilation.
 * 
 * Usage:
 *   node test-core.js [test_file]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_DIR = './tests/core';

function isTestFile(filename) {
  return filename.endsWith('.test.js');
}

function getTestFiles() {
  const files = fs.readdirSync(TEST_DIR);
  return files.filter(isTestFile).map(file => path.join(TEST_DIR, file));
}

function runTests(testFiles) {
  const baseTsxCommand = 'npx tsx';
  
  // Use the mocha programmatic API through tsx
  const mochaCommand = `${baseTsxCommand} node_modules/mocha/bin/mocha --timeout 10000 --colors --reporter spec`;
  
  // Handle specific test file or all test files
  const testFileList = testFiles.length > 0 ? testFiles.join(' ') : getTestFiles().join(' ');
  
  // Combine commands
  const fullCommand = `${mochaCommand} ${testFileList}`;
  
  console.log(`\nRunning command: ${fullCommand}\n`);
  
  try {
    execSync(fullCommand, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error running tests: ${error.message}`);
    return false;
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const testFiles = args.length > 0 ? args.map(file => {
    if (!file.includes('/')) {
      return path.join(TEST_DIR, file.endsWith('.js') ? file : `${file}.test.js`);
    }
    return file;
  }) : [];
  
  console.log('Running core tests with tsx for TypeScript compatibility...');
  
  if (testFiles.length > 0) {
    console.log(`Running specific test files: ${testFiles.join(', ')}`);
  } else {
    console.log(`Running all test files in ${TEST_DIR}`);
  }
  
  const success = runTests(testFiles);
  process.exit(success ? 0 : 1);
}

main();