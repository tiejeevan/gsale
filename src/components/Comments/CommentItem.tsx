// --- START OF FILE CommentItem.tsx ---

import React, { useState } from "react";
import { FiMoreHorizontal, FiThumbsUp, FiThumbsDown, FiChevronDown, FiChevronUp } from "react-icons/fi";
import AddComment from "./AddComment";
import { type Comment } from "./CommentsSection";

interface CommentItemProps {
  comment: Comment;
  currentUserId?: number;
  currentUserAvatar?: string;
  refreshComments: () => void;
}

const API_URL = import.meta.env.VITE_API_URL;

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUserId, currentUserAvatar, refreshComments }) => {
  // Your original state management
  const [showReply, setShowReply] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || "");

  // New state for collapsible replies
  const [repliesVisible, setRepliesVisible] = useState(false);

  const token = localStorage.getItem("token");
  const isOwner = currentUserId === Number(comment.user_id);

  // Your original working functions (unchanged logic)
  const handleLike = async () => {
    try {
      const endpoint = comment.liked_by_user
        ? `${API_URL}/api/comments/${comment.id}/unlike`
        : `${API_URL}/api/comments/${comment.id}/like`;
      const res = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to like/unlike");
      refreshComments();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`${API_URL}/api/comments/${comment.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete comment");
      refreshComments();
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
      setEditing(false);
      refreshComments();
    } catch (err) { console.error(err); }
  };

  // When a reply is added, we want to refresh and ensure replies are visible.
  const onReplyAdded = (_newComment: Comment) => {
    setShowReply(false); // Hide the reply form
    refreshComments();   // Refresh all comments
    setRepliesVisible(true); // Make sure the replies section is open
  };

  return (
    <div className="flex items-start gap-3">
      <img
        src={comment.avatar_url || 'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg'}
        alt={`${comment.username}'s avatar`}
        className="w-10 h-10 rounded-full"
      />
      <div className="flex-1">
        {!editing ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm dark:text-white">{comment.username}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-gray-800 dark:text-gray-200">{comment.content}</p>
          </div>
        ) : (
          // EDITING VIEW - using a similar UI to AddComment
          <div className="w-full">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-transparent border-b-2 p-1 focus:border-blue-500 focus:outline-none dark:text-white dark:border-gray-600"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-semibold rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleEdit} className="px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-full hover:bg-blue-600">Save</button>
            </div>
          </div>
        )}

        {/* --- ACTIONS --- */}
        {!editing && (
          <div className="flex items-center gap-2 mt-2 text-gray-500 dark:text-gray-400">
            <button onClick={handleLike} className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <FiThumbsUp size={16} className={comment.liked_by_user ? "text-blue-500" : ""} />
              <span className="text-xs">{comment.like_count > 0 && comment.like_count}</span>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <FiThumbsDown size={16} />
            </button>
            <button onClick={() => setShowReply(!showReply)} className="px-3 py-1.5 text-xs font-semibold rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              Reply
            </button>
          </div>
        )}

        {/* --- INLINE REPLY FORM --- */}
        {showReply && (
          <div className="mt-4">
            <AddComment
              postId={comment.post_id}
              parentCommentId={comment.id}
              onCommentAdded={onReplyAdded}
              currentUserAvatar={currentUserAvatar}
              onCancel={() => setShowReply(false)}
            />
          </div>
        )}

        {/* --- REPLIES SECTION --- */}
        {(comment.children || []).length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setRepliesVisible(!repliesVisible)}
              className="flex items-center gap-1 text-sm font-bold text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full px-3 py-1.5"
            >
              {repliesVisible ? <FiChevronUp/> : <FiChevronDown/>}
              {comment.children.length} {comment.children.length > 1 ? 'replies' : 'reply'}
            </button>

            {repliesVisible && (
              <div className="mt-3 space-y-5">
                {(comment.children || []).map((child) => (
                  <CommentItem
                    key={child.id}
                    comment={child}
                    currentUserId={currentUserId}
                    currentUserAvatar={currentUserAvatar}
                    refreshComments={refreshComments}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- EDIT/DELETE MENU --- */}
      {isOwner && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiMoreHorizontal />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg rounded-md z-10 w-32">
              <button onClick={() => { setEditing(true); setShowMenu(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Edit</button>
              <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;