/**
 * Script to run the Cost Estimation Agent through ts-node
 */

import { execSync } from 'child_process';

console.log('Running simple Cost Estimation Agent test...');

try {
  // Use ts-node to run the test script directly without compiling
  execSync('npx ts-node test-cost-agent.js', { stdio: 'inherit' });
  
  console.log('\n✅ Test completed successfully');
} catch (error) {
  console.error('\n❌ Test failed!');
  console.error('Error:', error.message);
  process.exit(1);
}