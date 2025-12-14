import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Tooltip,
  Button,
} from "@mui/material";
import { Edit, Delete, PushPin, PushPinOutlined, FavoriteBorder, Favorite, ChatBubbleOutline, Share, StarBorder, Star } from "@mui/icons-material";
import { addLike, removeLike } from "../services/likeService";
import { addBookmark, removeBookmark } from "../services/bookmarkService";
import CommentsSection, { type Comment } from "./Comments/CommentsSection";
import { socket } from "../socket";
import ProductEmbedCard from "./ProductEmbedCard";

interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  content: string;
  title?: string | null;
  image_url?: string | null;
  created_at: string;
  like_count: number;
  is_edited: boolean;
  is_pinned?: boolean;
  liked_by_user: boolean;
  bookmarked_by_user?: boolean;
  visibility?: string;
  attachments?: Attachment[];
  comments?: Comment[];
  view_count?: number;
  comments_enabled?: boolean;
  shared_product?: {
    id: string;
    title: string;
    price: number;
    images?: any;
    stock_quantity?: number;
    in_stock?: boolean;
    slug?: string;
    url: string;
  };
}

interface PostCardProps {
  post: Post;
  userId?: number;
  currentUserId?: number;
  token: string;
  showUsername?: boolean;
  showEditDeleteOnHover?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onPin?: (post: Post) => void;
  onBookmarkChange?: () => void;
  r2PublicUrl?: string;
  collapseComments?: boolean;
  showCommentsInitially?: boolean;
  highlightCommentId?: number;
  highlightLikeButton?: boolean;
}

const R2_PUBLIC_URL = "https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev";

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  token,
  showUsername = true,
  showEditDeleteOnHover = true,
  onEdit,
  onDelete,
  onPin,
  onBookmarkChange,
  collapseComments = true,
  showCommentsInitially = false,
  highlightCommentId,
  highlightLikeButton,
}) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [showComments, setShowComments] = useState(showCommentsInitially);
  const [liked, setLiked] = useState(post.liked_by_user || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [bookmarked, setBookmarked] = useState(post.bookmarked_by_user || false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [triggerLikeAnimation, setTriggerLikeAnimation] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (highlightLikeButton) {
      // Small delay to ensure render
      setTimeout(() => setTriggerLikeAnimation(true), 300);
      // Reset after animation (2 pulses = ~1.5s)
      setTimeout(() => setTriggerLikeAnimation(false), 2000);
    }
  }, [highlightLikeButton]);

  // Socket.IO: Listen for real-time like updates
  useEffect(() => {
    const postRoom = `post_${post.id}`;
    const likeEvent = `post_${post.id}:like:new`;

    // Join the room for this post
    const joinRoom = () => {
      if (socket.connected) {
        socket.emit("join", postRoom);
      }
    };

    // Connect and join room
    if (!socket.connected) {
      socket.connect();
      socket.once("connect", joinRoom);
    } else {
      joinRoom();
    }

    // Handler for new like/unlike events
    const handleNewLike = (data: any) => {
      console.log(`📡 Received like event for post ${post.id}:`, data);

      if (data.user_id === currentUserId) {
        // This is our own like, already handled optimistically
        return;
      }

      // Update like count based on reaction type
      if (data.reaction_type === 'like') {
        setLikeCount(prev => prev + 1);
      } else if (data.reaction_type === 'unlike') {
        setLikeCount(prev => Math.max(0, prev - 1));
      }
    };

    // Handler for new comment events
    const handleNewComment = (data: any) => {
      console.log(`📡 Received comment event for post ${post.id}:`, data);
      // Increment comment count for all users (including sender)
      setCommentCount(prev => prev + 1);
    };

    // Handler for comment delete events
    const handleCommentDelete = (data: { commentIds: number[]; deletedCount: number }) => {
      console.log(`🗑️ Received comment delete event for post ${post.id}:`, data);
      // Decrease comment count by the number of deleted comments (including replies)
      setCommentCount(prev => Math.max(0, prev - data.deletedCount));
    };

    // Listen for socket events
    socket.on(likeEvent, handleNewLike);
    socket.on(`post_${post.id}:comment:new`, handleNewComment);
    socket.on(`post_${post.id}:comment:delete`, handleCommentDelete);

    // Cleanup on unmount
    return () => {
      socket.off(likeEvent, handleNewLike);
      socket.off(`post_${post.id}:comment:new`, handleNewComment);
      socket.off(`post_${post.id}:comment:delete`, handleCommentDelete);
    };
  }, [post.id, currentUserId]);

  // Sync local state with prop changes (important for refresh scenarios)
  useEffect(() => {
    setLiked(post.liked_by_user || false);
    setLikeCount(post.like_count || 0);
    setCommentCount(post.comments?.length || 0);
    setBookmarked(post.bookmarked_by_user || false);
  }, [post.like_count, post.liked_by_user, post.comments?.length, post.bookmarked_by_user]);

  // Parse content and make mentions clickable
  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g);

    return parts.map((part, index) => {
      if (part.match(/^@\w+$/)) {
        const username = part.substring(1);
        return (
          <span
            key={index}
            style={{
              color: theme.palette.primary.main,
              textDecoration: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/profile/${username}`);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split("/").pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  const canEdit = post.user_id === currentUserId;

  const formatDate = (dateString: string) => {
    // Parse the date - JavaScript automatically handles timezone conversion
    const date = new Date(dateString);
    const now = new Date();

    // Calculate difference in milliseconds
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // If date is in the future (shouldn't happen), show the actual date
    if (diffInMs < 0) {
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    // Less than 1 minute
    if (diffInSeconds < 60) {
      return 'Just now';
    }

    // Less than 1 hour - show minutes
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} mins ago`;
    }

    // Less than 24 hours - show hours
    if (diffInHours < 24) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }

    // Less than 7 days - show day name
    if (diffInDays < 7) {
      return `${date.toLocaleDateString([], { weekday: 'long' })} at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }

    // This year - show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.toLocaleDateString([], { month: 'long', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }

    // Previous years - show full date
    return `${date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  };

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    const previousLiked = liked;
    const previousCount = likeCount;

    // Optimistic update
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      if (liked) {
        await removeLike(token, { target_type: 'post', target_id: post.id });
      } else {
        await addLike(token, { target_type: 'post', target_id: post.id });
      }
    } catch (error) {
      // Revert on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
      console.error("Failed to like/unlike post:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;

    setIsBookmarking(true);
    const previousBookmarked = bookmarked;

    // Optimistic update
    setBookmarked(!bookmarked);

    try {
      if (bookmarked) {
        await removeBookmark(token, post.id);
      } else {
        await addBookmark(token, post.id);
      }

      // Notify parent to refresh posts
      if (onBookmarkChange) {
        onBookmarkChange();
      }
    } catch (error) {
      // Revert on error
      setBookmarked(previousBookmarked);
      console.error("Failed to bookmark/unbookmark post:", error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Check out this post',
        text: post.content,
        url: postUrl,
      }).catch((error) => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(postUrl);
      // You could add a toast notification here
      alert('Link copied to clipboard!');
    }
  };

  return (
    <Card
      elevation={hovered ? 4 : 1}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        maxWidth: '100%',
        mb: 2,
        borderRadius: 2,
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        bgcolor: 'background.paper',
        backdropFilter: 'blur(10px)',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {/* Edit/Delete/Pin Actions */}
      {canEdit && (
        <Fade in={showEditDeleteOnHover ? hovered : true}>
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              display: 'flex',
              gap: 0.5,
            }}
          >
            {onPin && (
              <Tooltip title={post.is_pinned ? "Unpin post" : "Pin post"}>
                <IconButton
                  size="small"
                  onClick={() => onPin(post)}
                  sx={{
                    bgcolor: 'action.hover',
                    color: post.is_pinned ? 'warning.main' : 'text.secondary',
                    '&:hover': {
                      bgcolor: 'action.selected',
                      color: 'warning.main',
                    },
                    width: 28,
                    height: 28,
                  }}
                >
                  {post.is_pinned ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip title="Edit post">
                <IconButton
                  size="small"
                  onClick={() => onEdit(post)}
                  sx={{
                    bgcolor: 'action.hover',
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: 'action.selected',
                      color: 'primary.main',
                    },
                    width: 28,
                    height: 28,
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Delete post">
                <IconButton
                  size="small"
                  onClick={() => onDelete(post)}
                  sx={{
                    bgcolor: 'action.hover',
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: 'action.selected',
                      color: 'error.main',
                    },
                    width: 28,
                    height: 28,
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Fade>
      )}

      <CardContent sx={{ p: 2, pb: 0 }}>
        {/* User Header */}
        <Box sx={{ mb: 1.5 }}>
          {showUsername && post.username ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Avatar
                src={post.profile_image}
                onClick={() => navigate(`/profile/${post.user_id}`)}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                  transition: 'opacity 0.2s',
                }}
              >
                {post.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  component="div"
                  onClick={() => navigate(`/profile/${post.user_id}`)}
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 0,
                    fontSize: '0.95rem',
                    lineHeight: 1.2,
                    cursor: 'pointer',
                    display: 'inline-block',
                    '&:hover': { opacity: 0.8 },
                    transition: 'opacity 0.2s',
                  }}
                >
                  {post.username}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}
                  >
                    {formatDate(post.created_at)}
                  </Typography>
                  {post.is_pinned && (
                    <Tooltip title="Pinned post" arrow>
                      <PushPin
                        sx={{
                          fontSize: '0.75rem',
                          color: 'warning.main',
                          verticalAlign: 'middle',
                        }}
                      />
                    </Tooltip>
                  )}
                  {post.is_edited && (
                    <Chip
                      label="Edited"
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 14,
                        fontSize: '0.6rem',
                        '& .MuiChip-label': { px: 0.5, py: 0 },
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          ) : (
            // Show only date when username is hidden (profile page)
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                {formatDate(post.created_at)}
              </Typography>
              {post.is_pinned && (
                <Tooltip title="Pinned post" arrow>
                  <PushPin
                    sx={{
                      fontSize: '0.75rem',
                      color: 'warning.main',
                      verticalAlign: 'middle',
                    }}
                  />
                </Tooltip>
              )}
              {post.is_edited && (
                <Chip
                  label="Edited"
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 16,
                    fontSize: '0.65rem',
                    '& .MuiChip-label': { px: 0.5, py: 0 },
                  }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Post Title */}
        {post.title && (
          <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography
              variant="h6"
              sx={{
                mb: 1,
                fontWeight: 600,
                cursor: 'pointer',
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
                transition: 'color 0.2s',
              }}
            >
              {post.title}
            </Typography>
          </Link>
        )}

        {/* Post Content */}
        <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography
            variant="body1"
            sx={{
              mb: 1.5,
              lineHeight: 1.5,
              whiteSpace: 'pre-line',
              fontSize: '0.95rem',
              color: 'text.primary',
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
              transition: 'opacity 0.2s',
            }}
          >
            {renderContentWithMentions(post.content)}
          </Typography>
        </Link>

        {/* Post Image */}
        {post.image_url && (
          <Link to={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
            <Box sx={{ mb: 1.5 }}>
              <img
                src={getPublicUrl(post.image_url)}
                alt="Post"
                style={{
                  width: '100%',
                  maxHeight: isMobile ? '200px' : '300px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.01)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            </Box>
          </Link>
        )}

        {/* Shared Product */}
        {post.shared_product && (
          <ProductEmbedCard product={post.shared_product} />
        )}

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {post.attachments.map((att) => {
                const fileUrl = getPublicUrl(att.file_url);
                const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(att.file_name);

                return isImage ? (
                  <img
                    key={att.id}
                    src={fileUrl}
                    alt={att.file_name}
                    style={{
                      maxHeight: isMobile ? '100px' : '140px',
                      width: 'auto',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onClick={() => window.open(fileUrl, "_blank")}
                  />
                ) : (
                  <Chip
                    key={att.id}
                    label={att.file_name}
                    component="a"
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    size="small"
                    variant="outlined"
                    sx={{
                      maxWidth: isMobile ? '180px' : '250px',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Action Bar - Like, Comment, Share */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pt: 1,
          }}
        >
          {/* Like Button */}
          <Button
            startIcon={liked ? <Favorite /> : <FavoriteBorder />}
            onClick={handleLike}
            disabled={isLiking}
            sx={{
              color: liked ? 'error.main' : 'text.secondary',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'error.lighter',
                color: 'error.main',
              },
              animation: triggerLikeAnimation ? 'pulseLike 0.8s ease-in-out 2' : 'none',
              '@keyframes pulseLike': {
                '0%': { transform: 'scale(1)', color: liked ? '#d32f2f' : '#ef4444' },
                '50%': { transform: 'scale(1.4)', color: '#ef4444' },
                '100%': { transform: 'scale(1)', color: liked ? '#d32f2f' : 'inherit' }
              }
            }}
          >
            {likeCount > 0 ? likeCount : 'Like'}
          </Button>

          {/* Comment Button */}
          {post.comments_enabled !== false && (
            <Button
              startIcon={<ChatBubbleOutline />}
              onClick={() => setShowComments(!showComments)}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'primary.main',
                },
              }}
            >
              {commentCount > 0 ? commentCount : 'Comment'}
            </Button>
          )}

          {/* Share Button */}
          <Button
            startIcon={<Share />}
            onClick={handleShare}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'action.hover',
                color: 'primary.main',
              },
            }}
          >
            Share
          </Button>

          {/* Watch List Button */}
          <Button
            startIcon={bookmarked ? <Star /> : <StarBorder />}
            onClick={handleBookmark}
            disabled={isBookmarking}
            sx={{
              color: bookmarked ? '#ffd700' : 'text.secondary',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              ml: 'auto',
              '&:hover': {
                bgcolor: 'rgba(255, 215, 0, 0.1)',
                color: '#ffd700',
              },
            }}
          >
            {bookmarked ? 'Watching' : 'Watch'}
          </Button>
        </Box>

      </CardContent>

      {/* Comments Section - Only show when toggled */}
      {post.comments_enabled !== false && showComments && (
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          <CommentsSection
            key={`comments-${post.id}`}
            postId={post.id}
            currentUserId={currentUserId}
            collapseTopLevel={collapseComments}
            initialVisibleCount={2}
            highlightCommentId={highlightCommentId}
          />
        </Box>
      )}
    </Card>
  );
};

export default PostCard;