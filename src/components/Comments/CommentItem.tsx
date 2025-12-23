import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  TextField,
  Collapse,
} from "@mui/material";
import {
  MoreVert,
  ThumbUp,
  ThumbUpOutlined,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import AddComment from "./AddComment";
import MentionText from "./MentionText";
import { type Comment } from "./CommentsSection";

interface CommentItemProps {
  comment: Comment;
  currentUserId?: number;
  currentUserAvatar?: string;
  onCommentAdded: (comment: Comment) => void;
  onCommentUpdated: (comment: Comment) => void;
  onCommentDeleted: (commentId: number) => void;
  highlightCommentId?: number;
}

const API_URL = import.meta.env.VITE_API_URL;

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  currentUserAvatar,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  highlightCommentId,
}) => {
  const [showReply, setShowReply] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || "");
  const [repliesVisible, setRepliesVisible] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);

  const showMenu = Boolean(menuAnchor);

  // Check if this comment should be highlighted
  const shouldHighlight = highlightCommentId === comment.id;

  // Check if any child comment should be highlighted
  const hasHighlightedChild = (children: Comment[]): boolean => {
    if (!highlightCommentId || !children) return false;
    return children.some(child =>
      child.id === highlightCommentId || hasHighlightedChild(child.children || [])
    );
  };

  // Auto-expand replies if a child is highlighted
  useEffect(() => {
    if (highlightCommentId && hasHighlightedChild(comment.children || [])) {
      setRepliesVisible(true);
    }
  }, [highlightCommentId]);

  // Scroll to and highlight the comment if it matches
  useEffect(() => {
    if (shouldHighlight && commentRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        commentRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        setIsHighlighted(true);

        // Remove highlight after animation
        setTimeout(() => {
          setIsHighlighted(false);
        }, 3000);
      }, 300);
    }
  }, [shouldHighlight]);

  const token = localStorage.getItem("token");
  const isOwner = currentUserId === Number(comment.user_id);

  // --- START: IMPROVED handleLike FUNCTION ---
  const handleLike = async () => {
    const isCurrentlyLiked = comment.liked_by_user;
    const endpoint = isCurrentlyLiked
      ? `${API_URL}/api/comments/${comment.id}/unlike`
      : `${API_URL}/api/comments/${comment.id}/like`;

    const optimisticComment: Comment = {
      ...comment,
      like_count: Math.max(0, isCurrentlyLiked ? comment.like_count - 1 : comment.like_count + 1),
      liked_by_user: !isCurrentlyLiked,
    };

    // 1. Update the UI immediately with the optimistic state
    onCommentUpdated(optimisticComment);

    try {
      // 2. Send the actual request to the server
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Comment like API error:', { status: res.status, error: errorData });

        // Handle "Already liked" case - this means the UI state is out of sync
        if (errorData.error === 'Already liked') {
          // Fix the UI state to match the backend
          const correctedComment: Comment = {
            ...comment,
            liked_by_user: true,
            like_count: Math.max(comment.like_count, 1)
          };
          onCommentUpdated(correctedComment);
          toast.error('Comment is already liked. UI state has been corrected.');
          return; // Don't throw error, just return
        }

        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      // Parse the response to check if it's successful
      const responseData = await res.json().catch(() => ({ success: false }));
      if (!responseData.success && !responseData.msg) {
        throw new Error('Unexpected response format');
      }

      // 3. On success, the optimistic update is correct
      // The socket will handle real-time updates for other users
      // No toast needed - UI already provides visual feedback via icon change
      console.log(`✅ Comment ${isCurrentlyLiked ? 'unliked' : 'liked'} successfully`);

    } catch (err) {
      console.error('❌ Failed to like/unlike comment:', err);
      // 4. If anything goes wrong, revert the UI back to the original state
      onCommentUpdated(comment);

      // Show user-friendly error message with toast
      toast.error(`Failed to ${isCurrentlyLiked ? 'unlike' : 'like'} comment. Please try again.`);
    }
  };
  // --- END: IMPROVED handleLike FUNCTION ---


  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setMenuAnchor(null);
    try {
      const res = await fetch(`${API_URL}/api/comments/${comment.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete comment");

      onCommentDeleted(comment.id);

    } catch (err) { console.error(err); }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error("Failed to edit comment");

      const updatedComment = await res.json();
      setEditing(false);
      setMenuAnchor(null);
      onCommentUpdated(updatedComment);

    } catch (err) { console.error(err); }
  };

  const formatDate = (dateString: string) => {
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

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const onReplyAdded = (newComment: Comment) => {
    setShowReply(false);
    onCommentAdded(newComment);

    setRepliesVisible(true);
  };

  // Calculate comment depth from path
  const getCommentDepth = () => {
    if (!comment.path) return 0;
    return comment.path.split('/').length - 1;
  };

  const commentDepth = getCommentDepth();
  const canReply = commentDepth < 1; // Only allow replies on top-level comments (depth 0)

  return (
    <Box
      ref={commentRef}
      sx={{
        display: 'flex',
        gap: 1.5,
        width: '100%',
        p: isHighlighted ? 1.5 : 0,
        borderRadius: 2,
        backgroundColor: isHighlighted ? 'rgba(103, 126, 234, 0.15)' : 'transparent',
        transition: 'all 0.3s ease',
        animation: isHighlighted ? 'pulse 1s ease-in-out 2' : 'none',
        '@keyframes pulse': {
          '0%, 100%': {
            backgroundColor: 'rgba(103, 126, 234, 0.15)',
          },
          '50%': {
            backgroundColor: 'rgba(103, 126, 234, 0.25)',
          },
        },
      }}
    >
      {/* Avatar */}
      <Link to={`/profile/${comment.user_id}`} style={{ textDecoration: 'none' }}>
        <Avatar
          src={comment.avatar_url || 'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg'}
          alt={`${comment.username}'s avatar`}
          sx={{
            width: 32,
            height: 32,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.05)' },
          }}
        />
      </Link>

      {/* Comment Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {!editing ? (
          <Box>
            {/* Header and Content with Like on Right */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Link
                    to={`/profile/${comment.user_id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '0.85rem',
                        '&:hover': { color: 'primary.main' },
                        transition: 'color 0.2s',
                      }}
                    >
                      {comment.username}
                    </Typography>
                  </Link>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                    }}
                  >
                    {formatDate(comment.created_at)}
                  </Typography>
                </Box>

                {/* Content with Mentions */}
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontSize: '0.85rem',
                    lineHeight: 1.4,
                    mb: 1,
                  }}
                >
                  <MentionText content={comment.content || ''} />
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          /* Edit Mode */
          <Box sx={{ width: '100%' }}>
            <TextField
              multiline
              rows={2}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'transparent',
                  fontSize: '0.85rem',
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                size="small"
                onClick={() => setEditing(false)}
                sx={{ fontSize: '0.75rem', textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleEdit}
                disabled={!editContent.trim()}
                sx={{ fontSize: '0.75rem', textTransform: 'none' }}
              >
                Save
              </Button>
            </Box>
          </Box>
        )}

        {/* Actions - Like and Reply buttons */}
        {!editing && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            {/* Like Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleLike}
                sx={{
                  color: comment.liked_by_user ? 'primary.main' : 'text.secondary',
                  p: 0.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(103, 126, 234, 0.08)',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                {comment.liked_by_user ? (
                  <ThumbUp fontSize="small" />
                ) : (
                  <ThumbUpOutlined fontSize="small" />
                )}
              </IconButton>
              {comment.like_count > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                  {comment.like_count}
                </Typography>
              )}
            </Box>

            {/* Reply Button (only for top-level comments) */}
            {canReply && (
              <Button
                size="small"
                onClick={() => setShowReply(!showReply)}
                sx={{
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  color: showReply ? 'primary.main' : 'text.secondary',
                  fontWeight: showReply ? 600 : 500,
                  minWidth: 'auto',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  backgroundColor: showReply ? 'rgba(103, 126, 234, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: showReply ? 'rgba(103, 126, 234, 0.15)' : 'rgba(103, 126, 234, 0.08)',
                    color: 'primary.main',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                {showReply ? 'Cancel Reply' : 'Reply'}
              </Button>
            )}
          </Box>
        )}

        {/* Hint for nested comments */}
        {!editing && !canReply && (
          <Box sx={{ mt: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                fontStyle: 'italic',
              }}
            >
              Use @mentions to reply
            </Typography>
          </Box>
        )}

        {/* Reply Form */}
        <Collapse in={showReply}>
          <Box sx={{ mt: 2 }}>
            <AddComment
              postId={comment.post_id}
              parentCommentId={comment.id}
              onCommentAdded={onReplyAdded}
              currentUserAvatar={currentUserAvatar}
              onCancel={() => setShowReply(false)}
            />
          </Box>
        </Collapse>

        {/* Replies */}
        {(comment.children || []).length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              startIcon={repliesVisible ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setRepliesVisible(!repliesVisible)}
              sx={{
                fontSize: '0.75rem',
                textTransform: 'none',
                color: 'primary.main',
                fontWeight: 600,
                p: 0.5,
                minWidth: 'auto',
              }}
            >
              {comment.children.length} {comment.children.length > 1 ? 'replies' : 'reply'}
            </Button>

            <Collapse in={repliesVisible}>
              <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 2, pl: 1 }}>
                {(comment.children || []).map((child) => (
                  <CommentItem
                    key={child.id}
                    comment={child}
                    currentUserId={currentUserId}
                    currentUserAvatar={currentUserAvatar}
                    onCommentAdded={onCommentAdded}
                    onCommentUpdated={onCommentUpdated}
                    onCommentDeleted={onCommentDeleted}
                    highlightCommentId={highlightCommentId}
                  />
                ))}
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>

      {/* Menu */}
      {isOwner && (
        <Box>
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              color: 'text.secondary',
              opacity: 0.7,
              '&:hover': { opacity: 1 },
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={showMenu}
            onClose={() => setMenuAnchor(null)}
            PaperProps={{
              sx: {
                minWidth: 120,
                boxShadow: 3,
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setEditing(true);
                setMenuAnchor(null);
              }}
              sx={{ fontSize: '0.85rem' }}
            >
              Edit
            </MenuItem>
            <MenuItem
              onClick={handleDelete}
              sx={{ fontSize: '0.85rem', color: 'error.main' }}
            >
              Delete
            </MenuItem>
          </Menu>
        </Box>
      )}
    </Box>
  );
};

export default CommentItem;