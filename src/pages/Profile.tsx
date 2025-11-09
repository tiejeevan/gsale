import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Avatar,
  Typography,
  Button,
  IconButton,
  TextField,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Link as MuiLink,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Edit as EditIcon,
  Settings as SettingsIcon,
  LocationOn,
  Link as LinkIcon,
  CalendarToday,
  Email,
  Phone,
  Save,
  Close,
  Add,
  CheckCircle,
  Info as InfoIcon,
  Feed as FeedIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useUserContext } from "../context/UserContext";
import { userService, type User } from "../services/userService";
import { getUserPosts } from "../services/postService";
import EditProfileModal from "../components/EditProfileModal.tsx";
import DeactivateAccountModal from "../components/DeactivateAccountModal.tsx";
import PostCard, { type Post } from "../components/PostCard";
import FloatingChatPopup from "../components/chat/FloatingChatPopup";
import FollowButton from "../components/FollowButton";
import FollowersModal from "../components/FollowersModal";

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser, isAuthenticated, updateUser, isLoading: userLoading, token } = useUserContext();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');
  
  // Tab state
  const [activeTab, setActiveTab] = useState(1);
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  
  // Inline editing state
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});

  // Check if viewing own profile
  const isOwnProfile = !userId || (!!currentUser && userId === currentUser.id.toString());
  
  const R2_PUBLIC_URL = "https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev";
  
  // Add debugging
  console.log('Profile render:', { userId, currentUser: !!currentUser, isOwnProfile, loading, error });

  // Fetch posts function
  const fetchPosts = async (targetUserId: number) => {
    if (!token) return;
    
    setPostsLoading(true);
    setPostsError(null);
    
    try {
      const data = await getUserPosts(targetUserId, token);
      const transformedData = data.map(post => ({
        ...post,
        like_count: post.like_count || 0,
        liked_by_user: post.liked_by_user || false,
      })) as Post[];
      
      // Sort posts: pinned posts first, then by creation date (newest first)
      const sortedPosts = transformedData.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setPosts(sortedPosts);
    } catch (err: any) {
      console.error('Failed to fetch posts:', err);
      setPostsError(err.message || "Failed to fetch posts");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      // Reset state immediately when userId changes
      setProfileUser(null);
      setLoading(true);
      setError(null);
      setEditingFields({});
      setEditValues({});
      setSavingFields({});
      setPosts([]);
      setActiveTab(1);
      
      try {
        if (isOwnProfile && currentUser) {
          setProfileUser(currentUser);
        } else if (userId) {
          // Pass userId directly - backend handles both ID and username
          const user = await userService.getPublicProfile(userId);
          setProfileUser(user);
        } else {
          setError("Profile not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
        setProfileUser(null); // Ensure profileUser is null on error
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have the necessary data and user context is not loading
    if (!userLoading) {
      if (isOwnProfile ? currentUser : userId) {
        fetchProfile();
      } else if (!isOwnProfile && !userId) {
        setError("Profile not found");
        setLoading(false);
      } else if (isOwnProfile && !currentUser) {
        setError("Please log in to view your profile");
        setLoading(false);
      }
    }
  }, [userId, currentUser, isOwnProfile, userLoading]);

  // Fetch posts when Feed tab is selected
  useEffect(() => {
    if (activeTab === 1 && profileUser && posts.length === 0 && !postsLoading) {
      fetchPosts(profileUser.id);
    }
  }, [activeTab, profileUser]);

  const handleProfileUpdate = (updatedUser: User) => setProfileUser(updatedUser);

  // Inline editing functions
  const startEditing = (field: string, currentValue: string = '') => {
    setEditingFields(prev => ({ ...prev, [field]: true }));
    setEditValues(prev => ({ ...prev, [field]: currentValue }));
  };

  const cancelEditing = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: false }));
    setEditValues(prev => {
      const newValues = { ...prev };
      delete newValues[field];
      return newValues;
    });
  };

  const saveField = async (field: string) => {
    if (!profileUser || !editValues[field]?.trim()) return;
    
    setSavingFields(prev => ({ ...prev, [field]: true }));
    
    try {
      let updateData: any = {};
      
      // Handle social links separately
      if (field.startsWith('social_')) {
        const platform = field.replace('social_', '');
        updateData = {
          social_links: {
            ...profileUser.social_links,
            [platform]: editValues[field].trim()
          }
        };
      } else {
        updateData[field] = editValues[field].trim();
      }
      
      await updateUser(updateData);
      
      // Update local state
      const updatedUser = { ...profileUser, ...updateData };
      setProfileUser(updatedUser);
      
      // Clear editing state
      cancelEditing(field);
    } catch (error) {
      console.error('Failed to update field:', error);
    } finally {
      setSavingFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const isFieldEmpty = (value: any) => {
    return !value || (typeof value === 'string' && value.trim() === '');
  };

  // Inline edit component
  const InlineEditField: React.FC<{
    field: string;
    value: string;
    placeholder: string;
    icon: React.ReactNode;
    type?: 'text' | 'url' | 'email' | 'tel';
  }> = ({ field, value, placeholder, icon, type = 'text' }) => {
    const isEditing = editingFields[field];
    const isSaving = savingFields[field];
    const isEmpty = isFieldEmpty(value);

    if (!isOwnProfile && isEmpty) return null;

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          py: 1.5,
          '&:hover .edit-button': {
            opacity: 1,
          },
        }}
      >
        <Box sx={{ mt: 0.5, color: 'primary.main' }}>{icon}</Box>
        {isEditing ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TextField
              type={type}
              value={editValues[field] || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={placeholder}
              size="small"
              fullWidth
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default',
                  '& fieldset': {
                    borderColor: 'divider',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              <IconButton
                onClick={() => saveField(field)}
                disabled={isSaving || !editValues[field]?.trim()}
                size="small"
                sx={{ color: 'success.main' }}
              >
                <Save fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => cancelEditing(field)}
                disabled={isSaving}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {isEmpty ? (
              isOwnProfile && (
                <Button
                  onClick={() => startEditing(field)}
                  startIcon={<Add />}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    color: 'text.secondary',
                    borderColor: 'divider',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'rgba(102, 126, 234, 0.08)',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  Add {placeholder.toLowerCase()}
                </Button>
              )
            ) : (
              <>
                {type === 'url' ? (
                  <MuiLink
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {value}
                  </MuiLink>
                ) : (
                  <Typography variant="body2" color="text.primary">
                    {value}
                  </Typography>
                )}
                {isOwnProfile && (
                  <IconButton
                    onClick={() => startEditing(field, value)}
                    size="small"
                    className="edit-button"
                    sx={{
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Dedicated Bio/About components
  const BioField: React.FC = () => {
    const isEditing = editingFields['bio'];
    const isSaving = savingFields['bio'];
    const isEmpty = isFieldEmpty(profileUser?.bio);

    if (isEditing) {
      return (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Bio
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              value={editValues['bio'] || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell people about yourself..."
              fullWidth
              multiline
              rows={3}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default',
                  '& fieldset': {
                    borderColor: 'divider',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Stack spacing={0.5}>
              <IconButton
                onClick={() => saveField('bio')}
                disabled={isSaving || !editValues['bio']?.trim()}
                sx={{ color: 'success.main' }}
              >
                <Save />
              </IconButton>
              <IconButton
                onClick={() => cancelEditing('bio')}
                disabled={isSaving}
                sx={{ color: 'text.secondary' }}
              >
                <Close />
              </IconButton>
            </Stack>
          </Box>
        </Box>
      );
    }

    if (isEmpty && isOwnProfile) {
      return (
        <Box sx={{ mb: 4 }}>
          <Button
            onClick={() => startEditing('bio')}
            fullWidth
            variant="outlined"
            startIcon={<Add />}
            sx={{
              py: 2,
              borderStyle: 'dashed',
              textTransform: 'none',
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                borderStyle: 'dashed',
                bgcolor: 'rgba(102, 126, 234, 0.08)',
              },
            }}
          >
            Add a bio
          </Button>
        </Box>
      );
    }

    if (!isEmpty) {
      return (
        <Box
          sx={{
            mb: 4,
            '&:hover .edit-button': {
              opacity: 1,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bio
            </Typography>
            {isOwnProfile && (
              <IconButton
                onClick={() => startEditing('bio', profileUser?.bio || '')}
                size="small"
                className="edit-button"
                sx={{
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
            {profileUser?.bio}
          </Typography>
        </Box>
      );
    }

    return null;
  };

  const AboutField: React.FC = () => {
    const isEditing = editingFields['about'];
    const isSaving = savingFields['about'];
    const isEmpty = isFieldEmpty(profileUser?.about);

    if (isEditing) {
      return (
        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            About
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              value={editValues['about'] || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, about: e.target.value }))}
              placeholder="Write a longer description about yourself, your interests, experience, etc..."
              fullWidth
              multiline
              rows={5}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default',
                  '& fieldset': {
                    borderColor: 'divider',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Stack spacing={0.5}>
              <IconButton
                onClick={() => saveField('about')}
                disabled={isSaving || !editValues['about']?.trim()}
                sx={{ color: 'success.main' }}
              >
                <Save />
              </IconButton>
              <IconButton
                onClick={() => cancelEditing('about')}
                disabled={isSaving}
                sx={{ color: 'text.secondary' }}
              >
                <Close />
              </IconButton>
            </Stack>
          </Box>
        </Box>
      );
    }

    if (isEmpty && isOwnProfile) {
      return (
        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            About
          </Typography>
          <Button
            onClick={() => startEditing('about')}
            fullWidth
            variant="outlined"
            startIcon={<Add />}
            sx={{
              py: 3,
              borderStyle: 'dashed',
              textTransform: 'none',
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                borderStyle: 'dashed',
                bgcolor: 'rgba(102, 126, 234, 0.08)',
              },
            }}
          >
            Add about section
          </Button>
        </Box>
      );
    }

    if (!isEmpty) {
      return (
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            pt: 4,
            '&:hover .edit-button': {
              opacity: 1,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              About
            </Typography>
            {isOwnProfile && (
              <IconButton
                onClick={() => startEditing('about', profileUser?.about || '')}
                size="small"
                className="edit-button"
                sx={{
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.8,
              color: 'text.secondary',
              whiteSpace: 'pre-line',
            }}
          >
            {profileUser?.about}
          </Typography>
        </Box>
      );
    }

    return null;
  };

  if (loading || userLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Alert severity="error" sx={{ fontSize: '1.1rem' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!profileUser) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Profile not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      key={userId || 'own-profile'} // Force re-mount when userId changes
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 4,
      }}
    >
      <Container maxWidth="md" sx={{ pt: 4 }}>
        {/* Cover Image */}
        <Paper
          elevation={0}
          sx={(theme) => ({
            position: 'relative',
            height: 256,
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
            background: profileUser.cover_image
              ? `url(${profileUser.cover_image}) center/cover`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          })}
        >
          {profileUser.cover_image && (
            <Box
              component="img"
              src={profileUser.cover_image}
              alt="Cover"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
          
          {/* Action Buttons */}
          {isOwnProfile && isAuthenticated && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                gap: 1,
              }}
            >
              <IconButton
                onClick={() => setShowEditModal(true)}
                sx={{
                  bgcolor: 'background.paper',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'background.default',
                    color: 'primary.dark',
                  },
                }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={() => setShowDeactivateModal(true)}
                sx={{
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'error.dark',
                  },
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Box>
          )}
        </Paper>

        {/* Profile Card */}
        <Paper
          elevation={8}
          sx={{
            borderRadius: '0 0 16px 16px',
            mt: -8,
            position: 'relative',
            zIndex: 1,
            p: 4,
            bgcolor: 'background.paper',
          }}
        >
          {/* Profile Image & Basic Info */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-end' },
              gap: 3,
              mb: 4,
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={profileUser.profile_image || `https://ui-avatars.com/api/?name=${profileUser.display_name || profileUser.username}&size=128&background=6366f1&color=ffffff`}
                alt={profileUser.display_name || profileUser.username}
                sx={{
                  width: 128,
                  height: 128,
                  border: 4,
                  borderColor: 'background.paper',
                  boxShadow: 3,
                }}
              />
              {profileUser.is_verified && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: '50%',
                    p: 0.5,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 20 }} />
                </Box>
              )}
            </Box>

            <Box sx={{ textAlign: { xs: 'center', md: 'left' }, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {profileUser.display_name || profileUser.username}
                </Typography>
                {!isOwnProfile && (
                  <IconButton
                    onClick={() => setShowChatPopup(true)}
                    size="small"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    }}
                    title="Send message"
                  >
                    <ChatIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                @{profileUser.username}
              </Typography>
              
              {/* Follower/Following Stats */}
              <Box sx={{ display: 'flex', gap: 3, mb: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Box
                  onClick={() => {
                    setFollowersModalTab('followers');
                    setShowFollowersModal(true);
                  }}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.7 },
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Typography variant="body2" component="span">
                    <Typography component="span" fontWeight={600} color="text.primary">
                      {profileUser.follower_count || 0}
                    </Typography>
                    {' '}
                    <Typography component="span" color="text.secondary">
                      Followers
                    </Typography>
                  </Typography>
                </Box>
                <Box
                  onClick={() => {
                    setFollowersModalTab('following');
                    setShowFollowersModal(true);
                  }}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.7 },
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Typography variant="body2" component="span">
                    <Typography component="span" fontWeight={600} color="text.primary">
                      {profileUser.following_count || 0}
                    </Typography>
                    {' '}
                    <Typography component="span" color="text.secondary">
                      Following
                    </Typography>
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: 'wrap' }}>
                {profileUser.role && (
                  <Chip
                    label={profileUser.role}
                    size="small"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    }}
                  />
                )}
                {!isOwnProfile && (
                  <FollowButton
                    userId={profileUser.id}
                    onFollowChange={(isFollowing) => {
                      // Update local follower count
                      setProfileUser(prev => prev ? {
                        ...prev,
                        follower_count: (prev.follower_count || 0) + (isFollowing ? 1 : -1)
                      } : null);
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Bio Section */}
          <BioField />

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  minHeight: 48,
                },
              }}
            >
              <Tab icon={<InfoIcon />} iconPosition="start" label="About" />
              <Tab icon={<FeedIcon />} iconPosition="start" label="Feed" />
            </Tabs>
          </Box>

          {/* About Tab Content - Inside Paper */}
          {activeTab === 0 && (
            <Box>
              {/* Contact Info */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 4,
                  mb: 4,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Contact Information
                  </Typography>
                  
                  <InlineEditField
                    field="email"
                    value={profileUser.email || ''}
                    placeholder="Email"
                    icon={<Email sx={{ fontSize: 20 }} />}
                    type="email"
                  />
                  
                  <InlineEditField
                    field="phone"
                    value={profileUser.phone || ''}
                    placeholder="Phone"
                    icon={<Phone sx={{ fontSize: 20 }} />}
                    type="tel"
                  />
                  
                  <InlineEditField
                    field="location"
                    value={profileUser.location || ''}
                    placeholder="Location"
                    icon={<LocationOn sx={{ fontSize: 20 }} />}
                  />
                  
                  <InlineEditField
                    field="website"
                    value={profileUser.website || ''}
                    placeholder="Website"
                    icon={<LinkIcon sx={{ fontSize: 20 }} />}
                    type="url"
                  />
                  
                  {profileUser.created_at && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                      <CalendarToday sx={{ fontSize: 20, color: 'primary.main' }} />
                      <Typography variant="body2" color="text.secondary">
                        Joined {new Date(profileUser.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Social Links */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Social Links
                  </Typography>
                  
                  <InlineEditField
                    field="social_facebook"
                    value={profileUser.social_links?.facebook || ''}
                    placeholder="Facebook URL"
                    icon={<FaFacebook size={20} style={{ color: '#1877F2' }} />}
                    type="url"
                  />
                  
                  <InlineEditField
                    field="social_twitter"
                    value={profileUser.social_links?.twitter || ''}
                    placeholder="Twitter URL"
                    icon={<FaTwitter size={20} style={{ color: '#1DA1F2' }} />}
                    type="url"
                  />
                  
                  <InlineEditField
                    field="social_instagram"
                    value={profileUser.social_links?.instagram || ''}
                    placeholder="Instagram URL"
                    icon={<FaInstagram size={20} style={{ color: '#E4405F' }} />}
                    type="url"
                  />
                  
                  <InlineEditField
                    field="social_linkedin"
                    value={profileUser.social_links?.linkedin || ''}
                    placeholder="LinkedIn URL"
                    icon={<FaLinkedin size={20} style={{ color: '#0077B5' }} />}
                    type="url"
                  />
                </Box>
              </Box>

              {/* About Section */}
              <AboutField />
            </Box>
          )}
        </Paper>

        {/* Feed Tab Content - Outside Paper with normal styling */}
        {activeTab === 1 && (
          <Box sx={{ mt: 3 }}>
            {postsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : postsError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {postsError}
              </Alert>
            ) : posts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No posts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isOwnProfile ? "Start sharing your thoughts!" : "This user hasn't posted anything yet."}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    token={token ?? ""}
                    userId={currentUser?.id ?? 0}
                    showUsername={false}
                    r2PublicUrl={R2_PUBLIC_URL}
                    currentUserId={currentUser?.id ?? 0}
                    showEditDeleteOnHover={isOwnProfile}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* Modals */}
      {showEditModal && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {showDeactivateModal && (
        <DeactivateAccountModal
          onClose={() => setShowDeactivateModal(false)}
        />
      )}

      {/* Floating Chat Popup */}
      {showChatPopup && !isOwnProfile && profileUser && (
        <FloatingChatPopup
          userId={typeof profileUser.id === 'string' ? parseInt(profileUser.id) : profileUser.id}
          username={profileUser.display_name || profileUser.username}
          avatarUrl={profileUser.profile_image}
          onClose={() => setShowChatPopup(false)}
        />
      )}

      {/* Followers/Following Modal */}
      {showFollowersModal && profileUser && (
        <FollowersModal
          userId={profileUser.id}
          username={profileUser.display_name || profileUser.username}
          initialTab={followersModalTab}
          onClose={() => setShowFollowersModal(false)}
        />
      )}
    </Box>
  );
};

export default Profile;
