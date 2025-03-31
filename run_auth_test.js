/**
 * Auth Test Runner for Building Cost Building System
 * 
 * This script runs the authentication API tests.
 * 
 * Usage:
 *   node run_auth_test.js
 */

const { testLoginAPI, testAutoLoginAPI } = require('./tests/test_auth');

async function runAuthTests() {
  console.log('='.repeat(50));
  console.log('Running Authentication Tests');
  console.log('='.repeat(50));
  
  try {
    await testLoginAPI();
    await testAutoLoginAPI();
    console.log('\nAll authentication tests completed');
  } catch (error) {
    console.error('Error running authentication tests:', error);
    process.exit(1);
  }
}

// Run the tests
runAuthTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});