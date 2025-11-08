import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import { ChatBubbleOutline } from "@mui/icons-material";
import CommentItem from "./CommentItem";
import AddComment from "./AddComment";
import { socket } from "../../socket"; // <-- import socket instance

export interface Attachment {
  file_name: string;
  url: string;
  mime_type?: string;
  size?: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  content: string | null;
  attachments: Attachment[] | null;
  like_count: number;
  liked_by_user: boolean;
  parent_comment_id: number | null;
  children: Comment[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

interface CommentsSectionProps {
  postId: number;
  currentUserId?: number;
  currentUserAvatar?: string;
  className?: string;
  initialComments?: Comment[];
  collapseTopLevel?: boolean;
  initialVisibleCount?: number;
  highlightCommentId?: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  currentUserId,
  currentUserAvatar,
  initialComments,
  collapseTopLevel = false,
  initialVisibleCount = 2,
  highlightCommentId,
}) => {
  // Sort comments to put highlighted comment first (only when coming from notification)
  const sortedInitialComments = React.useMemo(() => {
    if (!initialComments) return [];
    
    // Only sort if we have a highlightCommentId (coming from notification)
    if (!highlightCommentId) {
      // Default behavior: sort by created_at DESC (latest first)
      return [...initialComments].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    const findAndExtractComment = (comments: Comment[], targetId: number): { found: Comment | null; remaining: Comment[] } => {
      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        
        // Check if this is the target comment
        if (comment.id === targetId) {
          const remaining = [...comments.slice(0, i), ...comments.slice(i + 1)];
          return { found: comment, remaining };
        }
        
        // Check children recursively
        if (comment.children && comment.children.length > 0) {
          const childResult = findAndExtractComment(comment.children, targetId);
          if (childResult.found) {
            // Found in children, return the found comment and update this comment's children
            const updatedComment = { ...comment, children: childResult.remaining };
            const remaining = [...comments.slice(0, i), updatedComment, ...comments.slice(i + 1)];
            return { found: childResult.found, remaining };
          }
        }
      }
      
      return { found: null, remaining: comments };
    };
    
    const { found, remaining } = findAndExtractComment([...initialComments], highlightCommentId);
    
    // If found, put it at the top
    if (found) {
      return [found, ...remaining];
    }
    
    return initialComments;
  }, [initialComments, highlightCommentId]);

  const [comments, setComments] = useState<Comment[]>(sortedInitialComments);
  const [loading, setLoading] = useState(!initialComments);
  const [visibleCount, setVisibleCount] = useState<number>(initialVisibleCount);

  // Update comments when sortedInitialComments changes
  useEffect(() => {
    if (sortedInitialComments) {
      setComments(sortedInitialComments);
    }
  }, [sortedInitialComments]);

  const fetchComments = async () => {
    if (initialComments) return;
    setLoading(true);
    try {
      // Replace with real API call to fetch initial comments
      setComments([]); 
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // --- SOCKET.IO LISTENER ---
    socket.connect(); // ensure socket is connected
    // Join this post room to receive post-scoped events (comments, likes, etc.)
    socket.emit('join', `post_${postId}`);

    socket.on(`post_${postId}:comment:new`, (newComment: Comment) => {
      // Avoid adding duplicates if we just created the comment ourselves
      setComments(prev => {
        const exists = prev.some(c => c.id === newComment.id) || prev.some(c => c.children?.some(child => child.id === newComment.id));
        if (exists) return prev;
        
        if (newComment.parent_comment_id) {
          const addToParent = (nodes: Comment[]): Comment[] => 
            nodes.map(node => {
              if (node.id === newComment.parent_comment_id) {
                return { ...node, children: [...(node.children || []), newComment] };
              } else if (node.children && node.children.length > 0) {
                return { ...node, children: addToParent(node.children) };
              }
              return node;
            });
          return addToParent(prev);
        } else {
          return [...prev, newComment];
        }
      });
    });

    // Listen for like/unlike events to update comment like counts in real time
    const handleCommentLikeEvent = (likeData: {
      post_id: number;
      comment_id: number;
      user_id: number;
      reaction_type: 'like' | 'unlike';
    }) => {
      if (currentUserId && likeData.user_id === currentUserId) return; // already optimistic locally

      setComments(prev => {
        const updateNode = (nodes: Comment[]): Comment[] =>
          nodes.map(node => {
            if (node.id === likeData.comment_id) {
              const delta = likeData.reaction_type === 'like' ? 1 : -1;
              return { ...node, like_count: Math.max(0, (node.like_count || 0) + delta) };
            }
            if (node.children && node.children.length > 0) {
              return { ...node, children: updateNode(node.children) };
            }
            return node;
          });
        return updateNode(prev);
      });
    };

    socket.on(`post_${postId}:comment:like:new`, handleCommentLikeEvent);

    return () => {
      socket.off(`post_${postId}:comment:new`);
      socket.off(`post_${postId}:comment:like:new`, handleCommentLikeEvent);
      // socket.disconnect();
    };
  }, [postId]);

  const addNewComment = (comment: Comment) => {
    if (comment.parent_comment_id) {
      const updateTree = (nodes: Comment[]): Comment[] =>
        nodes.map((c) => {
          if (c.id === comment.parent_comment_id) {
            return { ...c, children: [...(c.children || []), comment] };
          } else if (c.children && c.children.length > 0) {
            return { ...c, children: updateTree(c.children) };
          } else {
            return c;
          }
        });
      setComments(updateTree(comments));
    } else {
      setComments([...comments, comment]);
    }
  };

  const updateCommentInState = (updatedComment: Comment) => {
    const updateNode = (nodes: Comment[]): Comment[] => {
      return nodes.map(node => {
        if (node.id === updatedComment.id) return updatedComment;
        if (node.children && node.children.length > 0) return { ...node, children: updateNode(node.children) };
        return node;
      });
    };
    setComments(updateNode(comments));
  };

  const deleteCommentInState = (commentId: number) => {
    const removeNode = (nodes: Comment[]): Comment[] => {
      return nodes
        .filter(node => node.id !== commentId)
        .map(node => {
          if (node.children && node.children.length > 0) return { ...node, children: removeNode(node.children) };
          return node;
        });
    };
    setComments(removeNode(comments));
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Comments Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ChatBubbleOutline fontSize="small" sx={{ color: 'text.secondary' }} />
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            fontSize: '0.95rem',
          }}
        >
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2, opacity: 0.3 }} />

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Comments List */}
      {!loading && comments.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {(collapseTopLevel ? comments.slice(0, Math.min(visibleCount, comments.length)) : comments).map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserAvatar={currentUserAvatar}
              onCommentAdded={addNewComment}
              onCommentUpdated={updateCommentInState}
              onCommentDeleted={deleteCommentInState}
              highlightCommentId={highlightCommentId}
            />
          ))}
          {collapseTopLevel && comments.length > visibleCount && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600 }}
                onClick={() => setVisibleCount(comments.length)}
              >
                View {comments.length - visibleCount} more {comments.length - visibleCount > 1 ? 'comments' : 'comment'}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Add Comment - Now at the bottom */}
      <Box sx={{ mt: !loading && comments.length > 0 ? 2 : 0 }}>
        <AddComment
          postId={postId}
          parentCommentId={null}
          onCommentAdded={addNewComment}
          currentUserAvatar={currentUserAvatar}
          isTopLevel={true}
          placeholder={!loading && comments.length === 0 ? "Be first to comment..." : "Add a comment..."}
        />
      </Box>
    </Box>
  );
};

export default CommentsSection;
