/**
 * Script to run the Benton County Conversion Agent test
 */

import { execSync } from 'child_process';

console.log('Running Benton County Conversion Agent test...');

try {
  // Use ts-node to run the test script directly without compiling
  execSync('npx ts-node test-conversion-agent.js', { stdio: 'inherit' });
  
  console.log('\n✅ Test completed successfully');
} catch (error) {
  console.error('\n❌ Test failed!');
  console.error('Error:', error.message);
  process.exit(1);
}