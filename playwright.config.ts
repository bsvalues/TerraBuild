import { PlaywrightTestConfig, devices } from '@playwright/test';

/**
 * Configuration for Playwright E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
const config: PlaywrightTestConfig = {
  // Directory where tests are located
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Expected status for a test to pass
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000
  },
  
  // Run all tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/playwright/html-report' }],
    ['json', { outputFile: 'test-results/playwright/test-results.json' }],
    ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Maximum time each action (like click()) can take
    actionTimeout: 10 * 1000,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video only on failure
    video: 'on-first-retry',
    
    // Set base URL for all navigation operations
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5000',
  },
  
  // Configure projects for different browser environments
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
    // Test on mobile viewports
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],
  
  // Local development web server
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 5000,
    timeout: 60 * 1000,
    reuseExistingServer: !process.env.CI,
  },
};

export default config;