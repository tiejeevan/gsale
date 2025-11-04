import React, { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import EditPostModal from "./EditPostModal";
import DeletePostModal from "./DeletePostModal";
import PostCard from "../components/PostCard";

interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

interface Post {
  id: number;
  user_id: number;
  username?: string;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  is_edited: boolean;
  liked_by_user: boolean;
  comment_count?: number;
  attachments?: Attachment[];
}

// 🔥 Calculate “hot” ranking score — Reddit-inspired
function calculateHotScore(post: Post): number {
  const hoursSincePost =
    (Date.now() - new Date(post.created_at).getTime()) / 3600000;
  const likesWeight = post.like_count * 1.5;
  const commentsWeight = (post.comment_count || 0) * 1.2;
  // Newer posts get slight boost
  const recencyBoost = Math.max(0, 24 - hoursSincePost) * 0.5;
  return likesWeight + commentsWeight + recencyBoost;
}

const Discover: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModalPost, setEditModalPost] = useState<Post | null>(null);
  const [deleteModalPost, setDeleteModalPost] = useState<Post | null>(null);
  const [sortMode, setSortMode] = useState<"latest" | "top" | "hot">("hot");

  const API_URL = import.meta.env.VITE_API_URL;

  if (!auth || !auth.user) return null;
  const { token, user } = auth;

  // ✅ Fetch all posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to fetch posts");
      else setPosts(data);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while fetching posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // ✅ Derived, dynamically sorted posts
  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    switch (sortMode) {
      case "latest":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
      case "top":
        return sorted.sort((a, b) => b.like_count - a.like_count);
      case "hot":
      default:
        return sorted.sort((a, b) => calculateHotScore(b) - calculateHotScore(a));
    }
  }, [posts, sortMode]);

  // ✅ Edit post handler
  const handleUpdatePost = async (updated: Post) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${updated.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: updated.content,
          image_url: updated.image_url,
        }),
      });
      if (res.ok) {
        setEditModalPost(null);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Delete post handler
  const handleDeletePost = async (post: Post | null) => {
    if (!post) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteModalPost(null);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ UI
  if (loading)
    return <p className="text-gray-700 dark:text-gray-300">Loading posts...</p>;
  if (error)
    return <p className="text-red-500 dark:text-red-400">{error}</p>;
  if (posts.length === 0)
    return <p className="text-gray-700 dark:text-gray-300">No posts yet.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-indigo-500 hover:text-indigo-700 font-semibold mb-4"
      >
        <FiArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Header + Sort Filter */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Discover
        </h2>

        <select
          value={sortMode}
          onChange={(e) =>
            setSortMode(e.target.value as "latest" | "top" | "hot")
          }
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
        >
          <option value="hot">🔥 Hot</option>
          <option value="latest">🕒 Latest</option>
          <option value="top">⭐ Top</option>
        </select>
      </div>

      {/* Posts */}
      {sortedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          token={token as string}
          currentUserId={user.id}
          showUsername={true}
          showEditDeleteOnHover={true}
          onEdit={(p) => setEditModalPost(p)}
          onDelete={(p) => setDeleteModalPost(p)}
        />
      ))}

      {/* Modals */}
      {editModalPost && (
        <EditPostModal
          isOpen={true}
          content={editModalPost.content}
          imageUrl={editModalPost.image_url || ""}
          onClose={() => setEditModalPost(null)}
          onSave={(updatedContent, updatedImage) =>
            handleUpdatePost({
              ...editModalPost,
              content: updatedContent,
              image_url: updatedImage,
            })
          }
          onChangeContent={(val) =>
            setEditModalPost({ ...editModalPost, content: val })
          }
          onChangeImage={(val) =>
            setEditModalPost({ ...editModalPost, image_url: val })
          }
        />
      )}

      {deleteModalPost && (
        <DeletePostModal
          isOpen={true}
          onClose={() => setDeleteModalPost(null)}
          onDelete={() => handleDeletePost(deleteModalPost)}
        />
      )}
    </div>
  );
};

export default Discover;
