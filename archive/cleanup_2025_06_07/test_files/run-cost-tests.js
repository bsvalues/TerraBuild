/**
 * Cost Calculator Test Runner
 * 
 * This script runs the integration tests for the cost calculator API endpoints.
 * It uses Mocha to run the tests.
 */

const { spawn } = require('child_process');
const path = require('path');

async function runTests() {
  console.log('Running cost calculator integration tests...');
  
  // Use Mocha to run the tests
  const testProcess = spawn('npx', [
    'mocha', 
    path.join(__dirname, 'tests', 'cost-calculator-integration.test.js'),
    '--timeout', 
    '10000' // 10 second timeout for API calls
  ], {
    stdio: 'inherit'
  });
  
  return new Promise((resolve, reject) => {
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Cost calculator tests completed successfully!');
        resolve();
      } else {
        console.error(`Cost calculator tests failed with code ${code}`);
        reject(new Error(`Tests failed with code ${code}`));
      }
    });
    
    testProcess.on('error', (err) => {
      console.error('Error running tests:', err);
      reject(err);
    });
  });
}

// Run the tests
runTests()
  .then(() => {
    console.log('All tests completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error running tests:', err);
    process.exit(1);
  });