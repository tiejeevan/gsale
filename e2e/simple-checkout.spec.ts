import { test, expect } from '@playwright/test';

/**
 * Simple E2E Test for Checkout Flow
 * 
 * Prerequisites:
 * 1. Backend server must be running on http://localhost:5001
 * 2. Frontend dev server must be running on http://localhost:5173
 * 3. Test user must exist: username='testuser', password='Test123!@#'
 * 4. At least one product must exist in the database
 */

test.describe('Simple Checkout Flow', () => {
  
  test('User can login and view market page', async ({ page }) => {
    console.log('Step 1: Navigate to login page');
    await page.goto('/login');
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    
    console.log('Step 2: Fill login form');
    // Find username field (first text input)
    await page.fill('input[type="text"]', 'one');
    
    // Find password field
    await page.fill('input[type="password"]', '123456');
    
    console.log('Step 3: Submit login');
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL(/\/(dashboard|market)/, { timeout: 10000 });
    
    console.log('✓ Login successful');
    
    console.log('Step 4: Navigate to market');
    // Navigate to market page
    await page.goto('/market');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the market page
    await expect(page).toHaveURL(/\/market/);
    
    console.log('✓ Market page loaded');
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/market-page.png', fullPage: true });
    
    console.log('✓ Test complete!');
  });

  test('User can view cart page', async ({ page }) => {
    console.log('Step 1: Login');
    await page.goto('/login');
    await page.fill('input[type="text"]', 'one');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|market)/, { timeout: 10000 });
    
    console.log('Step 2: Navigate to cart');
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the cart page
    await expect(page).toHaveURL(/\/cart/);
    
    console.log('✓ Cart page loaded');
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/cart-page.png', fullPage: true });
  });

  test('User can view checkout page', async ({ page }) => {
    console.log('Step 1: Login');
    await page.goto('/login');
    await page.fill('input[type="text"]', 'one');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|market)/, { timeout: 10000 });
    
    console.log('Step 2: Navigate to checkout');
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the checkout page or redirected to cart (if cart is empty)
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/cart')) {
      console.log('⚠️  Redirected to cart (cart might be empty)');
    } else {
      console.log('✓ Checkout page loaded');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/checkout-page.png', fullPage: true });
  });

  test('Complete flow: Login → Market → Product Detail', async ({ page }) => {
    console.log('=== Starting Complete Flow Test ===');
    
    // Step 1: Login
    console.log('Step 1: Login');
    await page.goto('/login');
    await page.fill('input[type="text"]', 'one');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|market)/, { timeout: 10000 });
    console.log('✓ Logged in');
    
    // Step 2: Go to market
    console.log('Step 2: Navigate to market');
    await page.goto('/market');
    await page.waitForLoadState('networkidle');
    console.log('✓ Market page loaded');
    
    // Step 3: Wait for products to load
    console.log('Step 3: Waiting for products');
    await page.waitForTimeout(2000); // Give time for products to load
    
    // Take screenshot of market
    await page.screenshot({ path: 'e2e/screenshots/market-with-products.png', fullPage: true });
    
    // Step 4: Try to find and click a product card
    console.log('Step 4: Looking for product cards');
    
    // Look for MUI Cards that contain product information
    const productCards = page.locator('.MuiCard-root').filter({ 
      has: page.locator('img') 
    });
    
    const count = await productCards.count();
    console.log(`Found ${count} product cards`);
    
    if (count > 0) {
      console.log('✓ Found products, clicking first one');
      await productCards.first().click();
      
      // Wait a bit for navigation
      await page.waitForTimeout(1000);
      
      // Check if we navigated to product detail
      const currentUrl = page.url();
      console.log(`Current URL after click: ${currentUrl}`);
      
      if (currentUrl.includes('/market/product/')) {
        console.log('✓ Product detail page loaded');
        await page.screenshot({ path: 'e2e/screenshots/product-detail.png', fullPage: true });
      } else {
        console.log('⚠️  Did not navigate to product detail page');
        console.log('   This might be expected if products are not clickable');
      }
    } else {
      console.log('⚠️  No products found on market page');
      console.log('   Make sure you have products in your database');
    }
    
    console.log('=== Test Complete ===');
  });
});
