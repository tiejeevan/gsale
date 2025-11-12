const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

export const newsService = {
  async getWorldNews(token: string, country = 'us', limit = 5): Promise<NewsArticle[]> {
    const response = await fetch(`${API_URL}/api/news/world?country=${country}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch world news');
    return response.json();
  },

  async getRegionalNews(token: string, country = 'us', limit = 5): Promise<NewsArticle[]> {
    const response = await fetch(`${API_URL}/api/news/regional?country=${country}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch regional news');
    return response.json();
  },

  async getSportsNews(token: string, params: {
    scope?: string;
    country?: string;
    sport?: string;
    limit?: number;
  } = {}): Promise<NewsArticle[]> {
    const queryParams = new URLSearchParams();
    if (params.scope) queryParams.append('scope', params.scope);
    if (params.country) queryParams.append('country', params.country);
    if (params.sport) queryParams.append('sport', params.sport);
    queryParams.append('limit', (params.limit || 5).toString());

    const response = await fetch(`${API_URL}/api/news/sports?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch sports news');
    return response.json();
  },

  async getEntertainmentNews(token: string, limit = 5): Promise<NewsArticle[]> {
    const response = await fetch(`${API_URL}/api/news/entertainment?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch entertainment news');
    return response.json();
  },
};
