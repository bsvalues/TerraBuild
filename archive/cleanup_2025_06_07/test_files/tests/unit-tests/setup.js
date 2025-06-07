// Setup file for Jest unit tests

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/terrabuild_test';

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Global before all hook
beforeAll(async () => {
  console.log('Setting up test environment');
  // Any global setup can go here
});

// Global after all hook
afterAll(async () => {
  console.log('Tearing down test environment');
  // Any global teardown can go here
});