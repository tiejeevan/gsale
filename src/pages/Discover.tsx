import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiEdit2, FiTrash2 } from "react-icons/fi";
import EditPostModal from "./EditPostModal";
import DeletePostModal from "./DeletePostModal";

interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

interface Post {
  id: number;
  user_id: number;
  username: string;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  is_edited: boolean;
  attachments?: Attachment[];
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
  const R2_PUBLIC_URL = "https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev";

  if (!auth || !auth.user) return null;
  const { token, user } = auth;

  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split("/").pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

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

  const handleUpdatePost = async (post: Post) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: post.content, image_url: post.image_url }),
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
        <div
          key={post.id}
          onMouseEnter={() => setHoveredPostId(post.id)}
          onMouseLeave={() => setHoveredPostId(null)}
          className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow hover:shadow-lg transition-shadow relative group"
        >
          {/* Profile Badge */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
              {post.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-gray-800 dark:text-gray-100 font-semibold">
                {post.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <p className="text-gray-800 dark:text-gray-100">{post.content}</p>

          {/* Image */}
          {post.image_url && (
            <img
              src={getPublicUrl(post.image_url)}
              alt="Post"
              className="mt-2 rounded-lg max-h-60 w-full object-cover"
            />
          )}

          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {post.attachments.map((att) => {
                const fileUrl = getPublicUrl(att.file_url);
                const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(att.file_name);
                return (
                  <div key={att.id} className="relative">
                    {isImage ? (
                      <img
                        src={fileUrl}
                        alt={att.file_name}
                        className="rounded-lg max-h-60 w-auto object-cover border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => window.open(fileUrl, "_blank")}
                      />
                    ) : (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-indigo-200 dark:bg-indigo-600 text-indigo-800 dark:text-white rounded hover:bg-indigo-300 dark:hover:bg-indigo-500 transition-colors inline-block"
                      >
                        {att.file_name}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end mt-2 text-sm text-gray-600 dark:text-gray-300">
            Likes: {post.like_count}
          </div>

          {post.is_edited && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Edited</span>
          )}

          {/* Edit/Delete icons */}
          {hoveredPostId === post.id && post.user_id === user.id && (
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={() => setEditModalPost(post)}
                className="text-indigo-500 hover:text-indigo-700 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Edit Post"
              >
                <FiEdit2 size={18} />
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
        <EditPostModal
          isOpen={true}
          content={editModalPost.content}
          imageUrl={editModalPost.image_url || ""}
          onClose={() => setEditModalPost(null)}
          onSave={(updatedContent, updatedImage) => {
            if (!editModalPost) return;
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
