import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  List,
  ListItem,
  Avatar,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { getFollowers, getFollowing, type FollowUser } from '../services/followService';
import { useUserContext } from '../context/UserContext';
import FollowButton from './FollowButton';

interface FollowersModalProps {
  userId: number;
  username: string;
  initialTab?: 'followers' | 'following';
  onClose: () => void;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  userId,
  username,
  initialTab = 'followers',
  onClose,
}) => {
  const { token } = useUserContext();
  const [activeTab, setActiveTab] = useState<number>(initialTab === 'followers' ? 0 : 1);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 0) {
      loadFollowers();
    } else {
      loadFollowing();
    }
  }, [activeTab, userId]);

  const loadFollowers = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getFollowers(userId, token);
      setFollowers(data.followers);
    } catch (err: any) {
      setError(err.message || 'Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getFollowing(userId, token);
      setFollowing(data.following);
    } catch (err: any) {
      setError(err.message || 'Failed to load following');
    } finally {
      setLoading(false);
    }
  };

  const renderUserList = (users: FollowUser[]) => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }

    if (users.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {activeTab === 0 ? 'No followers yet' : 'Not following anyone yet'}
          </Typography>
        </Box>
      );
    }

    return (
      <List sx={{ pt: 0 }}>
        {users.map((user) => (
          <ListItem
            key={user.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 2,
              borderBottom: 1,
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 0,
              },
            }}
          >
            <Link
              to={`/profile/${user.id}`}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}
              onClick={onClose}
            >
              <Avatar
                src={user.profile_image || undefined}
                alt={user.display_name || user.username}
                sx={{ width: 48, height: 48 }}
              >
                {(user.display_name || user.username).charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {user.display_name || user.username}
                  {user.is_verified && (
                    <Box
                      component="span"
                      sx={{
                        color: 'primary.main',
                        fontSize: '1rem',
                      }}
                    >
                      ✓
                    </Box>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  @{user.username}
                </Typography>
                {user.bio && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {user.bio}
                  </Typography>
                )}
              </Box>
            </Link>
            <FollowButton
              userId={user.id}
              initialIsFollowing={user.is_followed_by_current_user}
              size="small"
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 0,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {username}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          px: 2,
        }}
      >
        <Tab label="Followers" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label="Following" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      <DialogContent sx={{ p: 0 }}>
        {activeTab === 0 ? renderUserList(followers) : renderUserList(following)}
      </DialogContent>
    </Dialog>
  );
};

export default FollowersModal;
