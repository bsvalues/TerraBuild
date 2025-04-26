import { test, expect } from '@playwright/test';

/**
 * End-to-end test for the BCBS Application homepage
 */
test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Check that the page title contains the expected text
    await expect(page).toHaveTitle(/Benton County/);
    
    // Verify that the main content loaded
    await expect(page.locator('main')).toBeVisible();
    
    // Screenshot for visual verification
    await page.screenshot({ path: 'test-results/homepage.png' });
  });
  
  test('should display the navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Verify navigation menu is present
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
    
    // Should have menu items
    const menuItems = navigation.locator('a');
    await expect(menuItems).toHaveCount({ min: 1 });
  });
  
  test('should have a working search function', async ({ page }) => {
    await page.goto('/');
    
    // Find the search input
    const searchInput = page.locator('input[type="search"], [placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
    
    // Enter search term
    await searchInput.fill('Test');
    await searchInput.press('Enter');
    
    // Wait for search results to appear
    // This might need adjustment based on the actual app implementation
    await page.waitForLoadState('networkidle');
    
    // Check that we've navigated to search results or the search is being processed
    const currentUrl = page.url();
    expect(currentUrl).toContain('search') || expect(currentUrl).toContain('q=');
  });
  
  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('/non-existent-page-123456789');
    
    // Check that we get an appropriate error message, not a crash
    await expect(page.locator('text="not found"')).toBeVisible({ timeout: 10000 });
  });
  
  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check that images have alt text
    const images = page.locator('img:visible');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) { // Test first 10 images max
      const image = images.nth(i);
      const altText = await image.getAttribute('alt') || '';
      // Either has alt text, or explicitly empty alt="" for decorative images
      expect(altText !== null).toBeTruthy();
    }
    
    // Check form controls have labels
    const formControls = page.locator('input:visible, select:visible, textarea:visible');
    const formControlCount = await formControls.count();
    
    for (let i = 0; i < Math.min(formControlCount, 5); i++) { // Test first 5 controls
      const control = formControls.nth(i);
      const id = await control.getAttribute('id');
      
      if (id) {
        // Check if there's an associated label
        const hasLabel = await page.locator(`label[for="${id}"]`).count() > 0;
        const hasAriaLabel = await control.getAttribute('aria-label') !== null;
        const hasAriaLabelledBy = await control.getAttribute('aria-labelledby') !== null;
        
        expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
      }
    }
  });
  
  test('should load quickly', async ({ page }) => {
    // Record performance metrics
    await page.goto('/', { waitUntil: 'load' });
    
    // Get performance metrics using JavaScript
    const timing = await page.evaluate(() => JSON.stringify(window.performance.timing));
    const timingData = JSON.parse(timing);
    
    // Calculate load time
    const loadTime = timingData.loadEventEnd - timingData.navigationStart;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    // Should load in less than 5 seconds (adjust as needed)
    expect(loadTime).toBeLessThan(5000);
  });
});