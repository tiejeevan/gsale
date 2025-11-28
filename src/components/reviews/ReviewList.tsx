import React, { useEffect, useState } from 'react';
import { ThumbsUp, User } from 'lucide-react';
import StarRating from './StarRating';
import { reviewService } from '../../services/reviewService';
import type { Review } from '../../types/review';
import { useUserContext } from '../../context/UserContext';

interface ReviewListProps {
  userId: number;
  type?: 'seller' | 'buyer';
}

const ReviewList: React.FC<ReviewListProps> = ({ userId, type }) => {
  const { currentUser: user } = useUserContext();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [userId, type, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getUserReviews(userId, type, page, 10);
      setReviews(data.reviews);
      setHasMore(data.pagination.page < data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string, currentlyHelpful: boolean) => {
    if (!user) return;

    try {
      if (currentlyHelpful) {
        await reviewService.removeHelpful(reviewId);
      } else {
        await reviewService.markHelpful(reviewId);
      }
      loadReviews(); // Reload to get updated counts
    } catch (error) {
      console.error('Error updating helpful vote:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No reviews yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          {/* Reviewer Info */}
          <div className="flex items-start gap-3 mb-3">
            {review.reviewer_profile_picture ? (
              <img
                src={review.reviewer_profile_picture}
                alt={review.reviewer_username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">@{review.reviewer_username}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(review.created_at)}
                </span>
              </div>
              <StarRating rating={review.rating} size="sm" />
            </div>
          </div>

          {/* Review Text */}
          {review.review_text && (
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {review.review_text}
            </p>
          )}

          {/* Detailed Ratings */}
          {(review.communication_rating || review.reliability_rating || review.item_as_described_rating) && (
            <div className="flex flex-wrap gap-4 mb-3 text-sm">
              {review.communication_rating && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Communication: </span>
                  <StarRating rating={review.communication_rating} size="sm" />
                </div>
              )}
              {review.reliability_rating && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Reliability: </span>
                  <StarRating rating={review.reliability_rating} size="sm" />
                </div>
              )}
              {review.item_as_described_rating && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">As Described: </span>
                  <StarRating rating={review.item_as_described_rating} size="sm" />
                </div>
              )}
            </div>
          )}

          {/* Product Info */}
          {review.product_title && (
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
              {review.product_image && (
                <img
                  src={review.product_image}
                  alt={review.product_title}
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              <span>Product: {review.product_title}</span>
            </div>
          )}

          {/* Response */}
          {review.response_text && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 border-blue-500">
              <div className="text-sm font-semibold mb-1">Response from seller:</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {review.response_text}
              </p>
            </div>
          )}

          {/* Helpful Button */}
          {user && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => handleHelpful(review.id, false)}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Helpful ({review.helpful_count})</span>
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setPage(page + 1)}
          disabled={loading}
          className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

export default ReviewList;
