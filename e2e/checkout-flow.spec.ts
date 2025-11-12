import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Product Order and Checkout Flow
 * 
 * This test simulates a real user journey:
 * 1. User logs in
 * 2. User browses products
 * 3. User adds product to cart
 * 4. User proceeds to checkout
 * 5. User fills shipping address
 * 6. User selects shipping method
 * 7. User selects payment method
 * 8. User reviews order
 * 9. User places order
 * 10. User sees order confirmation
 */

test.describe('Product Order and Checkout Flow', () => {
  
  // Test credentials - make sure this user exists in your database
  const testUser = {
    username: 'testuser',
    password: 'Test123!@#'
  };

  // Run before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('Complete checkout flow - Guest user creates account, adds product, and completes order', async ({ page }) => {
    // ============================================
    // STEP 1: User Registration
    // ============================================
    console.log('Step 1: Registering new user...');
    
    // Click on Sign Up button
    await page.click('text=Sign Up');
    
    // Wait for registration form
    await expect(page.locator('h1:has-text("Sign Up")')).toBeVisible();
    
    // Fill registration form
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');
    
    // Submit registration
    await page.click('button[type="submit"]:has-text("Sign Up")');
    
    // Wait for successful registration (redirect to login or dashboard)
    await page.waitForURL(/\/(login|dashboard|products)/, { timeout: 10000 });
    
    console.log('✓ User registered successfully');

    // ============================================
    // STEP 2: User Login (if redirected to login)
    // ============================================
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Step 2: Logging in...');
      
      await page.fill('input[name="username"]', testUsername);
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.click('button[type="submit"]:has-text("Login")');
      
      // Wait for successful login
      await page.waitForURL(/\/(dashboard|products)/, { timeout: 10000 });
      
      console.log('✓ User logged in successfully');
    }

    // ============================================
    // STEP 3: Browse Products
    // ============================================
    console.log('Step 3: Browsing products...');
    
    // Navigate to products page
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Wait for products to load
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
    
    // Get first available product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct).toBeVisible();
    
    // Get product name for verification later
    const productName = await firstProduct.locator('h3, h2, [data-testid="product-title"]').first().textContent();
    
    console.log(`✓ Found product: ${productName}`);

    // ============================================
    // STEP 4: Add Product to Cart
    // ============================================
    console.log('Step 4: Adding product to cart...');
    
    // Click on product to view details
    await firstProduct.click();
    
    // Wait for product detail page
    await page.waitForLoadState('networkidle');
    
    // Find and click "Add to Cart" button
    const addToCartButton = page.locator('button:has-text("Add to Cart")');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
    
    // Wait for success message or cart update
    await expect(page.locator('text=/added to cart|item added/i')).toBeVisible({ timeout: 5000 });
    
    // Verify cart count increased
    const cartBadge = page.locator('[data-testid="cart-count"], .cart-badge, [aria-label*="cart"]');
    await expect(cartBadge).toContainText('1');
    
    console.log('✓ Product added to cart');

    // ============================================
    // STEP 5: View Cart
    // ============================================
    console.log('Step 5: Viewing cart...');
    
    // Click on cart icon
    await page.click('[data-testid="cart-icon"], [aria-label*="cart"], button:has-text("Cart")');
    
    // Wait for cart page
    await page.waitForURL(/\/cart/, { timeout: 10000 });
    
    // Verify product is in cart
    await expect(page.locator(`text=${productName}`)).toBeVisible();
    
    console.log('✓ Cart page loaded with product');

    // ============================================
    // STEP 6: Proceed to Checkout
    // ============================================
    console.log('Step 6: Proceeding to checkout...');
    
    // Click checkout button
    const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Proceed to Checkout")');
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();
    
    // Wait for checkout page
    await page.waitForURL(/\/checkout/, { timeout: 10000 });
    
    // Verify we're on checkout page
    await expect(page.locator('h1:has-text("Checkout"), h2:has-text("Checkout")')).toBeVisible();
    
    console.log('✓ Checkout page loaded');

    // ============================================
    // STEP 7: Fill Shipping Address
    // ============================================
    console.log('Step 7: Filling shipping address...');
    
    // Fill shipping address form
    await page.fill('input[name="name"], input[label*="Name"]', 'John Doe');
    await page.fill('input[name="address"], input[label*="Address"]', '123 Test Street');
    await page.fill('input[name="city"], input[label*="City"]', 'San Francisco');
    await page.fill('input[name="state"], input[label*="State"]', 'CA');
    await page.fill('input[name="zip"], input[label*="ZIP"]', '94102');
    await page.fill('input[name="phone"], input[label*="Phone"]', '555-123-4567');
    
    // Click Next/Continue button
    await page.click('button:has-text("Next"), button:has-text("Continue")');
    
    console.log('✓ Shipping address filled');

    // ============================================
    // STEP 8: Select Shipping Method
    // ============================================
    console.log('Step 8: Selecting shipping method...');
    
    // Wait for shipping method section
    await expect(page.locator('text=/shipping method/i')).toBeVisible({ timeout: 5000 });
    
    // Select standard shipping (usually first option)
    const shippingOption = page.locator('input[type="radio"][value="standard"]').first();
    await shippingOption.check();
    
    // Click Next/Continue
    await page.click('button:has-text("Next"), button:has-text("Continue")');
    
    console.log('✓ Shipping method selected');

    // ============================================
    // STEP 9: Select Payment Method
    // ============================================
    console.log('Step 9: Selecting payment method...');
    
    // Wait for payment method section
    await expect(page.locator('text=/payment method/i')).toBeVisible({ timeout: 5000 });
    
    // Select payment method (e.g., Credit Card)
    const paymentOption = page.locator('input[type="radio"][value="credit_card"]').first();
    await paymentOption.check();
    
    // Click Next/Continue to review
    await page.click('button:has-text("Next"), button:has-text("Continue")');
    
    console.log('✓ Payment method selected');

    // ============================================
    // STEP 10: Review Order
    // ============================================
    console.log('Step 10: Reviewing order...');
    
    // Wait for review section
    await expect(page.locator('text=/review/i')).toBeVisible({ timeout: 5000 });
    
    // Verify order details are displayed
    await expect(page.locator(`text=${productName}`)).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=123 Test Street')).toBeVisible();
    
    // Verify total amount is displayed
    await expect(page.locator('text=/total/i')).toBeVisible();
    
    console.log('✓ Order review complete');

    // ============================================
    // STEP 11: Place Order
    // ============================================
    console.log('Step 11: Placing order...');
    
    // Click Place Order button
    const placeOrderButton = page.locator('button:has-text("Place Order")');
    await expect(placeOrderButton).toBeVisible();
    await placeOrderButton.click();
    
    // Wait for order confirmation page
    await page.waitForURL(/\/order-confirmation/, { timeout: 15000 });
    
    console.log('✓ Order placed successfully');

    // ============================================
    // STEP 12: Verify Order Confirmation
    // ============================================
    console.log('Step 12: Verifying order confirmation...');
    
    // Verify confirmation message
    await expect(page.locator('text=/order confirmed|thank you|success/i')).toBeVisible();
    
    // Verify order number is displayed
    await expect(page.locator('text=/order.*#|ORD-/i')).toBeVisible();
    
    // Take screenshot of confirmation page
    await page.screenshot({ path: 'e2e/screenshots/order-confirmation.png', fullPage: true });
    
    console.log('✓ Order confirmation verified');
    console.log('✅ Complete checkout flow test PASSED!');
  });

  test('Add multiple products to cart and checkout', async ({ page }) => {
    // Login first (reuse credentials or create new user)
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|products)/);

    // Navigate to products
    await page.goto('/products');
    
    // Add first product
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('button:has-text("Add to Cart")');
    await page.goBack();
    
    // Add second product
    await page.locator('[data-testid="product-card"]').nth(1).click();
    await page.click('button:has-text("Add to Cart")');
    
    // Verify cart has 2 items
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    
    // Proceed to checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('button:has-text("Checkout")');
    
    // Complete checkout (abbreviated)
    await page.fill('input[name="name"]', 'Jane Smith');
    await page.fill('input[name="address"]', '456 Another St');
    await page.fill('input[name="city"]', 'Los Angeles');
    await page.fill('input[name="state"]', 'CA');
    await page.fill('input[name="zip"]', '90001');
    await page.fill('input[name="phone"]', '555-987-6543');
    
    // Continue through steps
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Place Order")');
    
    // Verify order placed
    await expect(page.locator('text=/order confirmed/i')).toBeVisible();
  });

  test('Checkout with saved address', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|products)/);

    // Add product to cart
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('button:has-text("Add to Cart")');
    
    // Go to checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('button:has-text("Checkout")');
    
    // Select saved address (if available)
    const savedAddressRadio = page.locator('input[type="radio"][name="savedAddress"]').first();
    if (await savedAddressRadio.isVisible()) {
      await savedAddressRadio.check();
      console.log('✓ Using saved address');
    } else {
      // Fill new address
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="address"]', '789 Saved St');
      await page.fill('input[name="city"]', 'Seattle');
      await page.fill('input[name="state"]', 'WA');
      await page.fill('input[name="zip"]', '98101');
      await page.fill('input[name="phone"]', '555-111-2222');
    }
    
    // Complete checkout
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Place Order")');
    
    // Verify success
    await expect(page.locator('text=/order confirmed/i')).toBeVisible();
  });

  test('Cart validation - Cannot checkout with empty cart', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    
    // Try to go directly to checkout
    await page.goto('/checkout');
    
    // Should redirect to cart or show error
    await expect(page).toHaveURL(/\/cart/);
  });

  test('Form validation - Cannot proceed with invalid shipping address', async ({ page }) => {
    // Login and add product
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('button:has-text("Add to Cart")');
    await page.click('[data-testid="cart-icon"]');
    await page.click('button:has-text("Checkout")');
    
    // Try to proceed without filling address
    await page.click('button:has-text("Next")');
    
    // Should show validation errors
    await expect(page.locator('text=/required|invalid/i')).toBeVisible();
  });
});
