import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

interface Post {
  id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  is_edited: boolean;
}

interface UserPostsProps {
  refreshSignal?: number;
}

const UserPosts: React.FC<UserPostsProps> = ({ refreshSignal }) => {
  const auth = useContext(AuthContext);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  // Ref flag to prevent multiple API calls in StrictMode
  const fetchPostsRef = useRef(false);

  if (!auth || !auth.user) return null;
  const { user, token } = auth;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/user/${user.id}`, {
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
    if (fetchPostsRef.current) return;
    fetchPostsRef.current = true;
    fetchPosts();
  }, [user.id, refreshSignal]);

  // Edit Post
  const handleEditPost = async () => {
    if (!currentPost) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${currentPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: editContent,
          image_url: editImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update post");
      } else {
        setShowEditModal(false);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating post");
    }
  };

  // Delete Post
  const handleDeletePost = async () => {
    if (!currentPost) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${currentPost.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete post");
      } else {
        setShowDeleteModal(false);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting post");
    }
  };

  if (loading) return <p className="text-gray-700 dark:text-gray-300">Loading posts...</p>;
  if (error) return <p className="text-red-500 dark:text-red-400">{error}</p>;
  if (posts.length === 0) return <p className="text-gray-700 dark:text-gray-300">No posts yet.</p>;

  return (
    <div className="space-y-4 mt-6">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow hover:shadow-lg transition-shadow relative group"
        >
          <p className="text-gray-800 dark:text-gray-100">{post.content}</p>
          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post"
              className="mt-2 rounded-lg max-h-60 w-full object-cover"
            />
          )}
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-300">
            <span>{new Date(post.created_at).toLocaleString()}</span>
            <span>Likes: {post.like_count}</span>
          </div>
          {post.is_edited && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Edited</span>
          )}

          {post.user_id === user.id && (
            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <FiEdit2
                className="text-indigo-500 cursor-pointer hover:text-indigo-700"
                size={20}
                onClick={() => {
                  setCurrentPost(post);
                  setEditContent(post.content);
                  setEditImage(post.image_url || "");
                  setShowEditModal(true);
                }}
              />
              <FiTrash2
                className="text-red-500 cursor-pointer hover:text-red-700"
                size={20}
                onClick={() => {
                  setCurrentPost(post);
                  setShowDeleteModal(true);
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Edit Modal */}
      {showEditModal && currentPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Edit Post</h3>
            <textarea
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-gray-100 mb-3"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <input
              type="text"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-gray-100 mb-3"
              placeholder="Image URL (optional)"
              value={editImage}
              onChange={(e) => setEditImage(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
                onClick={handleEditPost}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && currentPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete this post?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                onClick={handleDeletePost}
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

export default UserPosts;
