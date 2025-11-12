/**
 * Page Object Models
 * Reusable page interactions for E2E tests
 */

import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]:has-text("Login")');
    await this.page.waitForURL(/\/(dashboard|products)/, { timeout: 10000 });
  }
}

export class ProductsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/products');
    await this.page.waitForLoadState('networkidle');
  }

  async getFirstProduct() {
    return this.page.locator('[data-testid="product-card"]').first();
  }

  async clickProduct(index: number = 0) {
    await this.page.locator('[data-testid="product-card"]').nth(index).click();
  }

  async addToCart() {
    await this.page.click('button:has-text("Add to Cart")');
    await this.page.waitForSelector('text=/added to cart|item added/i', { timeout: 5000 });
  }
}

export class CartPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/cart');
  }

  async openCart() {
    await this.page.click('[data-testid="cart-icon"], [aria-label*="cart"]');
  }

  async proceedToCheckout() {
    await this.page.click('button:has-text("Checkout"), button:has-text("Proceed to Checkout")');
    await this.page.waitForURL(/\/checkout/, { timeout: 10000 });
  }

  async getCartCount() {
    const badge = this.page.locator('[data-testid="cart-count"], .cart-badge');
    return await badge.textContent();
  }
}

export class CheckoutPage {
  constructor(private page: Page) {}

  async fillShippingAddress(address: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  }) {
    await this.page.fill('input[name="name"]', address.name);
    await this.page.fill('input[name="address"]', address.address);
    await this.page.fill('input[name="city"]', address.city);
    await this.page.fill('input[name="state"]', address.state);
    await this.page.fill('input[name="zip"]', address.zip);
    await this.page.fill('input[name="phone"]', address.phone);
  }

  async selectShippingMethod(method: string) {
    await this.page.locator(`input[type="radio"][value="${method}"]`).first().check();
  }

  async selectPaymentMethod(method: string) {
    await this.page.locator(`input[type="radio"][value="${method}"]`).first().check();
  }

  async clickNext() {
    await this.page.click('button:has-text("Next"), button:has-text("Continue")');
  }

  async placeOrder() {
    await this.page.click('button:has-text("Place Order")');
    await this.page.waitForURL(/\/order-confirmation/, { timeout: 15000 });
  }

  async selectSavedAddress(index: number = 0) {
    await this.page.locator('input[type="radio"][name*="address"]').nth(index).check();
  }
}

export class OrderConfirmationPage {
  constructor(private page: Page) {}

  async getOrderNumber() {
    const orderText = await this.page.locator('text=/order.*#|ORD-/i').textContent();
    return orderText?.match(/ORD-\d+-\d+/)?.[0];
  }

  async isConfirmationVisible() {
    return await this.page.locator('text=/order confirmed|thank you|success/i').isVisible();
  }
}
