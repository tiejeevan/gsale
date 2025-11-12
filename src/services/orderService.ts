// services/orderService.ts
const API_BASE_URL = 'http://localhost:5001/api';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  product_sku?: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  selected_attributes?: any;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: number;
  changed_by_username?: string;
  notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'failed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_address: any;
  billing_address?: any;
  shipping_method?: string;
  tracking_number?: string;
  payment_method: string;
  payment_transaction_id?: string;
  customer_notes?: string;
  admin_notes?: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
  item_count?: number;
  username?: string;
  email?: string;
}

export interface CheckoutData {
  shipping_address: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  billing_address?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  shipping_method: string;
  payment_method: string;
  customer_notes?: string;
  tax_rate?: number;
  shipping_amount?: number;
  discount_amount?: number;
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  refunded_orders: number;
  paid_orders: number;
  payment_pending_orders: number;
  total_revenue: number;
  average_order_value: number;
  unique_customers: number;
}

class OrderService {
  /**
   * Create order from cart (checkout)
   */
  async checkout(token: string, checkoutData: CheckoutData): Promise<{ success: boolean; order?: Order; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/orders/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutData)
    });
    return response.json();
  }

  /**
   * Get user's orders
   */
  async getUserOrders(
    token: string,
    filters?: {
      status?: string;
      payment_status?: string;
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: string;
    }
  ): Promise<{ success: boolean; orders?: Order[]; pagination?: any; error?: string }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/orders?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Get single order details
   */
  async getOrder(token: string, orderId: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    token: string,
    orderId: string,
    reason?: string
  ): Promise<{ success: boolean; order?: Order; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    return response.json();
  }

  /**
   * Track order status
   */
  async trackOrder(token: string, orderId: string): Promise<{ success: boolean; tracking?: any; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/track`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Reorder - Add all items from a previous order to cart
   */
  async reorder(token: string, orderId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/reorder`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  /**
   * Get all orders (admin)
   */
  async getAllOrders(
    token: string,
    filters?: {
      status?: string;
      payment_status?: string;
      user_id?: number;
      search?: string;
      date_from?: string;
      date_to?: string;
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: string;
    }
  ): Promise<{ success: boolean; orders?: Order[]; pagination?: any; error?: string }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/orders/admin/all?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Get order statistics (admin)
   */
  async getOrderStats(token: string): Promise<{ success: boolean; stats?: OrderStats; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/orders/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Get order by ID (admin - no user restriction)
   */
  async getOrderAdmin(token: string, orderId: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Update order status (admin)
   */
  async updateOrderStatus(
    token: string,
    orderId: string,
    status: string,
    notes?: string
  ): Promise<{ success: boolean; order?: Order; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, notes })
    });
    return response.json();
  }

  /**
   * Update shipping information (admin)
   */
  async updateShipping(
    token: string,
    orderId: string,
    trackingNumber: string,
    shippingMethod?: string
  ): Promise<{ success: boolean; order?: Order; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/shipping`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tracking_number: trackingNumber, shipping_method: shippingMethod })
    });
    return response.json();
  }

  /**
   * Process refund (admin)
   */
  async refundOrder(
    token: string,
    orderId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; order?: Order; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, reason })
    });
    return response.json();
  }
}

export const orderService = new OrderService();
