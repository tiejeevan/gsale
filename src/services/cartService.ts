// services/cartService.ts
const API_BASE_URL = 'http://localhost:5001/api';

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  selected_attributes?: any;
  product_title: string;
  product_slug: string;
  product_images?: string[];
  stock_quantity: number;
  product_status: string;
  current_price: number;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  user_id: number;
  status: 'active' | 'abandoned' | 'converted';
  total_amount: number;
  total_items: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
  items: CartItem[];
}

export interface CartValidation {
  valid: boolean;
  issues: string[];
  cart?: Cart;
}

class CartService {
  /**
   * Get user's cart with items
   */
  async getCart(token: string): Promise<{ success: boolean; cart: Cart; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Get cart item count
   */
  async getCartCount(token: string): Promise<{ success: boolean; count: number; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/cart/count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Add item to cart
   */
  async addToCart(
    token: string,
    productId: string,
    quantity: number = 1,
    selectedAttributes?: any
  ): Promise<{ success: boolean; cart_item?: CartItem; cart?: Cart; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        quantity,
        selected_attributes: selectedAttributes
      })
    });
    return response.json();
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    token: string,
    cartItemId: string,
    quantity: number
  ): Promise<{ success: boolean; cart_item?: CartItem; cart?: Cart; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/cart/item/${cartItemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity })
    });
    return response.json();
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(
    token: string,
    cartItemId: string
  ): Promise<{ success: boolean; cart?: Cart; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/cart/item/${cartItemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Clear entire cart
   */
  async clearCart(token: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Validate cart before checkout
   */
  async validateCart(token: string): Promise<{ success: boolean } & CartValidation> {
    const response = await fetch(`${API_BASE_URL}/cart/validate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Update cart prices to current product prices
   */
  async updateCartPrices(token: string): Promise<{ success: boolean; cart?: Cart; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/cart/update-prices`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
}

export const cartService = new CartService();
