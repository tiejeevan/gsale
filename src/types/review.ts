export interface Transaction {
  id: string;
  product_id: string | null;
  product_title: string;
  product_image: string | null;
  product_slug: string | null;
  seller_id: number;
  buyer_id: number;
  seller_confirmed: boolean;
  buyer_confirmed: boolean;
  seller_confirmed_at: string | null;
  buyer_confirmed_at: string | null;
  confirmed_at: string | null;
  agreed_price: number | null;
  meeting_method: 'in_person' | 'shipping' | 'pickup' | 'other' | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'disputed' | 'cancelled';
  created_at: string;
  updated_at: string;
  
  // Joined data
  seller_username?: string;
  seller_profile_picture?: string | null;
  buyer_username?: string;
  buyer_profile_picture?: string | null;
  user_has_reviewed?: number;
}

export interface Review {
  id: string;
  transaction_id: string;
  reviewed_user_id: number;
  reviewer_id: number;
  review_type: 'seller' | 'buyer';
  rating: number;
  review_text: string | null;
  communication_rating: number | null;
  reliability_rating: number | null;
  item_as_described_rating: number | null;
  product_title: string | null;
  product_image: string | null;
  helpful_count: number;
  response_text: string | null;
  response_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  reviewer_username?: string;
  reviewer_profile_picture?: string | null;
  reviewer_full_name?: string | null;
}

export interface ReviewStats {
  user_id: number;
  total_reviews_received: number;
  average_rating: number;
  seller_reviews_count: number;
  seller_average_rating: number;
  seller_5_star_count: number;
  seller_4_star_count: number;
  seller_3_star_count: number;
  seller_2_star_count: number;
  seller_1_star_count: number;
  buyer_reviews_count: number;
  buyer_average_rating: number;
  buyer_5_star_count: number;
  buyer_4_star_count: number;
  buyer_3_star_count: number;
  buyer_2_star_count: number;
  buyer_1_star_count: number;
  avg_communication_rating: number | null;
  avg_reliability_rating: number | null;
  avg_item_as_described_rating: number | null;
  total_sales_confirmed: number;
  total_purchases_confirmed: number;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionData {
  productId: string;
  buyerId: number;
  agreedPrice?: number;
  meetingMethod?: 'in_person' | 'shipping' | 'pickup' | 'other';
  notes?: string;
}

export interface CreateReviewData {
  rating: number;
  reviewText?: string;
  communicationRating?: number;
  reliabilityRating?: number;
  itemAsDescribedRating?: number;
}

export interface PotentialBuyer {
  id: number;
  username: string;
  profile_picture: string | null;
  full_name: string | null;
}
