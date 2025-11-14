// services/searchService.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export interface SearchResult {
  id: string;
  title: string;
  price: number;
  images?: string[];
  category_name?: string;
  brand?: string;
  description?: string;
  searchScore?: number;
  [key: string]: any;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  price: number;
  image: string | null;
  category: string;
}

/**
 * Search products with fuzzy search
 */
export const searchProducts = async (
  token: string,
  query: string,
  filters?: {
    category_id?: string;
    min_price?: number;
    max_price?: number;
    limit?: number;
  }
): Promise<{ success: boolean; results: SearchResult[]; count: number }> => {
  // Filter out undefined values to prevent "undefined" strings in URL
  const cleanFilters: Record<string, string> = { q: query };
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanFilters[key] = String(value);
      }
    });
  }

  const params = new URLSearchParams(cleanFilters);

  const response = await fetch(`${API_URL}/api/search/products?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to search products');
  }

  return response.json();
};

/**
 * Get search suggestions (typeahead)
 */
export const getSearchSuggestions = async (
  token: string,
  query: string,
  limit: number = 5
): Promise<{ success: boolean; suggestions: SearchSuggestion[]; count: number }> => {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });

  const response = await fetch(`${API_URL}/api/search/suggestions?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get suggestions');
  }

  return response.json();
};
