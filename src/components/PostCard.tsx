import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import LikeButton from "./LikeButton";
import CommentsSection, { type Comment } from "./Comments/CommentsSection";

interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  username?: string;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  is_edited: boolean;
  liked_by_user: boolean;
  attachments?: Attachment[];
  comments?: Comment[];
}

interface PostCardProps {
  post: Post;
  userId?: number;
  currentUserId?: number;
  token: string;
  showUsername?: boolean;
  showEditDeleteOnHover?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  r2PublicUrl?: string;
  collapseComments?: boolean;
}

const R2_PUBLIC_URL = "https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev";

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  token,
  showUsername = true,
  showEditDeleteOnHover = true,
  onEdit,
  onDelete,
  collapseComments = true,
}) => {
  const [hovered, setHovered] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split("/").pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  const canEdit = post.user_id === currentUserId;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <Card
      elevation={hovered ? 4 : 1}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        maxWidth: '100%',
        mb: 2,
        borderRadius: 2,
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
      }}
    >
      {/* Edit/Delete Actions */}
      {canEdit && (
        <Fade in={showEditDeleteOnHover ? hovered : true}>
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              display: 'flex',
              gap: 0.5,
            }}
          >
            {onEdit && (
              <IconButton
                size="small"
                onClick={() => onEdit(post)}
                sx={{
                  bgcolor: 'rgba(30, 41, 59, 0.8)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': { 
                    bgcolor: 'rgba(30, 41, 59, 0.9)',
                    color: '#667eea',
                  },
                  width: 28,
                  height: 28,
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                size="small"
                onClick={() => onDelete(post)}
                sx={{
                  bgcolor: 'rgba(30, 41, 59, 0.8)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': { 
                    bgcolor: 'rgba(30, 41, 59, 0.9)',
                    color: '#ef4444',
                  },
                  width: 28,
                  height: 28,
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Fade>
      )}

      <CardContent sx={{ p: 2, pb: 0 }}>
        {/* User Header */}
        {showUsername && post.username && (
          <Box sx={{ mb: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Link 
                to={`/profile/${post.user_id}`}
                style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    '&:hover': { opacity: 0.8 },
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    {post.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.95rem',
                      }}
                    >
                      {post.username}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                        }}
                      >
                        {formatDate(post.created_at)}
                      </Typography>
                      {post.is_edited && (
                        <Chip
                          label="Edited"
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 14,
                            fontSize: '0.6rem',
                            '& .MuiChip-label': { px: 0.5, py: 0 },
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Link>
              
              {/* Like Button on the right side */}
              <LikeButton
                targetType="post"
                targetId={post.id}
                initialLikesCount={post.like_count || 0}
                isInitiallyLiked={post.liked_by_user || false}
                token={token}
              />
            </Box>
          </Box>
        )}

        {/* Post Content */}
        <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography
            variant="body1"
            sx={{
              mb: 1.5,
              lineHeight: 1.5,
              whiteSpace: 'pre-line',
              cursor: 'pointer',
              '&:hover': { color: 'text.secondary' },
              transition: 'color 0.2s',
              fontSize: '0.95rem',
            }}
          >
            {post.content}
          </Typography>
        </Link>

        {/* Post Image */}
        {post.image_url && (
          <Box sx={{ mb: 1.5 }}>
            <img
              src={getPublicUrl(post.image_url)}
              alt="Post"
              style={{
                width: '100%',
                maxHeight: isMobile ? '200px' : '300px',
                objectFit: 'cover',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.01)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onClick={() => window.open(getPublicUrl(post.image_url!), '_blank')}
            />
          </Box>
        )}

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {post.attachments.map((att) => {
                const fileUrl = getPublicUrl(att.file_url);
                const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(att.file_name);
                
                return isImage ? (
                  <img
                    key={att.id}
                    src={fileUrl}
                    alt={att.file_name}
                    style={{
                      maxHeight: isMobile ? '100px' : '140px',
                      width: 'auto',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onClick={() => window.open(fileUrl, "_blank")}
                  />
                ) : (
                  <Chip
                    key={att.id}
                    label={att.file_name}
                    component="a"
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    size="small"
                    variant="outlined"
                    sx={{
                      maxWidth: isMobile ? '180px' : '250px',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}


      </CardContent>

      {/* Comments Section */}
      <Box sx={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', mt: 0.5 }}>
        <CommentsSection
          postId={post.id}
          currentUserId={currentUserId}
          initialComments={post.comments}
          collapseTopLevel={collapseComments}
          initialVisibleCount={2}
        />
      </Box>
    </Card>
  );
};

export default PostCard;