const { test, expect } = require('@playwright/test');

// Test authentication flows
test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth');
    
    // Verify login form elements are present
    await expect(page.locator('[data-testid="login-username"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    // Enter invalid credentials
    await page.locator('[data-testid="login-username"]').fill('invalid-user');
    await page.locator('[data-testid="login-password"]').fill('invalid-password');
    await page.locator('[data-testid="login-submit"]').click();
    
    // Verify error message is shown
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Skip if no test credentials provided
    test.skip(!process.env.TEST_USERNAME || !process.env.TEST_PASSWORD, 
      'Test credentials not provided');
    
    await page.goto('/auth');
    
    // Enter valid credentials
    await page.locator('[data-testid="login-username"]').fill(process.env.TEST_USERNAME);
    await page.locator('[data-testid="login-password"]').fill(process.env.TEST_PASSWORD);
    await page.locator('[data-testid="login-submit"]').click();
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
  });
});

// Test dashboard functionality with authenticated user
test.describe('Dashboard', () => {
  // Use stored authentication state
  test.use({ storageState: 'tests/e2e-tests/auth.json' });
  
  test('should display user information', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify user info is displayed
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });
  
  test('should navigate to property assessment', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on property assessment link
    await page.locator('[data-testid="nav-property-assessment"]').click();
    
    // Verify navigation to property assessment page
    await expect(page).toHaveURL(/.*property-assessment/);
    await expect(page.locator('[data-testid="property-assessment-header"]')).toBeVisible();
  });
});

// Test cost calculation functionality
test.describe('Cost Calculation', () => {
  // Use stored authentication state
  test.use({ storageState: 'tests/e2e-tests/auth.json' });
  
  test('should calculate building costs', async ({ page }) => {
    await page.goto('/cost-calculator');
    
    // Fill in calculation form
    await page.locator('[data-testid="building-type"]').selectOption('residential');
    await page.locator('[data-testid="square-footage"]').fill('2500');
    await page.locator('[data-testid="quality-level"]').selectOption('standard');
    await page.locator('[data-testid="calculate-button"]').click();
    
    // Verify result is displayed
    await expect(page.locator('[data-testid="calculation-result"]')).toBeVisible();
    
    // Verify the result contains a numeric value
    const resultText = await page.locator('[data-testid="calculation-result"]').textContent();
    expect(resultText).toMatch(/\$[\d,]+(\.\d{2})?/);
  });
});

// Test API endpoints directly
test.describe('API Endpoints', () => {
  test('health check endpoint returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
  
  test('user endpoint requires authentication', async ({ request }) => {
    const response = await request.get('/api/user');
    expect(response.status()).toBe(401);
  });
});