/**
 * Test runner for the Geospatial Analysis Agent
 */

import { spawn } from 'child_process';
import path from 'path';

console.log('Starting Geospatial Analysis Agent test...');

// Use tsx to execute TypeScript code directly
const testProcess = spawn('npx', ['tsx', 'test-geo-agent.js'], {
  cwd: process.cwd(),
  env: { ...process.env },
  stdio: 'inherit'
});

testProcess.on('close', (code) => {
  console.log(`Test process exited with code ${code}`);
  if (code !== 0) {
    console.error('⚠️ Test failed!');
  } else {
    console.log('✅ Test completed successfully!');
  }
});