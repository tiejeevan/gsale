import React, { useState } from "react";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

interface DeactivateAccountModalProps {
  onClose: () => void;
}

const DeactivateAccountModal: React.FC<DeactivateAccountModalProps> = ({ onClose }) => {
  const { deactivateUser, currentUser } = useUserContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const expectedText = `DELETE ${currentUser?.username}`;
  const isConfirmValid = confirmText === expectedText;

  const handleDeactivate = async () => {
    if (!isConfirmValid) return;
    
    setLoading(true);
    setError(null);

    try {
      await deactivateUser();
      // User will be logged out automatically by deactivateUser
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Failed to deactivate account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <FiAlertTriangle className="text-red-600 dark:text-red-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Deactivate Account
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                Warning: This action cannot be undone
              </h3>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Your account will be permanently deactivated</li>
                <li>• All your posts and data will be removed</li>
                <li>• You will be immediately logged out</li>
                <li>• Your username will become available to others</li>
              </ul>
            </div>

            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you're sure you want to deactivate your account, please type{" "}
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-red-600 dark:text-red-400">
                  {expectedText}
                </span>{" "}
                below to confirm:
              </p>
              
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={expectedText}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Consider these alternatives:
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Take a break - just log out for a while</li>
                <li>• Update your privacy settings instead</li>
                <li>• Contact support if you're having issues</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeactivate}
              disabled={!isConfirmValid || loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? "Deactivating..." : "Deactivate Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeactivateAccountModal;