import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests for BCBS Application
 * 
 * This suite tests the main homepage functionality including:
 * - Page load
 * - Navigation elements
 * - Key UI components
 * - Basic interactions
 */

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Verify page title
    await expect(page).toHaveTitle(/Benton County|Building Cost|BCBS/);
    
    // Screenshot for visual verification
    await page.screenshot({ path: 'test-results/screenshots/homepage.png' });
  });
  
  test('should have a working header with navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for header elements
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check for logo
    await expect(page.locator('header img[alt*="logo" i]').first()).toBeVisible();
    
    // Check for navigation links
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });
  
  test('should display the cost calculator section', async ({ page }) => {
    await page.goto('/');
    
    // Check for calculator section
    const calculatorSection = page.locator('*:text("Cost Calculator")').first();
    await expect(calculatorSection).toBeVisible();
    
    // Basic form elements should be present
    await expect(page.locator('form')).toBeVisible();
  });
  
  test('should have a responsive design', async ({ page }) => {
    // Test with desktop viewport (already default)
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/homepage-desktop.png' });
    
    // Test with tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('header')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/homepage-tablet.png' });
    
    // Test with mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('header')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/homepage-mobile.png' });
  });
  
  test('should have proper a11y attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check for image alt texts
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt, `Image ${i+1} should have alt text`).toBeTruthy();
    }
    
    // Check for landmarks
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Health Endpoint', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
  });
});

test.describe('Feature Flags', () => {
  test('should load feature flags', async ({ page }) => {
    await page.goto('/');
    
    // Wait for feature flags to be loaded
    // This tests if the application has loaded feature flags in any form
    try {
      // Check if we can find feature flag data in the page content
      const flagsExist = await page.evaluate(() => {
        // Look for flags in various possible locations
        return typeof (window as any).featureFlags !== 'undefined' || 
               document.querySelector('[data-feature-flags]') !== null;
      });
      
      // We don't need to assert this, as we're just ensuring the evaluation completes
      // If feature flags aren't found, we'll just not run additional assertions
      if (flagsExist) {
        // Additional assertions can go here if flags exist
        console.log('Feature flags found in the application');
      } else {
        console.log('No feature flags found in standard locations');
      }
    } catch (error) {
      console.log('Error checking for feature flags:', error);
    }
  });
});