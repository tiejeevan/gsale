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
  className?: string;
  initialComments?: Comment[];
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  currentUserId,
  initialComments,
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [loading, setLoading] = useState(!initialComments);

  const fetchComments = async () => {
    if (initialComments) return; // skip fetching if passed
    setLoading(true);
    try {
    //   const token = localStorage.getItem("token");
    //   const res = await fetch(`${API_URL}/api/comments/${postId}`, {
    //     headers: { Authorization: `Bearer ${token}` },
    //   });
    //   const data = [await res.json()];
      setComments([]);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, initialComments]);

  const addNewComment = (comment: Comment) => {
    if (comment.parent_comment_id) {
      const updateTree = (nodes: Comment[]): Comment[] =>
        nodes.map((c) => {
          if (c.id === comment.parent_comment_id) {
            return { ...c, children: [...c.children, comment] };
          } else if (c.children.length) {
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
    <div className={`comments-section mt-4 ${loading ? "opacity-70" : ""}`}>
      <AddComment postId={postId} parentCommentId={null} onCommentAdded={addNewComment} />
      {loading && <div className="text-gray-500 mt-2">Loading comments...</div>}
      {!loading && comments.length === 0 && (
        <div className="text-gray-400 mt-2 text-sm">No comments yet</div>
      )}
      {!loading &&
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            refreshComments={fetchComments}
          />
        ))}
    </div>
  );
};

export default CommentsSection;
