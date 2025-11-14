import { useEffect, useState } from 'react';
import { Snackbar, Alert, Box, Typography } from '@mui/material';
import { Star as StarIcon, TrendingUp as LevelUpIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { socket } from '../socket';

interface XPNotification {
  type: 'xp' | 'level' | 'badge';
  message: string;
  icon: React.ReactNode;
}

const XPNotificationToast = () => {
  const [notification, setNotification] = useState<XPNotification | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    console.log('🎮 XPNotificationToast: Setting up Socket.IO listeners');
    console.log('🔌 Socket connected:', socket.connected);
    
    // Listen for XP earned events
    const handleXPEarned = (data: { xpAmount: number; actionType: string }) => {
      console.log('✨ XP Earned event received:', data);
      setNotification({
        type: 'xp',
        message: `+${data.xpAmount} XP earned!`,
        icon: <StarIcon sx={{ color: '#FFD700', fontSize: 24 }} />
      });
      setOpen(true);
    };

    // Listen for level up events
    const handleLevelUp = (data: { newLevel: number }) => {
      console.log('📈 Level Up event received:', data);
      setNotification({
        type: 'level',
        message: `🎊 Level Up! You're now level ${data.newLevel}`,
        icon: <LevelUpIcon sx={{ color: '#4CAF50', fontSize: 24 }} />
      });
      setOpen(true);
    };

    // Listen for badge earned events
    const handleBadgeEarned = (data: { badgeName: string }) => {
      console.log('🏆 Badge Earned event received:', data);
      setNotification({
        type: 'badge',
        message: `🏆 Badge Unlocked: "${data.badgeName}"!`,
        icon: <TrophyIcon sx={{ color: '#FF6B35', fontSize: 24 }} />
      });
      setOpen(true);
    };

    // Set up listeners immediately
    socket.on('xp:earned', handleXPEarned);
    socket.on('level:up', handleLevelUp);
    socket.on('badge:earned', handleBadgeEarned);

    // Also set up listeners when socket connects (in case it wasn't connected yet)
    const handleConnect = () => {
      console.log('🔌 XPNotificationToast: Socket connected, re-registering listeners');
      socket.on('xp:earned', handleXPEarned);
      socket.on('level:up', handleLevelUp);
      socket.on('badge:earned', handleBadgeEarned);
    };

    socket.on('connect', handleConnect);

    console.log('✅ XPNotificationToast: Listeners registered');

    return () => {
      console.log('🧹 XPNotificationToast: Cleaning up listeners');
      socket.off('xp:earned', handleXPEarned);
      socket.off('level:up', handleLevelUp);
      socket.off('badge:earned', handleBadgeEarned);
      socket.off('connect', handleConnect);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  if (!notification) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 8 }}
    >
      <Alert
        onClose={handleClose}
        severity="success"
        icon={notification.icon}
        sx={{
          width: '100%',
          minWidth: 300,
          backgroundColor: notification.type === 'xp' ? '#FFF9E6' : 
                          notification.type === 'level' ? '#E8F5E9' : '#FFF3E0',
          color: '#000',
          border: `2px solid ${
            notification.type === 'xp' ? '#FFD700' : 
            notification.type === 'level' ? '#4CAF50' : '#FF6B35'
          }`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {notification.message}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default XPNotificationToast;
