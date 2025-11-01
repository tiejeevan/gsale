import React, { useState } from "react";
import { FiSend } from "react-icons/fi"; // paper plane icon
import { type Comment } from "./CommentsSection";

interface AddCommentProps {
  postId: number;
  parentCommentId: number | null;
  onCommentAdded: (comment: Comment) => void;
}

const API_URL = import.meta.env.VITE_API_URL;

const AddComment: React.FC<AddCommentProps> = ({ postId, parentCommentId, onCommentAdded }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          parent_comment_id: parentCommentId,
          content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add comment");
      onCommentAdded(data);
      setContent("");
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <input
        type="text"
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 border rounded-full px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-white"
      />
      <button
        type="submit"
        className="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
        disabled={loading || !content.trim()}
        aria-label="Post Comment"
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        ) : (
          <FiSend size={18} />
        )}
      </button>
    </form>
  );
};

export default AddComment;
