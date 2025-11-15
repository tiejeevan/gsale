import React, { useState, useEffect } from "react";
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
import { ArrowBack, Edit, Delete, Person, Schedule, ThumbUp, Image, Public, Group, Lock, PushPin, PushPinOutlined } from "@mui/icons-material";
import { Menu, MenuItem, Tooltip } from "@mui/material";
import { getPostById, deletePost, updatePost, pinPost, unpinPost, type Post } from "../services/postService";
import { useUserContext } from "../context/UserContext";
import PostCard from "../components/PostCard";
import EditPostModal from "./EditPostModal";
import { socket, joinPostRoom } from "../socket";
import BottomNav from "../components/layout/BottomNav";

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { token, currentUser: user } = useUserContext();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [visibilityAnchorEl, setVisibilityAnchorEl] = useState<null | HTMLElement>(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  
  // Check if we should show comments initially (ONLY from notification)
  const navigationState = (window.history.state as any)?.usr;
  const showCommentsInitially = Boolean(navigationState?.showComments);
  const highlightCommentId = navigationState?.highlightCommentId;

  // Clear navigation state after component mounts to prevent persistence on reload
  useEffect(() => {
    if (navigationState?.showComments || navigationState?.highlightCommentId) {
      // Clear the state after a delay (after highlight animation completes)
      const timer = setTimeout(() => {
        window.history.replaceState(
          { ...window.history.state, usr: undefined },
          ''
        );
      }, 3500); // Clear after highlight animation (3s) + buffer

      return () => clearTimeout(timer);
    }
  }, []);

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
        
        // Join post room for real-time updates
        if (socket.connected) {
          joinPostRoom(parseInt(postId));
        } else {
          socket.connect();
          socket.once("connect", () => {
            joinPostRoom(parseInt(postId));
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    // Cleanup: leave post room when component unmounts
    return () => {
      if (postId && socket.connected) {
        socket.emit("leave", `post_${postId}`);
      }
    };
  }, [postId, token]);

  const handleEdit = (post: Post) => {
    console.log("Edit button clicked! Post:", post);
    setEditContent(post.content);
    setEditImageUrl(post.image_url || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (newContent: string) => {
    if (!post || !token) return;
    
    try {
      const updatedPost = await updatePost(token, post.id, { content: newContent });
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

  const openVisibilityMenu = (e: React.MouseEvent<HTMLElement>) => setVisibilityAnchorEl(e.currentTarget);
  const closeVisibilityMenu = () => setVisibilityAnchorEl(null);
  const currentVisibility = (post?.visibility as "public" | "private" | "follows") || "public";
  const renderVisibilityIcon = () => {
    if (currentVisibility === "private") return <Lock fontSize="small" />;
    if (currentVisibility === "follows") return <Group fontSize="small" />;
    return <Public fontSize="small" />;
  };
  const changeVisibility = async (vis: "public" | "private" | "follows") => {
    if (!post || !token) return;
    try {
      const updated = await updatePost(token, post.id, { visibility: vis });
      setPost(updated);
    } catch (e) {
      console.error(e);
    } finally {
      closeVisibilityMenu();
    }
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

  const handleToggleComments = async () => {
    if (!post || !token) return;
    
    try {
      await updatePost(token, post.id, { 
        comments_enabled: post.comments_enabled === false ? true : false 
      });
      // Refetch the post to get updated data including comments
      const refreshedPost = await getPostById(parseInt(postId!), token, user?.id);
      setPost(refreshedPost);
    } catch (error) {
      console.error("Failed to toggle comments:", error);
    }
  };

  const handleTogglePin = async () => {
    if (!post || !token) return;
    
    try {
      if (post.is_pinned) {
        await unpinPost(token, post.id);
      } else {
        await pinPost(token, post.id);
      }
      // Refresh post data
      const updatedPost = await getPostById(parseInt(postId!), token, user?.id);
      setPost(updatedPost);
    } catch (error) {
      console.error("Failed to toggle pin:", error);
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
            bgcolor: 'background.paper',
            backdropFilter: 'blur(10px)',
            border: 1,
            borderColor: 'divider',
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
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
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
            bgcolor: 'background.paper',
            backdropFilter: 'blur(10px)',
            border: 1,
            borderColor: 'divider',
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
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
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
    <Container maxWidth="md" sx={{ py: 4, pb: { xs: 10, lg: 4 } }}>
      {/* Header Card */}
      <Card
        sx={{
          mb: 0,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(10px)',
          border: 1,
          borderColor: 'divider',
          borderRadius: '16px 16px 0 0',
          borderBottom: 'none',
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
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
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

            {/* Quick actions for post owner - Expandable Menu */}
            {user?.id === post.user_id && (
              <Box sx={{ display: 'flex', gap: 1, position: 'relative' }}>
                {/* Expanded Action Buttons */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    opacity: menuExpanded ? 1 : 0,
                    transform: menuExpanded ? 'translateX(0)' : 'translateX(20px)',
                    transition: 'all 0.3s ease',
                    pointerEvents: menuExpanded ? 'auto' : 'none',
                  }}
                >
                  <Tooltip title={currentVisibility === 'public' ? 'Public' : currentVisibility === 'follows' ? 'Follows' : 'Private'} arrow>
                    <IconButton
                      onClick={openVisibilityMenu}
                      sx={{
                        bgcolor: 'action.hover',
                        color: 'text.secondary',
                        '&:hover': { 
                          bgcolor: 'action.selected',
                          color: 'info.main',
                        },
                      }}
                    >
                      {renderVisibilityIcon()}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={post.comments_enabled !== false ? "Disable comments" : "Enable comments"} arrow>
                    <IconButton
                      onClick={handleToggleComments}
                      sx={{
                        bgcolor: 'action.hover',
                        color: post.comments_enabled !== false ? 'success.main' : 'text.disabled',
                        '&:hover': { 
                          bgcolor: 'action.selected',
                          color: post.comments_enabled !== false ? 'success.dark' : 'text.secondary',
                        },
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={post.is_pinned ? "Unpin post" : "Pin post"} arrow>
                    <IconButton
                      onClick={handleTogglePin}
                      sx={{
                        bgcolor: 'action.hover',
                        color: post.is_pinned ? 'warning.main' : 'text.secondary',
                        '&:hover': { 
                          bgcolor: 'action.selected',
                          color: 'warning.main',
                        },
                      }}
                    >
                      {post.is_pinned ? <PushPin /> : <PushPinOutlined />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Edit post" arrow>
                    <IconButton
                      onClick={() => handleEdit(post)}
                      sx={{
                        bgcolor: 'action.hover',
                        color: 'text.secondary',
                        '&:hover': { 
                          bgcolor: 'action.selected',
                          color: 'primary.main',
                        },
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete post" arrow>
                    <IconButton
                      onClick={() => handleDelete(post)}
                      sx={{
                        bgcolor: 'action.hover',
                        color: 'text.secondary',
                        '&:hover': { 
                          bgcolor: 'action.selected',
                          color: 'error.main',
                        },
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Menu Toggle Button */}
                <Tooltip title={menuExpanded ? "Close menu" : "More options"} arrow>
                  <IconButton
                    onClick={() => setMenuExpanded(!menuExpanded)}
                    sx={{
                      bgcolor: 'action.hover',
                      color: 'text.secondary',
                      '&:hover': { 
                        bgcolor: 'action.selected',
                        color: 'text.primary',
                      },
                      transform: menuExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={visibilityAnchorEl}
                  open={Boolean(visibilityAnchorEl)}
                  onClose={closeVisibilityMenu}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem onClick={() => changeVisibility('public')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Public fontSize="small" />
                      <Typography variant="body2">Public</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={() => changeVisibility('follows')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group fontSize="small" />
                      <Typography variant="body2">Follows</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={() => changeVisibility('private')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Lock fontSize="small" />
                      <Typography variant="body2">Private</Typography>
                    </Box>
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>

          {/* Author Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={post.profile_image}
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
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
                    '&:hover': { color: 'primary.main' },
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
        <Box
          sx={{
            '& > div': {
              borderRadius: '0 0 16px 16px !important',
              borderTop: 'none !important',
              mt: 0,
            }
          }}
        >
          <PostCard
            post={{
              ...post,
              like_count: post.like_count || 0,
              liked_by_user: post.liked_by_user || false,
              comments_enabled: post.comments_enabled,
            } as any}
            currentUserId={user?.id}
            token={token || ""}
            showUsername={false} // We show it in the header card
            showEditDeleteOnHover={false} // We have dedicated buttons in header
            onEdit={undefined} // Disable PostCard edit button
            onDelete={undefined} // Disable PostCard delete button
            collapseComments={false}
            showCommentsInitially={showCommentsInitially}
            highlightCommentId={highlightCommentId}
          />
        </Box>
      </Box>

      {/* Post Details Card */}
      <Card
        sx={{
          bgcolor: 'background.paper',
          backdropFilter: 'blur(10px)',
          border: 1,
          borderColor: 'divider',
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
                      '&:hover': { bgcolor: 'action.hover' },
                      color: 'primary.main',
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
      
      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </Container>
  );
};

export default PostDetail;