import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { Edit, Delete, PushPin, PushPinOutlined, FavoriteBorder, Favorite, ChatBubbleOutline, Share } from "@mui/icons-material";
import { addLike, removeLike } from "../services/likeService";
import CommentsSection, { type Comment } from "./Comments/CommentsSection";
import { socket } from "../socket";

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
  visibility?: string;
  attachments?: Attachment[];
  comments?: Comment[];
  view_count?: number;
  comments_enabled?: boolean;
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
  r2PublicUrl?: string;
  collapseComments?: boolean;
  showCommentsInitially?: boolean;
  highlightCommentId?: number;
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
  collapseComments = true,
  showCommentsInitially = false,
  highlightCommentId,
}) => {
  const [hovered, setHovered] = useState(false);
  const [showComments, setShowComments] = useState(showCommentsInitially);
  const [liked, setLiked] = useState(post.liked_by_user || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const [isLiking, setIsLiking] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Socket.IO: Listen for real-time like updates
  useEffect(() => {
    const postRoom = `post_${post.id}`;
    const likeEvent = `post_${post.id}:like:new`;

    // Join the room for this post
    const joinRoom = () => {
      if (socket.connected) {
        socket.emit("join", postRoom);
        console.log(`🔌 PostCard joined room: ${postRoom}`);
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

  // Parse content and make mentions clickable
  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    
    return parts.map((part, index) => {
      if (part.match(/^@\w+$/)) {
        const username = part.substring(1);
        return (
          <Link
            key={index}
            to={`/profile/${username}`}
            style={{
              color: theme.palette.primary.main,
              textDecoration: 'none',
              fontWeight: 600,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            {part}
          </Link>
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
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
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
        {showUsername && post.username && (
          <Box sx={{ mb: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Link 
                to={`/profile/${post.user_id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}
              >
                <Avatar
                  src={post.profile_image}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {post.username.charAt(0).toUpperCase()}
                </Avatar>
              </Link>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Link 
                  to={`/profile/${post.user_id}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'inline' }}
                >
                  <Typography
                    variant="subtitle1"
                    component="span"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0,
                      display: 'inline',
                      fontSize: '0.95rem',
                      '&:hover': { opacity: 0.8 },
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {post.username}
                  </Typography>
                </Link>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
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
          </Box>
        )}

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
              '&:hover': {
                color: 'text.primary',
              },
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