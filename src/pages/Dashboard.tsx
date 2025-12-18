import React, { useEffect, useState, useMemo } from "react";
import { useUserContext } from "../context/UserContext";
import CreatePost from "./CreatePost";
import PostCard from "../components/PostCard";
import { getAllPosts, type Post } from "../services/postService";
import { onPostCreated } from "../utils/eventBus";
import LeftSidebar from "../components/layout/LeftSidebar";
import RightSidebar from "../components/layout/RightSidebar";
import BottomNav from "../components/layout/BottomNav";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  useTheme,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
// Optimized individual icon imports (95% bundle size reduction)
import WhatshotIcon from "@mui/icons-material/Whatshot";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StarIcon from "@mui/icons-material/Star";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { Virtuoso } from "react-virtuoso";

import { useLocation } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { token, currentUser: user } = useUserContext();
  const theme = useTheme();
  const location = useLocation();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [sortMode, setSortMode] = useState<"latest" | "top" | "hot">("latest");
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Load more posts - called by Virtuoso when reaching end
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const data = await getAllPosts(token!, 20, offset);
      // Merge new posts, avoiding duplicates
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = data.posts.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
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

  // Listen for new posts - optimistically add to state
  useEffect(() => {
    const unsubscribe = onPostCreated((newPost) => {
      setPosts(prev => [newPost, ...prev]);
      // Scroll to top when new post is added to show it
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return unsubscribe;
  }, []);

  // Handle bookmark change without refetching
  const handleBookmarkChange = (postId: number, isBookmarked: boolean) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, bookmarked_by_user: isBookmarked }
          : post
      )
    );
  };

  // Filtered and sorted posts
  const sortedPosts = useMemo(() => {
    // Remove duplicates by post ID first
    const uniquePosts = Array.from(
      new Map(posts.map(post => [post.id, post])).values()
    );
    
    let filtered = [...uniquePosts];

    // Filter by search query (hashtags)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(post => {
        const content = post.content.toLowerCase();
        // Search in hashtags or general content
        if (query.startsWith('#')) {
          return content.includes(query);
        }
        return content.includes(query) || 
               post.title?.toLowerCase().includes(query) ||
               post.username?.toLowerCase().includes(query);
      });
    }

    // Sort based on mode
    switch (sortMode) {
      case "latest":
        return filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
      case "top":
        // Show only bookmarked posts
        return filtered
          .filter(post => (post as any).bookmarked_by_user === true)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
      case "hot":
      default:
        // Hot = most engagement (likes + comments)
        return filtered.sort((a, b) => {
          const scoreA = a.like_count * 1.5 + (a.comments?.length || 0) * 1.2;
          const scoreB = b.like_count * 1.5 + (b.comments?.length || 0) * 1.2;
          return scoreB - scoreA;
        });
    }
  }, [posts, sortMode, searchQuery]);

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortMode(event.target.value as "latest" | "top" | "hot");
    // Scroll to top when sort changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          bgcolor: 'background.default',
          justifyContent: 'center',
        }}
      >
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: { 
              xs: '100%',
              sm: '600px',
              md: '680px',
              lg: '600px',
              xl: '680px'
            },
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 2, sm: 3 },
            pb: { xs: 10, lg: 3 },
          }}
        >
          <div className="space-y-6">
            {/* Create Post */}
            <CreatePost sharedProduct={(location.state as any)?.shareProduct} />

            {/* Search Bar */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search posts by hashtags or keywords..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery("")}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 5,
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  },
                }}
              />
            </Box>

            {/* Feed Header with Sort */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
                px: { xs: 1, sm: 2 },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Feed
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
                      Watch List
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
              <Virtuoso
                useWindowScroll
                data={sortedPosts}
                endReached={() => {
                  if (hasMore && !loadingMore) {
                    loadMorePosts();
                  }
                }}
                overscan={200}
                increaseViewportBy={200}
                itemContent={(_index, post) => (
                  <Box sx={{ mb: 2 }}>
                    <PostCard
                      post={post as any}
                      token={token as string}
                      currentUserId={user.id}
                      showUsername={true}
                      showEditDeleteOnHover={false}
                      onBookmarkChange={() => handleBookmarkChange(post.id, !post.bookmarked_by_user)}
                    />
                  </Box>
                )}
                components={{
                  Footer: () => {
                    if (loadingMore) {
                      return (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                          <CircularProgress size={32} />
                        </Box>
                      );
                    }
                    
                    if (!hasMore && posts.length > 0) {
                      return (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            You've reached the end! 🎉
                          </Typography>
                        </Box>
                      );
                    }
                    
                    return null;
                  }
                }}
              />
            )}
          </div>
        </Box>

        {/* Right Sidebar */}
        <RightSidebar />
      </Box>

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </>
  );
};

export default Dashboard;
