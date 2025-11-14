import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconButton,
  Badge,
  Menu,
  Typography,
  Box,
  Button,
  Divider,
  ListItemButton,
  Avatar,
  useTheme,
  useMediaQuery,
  Chip,
} from "@mui/material";
import { 
  Notifications as NotificationsIcon,
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
  PersonAdd as PersonAddIcon,
  Circle as CircleIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  TrendingUp as LevelUpIcon,
} from "@mui/icons-material";
import { useNotifications } from "../NotificationsContext";
import { useUserContext } from "../context/UserContext";

const NotificationsBell = () => {
  const { notifications, markAsRead } = useNotifications();
  const { token } = useUserContext();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const open = Boolean(anchorEl);
  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 10); // Show only recent 10

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Close the menu
    handleClose();
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notification.id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }

    // Navigate to the appropriate page based on notification type
    if (notification.type === 'comment' || notification.type === 'like' || notification.type === 'mention') {
      // For comments, likes, and mentions, navigate to the post
      const postId = notification.payload?.postId;
      const commentId = notification.payload?.commentId;
      if (postId) {
        // Pass state to show comments immediately for comment/mention notifications
        navigate(`/post/${postId}`, { 
          state: { 
            fromNotification: true,
            showComments: notification.type === 'comment' || notification.type === 'mention',
            highlightCommentId: commentId // Pass the comment ID to highlight
          } 
        });
      }
    } else if (notification.type === 'follow') {
      // For follows, navigate to the actor's profile
      navigate(`/profile/${notification.actor_user_id}`);
    }
  };

  const markAllAsRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    notifications.forEach(n => markAsRead(n.id));
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <CommentIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
      case 'like':
        return <FavoriteIcon sx={{ fontSize: 16, color: 'error.main' }} />;
      case 'follow':
        return <PersonAddIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'mention':
        return <CommentIcon sx={{ fontSize: 16, color: '#667eea' }} />;
      case 'xp_earned':
        return <StarIcon sx={{ fontSize: 16, color: '#FFD700' }} />;
      case 'level_up':
        return <LevelUpIcon sx={{ fontSize: 16, color: '#4CAF50' }} />;
      case 'badge_earned':
        return <TrophyIcon sx={{ fontSize: 16, color: '#FF6B35' }} />;
      default:
        return <CircleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    // Parse the date string properly, handling timezone
    let date: Date;
    
    // If the date string doesn't have timezone info, treat it as UTC
    if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      date = new Date(dateString + 'Z');
    } else {
      date = new Date(dateString);
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Recently';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    // If the difference is negative or very small, it's just now
    if (diffInMs < 0 || diffInMs < 60000) return 'Just now';
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    if (diffInMinutes === 1) return '1 min ago';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return '1 week ago';
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Bell Icon Button with Badge */}
      <IconButton
        onClick={handleClick}
        color="inherit"
        aria-label="notifications"
        sx={{
          p: 0,
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon sx={{ fontSize: 32 }} />
        </Badge>
      </IconButton>

      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              width: isMobile ? '90vw' : 380,
              maxWidth: isMobile ? '90vw' : 400,
              maxHeight: isMobile ? '50vh' : 500,
              mt: 1,
              borderRadius: 2,
              boxShadow: theme.shadows[8],
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              backdropFilter: 'blur(10px)',
            },
          },
        }}
      >
        {/* Header */}
        <Box 
          sx={{ 
            px: isMobile ? 2 : 2.5, 
            py: isMobile ? 1.5 : 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: isMobile ? 0.5 : 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '1rem' : '1.1rem' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip 
                label={`${unreadCount} new`} 
                size="small" 
                color="primary"
                sx={{ fontSize: '0.7rem', height: isMobile ? 18 : 20 }}
              />
            )}
          </Box>
          {notifications.length > 0 && (
            <Button
              size="small"
              onClick={markAllAsRead}
              disabled={markingAll || unreadCount === 0}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.8rem',
                minWidth: 'auto',
                p: 0.5,
              }}
            >
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </Button>
          )}
        </Box>

        {/* Notifications List */}
        <Box sx={{ 
          maxHeight: isMobile ? 'calc(50vh - 80px)' : 400, 
          overflow: 'auto',
          backgroundColor: theme.palette.background.paper,
        }}>
          {recentNotifications.length === 0 ? (
            <Box sx={{ p: isMobile ? 3 : 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: isMobile ? 36 : 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                No notifications yet
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                You'll see notifications here when someone interacts with your posts
              </Typography>
            </Box>
          ) : (
            recentNotifications.map((n, index) => (
              <Box key={n.id}>
                <ListItemButton
                  onClick={() => handleNotificationClick(n)}
                  sx={{
                    px: isMobile ? 2 : 2.5,
                    py: isMobile ? 1 : 1.5,
                    backgroundColor: !n.read ? 'action.hover' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                    position: 'relative',
                  }}
                >
                  {/* Unread indicator */}
                  {!n.read && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                      }}
                    />
                  )}
                  
                  {/* Avatar */}
                  <Avatar
                    sx={{
                      width: isMobile ? 28 : 32,
                      height: isMobile ? 28 : 32,
                      mr: isMobile ? 1 : 1.5,
                      ml: !n.read ? (isMobile ? 0.5 : 1) : 0,
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    {n.actor_name?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: !n.read ? 600 : 400,
                            fontSize: isMobile ? '0.8rem' : '0.875rem',
                            lineHeight: 1.4,
                            mb: isMobile ? 0.25 : 0.5,
                          }}
                        >
                          <Box component="span" sx={{ fontWeight: 600 }}>
                            {n.actor_name}
                          </Box>
                          {' '}
                          {n.type === "like" && "liked your post"}
                          {n.type === "comment" && "commented on your post"}
                          {n.type === "follow" && "started following you"}
                          {n.type === "mention" && "mentioned you in a comment"}
                          {n.type === "xp_earned" && `You earned ${n.payload?.xpAmount || 0} XP!`}
                          {n.type === "level_up" && `Level up! You're now level ${n.payload?.newLevel || 0}`}
                          {n.type === "badge_earned" && `You earned the "${n.payload?.badgeName || 'badge'}" badge!`}
                        </Typography>
                        
                        {/* Comment/Mention preview */}
                        {(n.type === "comment" || n.type === "mention") && n.payload?.text && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: isMobile ? '0.75rem' : '0.8rem',
                              fontStyle: 'italic',
                              mb: isMobile ? 0.25 : 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: isMobile ? 1 : 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            "{n.payload.text}"
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getNotificationIcon(n.type)}
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                          >
                            {formatTimeAgo(n.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </ListItemButton>
                {index < recentNotifications.length - 1 && (
                  <Divider sx={{ ml: isMobile ? 5 : 7, opacity: 0.5 }} />
                )}
              </Box>
            ))
          )}
          
          {/* Show more indicator */}
          {notifications.length > 10 && (
            <Box sx={{ p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Showing {recentNotifications.length} of {notifications.length} notifications
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NotificationsBell;
