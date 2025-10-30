// src/hooks/usePosts.ts
import { useEffect, useState } from "react";
import { getUserPosts, getAllPosts } from "../services/postService";
import type { Post } from "../services/postService";

export const usePosts = (
  token: string,
  type: "user" | "all",
  userId?: number,
  refreshKey?: number
) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data =
          type === "user" && userId
            ? await getUserPosts(userId, token)
            : await getAllPosts(token);
        setPosts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [type, userId, token, refreshKey]);

  return { posts, loading, error, refetch: () => setPosts([...posts]) };
};
