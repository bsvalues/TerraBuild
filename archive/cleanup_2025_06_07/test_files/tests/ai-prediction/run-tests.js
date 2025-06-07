/**
 * Test Runner for AI Prediction Feature
 * 
 * This script runs the tests for the AI prediction functionality.
 * 
 * Usage:
 *   node tests/ai-prediction/run-tests.js
 */

const Mocha = require('mocha');
const path = require('path');
const fs = require('fs');

// Create a new Mocha instance
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000
});

// Get the directory for the AI tests
const testDir = __dirname;

// Add each test file to the mocha instance
fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'))
  .forEach(file => {
    mocha.addFile(
      path.join(testDir, file)
    );
  });

// Run the tests
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;
});