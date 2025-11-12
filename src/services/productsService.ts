// services/productsService.ts
const API_BASE_URL = 'http://localhost:5001/api';

export interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  category_id?: string;
  category_name?: string;
  brand?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  weight?: number;
  dimensions?: any;
  images?: any;
  video_url?: string;
  tags?: string[];
  status: string;
  is_featured: boolean;
  is_verified: boolean;
  owner_type: string;
  owner_id: string;
  rating_average: number;
  rating_count: number;
  views_count: number;
  sales_count: number;
  seo_title?: string;
  seo_description?: string;
  meta_keywords?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  attributes?: ProductAttribute[];
  media?: ProductMedia[];
}

export interface ProductAttribute {
  id?: string;
  key: string;
  value: string;
}

export interface ProductMedia {
  id?: string;
  type: 'image' | 'video';
  url: string;
  display_order?: number;
  is_primary?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductStats {
  total_products: number;
  active_products: number;
  pending_products: number;
  draft_products: number;
  sold_products: number;
  deleted_products: number;
  featured_products: number;
  categories_used: number;
  average_price: number;
  total_stock: number;
  total_views: number;
  total_sales: number;
}

class ProductsService {
  // Products
  async getProducts(token: string, params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    const response = await fetch(`${API_BASE_URL}/products${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  async getProductById(token: string, id: string) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  async createProduct(token: string, productData: any) {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    return response.json();
  }

  async updateProduct(token: string, id: string, productData: any) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    return response.json();
  }

  async deleteProduct(token: string, id: string) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  async updateStock(token: string, id: string, quantity: number, operation: string) {
    const response = await fetch(`${API_BASE_URL}/products/${id}/stock`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity, operation })
    });
    return response.json();
  }

  // Admin operations
  async getProductStats(token: string) {
    const response = await fetch(`${API_BASE_URL}/products/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  async getPendingProducts(token: string, page: number = 1, limit: number = 20) {
    const response = await fetch(
      `${API_BASE_URL}/products/admin/pending?page=${page}&limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    return response.json();
  }

  async approveProduct(token: string, id: string) {
    const response = await fetch(`${API_BASE_URL}/products/admin/${id}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  async rejectProduct(token: string, id: string) {
    const response = await fetch(`${API_BASE_URL}/products/admin/${id}/reject`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  async restoreProduct(token: string, id: string) {
    const response = await fetch(`${API_BASE_URL}/products/admin/${id}/restore`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  async permanentlyDeleteProduct(token: string, id: string) {
    const response = await fetch(`${API_BASE_URL}/products/admin/${id}/permanent`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  // Categories
  async getCategories(token: string, includeInactive: boolean = false) {
    const params = includeInactive ? '?include_inactive=true' : '';
    const response = await fetch(`${API_BASE_URL}/products/categories${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  async getCategoryById(token: string, id: string) {
    const response = await fetch(`${API_BASE_URL}/products/categories/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  async createCategory(token: string, categoryData: any) {
    const response = await fetch(`${API_BASE_URL}/products/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData)
    });
    return response.json();
  }

  async updateCategory(token: string, id: string, categoryData: any) {
    const response = await fetch(`${API_BASE_URL}/products/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData)
    });
    return response.json();
  }

  async deleteCategory(token: string, id: string) {
    const response = await fetch(`${API_BASE_URL}/products/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  // Search
  async searchProducts(token: string, query: string, params?: any) {
    const searchParams = new URLSearchParams({ q: query, ...params });
    const response = await fetch(`${API_BASE_URL}/products/search?${searchParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  // Featured products
  async getFeaturedProducts(token: string, limit: number = 10) {
    const response = await fetch(`${API_BASE_URL}/products/featured?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  // Get products including deleted
  async getProductsIncludingDeleted(token: string, params?: any) {
    const searchParams = new URLSearchParams({ ...params, include_deleted: 'true' });
    const response = await fetch(`${API_BASE_URL}/products?${searchParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
}

export const productsService = new ProductsService();
