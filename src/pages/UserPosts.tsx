import React, { useEffect, useState, useRef } from "react";
import { useUserContext } from "../context/UserContext";
import { getUserPosts } from "../services/postService";
import { onPostCreated } from "../utils/eventBus";
import PostCard, { type Post } from "../components/PostCard";

const UserPosts: React.FC = () => {
  const { currentUser: user, token } = useUserContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const R2_PUBLIC_URL = "https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev";
  const fetchPostsRef = useRef(false);

  if (!user) return null;

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
      
      // Sort posts: pinned posts first, then by creation date (newest first)
      const sortedPosts = transformedData.sort((a, b) => {
        // If one is pinned and the other isn't, pinned comes first
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        
        // If both have same pin status, sort by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setPosts(sortedPosts);
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
          token={token ?? ""}
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
