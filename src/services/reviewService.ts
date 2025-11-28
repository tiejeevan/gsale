import axios from 'axios';
import type {
  Transaction,
  Review,
  ReviewStats,
  CreateTransactionData,
  CreateReviewData,
  PotentialBuyer
} from '../types/review';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Transaction APIs
export const transactionService = {
  // Create transaction (seller marks as sold)
  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    const response = await axios.post(
      `${API_URL}/api/transactions`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data.transaction;
  },

  // Confirm transaction (buyer confirms)
  async confirmTransaction(transactionId: string): Promise<Transaction> {
    const response = await axios.put(
      `${API_URL}/api/transactions/${transactionId}/confirm`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data.transaction;
  },

  // Cancel transaction
  async cancelTransaction(transactionId: string): Promise<Transaction> {
    const response = await axios.put(
      `${API_URL}/api/transactions/${transactionId}/cancel`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data.transaction;
  },

  // Get pending transactions
  async getPendingTransactions(): Promise<Transaction[]> {
    const response = await axios.get(
      `${API_URL}/api/transactions/pending`,
      { headers: getAuthHeader() }
    );
    return response.data.transactions;
  },

  // Get confirmed transactions
  async getConfirmedTransactions(): Promise<Transaction[]> {
    const response = await axios.get(
      `${API_URL}/api/transactions/confirmed`,
      { headers: getAuthHeader() }
    );
    return response.data.transactions;
  },

  // Get potential buyers for a product
  async getPotentialBuyers(productId: string): Promise<PotentialBuyer[]> {
    const response = await axios.get(
      `${API_URL}/api/transactions/product/${productId}/buyers`,
      { headers: getAuthHeader() }
    );
    return response.data.buyers;
  }
};

// Review APIs
export const reviewService = {
  // Create review
  async createReview(transactionId: string, data: CreateReviewData): Promise<Review> {
    const response = await axios.post(
      `${API_URL}/api/reviews/transaction/${transactionId}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data.review;
  },

  // Get user reviews
  async getUserReviews(
    userId: number,
    type?: 'seller' | 'buyer',
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: Review[]; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (type) params.append('type', type);

    const response = await axios.get(
      `${API_URL}/api/reviews/user/${userId}?${params.toString()}`
    );
    return response.data;
  },

  // Get user review stats
  async getUserReviewStats(userId: number): Promise<ReviewStats> {
    const response = await axios.get(
      `${API_URL}/api/reviews/user/${userId}/stats`
    );
    return response.data.stats;
  },

  // Mark review as helpful
  async markHelpful(reviewId: string): Promise<void> {
    await axios.post(
      `${API_URL}/api/reviews/${reviewId}/helpful`,
      {},
      { headers: getAuthHeader() }
    );
  },

  // Remove helpful vote
  async removeHelpful(reviewId: string): Promise<void> {
    await axios.delete(
      `${API_URL}/api/reviews/${reviewId}/helpful`,
      { headers: getAuthHeader() }
    );
  },

  // Respond to review
  async respondToReview(reviewId: string, responseText: string): Promise<Review> {
    const response = await axios.post(
      `${API_URL}/api/reviews/${reviewId}/respond`,
      { responseText },
      { headers: getAuthHeader() }
    );
    return response.data.review;
  }
};
