import React, { useEffect, useState, useMemo } from "react";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import EditPostModal from "./EditPostModal";
import DeletePostModal from "./DeletePostModal";
import PostCard from "../components/PostCard";
import { getAllPosts, updatePost, deletePost, type Post } from "../services/postService";
import {
  Box,
  Typography,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Whatshot as WhatshotIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
} from "@mui/icons-material";

const Discover: React.FC = () => {
  const { token, currentUser: user } = useUserContext();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModalPost, setEditModalPost] = useState<Post | null>(null);
  const [deleteModalPost, setDeleteModalPost] = useState<Post | null>(null);
  const [sortMode, setSortMode] = useState<"latest" | "top" | "hot">("latest");

  if (!user) return null;

  // ✅ Fetch all posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getAllPosts(token!);
      setPosts(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while fetching posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // ✅ Derived, dynamically sorted posts
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

  // ✅ Edit post handler
  const handleUpdatePost = async (updated: Post) => {
    try {
      await updatePost(token!, updated.id, { content: updated.content });
      setEditModalPost(null);
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Delete post handler
  const handleDeletePost = async (post: Post | null) => {
    if (!post || !token) return;
    try {
      await deletePost(token, post.id);
      setDeleteModalPost(null);
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ UI
  if (loading)
    return <p className="text-gray-700 dark:text-gray-300">Loading posts...</p>;
  if (error)
    return <p className="text-red-500 dark:text-red-400">{error}</p>;
  if (posts.length === 0)
    return <p className="text-gray-700 dark:text-gray-300">No posts yet.</p>;

  const theme = useTheme();

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortMode(event.target.value as "latest" | "top" | "hot");
  };

  return (
    <Box sx={{ maxWidth: 768, mx: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.main + '10',
              color: theme.palette.primary.dark,
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="button"
          sx={{
            ml: 1,
            color: theme.palette.primary.main,
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': {
              color: theme.palette.primary.dark,
            },
          }}
          onClick={() => navigate(-1)}
        >
          Back
        </Typography>
      </Box>

      {/* Header + Sort Filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
          }}
        >
          Discover
        </Typography>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={sortMode}
            onChange={handleSortChange}
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <MenuItem value="hot">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WhatshotIcon sx={{ fontSize: 18, color: '#ff6b35' }} />
                Hot
              </Box>
            </MenuItem>
            <MenuItem value="latest">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                Latest
              </Box>
            </MenuItem>
            <MenuItem value="top">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ fontSize: 18, color: '#ffd700' }} />
                Top
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Posts */}
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

      {/* Modals */}
      {editModalPost && (
        <EditPostModal
          isOpen={true}
          content={editModalPost.content}
          imageUrl={editModalPost.image_url || ""}
          onClose={() => setEditModalPost(null)}
          onSave={(updatedContent, updatedImage) =>
            handleUpdatePost({
              ...editModalPost,
              content: updatedContent,
              image_url: updatedImage,
            })
          }
          onChangeContent={(val) =>
            setEditModalPost({ ...editModalPost, content: val })
          }
          onChangeImage={(val) =>
            setEditModalPost({ ...editModalPost, image_url: val })
          }
        />
      )}

      {deleteModalPost && (
        <DeletePostModal
          isOpen={true}
          onClose={() => setDeleteModalPost(null)}
          onDelete={() => handleDeletePost(deleteModalPost)}
        />
      )}
    </Box>
  );
};

export default Discover;
