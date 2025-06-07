// End-to-End Testing Setup for TerraBuild Application
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Global setup
async function globalSetup() {
  // Launch browser and create a new context
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto(process.env.TEST_APP_URL || 'http://localhost:5000');

    // Log in to the application (if needed)
    if (process.env.TEST_USERNAME && process.env.TEST_PASSWORD) {
      await page.locator('[data-testid="login-username"]').fill(process.env.TEST_USERNAME);
      await page.locator('[data-testid="login-password"]').fill(process.env.TEST_PASSWORD);
      await page.locator('[data-testid="login-submit"]').click();
      
      // Wait for authentication to complete and dashboard to load
      await page.waitForSelector('[data-testid="dashboard-header"]');
      
      // Save authentication state
      await context.storageState({ path: path.join(__dirname, 'auth.json') });
    }
  } catch (error) {
    console.error('Setup failed:', error);
    // Take screenshot of the failed setup
    await page.screenshot({ path: path.join(screenshotsDir, 'setup-error.png') });
    throw error;
  } finally {
    // Close browser after setup
    await browser.close();
  }
}

// Global teardown
async function globalTeardown() {
  // Perform any cleanup if needed
  console.log('E2E test teardown complete');
}

module.exports = { globalSetup, globalTeardown };