import React, { useState } from 'react';
import AdminGamificationSettings from './admin/AdminGamificationSettings';
import AdminXPRules from './admin/AdminXPRules';
import AdminBadges from './admin/AdminBadges';
import AdminEvents from './admin/AdminEvents';
import AdminStats from './admin/AdminStats';
import AdminManualXP from './admin/AdminManualXP';

const AdminGamificationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('settings');

  const tabs = [
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
    { id: 'stats', label: '📊 Statistics', icon: '📊' },
    { id: 'xp-rules', label: '⭐ XP Rules', icon: '⭐' },
    { id: 'badges', label: '🏆 Badges', icon: '🏆' },
    { id: 'events', label: '🎉 Events', icon: '🎉' },
    { id: 'manual-xp', label: '✏️ Manual XP', icon: '✏️' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          🎮 Gamification Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage all aspects of the gamification system
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'settings' && <AdminGamificationSettings />}
        {activeTab === 'stats' && <AdminStats />}
        {activeTab === 'xp-rules' && <AdminXPRules />}
        {activeTab === 'badges' && <AdminBadges />}
        {activeTab === 'events' && <AdminEvents />}
        {activeTab === 'manual-xp' && <AdminManualXP />}
      </div>
    </div>
  );
};

export default AdminGamificationDashboard;
