/**
 * Test Data Helpers
 * Reusable test data and helper functions for E2E tests
 */

export const testUsers = {
  newUser: () => ({
    username: `testuser${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
  }),
  
  existingUser: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!@#',
  },
};

export const testAddresses = {
  shipping: {
    name: 'John Doe',
    address: '123 Test Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    country: 'USA',
    phone: '555-123-4567',
  },
  
  billing: {
    name: 'Jane Smith',
    address: '456 Another St',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90001',
    country: 'USA',
    phone: '555-987-6543',
  },
};

export const testPayment = {
  creditCard: {
    number: '4242424242424242',
    expiry: '12/25',
    cvv: '123',
    name: 'John Doe',
  },
};

export const shippingMethods = {
  standard: 'standard',
  express: 'express',
  overnight: 'overnight',
};

export const paymentMethods = {
  creditCard: 'credit_card',
  debitCard: 'debit_card',
  paypal: 'paypal',
  cashOnDelivery: 'cash_on_delivery',
};
