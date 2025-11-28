import React, { useEffect, useState } from 'react';
import { Star, ShoppingBag, Package } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import type { ReviewStats } from '../../types/review';

interface ReviewStatsBadgeProps {
  userId: number;
  type?: 'seller' | 'buyer' | 'both';
  compact?: boolean;
}

const ReviewStatsBadge: React.FC<ReviewStatsBadgeProps> = ({
  userId,
  type = 'both',
  compact = false
}) => {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      const data = await reviewService.getUserReviewStats(userId);
      setStats(data);
    } catch (error) {
      console.error('Error loading review stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!stats || stats.total_reviews_received === 0) {
    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        No reviews yet
      </span>
    );
  }

  const getDisplayStats = () => {
    if (type === 'seller') {
      return {
        rating: stats.seller_average_rating,
        count: stats.seller_reviews_count,
        icon: <ShoppingBag className="w-4 h-4" />
      };
    } else if (type === 'buyer') {
      return {
        rating: stats.buyer_average_rating,
        count: stats.buyer_reviews_count,
        icon: <Package className="w-4 h-4" />
      };
    } else {
      return {
        rating: stats.average_rating,
        count: stats.total_reviews_received,
        icon: <Star className="w-4 h-4" />
      };
    }
  };

  const displayStats = getDisplayStats();

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold">{displayStats.rating.toFixed(1)}</span>
        <span className="text-gray-500 dark:text-gray-400">
          ({displayStats.count})
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-1">
        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        <span className="text-lg font-bold">{displayStats.rating.toFixed(1)}</span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <div>{displayStats.count} reviews</div>
        {type === 'both' && stats.total_sales_confirmed > 0 && (
          <div className="text-xs">
            {stats.total_sales_confirmed} sales confirmed
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewStatsBadge;
