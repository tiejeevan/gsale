import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "@mui/icons-material";
import { useNotifications } from "../NotificationsContext";
import { useUserContext } from "../context/UserContext";
import { formatTimeAgo } from "../utils/timeUtils";

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
    // Close the menu
    handleClose();

    // Mark as read only if not already read
    if (!notification.read) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notification.id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          // Only update UI after successful backend update
          markAsRead(notification.id);
        } else {
          console.error("Failed to mark notification as read - server error");
        }
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // Navigate to the appropriate page based on notification type
    if (notification.type === 'comment' || notification.type === 'like' || notification.type === 'mention' || notification.type === 'comment_like') {
      // For comments, likes, mentions, and comment likes, navigate to the post
      const postId = notification.payload?.postId || notification.payload?.post_id;
      const commentId = notification.payload?.commentId || notification.payload?.comment_id;
      if (postId) {
        // Pass state to show comments immediately for comment/mention/comment_like notifications
        navigate(`/post/${postId}`, {
          state: {
            fromNotification: true,
            showComments: notification.type === 'comment' || notification.type === 'mention' || notification.type === 'comment_like',
            highlightCommentId: commentId // Pass the comment ID to highlight
          }
        });
      }
    } else if (notification.type === 'follow') {
      // For follows, navigate to the actor's profile
      navigate(`/profile/${notification.actor_user_id}`);
    } else if (notification.type === 'product_approval') {
      // For product approvals, navigate to admin panel
      navigate('/admin', {
        state: {
          tab: 'products',
          highlightProductId: notification.payload?.productId
        }
      });
    } else if (notification.type === 'product_approved' || notification.type === 'product_rejected') {
      // For product status updates, navigate to the product page
      const productId = notification.payload?.productId;
      if (productId) {
        navigate(`/market/product/${productId}`);
      }
    }
  };

  const markAllAsRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);

    const unreadNotifications = notifications.filter(n => !n.read);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        // Only update UI after successful backend update
        unreadNotifications.forEach(n => markAsRead(n.id));
      } else {
        console.error("Failed to mark all as read - server error");
      }
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
      case 'comment_like':
        return <FavoriteIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
      case 'follow':
        return <PersonAddIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'mention':
        return <CommentIcon sx={{ fontSize: 16, color: '#667eea' }} />;
      case 'product_approval':
        return <CircleIcon sx={{ fontSize: 16, color: 'info.main' }} />;
      case 'product_approved':
        return <CircleIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'product_rejected':
        return <CircleIcon sx={{ fontSize: 16, color: 'error.main' }} />;
      default:
        return <CircleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
    }
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
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <ListItemButton
                  onClick={() => handleNotificationClick(n)}
                  sx={{
                    px: isMobile ? 2 : 2.5,
                    py: isMobile ? 1 : 1.5,
                    backgroundColor: !n.read ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    position: 'relative',
                    borderLeft: !n.read ? '3px solid' : '3px solid transparent',
                    borderLeftColor: 'primary.main',
                    transition: 'all 0.2s ease',
                  }}
                >

                  {/* Avatar */}
                  <Avatar
                    src={n.actor_avatar}
                    sx={{
                      width: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                      mr: isMobile ? 1.5 : 2,
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: '2px solid',
                      borderColor: 'background.paper',
                      boxShadow: 1
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
                            {n.actor_display_name || n.actor_name}
                          </Box>
                          {' '}
                          {n.type === "like" && "liked your post"}
                          {n.type === "comment" && "commented on your post"}
                          {n.type === "comment_like" && "liked your comment"}
                          {n.type === "follow" && "started following you"}
                          {n.type === "mention" && "mentioned you in a comment"}
                          {n.type === "product_approval" && `submitted "${n.payload?.productTitle}" for approval`}
                          {n.type === "product_approved" && `approved your product "${n.payload?.productTitle}"`}
                          {n.type === "product_rejected" && `rejected your product "${n.payload?.productTitle}"`}
                        </Typography>

                        {/* Comment/Mention/Comment Like preview */}
                        {(n.type === "comment" || n.type === "mention" || n.type === "comment_like") && n.payload?.text && (
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
              </motion.div>
            ))
          )}

          {/* View All Button */}
          {notifications.length > 0 && (
            <Box sx={{ p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  handleClose();
                  navigate('/notifications');
                }}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                View All Notifications
                {notifications.length > 10 && ` (${notifications.length})`}
              </Button>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NotificationsBell;
