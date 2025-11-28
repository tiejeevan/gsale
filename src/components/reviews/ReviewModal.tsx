import React, { useState } from 'react';
import { X } from 'lucide-react';
import StarRating from './StarRating';
import { reviewService } from '../../services/reviewService';
import type { Transaction } from '../../types/review';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  reviewType: 'seller' | 'buyer';
  onSuccess?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  transaction,
  reviewType,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [communicationRating, setCommunicationRating] = useState(0);
  const [reliabilityRating, setReliabilityRating] = useState(0);
  const [itemAsDescribedRating, setItemAsDescribedRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await reviewService.createReview(transaction.id, {
        rating,
        reviewText: reviewText || undefined,
        communicationRating: communicationRating || undefined,
        reliabilityRating: reliabilityRating || undefined,
        itemAsDescribedRating: itemAsDescribedRating || undefined
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const reviewingUsername = reviewType === 'seller' 
    ? transaction.seller_username 
    : transaction.buyer_username;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">
            Review {reviewType === 'seller' ? 'Seller' : 'Buyer'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Transaction Info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Product: <span className="font-semibold text-gray-900 dark:text-white">
                {transaction.product_title}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {reviewType === 'seller' ? 'Seller' : 'Buyer'}: <span className="font-semibold text-gray-900 dark:text-white">
                @{reviewingUsername}
              </span>
            </div>
          </div>

          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Overall Rating *
            </label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                Communication
              </label>
              <StarRating
                rating={communicationRating}
                size="md"
                interactive
                onRatingChange={setCommunicationRating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Reliability
              </label>
              <StarRating
                rating={reliabilityRating}
                size="md"
                interactive
                onRatingChange={setReliabilityRating}
              />
            </div>

            {reviewType === 'seller' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Item as Described
                </label>
                <StarRating
                  rating={itemAsDescribedRating}
                  size="md"
                  interactive
                  onRatingChange={setItemAsDescribedRating}
                />
              </div>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Review (optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={`Share your experience with ${reviewingUsername}...`}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
