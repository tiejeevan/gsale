import React from 'react';
import { useGamification } from '../../context/GamificationContext';
import { motion } from 'framer-motion';

const GamificationProfile: React.FC = () => {
  const { profile, badges, isEnabled, isLoading } = useGamification();

  if (!isEnabled || isLoading || !profile) return null;

  const xpInCurrentLevel = profile.total_xp - (Math.pow(profile.current_level - 1, 2) * 100);
  const xpForNextLevel = Math.pow(profile.current_level, 2) * 100;
  const actualProgress = (xpInCurrentLevel / xpForNextLevel) * 100;

  const getReputationColor = (level: string) => {
    switch (level) {
      case 'Elite Seller': return 'text-purple-600';
      case 'Trusted Seller': return 'text-blue-600';
      case 'Established Seller': return 'text-green-600';
      case 'Rising Seller': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-lg border border-blue-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          Gamification
        </h3>
        <div className="flex items-center gap-2">
          {profile.current_streak_days > 0 && (
            <div className="bg-orange-100 dark:bg-orange-900 px-3 py-1 rounded-full text-sm font-semibold text-orange-700 dark:text-orange-300">
              🔥 {profile.current_streak_days} day streak
            </div>
          )}
        </div>
      </div>

      {/* Level and XP */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
            >
              {profile.current_level}
            </motion.div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {profile.current_level}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total XP</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {profile.total_xp.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${actualProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full"
            />
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
            {xpInCurrentLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP to Level {profile.current_level + 1}
          </div>
        </div>
      </div>

      {/* Reputation */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Reputation</div>
            <div className={`text-lg font-bold ${getReputationColor(profile.reputation_level)}`}>
              {profile.reputation_level}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-800 dark:text-white">
              {profile.reputation_score}
            </div>
            <div className="text-xs text-gray-500">points</div>
          </div>
        </div>
      </div>

      {/* Badges Preview */}
      {badges.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Recent Badges ({badges.length})
          </div>
          <div className="flex gap-2 flex-wrap">
            {badges.slice(0, 6).map((userBadge) => (
              <motion.div
                key={userBadge.id}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative group"
                title={userBadge.badge.name}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md ${
                  userBadge.badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                  userBadge.badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                  userBadge.badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-400 to-cyan-500' :
                  'bg-gradient-to-br from-gray-300 to-gray-400'
                }`}>
                  {userBadge.badge.icon}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {userBadge.badge.name}
                </div>
              </motion.div>
            ))}
            {badges.length > 6 && (
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                +{badges.length - 6}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationProfile;
