import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Container,
} from "@mui/material";
import { ArrowBack, Edit, Delete, Person, Schedule, ThumbUp, Image } from "@mui/icons-material";
import { getPostById, deletePost, updatePost, type Post } from "../services/postService";
import { AuthContext } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import EditPostModal from "./EditPostModal";

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext)!;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

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
    console.log("Edit button clicked! Post:", post);
    setEditContent(post.content);
    setEditImageUrl(post.image_url || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (newContent: string, newImageUrl: string) => {
    if (!post || !token) return;
    
    try {
      const updatedPost = await updatePost(token, post.id, newContent, newImageUrl || undefined);
      setPost(updatedPost);
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to update post:", error);
    }
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditContent("");
    setEditImageUrl("");
  };

  const handleChangeContent = (value: string) => {
    setEditContent(value);
  };

  const handleChangeImage = (value: string) => {
    setEditImageUrl(value);
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card
          sx={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: 2,
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="h6" color="text.secondary">
              Loading post...
            </Typography>
          </Box>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card
          sx={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: 2,
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  },
                }}
              >
                Go Back
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card
          sx={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: 2,
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Typography variant="h6" color="text.secondary">
                Post not found
              </Typography>
              <Button
                variant="contained"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  },
                }}
              >
                Go Back
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header Card */}
      <Card
        sx={{
          mb: 3,
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Back Button Row */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{
                borderColor: 'rgba(148, 163, 184, 0.3)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'rgba(148, 163, 184, 0.5)',
                  backgroundColor: 'rgba(148, 163, 184, 0.1)',
                },
              }}
            >
              Back
            </Button>
          </Box>

          {/* Post Title and Actions Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" fontWeight={600} color="text.primary">
              Post by {post.username}
            </Typography>

            {/* Quick actions for post owner */}
            {user?.id === post.user_id && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={() => {
                    console.log("Edit button clicked!");
                    handleEdit(post);
                  }}
                  sx={{
                    bgcolor: 'rgba(30, 41, 59, 0.8)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { 
                      bgcolor: 'rgba(30, 41, 59, 0.9)',
                      color: '#667eea',
                    },
                  }}
                  title="Edit post"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  onClick={() => {
                    console.log("Delete button clicked!");
                    handleDelete(post);
                  }}
                  sx={{
                    bgcolor: 'rgba(30, 41, 59, 0.8)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { 
                      bgcolor: 'rgba(30, 41, 59, 0.9)',
                      color: '#ef4444',
                    },
                  }}
                  title="Delete post"
                >
                  <Delete />
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Author Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '1.2rem',
                fontWeight: 600,
              }}
            >
              {post.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Link 
                to={`/profile/${post.user_id}`}
                style={{ textDecoration: 'none' }}
              >
                <Typography 
                  variant="subtitle1" 
                  fontWeight={600}
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': { color: '#667eea' },
                    transition: 'color 0.2s',
                  }}
                >
                  {post.username}
                </Typography>
              </Link>
              <Typography variant="caption" color="text.secondary">
                {new Date(post.created_at).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Post Content Card */}
      <Box sx={{ mb: 3 }}>
        <PostCard
          post={{
            ...post,
            like_count: post.like_count || 0,
            liked_by_user: post.liked_by_user || false,
          } as any}
          currentUserId={user?.id}
          token={token || ""}
          showUsername={false} // We show it in the header card
          showEditDeleteOnHover={false} // We have dedicated buttons in header
          onEdit={undefined} // Disable PostCard edit button
          onDelete={undefined} // Disable PostCard delete button
        />
      </Box>

      {/* Post Details Card */}
      <Card
        sx={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 3 }}>
            Post Details
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3 
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Post ID:
                </Typography>
                <Chip 
                  label={`#${post.id}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontFamily: 'monospace' }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Author:
                </Typography>
                <Link 
                  to={`/profile/${post.user_id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Chip 
                    icon={<Person />}
                    label={post.username}
                    size="small"
                    clickable
                    sx={{ 
                      '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
                      color: '#667eea',
                    }}
                  />
                </Link>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Created:
                </Typography>
                <Chip 
                  icon={<Schedule />}
                  label={new Date(post.created_at).toLocaleString()}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Likes:
                </Typography>
                <Chip 
                  icon={<ThumbUp />}
                  label={post.like_count}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              
              {post.is_edited && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip 
                    label="Edited"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              )}
              
              {post.attachments && post.attachments.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Attachments:
                  </Typography>
                  <Chip 
                    icon={<Image />}
                    label={post.attachments.length}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditPostModal
        isOpen={showEditModal}
        content={editContent}
        imageUrl={editImageUrl}
        onSave={handleSaveEdit}
        onClose={handleCloseEdit}
        onChangeContent={handleChangeContent}
        onChangeImage={handleChangeImage}
      />
    </Container>
  );
};

export default PostDetail;