import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gamificationService, { type Badge } from '../../services/gamificationService';
import { useGamification } from '../../context/GamificationContext';

const BadgesPage: React.FC = () => {
  const { badges: userBadges, isEnabled } = useGamification();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const badges = await gamificationService.getAllBadges();
      setAllBadges(badges);
    } catch (error) {
      console.error('Failed to load badges:', error);
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

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge.id));
  
  const filteredBadges = allBadges.filter(badge => {
    if (filter === 'earned') return earnedBadgeIds.has(badge.id);
    if (filter === 'locked') return !earnedBadgeIds.has(badge.id);
    return true;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-300 to-gray-400';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400';
      case 'epic': return 'border-purple-400';
      case 'rare': return 'border-blue-400';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          🏆 Badge Collection
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Earn badges by completing achievements and milestones
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {userBadges.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Earned</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {allBadges.length - userBadges.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Locked</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {Math.round((userBadges.length / allBadges.length) * 100)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completion</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {allBadges.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Badges</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          All ({allBadges.length})
        </button>
        <button
          onClick={() => setFilter('earned')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'earned'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Earned ({userBadges.length})
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'locked'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Locked ({allBadges.length - userBadges.length})
        </button>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            const userBadge = userBadges.find(ub => ub.badge.id === badge.id);

            return (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 ${getRarityBorder(badge.rarity)} ${
                  !isEarned ? 'opacity-50 grayscale' : ''
                } transition-all cursor-pointer`}
              >
                <div className="text-center">
                  {/* Badge Icon */}
                  <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center text-4xl shadow-lg`}>
                    {isEarned ? badge.icon : '🔒'}
                  </div>

                  {/* Badge Name */}
                  <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                    {badge.name}
                  </h3>

                  {/* Badge Description */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {badge.description}
                  </p>

                  {/* Rarity */}
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    badge.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                    badge.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                    badge.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {badge.rarity.toUpperCase()}
                  </div>

                  {/* Earned Date */}
                  {isEarned && userBadge && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      ✓ Earned {new Date(userBadge.earned_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BadgesPage;
