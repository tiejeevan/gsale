import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Avatar,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import { type Comment } from "./CommentsSection";
import { socket } from "../../socket"; // <-- import socket instance

interface AddCommentProps {
  postId: number;
  parentCommentId: number | null;
  onCommentAdded: (comment: Comment) => void;
  currentUserAvatar?: string;
  isTopLevel?: boolean;
  onCancel?: () => void;
  placeholder?: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const AddComment: React.FC<AddCommentProps> = ({
  postId,
  parentCommentId,
  onCommentAdded,
  currentUserAvatar,
  onCancel,
  placeholder,
}) => {
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          post_id: postId,
          parent_comment_id: parentCommentId,
          content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add comment");

      // Call original callback to update UI
      onCommentAdded(data);

      // Emit to Socket.IO server for real-time update
      socket.emit(`post_${postId}:comment:new`, data);

      setContent("");
      setIsFocused(false);
      if (onCancel) onCancel();
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    setIsFocused(false);
    if (onCancel) onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && content.trim()) {
        const formEvent = new Event('submit') as any;
        handleSubmit(formEvent);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
      {/* Avatar */}
      <Link to="/profile" style={{ textDecoration: 'none' }}>
        <Avatar
          src={currentUserAvatar || 'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg'}
          alt="Your avatar"
          sx={{
            width: 32,
            height: 32,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.05)' },
          }}
        />
      </Link>

      {/* Comment Form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1 }}>
        <TextField
          multiline
          placeholder={placeholder || "Add a comment... (Press Enter to post, Shift+Enter for new line)"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          variant="outlined"
          size="small"
          fullWidth
          rows={isFocused || content ? 2 : 1}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'transparent',
              fontSize: '0.85rem',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'text.secondary',
              opacity: 0.7,
            },
          }}
        />

        {/* Action Buttons */}
        {(isFocused || content) && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
            <Button
              type="button"
              size="small"
              onClick={handleCancel}
              disabled={loading}
              sx={{
                fontSize: '0.75rem',
                textTransform: 'none',
                color: 'text.secondary',
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              variant="contained"
              disabled={loading || !content.trim()}
              startIcon={
                loading ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Send fontSize="small" />
                )
              }
              sx={{
                fontSize: '0.75rem',
                textTransform: 'none',
                minWidth: 80,
              }}
            >
              {loading ? "Posting..." : parentCommentId ? "Reply" : "Comment"}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AddComment;
