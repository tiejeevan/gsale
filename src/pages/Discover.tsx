import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiEdit, FiTrash2 } from "react-icons/fi";

interface Post {
  id: number;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  is_edited: boolean;
  username: string;
  first_name: string;
  last_name: string;
}

const Discover: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredPostId, setHoveredPostId] = useState<number | null>(null);
  const [editModalPost, setEditModalPost] = useState<Post | null>(null);
  const [deleteModalPost, setDeleteModalPost] = useState<Post | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;


  if (!auth || !auth.user) return null;
  const { token, user } = auth;

  // Fetch all posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  // Edit & Delete handlers
  const handleUpdatePost = async (post: Post | null) => {
    if (!post) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: post.content }),
      });
      if (res.ok) {
        setEditModalPost(null);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (post: Post | null) => {
    if (!post) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setDeleteModalPost(null);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="text-gray-700 dark:text-gray-300">Loading posts...</p>;
  if (error) return <p className="text-red-500 dark:text-red-400">{error}</p>;
  if (posts.length === 0) return <p className="text-gray-700 dark:text-gray-300">No posts yet.</p>;

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

      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Discover</h2>

      {posts.map((post) => (
        <div
          key={post.id}
          onMouseEnter={() => setHoveredPostId(post.id)}
          onMouseLeave={() => setHoveredPostId(null)}
          className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow hover:shadow-lg transition-shadow relative"
        >
          {/* Profile Badge */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
              {post.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-gray-800 dark:text-gray-100 font-semibold">{post.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <p className="text-gray-800 dark:text-gray-100">{post.content}</p>
          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post"
              className="mt-2 rounded-lg max-h-60 w-full object-cover"
            />
          )}

          <div className="flex justify-end mt-2 text-sm text-gray-600 dark:text-gray-300">
            Likes: {post.like_count}
          </div>

          {post.is_edited && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Edited</span>
          )}

          {/* Edit/Delete icons only for user's own posts */}
          {hoveredPostId === post.id && post.username === user.username && (
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={() => setEditModalPost(post)}
                className="text-indigo-500 hover:text-indigo-700 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Edit Post"
              >
                <FiEdit size={18} />
              </button>
              <button
                onClick={() => setDeleteModalPost(post)}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Delete Post"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Edit Modal */}
      {editModalPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Edit Post</h3>
            <textarea
              className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:text-white"
              value={editModalPost.content}
              onChange={(e) =>
                setEditModalPost({ ...editModalPost, content: e.target.value })
              }
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditModalPost(null)}
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdatePost(editModalPost)}
                className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModalPost(null)}
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(deleteModalPost)}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discover;
