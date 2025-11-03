import React, { useEffect, useState } from "react";
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

    return () => {
      socket.off(`post_${postId}:comment:new`);
      socket.disconnect();
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
    <div className={`comments-section mt-8 font-sans`}>
      <h3 className="text-lg font-bold mb-4 dark:text-white">{comments.length} Comments</h3>

      <div className="mb-6">
        <AddComment
          postId={postId}
          parentCommentId={null}
          onCommentAdded={addNewComment}
          currentUserAvatar={currentUserAvatar}
          isTopLevel={true}
        />
      </div>

      {loading && <div className="text-gray-500 mt-2">Loading comments...</div>}

      {!loading && comments.length === 0 && (
        <div className="text-gray-400 mt-2 text-sm">No comments yet. Be the first to comment!</div>
      )}

      {!loading && (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserAvatar={currentUserAvatar}
              onCommentAdded={addNewComment}
              onCommentUpdated={updateCommentInState}
              onCommentDeleted={deleteCommentInState}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
