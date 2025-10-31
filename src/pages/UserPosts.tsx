import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import EditPostModal from "./EditPostModal";
import DeletePostModal from "./DeletePostModal";
import { getUserPosts, updatePost, deletePost } from "../services/postService";
import { onPostCreated } from "../utils/eventBus";
import LikeButton from '../components/LikeButton';


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
  liked_by_user: boolean;
  attachments?: Attachment[];
}

const UserPosts: React.FC = () => {
  const auth = useContext(AuthContext);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState("");

  const R2_PUBLIC_URL = "https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev";
  const fetchPostsRef = useRef(false);

  if (!auth || !auth.user) return null;
  const { user, token } = auth;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      if (!token) {
        setError("Authentication token missing. Please sign in again.");
        return;
      }
      const data = await getUserPosts(user.id, token);
      setPosts(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fetchPostsRef.current) {
      fetchPostsRef.current = true;
      fetchPosts();
    }
  }, [user.id]);

  // Listen for new post events
  useEffect(() => {
    const unsubscribe = onPostCreated(() => fetchPosts());
    return unsubscribe;
  }, []);

  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split("/").pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  const handleEditPost = async (updatedContent?: string, updatedImage?: string) => {
    if (!currentPost || !token) return;
    try {
      const updatedPost = await updatePost(
        token,
        currentPost.id,
        updatedContent ?? editContent,
        updatedImage ?? editImage
      );
      if (updatedPost) {
        setShowEditModal(false);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating post");
    }
  };

  const handleDeletePost = async () => {
    if (!currentPost || !token) return;
    try {
      const success = await deletePost(token, currentPost.id);
      if (success) {
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

          {/* Main image */}
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

          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-300">
            <span>{new Date(post.created_at).toLocaleString()}</span>
            <LikeButton
              targetType="post" // The type of content being liked
              targetId={post.id}
              initialLikesCount={post.like_count}
              isInitiallyLiked={post.liked_by_user}
              token={token as string}
            />
          </div>
          {post.is_edited && <span className="text-xs text-gray-500 dark:text-gray-400">Edited</span>}

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

      {/* Modals */}
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
