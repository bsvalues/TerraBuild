/**
 * Test runner for the Document Processing Agent
 */

import { spawn } from 'child_process';
import path from 'path';

console.log('Starting Document Processing Agent test...');

// Use tsx to execute TypeScript code directly
const testProcess = spawn('npx', ['tsx', 'test-document-agent.js'], {
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