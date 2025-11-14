import React, { useEffect, useState } from 'react';
import gamificationService, { type SystemStats } from '../../../services/gamificationService';
import toast from 'react-hot-toast';

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await gamificationService.getSystemStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const forceUpdateLeaderboards = async () => {
    try {
      await gamificationService.forceUpdateLeaderboards();
      toast.success('Leaderboards updated successfully');
    } catch (error) {
      toast.error('Failed to update leaderboards');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12">Failed to load statistics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold">{stats.total_users.toLocaleString()}</div>
          <div className="text-sm opacity-90">Total Users</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-2">⭐</div>
          <div className="text-3xl font-bold">{stats.total_xp_awarded.toLocaleString()}</div>
          <div className="text-sm opacity-90">Total XP Awarded</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-3xl font-bold">{stats.total_badges_awarded.toLocaleString()}</div>
          <div className="text-sm opacity-90">Badges Awarded</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-3xl font-bold">{stats.average_level.toFixed(1)}</div>
          <div className="text-sm opacity-90">Average Level</div>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          🌟 Top Users
        </h3>
        <div className="space-y-3">
          {stats.top_users.map((user, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-400 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-400 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  #{index + 1}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">
                    {user.username}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Level {user.level}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600 dark:text-blue-400">
                  {user.total_xp.toLocaleString()} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Awarded Badges */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          🏆 Most Awarded Badges
        </h3>
        <div className="space-y-3">
          {stats.most_awarded_badges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="font-semibold text-gray-800 dark:text-white">
                {badge.badge_name}
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {badge.count} awarded
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          ⚡ Quick Actions
        </h3>
        <div className="flex gap-3">
          <button
            onClick={forceUpdateLeaderboards}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            🔄 Force Update Leaderboards
          </button>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
          >
            🔄 Refresh Stats
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
