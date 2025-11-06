import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { getUserPosts } from "../services/postService";
import { onPostCreated } from "../utils/eventBus";
import PostCard, { type Post } from "../components/PostCard";

const UserPosts: React.FC = () => {
  const auth = useContext(AuthContext);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  

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
      // Transform data to ensure compatibility with PostCard interface
      const transformedData = data.map(post => ({
        ...post,
        like_count: post.like_count || 0,
        liked_by_user: post.liked_by_user || false,
      })) as Post[];
      setPosts(transformedData);
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

  useEffect(() => {
    const unsubscribe = onPostCreated(() => fetchPosts());
    return unsubscribe;
  }, []);

  

  if (loading) return <p className="text-gray-700 dark:text-gray-300">Loading posts...</p>;
  if (error) return <p className="text-red-500 dark:text-red-400">{error}</p>;
  if (posts.length === 0) return <p className="text-gray-700 dark:text-gray-300">No posts yet.</p>;

  return (
    <div className="space-y-4 mt-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          token={token ?? ""} // ✅ Fix type issue: token is string | null
          userId={user.id}
          showUsername={true}
          r2PublicUrl={R2_PUBLIC_URL}
          currentUserId={user.id}
          showEditDeleteOnHover={false}
        />
      ))}

      
    </div>
  );
};

export default UserPosts;
