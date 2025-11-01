import React, { useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import AddComment from "./AddComment";
import { type Comment } from "./CommentsSection";

interface CommentItemProps {
  comment: Comment;
  currentUserId?: number;
  refreshComments: () => void;
}

const API_URL = import.meta.env.VITE_API_URL;

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUserId, refreshComments }) => {
  const [showReply, setShowReply] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || "");

  const token = localStorage.getItem("token");

  const handleLike = async () => {
    try {
      const endpoint = comment.liked_by_user
        ? `${API_URL}/api/comments/${comment.id}/unlike`
        : `${API_URL}/api/comments/${comment.id}/like`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to like/unlike");
      refreshComments();
    } catch (err) {
      console.error(err);
    }
  };

  console.log("++res", currentUserId === Number(comment.user_id) )
  console.log("++currentUserId", currentUserId )
  console.log("++comment user id", comment.user_id )

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`${API_URL}/api/comments/${comment.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      refreshComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/comments/${comment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error("Failed to edit comment");
      setEditing(false);
      refreshComments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="comment-item mt-2 ml-0 md:ml-4">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <span className="font-semibold">{comment.username}</span>{" "}
          {!editing ? (
            <span>{comment.content}</span>
          ) : (
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="border rounded px-2 py-1 w-full mt-1"
            />
          )}
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
            <button onClick={handleLike} className="hover:underline">
              {comment.liked_by_user ? "Unlike" : "Like"} ({comment.like_count})
            </button>
            <button onClick={() => setShowReply(!showReply)} className="hover:underline">
              Reply
            </button>
            <span className="text-xs">{new Date(comment.created_at).toLocaleString()}</span>
          </div>
        </div>

        {currentUserId === Number(comment.user_id) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-red dark:hover:bg-gray-700 transition-colors"
              title="Menu"
            >
              <FiMoreHorizontal size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg rounded z-10 min-w-[100px]">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center px-3 py-1 w-full hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    Edit
                  </button>
                )}
                {editing && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center px-3 py-1 w-full hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    Save
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="flex items-center px-3 py-1 w-full hover:bg-red-100 dark:hover:bg-red-700 text-red-500 text-left"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showReply && (
        <AddComment
          postId={comment.post_id}
          parentCommentId={comment.id}
          onCommentAdded={refreshComments}
        />
      )}

      {(comment.children || []).length > 0 && (
        <div className="ml-4 mt-2 border-l border-gray-200 dark:border-gray-700 pl-2">
          {(comment.children || []).map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              currentUserId={currentUserId}
              refreshComments={refreshComments}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default CommentItem;
