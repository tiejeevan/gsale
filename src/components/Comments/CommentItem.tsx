import React, { useState } from "react";
import { Link } from "react-router-dom";
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
  Reply,
} from "@mui/icons-material";
import AddComment from "./AddComment";
import { type Comment } from "./CommentsSection";

interface CommentItemProps {
  comment: Comment;
  currentUserId?: number;
  currentUserAvatar?: string;
  onCommentAdded: (comment: Comment) => void;
  onCommentUpdated: (comment: Comment) => void;
  onCommentDeleted: (commentId: number) => void;
}

const API_URL = import.meta.env.VITE_API_URL;

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  currentUserId, 
  currentUserAvatar, 
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
}) => {
  const [showReply, setShowReply] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || "");
  const [repliesVisible, setRepliesVisible] = useState(false);
  
  const showMenu = Boolean(menuAnchor);

  const token = localStorage.getItem("token");
  const isOwner = currentUserId === Number(comment.user_id);

  // --- START: CORRECTED handleLike FUNCTION ---
  const handleLike = async () => {
    const isCurrentlyLiked = comment.liked_by_user;
    const endpoint = isCurrentlyLiked
      ? `${API_URL}/api/comments/${comment.id}/unlike`
      : `${API_URL}/api/comments/${comment.id}/like`;

    const optimisticComment: Comment = {
      ...comment,
      like_count: isCurrentlyLiked ? comment.like_count - 1 : comment.like_count + 1,
      liked_by_user: !isCurrentlyLiked,
    };
    
    // 1. Update the UI immediately with the optimistic state
    onCommentUpdated(optimisticComment);

    try {
      // 2. Send the actual request to the server in the background
      const res = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      
      if (!res.ok) {
        // If the API call fails, throw an error to be caught below
        throw new Error("Failed to like/unlike");
      }
      
      // 3. ON SUCCESS, DO NOTHING. The UI is already correct.
      // We removed the code that processed the successful response `res.json()`.

    } catch (err) {
      console.error(err);
      // 4. If anything goes wrong, revert the UI back to the original state
      onCommentUpdated(comment);
    }
  };
  // --- END: CORRECTED handleLike FUNCTION ---


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
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const onReplyAdded = (newComment: Comment) => {
    setShowReply(false);
    onCommentAdded(newComment);

    setRepliesVisible(true);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
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

            {/* Content */}
            <Typography
              variant="body2"
              sx={{
                color: 'text.primary',
                fontSize: '0.85rem',
                lineHeight: 1.4,
                mb: 1,
              }}
            >
              {comment.content}
            </Typography>
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

        {/* Actions */}
        {!editing && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {/* Like Button */}
            <IconButton
              size="small"
              onClick={handleLike}
              sx={{
                color: comment.liked_by_user ? 'primary.main' : 'text.secondary',
                p: 0.5,
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
              }}
            >
              {comment.liked_by_user ? (
                <ThumbUp fontSize="small" />
              ) : (
                <ThumbUpOutlined fontSize="small" />
              )}
            </IconButton>
            {comment.like_count > 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', mr: 1 }}>
                {comment.like_count}
              </Typography>
            )}

            {/* Reply Button */}
            <Button
              size="small"
              startIcon={<Reply fontSize="small" />}
              onClick={() => setShowReply(!showReply)}
              sx={{
                fontSize: '0.7rem',
                textTransform: 'none',
                color: 'text.secondary',
                minWidth: 'auto',
                p: 0.5,
              }}
            >
              Reply
            </Button>
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