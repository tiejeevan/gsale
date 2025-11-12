import React, { useEffect, useState } from 'react';
import { useUserContext } from '../../context/UserContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { systemSettingsService, type SystemSetting } from '../../services/systemSettingsService';

const SystemSettings: React.FC = () => {
  const { token } = useUserContext();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const response = await systemSettingsService.getAllSettings(token);
      setSettings(response.settings);
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (key: string, currentValue: string) => {
    if (!token) return;

    try {
      setUpdating(key);
      setError('');
      setSuccess('');

      const newValue = currentValue === 'true' ? 'false' : 'true';
      await systemSettingsService.updateSetting(token, key, newValue);

      // Update local state
      setSettings(settings.map(s => 
        s.setting_key === key 
          ? { ...s, setting_value: newValue }
          : s
      ));

      setSuccess('Setting updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating setting:', err);
      setError(err.message || 'Failed to update setting');
    } finally {
      setUpdating(null);
    }
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      'password_encryption_enabled': 'Password Encryption',
    };
    return labels[key] || key;
  };

  const getSettingDescription = (key: string, description?: string): string => {
    if (description) return description;
    
    const descriptions: Record<string, string> = {
      'password_encryption_enabled': 'When enabled, user passwords are encrypted using bcrypt. When disabled, passwords are stored as plain text (NOT RECOMMENDED for production).',
    };
    return descriptions[key] || '';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          System Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {settings.map((setting, index) => (
            <Box key={setting.setting_key}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {getSettingLabel(setting.setting_key)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {getSettingDescription(setting.setting_key, setting.description)}
                  </Typography>
                  {setting.updated_at && (
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {new Date(setting.updated_at).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setting.setting_value === 'true'}
                      onChange={() => handleToggleSetting(setting.setting_key, setting.setting_value)}
                      disabled={updating === setting.setting_key}
                      color="primary"
                    />
                  }
                  label={setting.setting_value === 'true' ? 'Enabled' : 'Disabled'}
                  sx={{ ml: 2 }}
                />
              </Box>
              {index < settings.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}

          {settings.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No system settings available
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SystemSettings;
