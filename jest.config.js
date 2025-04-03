/**
 * Jest Configuration for UI Component Tests
 * 
 * This file configures Jest for testing React components
 * using JSDOM and the Testing Library ecosystem.
 */

export default {
  // Specify the test environment to use
  testEnvironment: 'jsdom',
  
  // File extensions Jest should look for
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Transform files for compatibility with Jest
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'ts-jest',
    '^.+\\.css$': 'jest-transform-css',
  },
  
  // Path mapping for module aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@assets/(.*)$': '<rootDir>/attached_assets/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Files to ignore
  testPathIgnorePatterns: ['/node_modules/', '/.replit/', '/dist/', '/build/', '/.vscode/', '/.github/'],
  
  // Setup files for global test configuration
  setupFilesAfterEnv: ['<rootDir>/tests/ui/setup.js'],
  
  // Glob patterns for finding test files
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  
  // Use verbose test output
  verbose: true,
  
  // Add coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'client/src/components/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  
  // Configure code coverage reporting
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  
  // Set timeout for tests
  testTimeout: 10000,
};