// Jest Configuration for TerraBuild unit tests

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test paths
  roots: ['<rootDir>/tests/unit-tests'],
  testMatch: ['**/*.test.js'],
  
  // Coverage reporting
  collectCoverage: true,
  collectCoverageFrom: [
    'server/**/*.js',
    'server/**/*.ts',
    '!server/vite.ts',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  
  // Transformations
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Module transformations
  moduleNameMapper: {
    // Handle CSS imports (if needed)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle @/ path mapping
    '^@/(.*)$': '<rootDir>/client/src/$1',
    // Handle @shared/ path mapping
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/unit-tests/setup.js'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Reporter
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
      },
    ],
  ],
};