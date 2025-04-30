// Playwright End-to-End Test Configuration for TerraBuild
const { devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = {
  // Test directory
  testDir: './tests/e2e-tests',
  
  // Maximum time one test can run for
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 5000
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/test-results.json' }]
  ],
  
  // Global setup/teardown for the testing environment
  globalSetup: require.resolve('./tests/e2e-tests/setup.js').globalSetup,
  globalTeardown: require.resolve('./tests/e2e-tests/setup.js').globalTeardown,
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Base URL to use in navigation
        baseURL: process.env.TEST_APP_URL || 'http://localhost:5000',
        
        // Collect trace when retrying the failed test
        trace: 'on-first-retry',
        
        // Capture screenshot on failure
        screenshot: 'only-on-failure',
        
        // Record video on failure
        video: 'on-first-retry',
      },
    },
    
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: process.env.TEST_APP_URL || 'http://localhost:5000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
      },
    },
    
    // Test against mobile browsers if needed
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     baseURL: process.env.TEST_APP_URL || 'http://localhost:5000',
    //   },
    // },
  ],
  
  // Run local dev server before starting the tests
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 5000,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
};