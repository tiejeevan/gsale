import React, { useState } from "react";
import { type Comment } from "./CommentsSection";
import { socket } from "../../socket"; // <-- import socket instance

interface AddCommentProps {
  postId: number;
  parentCommentId: number | null;
  onCommentAdded: (comment: Comment) => void;
  currentUserAvatar?: string;
  isTopLevel?: boolean;
  onCancel?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL;

const AddComment: React.FC<AddCommentProps> = ({
  postId,
  parentCommentId,
  onCommentAdded,
  currentUserAvatar,
  onCancel,
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

  return (
    <div className="flex items-start gap-3 w-full">
      <img
        src={currentUserAvatar || 'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg'}
        alt="Your avatar"
        className="w-10 h-10 rounded-full"
      />
      <form onSubmit={handleSubmit} className="w-full">
        <div className="w-full">
          <textarea
            placeholder="Add a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full bg-transparent border-b-2 p-1 focus:border-blue-500 focus:outline-none dark:text-white dark:border-gray-600 transition-colors"
            rows={isFocused || content ? 2 : 1}
          />
        </div>
        {(isFocused || content) && (
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-semibold rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"
            >
              {loading ? "Commenting..." : parentCommentId ? "Reply" : "Comment"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddComment;
