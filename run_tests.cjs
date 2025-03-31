/**
 * Test Runner for Building Cost Building System
 * 
 * This script runs all or specific test suites for the BCBS application using Mocha.
 * 
 * Usage:
 *   node run_tests.cjs [test_file]
 * 
 * Examples:
 *   node run_tests.cjs                    # Run all tests
 *   node run_tests.cjs batch_import_tests # Run batch import tests only
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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
    // Try different extensions
    let extensions = ['.cjs', '.js'];
    let testFile = specifiedTest;
    
    // If the filename already has an extension, just use that
    if (specifiedTest.endsWith('.js') || specifiedTest.endsWith('.cjs')) {
      testFile = specifiedTest;
      extensions = [''];
    }
    
    // Try each extension
    for (const ext of extensions) {
      const fullTestFile = testFile + ext;
      const testPath = path.join(TEST_DIR, fullTestFile);
      
      if (fs.existsSync(testPath)) {
        return [testPath];
      }
    }
    
    console.error(`Test file not found: ${path.join(TEST_DIR, testFile)} with any supported extension`);
    process.exit(1);
  } else {
    // Get all test files with .cjs extension (CommonJS)
    return fs.readdirSync(TEST_DIR)
      .filter(file => file.endsWith('.cjs') && DEFAULT_TEST_PATTERN.test(file.replace('.cjs', '.js')))
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
    
    // Important: Use --require instead of directly loading the test file
    // This ensures that CommonJS modules are loaded correctly
    const mochaProcess = spawn('./node_modules/.bin/mocha', ['--require', 'module', ...args], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
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