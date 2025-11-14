import React, { useEffect, useState } from 'react';
import gamificationService, { type GamificationSettings } from '../../../services/gamificationService';
import toast from 'react-hot-toast';

const AdminGamificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<GamificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await gamificationService.getSettings();
      setSettings(data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(key);
    try {
      await gamificationService.updateSetting(key, value);
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      toast.success('Setting updated successfully');
    } catch (error) {
      toast.error('Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!settings) {
    return <div className="text-center py-12">Failed to load settings</div>;
  }

  const toggleSettings = [
    { key: 'gamification_enabled', label: 'Master Switch', description: 'Enable/disable entire gamification system' },
    { key: 'gamification_xp_enabled', label: 'XP System', description: 'Enable XP earning' },
    { key: 'gamification_badges_enabled', label: 'Badges', description: 'Enable badge system' },
    { key: 'gamification_leaderboards_enabled', label: 'Leaderboards', description: 'Enable leaderboards' },
    { key: 'gamification_reputation_enabled', label: 'Reputation', description: 'Enable reputation system' },
    { key: 'gamification_seasonal_events_enabled', label: 'Seasonal Events', description: 'Enable seasonal events' },
  ];

  return (
    <div className="space-y-6">
      {/* Master Switch - Highlighted */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">🎮 Master Switch</h3>
            <p className="text-sm opacity-90">
              {settings.gamification_enabled ? 'Gamification is currently ENABLED' : 'Gamification is currently DISABLED'}
            </p>
          </div>
          <button
            onClick={() => updateSetting('gamification_enabled', !settings.gamification_enabled)}
            disabled={saving === 'gamification_enabled'}
            className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
              settings.gamification_enabled ? 'bg-green-500' : 'bg-gray-400'
            }`}
          >
            <span
              className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                settings.gamification_enabled ? 'translate-x-12' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Feature Toggles
        </h3>
        <div className="space-y-4">
          {toggleSettings.slice(1).map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <div className="font-semibold text-gray-800 dark:text-white">
                  {setting.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {setting.description}
                </div>
              </div>
              <button
                onClick={() => updateSetting(setting.key, !(settings as any)[setting.key])}
                disabled={saving === setting.key}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  (settings as any)[setting.key] ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    (settings as any)[setting.key] ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* XP Multiplier */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Global XP Multiplier
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={settings.gamification_xp_multiplier}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setSettings(prev => prev ? { ...prev, gamification_xp_multiplier: value } : null);
            }}
            onBlur={() => updateSetting('gamification_xp_multiplier', settings.gamification_xp_multiplier)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          />
          <span className="text-gray-600 dark:text-gray-400">
            Current: {settings.gamification_xp_multiplier}x
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Multiply all XP rewards by this value (useful for special events)
        </p>
      </div>
    </div>
  );
};

export default AdminGamificationSettings;
