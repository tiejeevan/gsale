import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gamificationService, { type LeaderboardEntry } from '../../services/gamificationService';
import { useGamification } from '../../context/GamificationContext';
import { useUserContext } from '../../context/UserContext';

const LeaderboardPage: React.FC = () => {
  const { isEnabled } = useGamification();
  const { currentUser: user } = useUserContext();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('top_level');

  const leaderboardTypes = [
    { value: 'top_level', label: '🏆 Top Level', icon: '⭐' },
    { value: 'weekly_sellers', label: '💰 Weekly Sellers', icon: '🛍️' },
    { value: 'monthly_creators', label: '📝 Monthly Creators', icon: '✍️' },
    { value: 'top_helpers', label: '🤝 Top Helpers', icon: '💪' },
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedType]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await gamificationService.getLeaderboard(selectedType, 50);
      setLeaderboard(data);
      
      if (user) {
        const rank = await gamificationService.getMyRank(selectedType);
        setMyRank(rank);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Gamification is currently disabled.</p>
        </div>
      </div>
    );
  }

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          🏆 Leaderboards
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compete with other users and climb the ranks
        </p>
      </div>

      {/* My Rank Card */}
      {myRank && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 mb-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90 mb-1">Your Rank</div>
              <div className="text-4xl font-bold">#{myRank.rank}</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">Out of</div>
              <div className="text-2xl font-bold">{myRank.total} users</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {leaderboardTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`p-4 rounded-xl font-medium transition-all ${
              selectedType === type.value
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400'
            }`}
          >
            <div className="text-2xl mb-1">{type.icon}</div>
            <div className="text-sm">{type.label.split(' ')[1]}</div>
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600 dark:text-gray-400">No data available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${
                entry.user_id === user?.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              } rounded-xl p-4 hover:shadow-lg transition-all`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${getRankColor(entry.rank)}`}>
                  {getRankMedal(entry.rank)}
                </div>

                {/* Profile Picture */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                  {entry.profile_picture ? (
                    <img src={entry.profile_picture} alt={entry.username} className="w-full h-full object-cover" />
                  ) : (
                    entry.username.charAt(0).toUpperCase()
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="font-bold text-gray-800 dark:text-white">
                    {entry.username}
                    {entry.user_id === user?.id && (
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.level && `Level ${entry.level}`}
                    {entry.badge_count && ` • ${entry.badge_count} badges`}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedType === 'top_level' ? 'XP' : 'points'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
