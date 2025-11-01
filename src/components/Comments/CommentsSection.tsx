// --- START OF FILE CommentsSection.tsx ---

import React, { useEffect, useState } from "react";
import CommentItem from "./CommentItem";
import AddComment from "./AddComment";

// const API_URL = import.meta.env.VITE_API_URL;

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
  avatar_url?: string; // Essential for the YouTube-style UI
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
  currentUserAvatar?: string; // Pass the current user's avatar for the top-level comment box
  className?: string;
  initialComments?: Comment[];
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  currentUserId,
  currentUserAvatar,
  initialComments,
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [loading, setLoading] = useState(!initialComments);

  const fetchComments = async () => {
    if (initialComments) return;
    setLoading(true);
    try {
      // Your original fetch logic here...
      setComments([]); // Assuming it gets populated by the API call
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, initialComments]);

  // Your original working function
  const addNewComment = (comment: Comment) => {
    if (comment.parent_comment_id) {
      const updateTree = (nodes: Comment[]): Comment[] =>
        nodes.map((c) => {
          if (c.id === comment.parent_comment_id) {
            return { ...c, children: [...c.children, comment] };
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

  return (
    <div className={`comments-section mt-8 font-sans`}>
      <h3 className="text-lg font-bold mb-4 dark:text-white">{comments.length} Comments</h3>
      
      {/* Top-level comment input */}
      <div className="mb-6">
          <AddComment
            postId={postId}
            parentCommentId={null}
            onCommentAdded={addNewComment}
            currentUserAvatar={currentUserAvatar}
            isTopLevel={true} // Differentiate style for top-level input
          />
      </div>

      {loading && <div className="text-gray-500 mt-2">Loading comments...</div>}
      
      {!loading && comments.length === 0 && (
        <div className="text-gray-400 mt-2 text-sm">No comments yet. Be the first to comment!</div>
      )}

      {/* Renders the list of comments */}
      {!loading && (
        <div className="space-y-5">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                refreshComments={fetchComments}
                currentUserAvatar={currentUserAvatar}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;