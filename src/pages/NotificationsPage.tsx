import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Avatar,
  Chip,
  Button,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  InputAdornment,
  Divider,
  List,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Pagination,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
  PersonAdd as PersonAddIcon,
  Circle as CircleIcon,
  Search as SearchIcon,
  RadioButtonUnchecked as UnreadIcon,
  Approval as ApprovalIcon,
  CheckCircleOutline as ApprovedIcon,
  Cancel as RejectedIcon,
  AlternateEmail as MentionIcon,
  ThumbUp as CommentLikeIcon,
  MarkEmailRead as MarkReadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotifications, type Notification } from '../NotificationsContext';
import { useUserContext } from '../context/UserContext';
import { formatTimeAgo, formatDetailedDate } from '../utils/timeUtils';

const ITEMS_PER_PAGE = 20;

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, refreshNotifications, fetchFullNotifications } = useNotifications();
  const { token } = useUserContext();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for filters and sorting
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch full notifications when page mounts (lazy loading)
  useEffect(() => {
    fetchFullNotifications();
  }, []);
  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    const users = notifications.reduce((acc, notif) => {
      if (notif.actor_name && !acc.find(u => u.id === notif.actor_user_id)) {
        acc.push({
          id: notif.actor_user_id,
          name: notif.actor_name
        });
      }
      return acc;
    }, [] as { id: number; name: string }[]);
    return users.sort((a, b) => a.name.localeCompare(b.name));
  }, [notifications]);

  // Filter and sort notifications
  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    // Filter by read status
    if (filterRead === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filterRead === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Filter by user
    if (selectedUser !== 'all') {
      filtered = filtered.filter(n => n.actor_user_id === parseInt(selectedUser));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.actor_name?.toLowerCase().includes(query) ||
        n.payload?.text?.toLowerCase().includes(query) ||
        n.payload?.productTitle?.toLowerCase().includes(query)
      );
    }

    // Sort notifications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        case 'user':
          return (a.actor_name || '').localeCompare(b.actor_name || '');
        case 'unread':
          if (a.read === b.read) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          return a.read ? 1 : -1;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [notifications, filterType, filterRead, selectedUser, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = filteredAndSortedNotifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Statistics
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, unread, byType };
  }, [notifications]);

  const getNotificationIcon = (type: string, size: 'small' | 'medium' = 'medium') => {
    const iconSize = size === 'small' ? 16 : 20;
    switch (type) {
      case 'comment':
        return <CommentIcon sx={{ fontSize: iconSize, color: 'primary.main' }} />;
      case 'like':
        return <FavoriteIcon sx={{ fontSize: iconSize, color: 'error.main' }} />;
      case 'comment_like':
        return <CommentLikeIcon sx={{ fontSize: iconSize, color: 'warning.main' }} />;
      case 'follow':
        return <PersonAddIcon sx={{ fontSize: iconSize, color: 'success.main' }} />;
      case 'mention':
        return <MentionIcon sx={{ fontSize: iconSize, color: '#667eea' }} />;
      case 'product_approval':
        return <ApprovalIcon sx={{ fontSize: iconSize, color: 'info.main' }} />;
      case 'product_approved':
        return <ApprovedIcon sx={{ fontSize: iconSize, color: 'success.main' }} />;
      case 'product_rejected':
        return <RejectedIcon sx={{ fontSize: iconSize, color: 'error.main' }} />;
      default:
        return <CircleIcon sx={{ fontSize: iconSize, color: 'text.secondary' }} />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'comment': return 'Comments';
      case 'like': return 'Likes';
      case 'comment_like': return 'Comment Likes';
      case 'follow': return 'Follows';
      case 'mention': return 'Mentions';
      case 'product_approval': return 'Product Approvals';
      case 'product_approved': return 'Products Approved';
      case 'product_rejected': return 'Products Rejected';
      default: return type;
    }
  };



  const getNotificationMessage = (notif: Notification) => {
    switch (notif.type) {
      case "comment":
        return "commented on your post";
      case "like":
        return "liked your post";
      case "comment_like":
        return "liked your comment";
      case "follow":
        return "started following you";
      case "mention":
        return "mentioned you in a comment";
      case "product_approval":
        return `submitted "${notif.payload?.productTitle}" for approval`;
      case "product_approved":
        return `approved your product "${notif.payload?.productTitle}"`;
      case "product_rejected":
        return `rejected your product "${notif.payload?.productTitle}"`;
      default:
        return "sent you a notification";
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
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

    // Navigate based on notification type
    if (notification.type === 'comment' || notification.type === 'like' || notification.type === 'mention' || notification.type === 'comment_like') {
      const postId = notification.payload?.postId || notification.payload?.post_id;
      const commentId = notification.payload?.commentId || notification.payload?.comment_id;
      if (postId) {
        navigate(`/post/${postId}`, {
          state: {
            fromNotification: true,
            showComments: notification.type === 'comment' || notification.type === 'mention' || notification.type === 'comment_like',
            highlightCommentId: commentId
          }
        });
      }
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor_user_id}`);
    } else if (notification.type === 'product_approval') {
      navigate('/admin', { state: { tab: 'products', highlightProductId: notification.payload?.productId } });
    } else if (notification.type === 'product_approved' || notification.type === 'product_rejected') {
      const productId = notification.payload?.productId;
      if (productId) {
        navigate(`/market/product/${productId}`);
      }
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);

    if (unreadNotifications.length === 0) return;

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
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            <Badge badgeContent={stats.unread} color="error" />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh notifications">
              <IconButton onClick={refreshNotifications} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {stats.unread > 0 && (
              <Button
                variant="outlined"
                startIcon={<MarkReadIcon />}
                onClick={markAllAsRead}
                size="small"
              >
                Mark All Read
              </Button>
            )}
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mb: 3 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" color="primary">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" color="error">{stats.unread}</Typography>
              <Typography variant="body2" color="text.secondary">Unread</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" color="success.main">{stats.total - stats.unread}</Typography>
              <Typography variant="body2" color="text.secondary">Read</Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems="center">
          {/* Search */}
          <TextField
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ minWidth: isMobile ? '100%' : 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Type Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              {Object.keys(stats.byType).map(type => (
                <MenuItem key={type} value={type}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getNotificationIcon(type, 'small')}
                    {getNotificationTypeLabel(type)} ({stats.byType[type]})
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Read Status Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterRead}
              label="Status"
              onChange={(e) => setFilterRead(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
              <MenuItem value="read">Read</MenuItem>
            </Select>
          </FormControl>

          {/* User Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>User</InputLabel>
            <Select
              value={selectedUser}
              label="User"
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <MenuItem value="all">All Users</MenuItem>
              {uniqueUsers.map(user => (
                <MenuItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Sort */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={sortBy}
              label="Sort"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="unread">Unread First</MenuItem>
              <MenuItem value="type">By Type</MenuItem>
              <MenuItem value="user">By User</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Results Info */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {paginatedNotifications.length} of {filteredAndSortedNotifications.length} notifications
          {searchQuery && ` matching "${searchQuery}"`}
        </Typography>
      </Box>

      {/* Notifications List */}
      <Paper>
        {paginatedNotifications.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {searchQuery || filterType !== 'all' || filterRead !== 'all' || selectedUser !== 'all'
                ? 'Try adjusting your filters'
                : 'You\'ll see notifications here when people interact with your content'
              }
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            <AnimatePresence mode="popLayout">
              {paginatedNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                >
                  <React.Fragment>
                    <ListItemButton
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        py: 2,
                        px: 3,
                        mb: 1, // Add spacing between items
                        borderRadius: 2, // Rounded corners for card-like feel
                        backgroundColor: !notification.read ? 'rgba(102, 126, 234, 0.08)' : 'transparent', // Subtle color for unread
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderColor: 'primary.main',
                          transform: 'translateY(-2px)',
                          boxShadow: 2
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                          badgeContent={
                            !notification.read ? (
                              <UnreadIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                            ) : null
                          }
                        >
                          <Avatar
                            src={notification.actor_avatar}
                            sx={{
                              width: 48,
                              height: 48,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }}
                          >
                            {notification.actor_name?.charAt(0)?.toUpperCase() || '?'}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: !notification.read ? 600 : 400 }}
                            >
                              <Box component="span" sx={{ fontWeight: 600 }}>
                                {notification.actor_name}
                              </Box>
                              {' '}
                              {getNotificationMessage(notification)}
                            </Typography>
                            {getNotificationIcon(notification.type, 'small')}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {/* Content preview */}
                            {(notification.type === "comment" || notification.type === "mention" || notification.type === "comment_like") && notification.payload?.text && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.secondary',
                                  fontStyle: 'italic',
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                "{notification.payload.text}"
                              </Typography>
                            )}

                            {/* Product rejection reason */}
                            {notification.type === "product_rejected" && notification.payload?.reason && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'error.main',
                                  mb: 0.5,
                                }}
                              >
                                Reason: {notification.payload.reason}
                              </Typography>
                            )}
                            {/* Timestamp and status */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Tooltip title={formatDetailedDate(notification.created_at)} arrow>
                                <Typography variant="caption" color="text.secondary" sx={{ cursor: 'help' }}>
                                  {formatTimeAgo(notification.created_at)}
                                </Typography>
                              </Tooltip>
                              <Chip
                                label={getNotificationTypeLabel(notification.type)}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                              {!notification.read && (
                                <Chip
                                  label="New"
                                  size="small"
                                  color="primary"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {index < paginatedNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        )}
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
          />
        </Box>
      )}
    </Container>
  );
};

export default NotificationsPage;