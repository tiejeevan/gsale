import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiEdit2, FiTrash2 } from "react-icons/fi";
import { getPostById, deletePost, type Post } from "../services/postService";
import { AuthContext } from "../context/AuthContext";
import PostCard from "../components/PostCard";

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext)!;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId || !token) {
        setError("Invalid post ID or not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const postData = await getPostById(parseInt(postId), token, user?.id);
        setPost(postData);
      } catch (err: any) {
        setError(err.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, token]);

  const handleEdit = (post: Post) => {
    // You can implement edit functionality here
    console.log("Edit post:", post);
  };

  const handleDelete = async (post: Post) => {
    if (!token || !window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost(token, post.id);
      navigate("/dashboard"); // Redirect to dashboard after deletion
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-xl text-gray-600 dark:text-gray-300">Loading post...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="text-xl text-red-600 dark:text-red-400">{error}</div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="text-xl text-gray-600 dark:text-gray-300">Post not found</div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-md"
          >
            <FiArrowLeft size={18} />
            Back
          </button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Post by {post.username}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Quick actions for post owner */}
          {user?.id === post.user_id && (
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(post)}
                className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                title="Edit post"
              >
                <FiEdit2 size={20} />
              </button>
              <button
                onClick={() => handleDelete(post)}
                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete post"
              >
                <FiTrash2 size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-8">
          <PostCard
            post={{
              ...post,
              like_count: post.like_count || 0,
              liked_by_user: post.liked_by_user || false,
            } as any}
            currentUserId={user?.id}
            token={token || ""}
            showUsername={true}
            showEditDeleteOnHover={false} // We have dedicated buttons above
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Additional Info Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Post Details
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Post ID:</span>
                <span className="font-mono text-gray-900 dark:text-white">#{post.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Author:</span>
                <Link 
                  to={`/profile/${post.user_id}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {post.username}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Likes:</span>
                <span className="text-gray-900 dark:text-white">{post.like_count}</span>
              </div>
              {post.is_edited && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="text-orange-600 dark:text-orange-400">Edited</span>
                </div>
              )}
              {post.attachments && post.attachments.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Attachments:</span>
                  <span className="text-gray-900 dark:text-white">{post.attachments.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;