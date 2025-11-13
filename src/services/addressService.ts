// services/addressService.ts
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export interface Address {
  id: string;
  user_id: number;
  address_type: 'shipping' | 'billing' | 'both';
  label?: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressInput {
  address_type?: 'shipping' | 'billing' | 'both';
  label?: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  is_default?: boolean;
}

class AddressService {
  /**
   * Get all user addresses
   */
  async getUserAddresses(token: string): Promise<{ success: boolean; addresses?: Address[]; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Get single address
   */
  async getAddress(token: string, addressId: string): Promise<{ success: boolean; address?: Address; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Get default address
   */
  async getDefaultAddress(token: string, type: 'shipping' | 'billing' = 'shipping'): Promise<{ success: boolean; address?: Address | null; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/addresses/default/${type}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Create new address
   */
  async createAddress(token: string, addressData: AddressInput): Promise<{ success: boolean; address?: Address; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addressData)
    });
    return response.json();
  }

  /**
   * Update address
   */
  async updateAddress(token: string, addressId: string, addressData: Partial<AddressInput>): Promise<{ success: boolean; address?: Address; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addressData)
    });
    return response.json();
  }

  /**
   * Set address as default
   */
  async setDefaultAddress(token: string, addressId: string): Promise<{ success: boolean; address?: Address; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}/default`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Delete address
   */
  async deleteAddress(token: string, addressId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }

  /**
   * Convert address to checkout format
   */
  addressToCheckoutFormat(address: Address) {
    return {
      name: address.name,
      address: address.address_line1,
      city: address.city,
      state: address.state,
      zip: address.postal_code,
      country: address.country,
      phone: address.phone
    };
  }
}

export const addressService = new AddressService();
