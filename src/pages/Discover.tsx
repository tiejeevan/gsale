import React, { useEffect, useState, useContext } from "react";
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
  attachments?: Attachment[];
}

const Discover: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to fetch posts");
      else setPosts(data.reverse()); // latest first
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

  // Handle edit
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

  // Handle delete
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

  if (loading)
    return <p className="text-gray-700 dark:text-gray-300">Loading posts...</p>;
  if (error)
    return <p className="text-red-500 dark:text-red-400">{error}</p>;
  if (posts.length === 0)
    return <p className="text-gray-700 dark:text-gray-300">No posts yet.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-indigo-500 hover:text-indigo-700 font-semibold mb-4"
      >
        <FiArrowLeft size={20} />
        <span>Back</span>
      </button>

      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Discover
      </h2>

      {posts.map((post) => (
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

      {/* Edit Modal */}
      {editModalPost && (
        <EditPostModal
          isOpen={true}
          content={editModalPost.content}
          imageUrl={editModalPost.image_url || ""}
          onClose={() => setEditModalPost(null)}
          onSave={(updatedContent, updatedImage) => {
            handleUpdatePost({
              ...editModalPost,
              content: updatedContent,
              image_url: updatedImage,
            });
          }}
          onChangeContent={(val) =>
            setEditModalPost({ ...editModalPost, content: val })
          }
          onChangeImage={(val) =>
            setEditModalPost({ ...editModalPost, image_url: val })
          }
        />
      )}

      {/* Delete Modal */}
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
