/**
 * Test Configuration for Benton County Building Cost System
 * 
 * This file provides a centralized configuration for test setup, including:
 * - Mocha configuration for ES Module compatibility
 * - Test helpers and utilities
 * - Environment setup
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

// Enable both ES Module and CommonJS patterns
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Base test configuration
export const TEST_CONFIG = {
  timeout: 10000,
  baseUrl: 'http://localhost:5000',
  testDir: resolve(__dirname, 'tests'),
  fixturesDir: resolve(__dirname, 'tests', 'fixtures'),
  outputDir: resolve(__dirname, 'tests', 'output')
};

// Test data paths
export const TEST_PATHS = {
  validExcel: './attached_assets/Cost Matrix 2025.xlsx',
  invalidExcel: './tests/fixtures/invalid_matrix.xlsx'
};

// Status check for whether the server is running
export async function isServerRunning() {
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/repository`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Test environment setup
export function setupTestEnvironment() {
  process.env.NODE_ENV = 'test';
  
  // Ensure test directories exist
  import('fs').then(fs => {
    if (!fs.existsSync(TEST_CONFIG.fixturesDir)) {
      fs.mkdirSync(TEST_CONFIG.fixturesDir, { recursive: true });
    }
    if (!fs.existsSync(TEST_CONFIG.outputDir)) {
      fs.mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
    }
  });
}

// Create test data fixtures if needed
export function setupTestFixtures() {
  import('fs').then(fs => {
    // Create an invalid Excel test fixture if needed
    if (!fs.existsSync(TEST_PATHS.invalidExcel)) {
      fs.writeFileSync(TEST_PATHS.invalidExcel, 'This is not a valid Excel file');
    }
  });
}