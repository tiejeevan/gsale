import React, { useState } from 'react';
import { useUserContext } from '../../context/UserContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { adminService, type AdminUser } from '../../services/adminService';

interface ActionDialogProps {
  open: boolean;
  user: AdminUser;
  actionType: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const ActionDialog: React.FC<ActionDialogProps> = ({
  open,
  user,
  actionType,
  onClose,
  onSuccess,
}) => {
  const { token } = useUserContext();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getActionConfig = () => {
    switch (actionType) {
      case 'mute':
        return {
          title: 'Mute User',
          description: `Are you sure you want to mute ${user.username}? They will not be able to post or comment.`,
          requireReason: true,
          confirmText: 'Mute',
          color: 'warning' as const,
        };
      case 'unmute':
        return {
          title: 'Unmute User',
          description: `Are you sure you want to unmute ${user.username}?`,
          requireReason: false,
          confirmText: 'Unmute',
          color: 'primary' as const,
        };
      case 'suspend':
        return {
          title: 'Suspend User',
          description: `Are you sure you want to suspend ${user.username}? They will not be able to access their account.`,
          requireReason: true,
          confirmText: 'Suspend',
          color: 'error' as const,
        };
      case 'unsuspend':
        return {
          title: 'Unsuspend User',
          description: `Are you sure you want to unsuspend ${user.username}?`,
          requireReason: false,
          confirmText: 'Unsuspend',
          color: 'primary' as const,
        };
      case 'soft_delete':
        return {
          title: 'Delete User',
          description: `Are you sure you want to delete ${user.username}? This can be reversed later.`,
          requireReason: true,
          confirmText: 'Delete',
          color: 'error' as const,
        };
      case 'restore':
        return {
          title: 'Restore User',
          description: `Are you sure you want to restore ${user.username}?`,
          requireReason: false,
          confirmText: 'Restore',
          color: 'success' as const,
        };
      case 'permanent_delete':
        return {
          title: 'Permanently Delete User',
          description: `⚠️ WARNING: This will permanently delete ${user.username} and all their data. This action CANNOT be undone!`,
          requireReason: true,
          confirmText: 'Permanently Delete',
          color: 'error' as const,
        };
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure?',
          requireReason: false,
          confirmText: 'Confirm',
          color: 'primary' as const,
        };
    }
  };

  const handleConfirm = async () => {
    if (!token) return;

    const config = getActionConfig();
    if (config.requireReason && !reason.trim()) {
      setError('Reason is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let message = '';
      switch (actionType) {
        case 'mute':
          await adminService.muteUser(token, user.id, reason);
          message = 'User muted successfully';
          break;
        case 'unmute':
          await adminService.unmuteUser(token, user.id);
          message = 'User unmuted successfully';
          break;
        case 'suspend':
          await adminService.suspendUser(token, user.id, reason);
          message = 'User suspended successfully';
          break;
        case 'unsuspend':
          await adminService.unsuspendUser(token, user.id);
          message = 'User unsuspended successfully';
          break;
        case 'soft_delete':
          await adminService.softDeleteUser(token, user.id, reason);
          message = 'User deleted successfully';
          break;
        case 'restore':
          await adminService.restoreUser(token, user.id);
          message = 'User restored successfully';
          break;
        case 'permanent_delete':
          await adminService.permanentDeleteUser(token, user.id, reason);
          message = 'User permanently deleted';
          break;
      }

      onSuccess(message);
      onClose();
    } catch (err: any) {
      console.error('Error performing action:', err);
      setError(err.message || 'Failed to perform action');
    } finally {
      setLoading(false);
    }
  };

  const config = getActionConfig();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{config.title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="body1" sx={{ mb: 2 }}>
            {config.description}
          </Typography>

          {config.requireReason && (
            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
              placeholder="Provide a reason for this action..."
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={config.color}
          disabled={loading}
        >
          {loading ? 'Processing...' : config.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActionDialog;
