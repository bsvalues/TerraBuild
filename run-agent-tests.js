/**
 * Test Runner for BCBS AI Agents
 * 
 * This script runs the tests for the AI agents in the system
 */

import { execSync } from 'child_process';

console.log('Running tests for BCBS AI Agents...');

try {
  // Run Jest tests for Cost Estimation Agent
  console.log('\n----- Testing Cost Estimation Agent -----');
  execSync('npx jest tests/costEstimationAgent.test.ts --verbose', { stdio: 'inherit' });
  
  // Add more agent tests here as they are developed
  
  console.log('\n✅ All agent tests completed successfully');
} catch (error) {
  console.error('\n❌ Some tests failed!');
  console.error('Fix the failing tests before proceeding with implementation');
  process.exit(1);
}