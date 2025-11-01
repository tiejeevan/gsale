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
    // We keep this function for the initial load but won't use it for updates
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

  const addNewComment = (comment: Comment) => {
    if (comment.parent_comment_id) {
      const updateTree = (nodes: Comment[]): Comment[] =>
        nodes.map((c) => {
          if (c.id === comment.parent_comment_id) {
            // Add the new comment to the children of the correct parent
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

  // --- START: NEW FUNCTIONS ---
  // New function to update a comment anywhere in the state tree (for likes, edits)
  const updateCommentInState = (updatedComment: Comment) => {
    const updateNode = (nodes: Comment[]): Comment[] => {
      return nodes.map(node => {
        if (node.id === updatedComment.id) {
          return updatedComment; // Replace the old comment with the updated one
        }
        if (node.children && node.children.length > 0) {
          // Recursively search in children
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    setComments(updateNode(comments));
  };
  
  // New function to delete a comment anywhere in the state tree
  const deleteCommentInState = (commentId: number) => {
    const removeNode = (nodes: Comment[]): Comment[] => {
      return nodes
        .filter(node => node.id !== commentId) // Filter out the deleted comment
        .map(node => {
          if (node.children && node.children.length > 0) {
            // Recursively search and remove from children
            return { ...node, children: removeNode(node.children) };
          }
          return node;
        });
    };
    setComments(removeNode(comments));
  };
  // --- END: NEW FUNCTIONS ---

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
                // --- Pass down the new state management functions ---
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