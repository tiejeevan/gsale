import React, { useState, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { PersonAdd, PersonRemove, Check } from '@mui/icons-material';
import { followUser, unfollowUser, checkFollowStatus } from '../services/followService';
import { useUserContext } from '../context/UserContext';

interface FollowButtonProps {
  userId: number;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'contained' | 'outlined' | 'text';
  fullWidth?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  initialIsFollowing,
  onFollowChange,
  size = 'medium',
  variant = 'contained',
  fullWidth = false,
}) => {
  const { token, currentUser } = useUserContext();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(initialIsFollowing === undefined);

  // Don't show button for own profile
  if (!token || !currentUser || currentUser.id === userId) {
    return null;
  }

  // Check follow status on mount if not provided
  useEffect(() => {
    if (initialIsFollowing === undefined && token) {
      setCheckingStatus(true);
      checkFollowStatus(userId, token)
        .then((status) => {
          setIsFollowing(status);
          setCheckingStatus(false);
        })
        .catch((error) => {
          console.error('Failed to check follow status:', error);
          setCheckingStatus(false);
        });
    }
  }, [userId, token, initialIsFollowing]);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token || loading) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId, token);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followUser(userId, token);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error: any) {
      console.error('Follow action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading || checkingStatus) return 'Loading...';
    if (isFollowing) {
      return hovered ? 'Unfollow' : 'Following';
    }
    return 'Follow';
  };

  const getButtonIcon = () => {
    if (loading || checkingStatus) return <CircularProgress size={16} />;
    if (isFollowing) {
      return hovered ? <PersonRemove fontSize="small" /> : <Check fontSize="small" />;
    }
    return <PersonAdd fontSize="small" />;
  };

  return (
    <Button
      onClick={handleToggleFollow}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={loading || checkingStatus}
      size={size}
      variant={isFollowing ? 'outlined' : variant}
      color={isFollowing && hovered ? 'error' : 'primary'}
      startIcon={getButtonIcon()}
      fullWidth={fullWidth}
      sx={{
        textTransform: 'none',
        minWidth: 110,
        transition: 'all 0.2s',
        fontWeight: 600,
        ...(isFollowing && {
          borderColor: 'primary.main',
          color: 'primary.main',
        }),
        ...(isFollowing && hovered && {
          borderColor: 'error.main',
          color: 'error.main',
          bgcolor: 'rgba(211, 47, 47, 0.08)',
          '&:hover': {
            bgcolor: 'rgba(211, 47, 47, 0.12)',
            borderColor: 'error.main',
          },
        }),
      }}
    >
      {getButtonText()}
    </Button>
  );
};

export default FollowButton;
