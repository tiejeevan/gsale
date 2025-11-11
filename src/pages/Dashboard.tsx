import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useUserContext } from "../context/UserContext";
import CreatePost from "./CreatePost";
import PostCard from "../components/PostCard";
import { getAllPosts, type Post } from "../services/postService";
import { onPostCreated } from "../utils/eventBus";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  useTheme,
  CircularProgress,
  Alert,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  Whatshot as WhatshotIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
} from "@mui/icons-material";

const Dashboard: React.FC = () => {
  const { token, currentUser: user } = useUserContext();
  const theme = useTheme();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [sortMode, setSortMode] = useState<"latest" | "top" | "hot">("latest");
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  if (!user) return null;

  // Fetch initial posts
  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    setOffset(0);
    try {
      const data = await getAllPosts(token!, 20, 0);
      setPosts(data.posts);
      setHasMore(data.hasMore);
      setOffset(20);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  // Load more posts
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const data = await getAllPosts(token!, 20, offset);
      setPosts(prev => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setOffset(prev => prev + 20);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Listen for new posts
  useEffect(() => {
    const unsubscribe = onPostCreated(() => fetchPosts());
    return unsubscribe;
  }, []);

  // Sorted posts based on selected mode
  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    switch (sortMode) {
      case "latest":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
      case "top":
        return sorted.sort((a, b) => b.like_count - a.like_count);
      case "hot":
      default:
        return sorted.sort((a, b) => {
          const scoreA = a.like_count * 1.5 + (a.comments?.length || 0) * 1.2;
          const scoreB = b.like_count * 1.5 + (b.comments?.length || 0) * 1.2;
          return scoreB - scoreA;
        });
    }
  }, [posts, sortMode]);

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortMode(event.target.value as "latest" | "top" | "hot");
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Create Post */}
          <CreatePost />

          {/* Feed Header with Sort */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              px: 2,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              Explore...
            </Typography>

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <Select
                value={sortMode}
                onChange={handleSortChange}
                sx={{
                  height: 36,
                  borderRadius: 3,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  bgcolor: 'action.hover',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider',
                  },
                  '&:hover': {
                    bgcolor: 'action.selected',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                  '&.Mui-focused': {
                    bgcolor: 'action.selected',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiSelect-select': {
                    py: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
              >
                <MenuItem 
                  value="latest"
                  sx={{
                    fontSize: '0.875rem',
                    py: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 16 }} />
                    Latest
                  </Box>
                </MenuItem>
                <MenuItem 
                  value="hot"
                  sx={{
                    fontSize: '0.875rem',
                    py: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <WhatshotIcon sx={{ fontSize: 16, color: "#ff6b35" }} />
                    Hot
                  </Box>
                </MenuItem>
                <MenuItem 
                  value="top"
                  sx={{
                    fontSize: '0.875rem',
                    py: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StarIcon sx={{ fontSize: 16, color: "#ffd700" }} />
                    Top
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Posts Feed */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : sortedPosts.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                bgcolor: "background.paper",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No posts yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Be the first to share something!
              </Typography>
            </Box>
          ) : (
            <div className="space-y-4">
              {sortedPosts.map((post, index) => {
                if (sortedPosts.length === index + 1) {
                  return (
                    <div ref={lastPostRef} key={post.id}>
                      <PostCard
                        post={post as any}
                        token={token as string}
                        currentUserId={user.id}
                        showUsername={true}
                        showEditDeleteOnHover={false}
                      />
                    </div>
                  );
                } else {
                  return (
                    <PostCard
                      key={post.id}
                      post={post as any}
                      token={token as string}
                      currentUserId={user.id}
                      showUsername={true}
                      showEditDeleteOnHover={false}
                    />
                  );
                }
              })}
              
              {loadingMore && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              )}
              
              {!hasMore && posts.length > 0 && (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    You've reached the end! 🎉
                  </Typography>
                </Box>
              )}
            </div>
          )}
        </div>
      </main>
    </Box>
  );
};

export default Dashboard;
