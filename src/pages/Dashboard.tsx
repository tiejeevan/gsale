import React, { useEffect, useState, useMemo } from "react";
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
  const [error, setError] = useState("");
  const [sortMode, setSortMode] = useState<"latest" | "top" | "hot">("latest");

  if (!user) return null;

  // Fetch all posts
  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllPosts(token!);
      setPosts(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch posts");
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
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
                  bgcolor: 'rgba(99, 102, 241, 0.08)',
                  border: 'none',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '&:hover': {
                    bgcolor: 'rgba(99, 102, 241, 0.12)',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(99, 102, 241, 0.12)',
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
                    '&:hover': {
                      bgcolor: 'rgba(99, 102, 241, 0.08)',
                    },
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
                    '&:hover': {
                      bgcolor: 'rgba(99, 102, 241, 0.08)',
                    },
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
                    '&:hover': {
                      bgcolor: 'rgba(99, 102, 241, 0.08)',
                    },
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
              {sortedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post as any}
                  token={token as string}
                  currentUserId={user.id}
                  showUsername={true}
                  showEditDeleteOnHover={false}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
