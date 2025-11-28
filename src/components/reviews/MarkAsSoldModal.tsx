import React, { useState, useEffect } from 'react';
import { X, Check, User } from 'lucide-react';
import { transactionService } from '../../services/reviewService';
import type { PotentialBuyer } from '../../types/review';

interface MarkAsSoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  onSuccess?: () => void;
}

const MarkAsSoldModal: React.FC<MarkAsSoldModalProps> = ({
  isOpen,
  onClose,
  productId,
  productTitle,
  onSuccess
}) => {
  const [buyers, setBuyers] = useState<PotentialBuyer[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<number | null>(null);
  const [agreedPrice, setAgreedPrice] = useState('');
  const [meetingMethod, setMeetingMethod] = useState<'in_person' | 'shipping' | 'pickup' | 'other'>('in_person');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadBuyers();
    }
  }, [isOpen, productId]);

  const loadBuyers = async () => {
    try {
      setLoadingBuyers(true);
      const data = await transactionService.getPotentialBuyers(productId);
      setBuyers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load buyers');
    } finally {
      setLoadingBuyers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBuyerId) {
      setError('Please select a buyer');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await transactionService.createTransaction({
        productId,
        buyerId: selectedBuyerId,
        agreedPrice: agreedPrice ? parseFloat(agreedPrice) : undefined,
        meetingMethod,
        notes: notes || undefined
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Mark as Sold</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Product: <span className="font-semibold">{productTitle}</span>
            </p>
          </div>

          {/* Select Buyer */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Who bought this item? *
            </label>
            {loadingBuyers ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : buyers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                No potential buyers found. Users who messaged you will appear here.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {buyers.map((buyer) => (
                  <button
                    key={buyer.id}
                    type="button"
                    onClick={() => setSelectedBuyerId(buyer.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      selectedBuyerId === buyer.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {buyer.profile_picture ? (
                      <img
                        src={buyer.profile_picture}
                        alt={buyer.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{buyer.username}</div>
                      {buyer.full_name && (
                        <div className="text-sm text-gray-500">{buyer.full_name}</div>
                      )}
                    </div>
                    {selectedBuyerId === buyer.id && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Agreed Price */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Agreed Price (optional)
            </label>
            <input
              type="number"
              step="0.01"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          {/* Meeting Method */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Meeting Method
            </label>
            <select
              value={meetingMethod}
              onChange={(e) => setMeetingMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="in_person">In Person</option>
              <option value="shipping">Shipping</option>
              <option value="pickup">Pickup</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={3}
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
              disabled={loading || !selectedBuyerId}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Mark as Sold'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkAsSoldModal;
