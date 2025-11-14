import React, { useState } from 'react';
import gamificationService from '../../../services/gamificationService';
import toast from 'react-hot-toast';

const AdminManualXP: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !amount || !reason) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await gamificationService.manualXPAdjustment(
        parseInt(userId),
        parseInt(amount),
        reason
      );
      toast.success(`Successfully ${parseInt(amount) > 0 ? 'added' : 'removed'} ${Math.abs(parseInt(amount))} XP`);
      setUserId('');
      setAmount('');
      setReason('');
    } catch (error) {
      toast.error('Failed to adjust XP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          ✏️ Manual XP Adjustment
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Manually add or remove XP from a user's account. Use positive numbers to add XP, negative to remove.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User ID
            </label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The numeric ID of the user (not username)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              XP Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 500 or -100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Positive to add XP, negative to remove XP
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Contest winner bonus, Compensation for bug, etc."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be logged for audit purposes
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Adjust XP'}
          </button>
        </form>

        {/* Warning */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex gap-2">
            <div className="text-yellow-600 dark:text-yellow-400">⚠️</div>
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Warning:</strong> Manual XP adjustments are logged and cannot be undone. 
              Make sure you enter the correct user ID and amount before submitting.
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Examples:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Add 500 XP: User ID: 123, Amount: 500, Reason: "Contest winner"</li>
              <li>Remove 100 XP: User ID: 456, Amount: -100, Reason: "Penalty for violation"</li>
              <li>Bonus XP: User ID: 789, Amount: 1000, Reason: "Early adopter bonus"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManualXP;
