const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface SystemSetting {
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_at?: string;
}

export const systemSettingsService = {
  // Get all settings (admin only)
  getAllSettings: async (token: string): Promise<{ settings: SystemSetting[] }> => {
    const response = await fetch(`${API_URL}/api/system-settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch settings');
    }

    return response.json();
  },

  // Get specific setting (public)
  getSetting: async (key: string): Promise<{ setting: SystemSetting }> => {
    const response = await fetch(`${API_URL}/api/system-settings/${key}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch setting');
    }

    return response.json();
  },

  // Update setting (admin only)
  updateSetting: async (token: string, key: string, value: string): Promise<{ message: string; setting: SystemSetting }> => {
    const response = await fetch(`${API_URL}/api/system-settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update setting');
    }

    return response.json();
  },
};
