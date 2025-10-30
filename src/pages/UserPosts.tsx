import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
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
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  is_edited: boolean;
  attachments?: Attachment[];
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
  const R2_PUBLIC_URL = "https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev";

  // Prevent double-fetch in React StrictMode
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

  // ✅ Helper: extract only filename from file_url
  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split("/").pop(); // get last part
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  // Edit Post
  const handleEditPost = async (updatedContent?: string, updatedImage?: string) => {
    if (!currentPost) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${currentPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: updatedContent ?? editContent,
          image_url: updatedImage ?? editImage,
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

          {/* ✅ Display image if exists */}
          {post.image_url && (
            <img
              src={getPublicUrl(post.image_url)}
              alt="Post"
              className="mt-2 rounded-lg max-h-60 w-full object-cover"
            />
          )}

          {/* ✅ Display attachments with public URLs */}
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

          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-300">
            <span>{new Date(post.created_at).toLocaleString()}</span>
            <span>Likes: {post.like_count}</span>
          </div>
          {post.is_edited && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Edited</span>
          )}

          {/* Edit/Delete buttons */}
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

      {/* ---- Reusable Modals ---- */}
      <EditPostModal
        isOpen={showEditModal && currentPost !== null}
        content={editContent}
        imageUrl={editImage}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditPost}
        onChangeContent={setEditContent}
        onChangeImage={setEditImage}
      />

      <DeletePostModal
        isOpen={showDeleteModal && currentPost !== null}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeletePost}
      />
    </div>
  );
};

export default UserPosts;
