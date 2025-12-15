import React, { useState, useRef, useEffect } from "react";
import { IconButton, Menu, MenuItem, Tooltip, Paper, Avatar, Typography, Box } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import GroupIcon from "@mui/icons-material/Group";
import { useUserContext } from "../context/UserContext";
import { Image as FiImage, HourglassEmpty as FiLoader, Send as FiSend, Close as FiX } from "@mui/icons-material";
import { triggerPostCreated } from "../utils/eventBus";
import { createPost as createPostService } from "../services/postService";
import { searchUsersForMentions } from "../services/userService";

interface CreatePostProps {
  sharedProduct?: {
    id: string;
    title: string;
    price: number;
    image: string;
    url: string;
  };
}

const CreatePost: React.FC<CreatePostProps> = ({ sharedProduct }) => {
  const { token, currentUser: user } = useUserContext();

  if (!user) return null;

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "follows">("public");
  const [visibilityAnchorEl, setVisibilityAnchorEl] = useState<null | HTMLElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [productPreview, setProductPreview] = useState(sharedProduct || null);
  
  // Mentions state
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand and pre-fill when product is shared
  useEffect(() => {
    if (sharedProduct) {
      setIsExpanded(true);
      setContent('Check out this product! 🛍️');
      setProductPreview(sharedProduct);
    }
  }, [sharedProduct]);

  const openVisibilityMenu = (e: React.MouseEvent<HTMLElement>) => setVisibilityAnchorEl(e.currentTarget);
  const closeVisibilityMenu = () => setVisibilityAnchorEl(null);
  const selectVisibility = (value: "public" | "private" | "follows") => {
    setVisibility(value);
    closeVisibilityMenu();
  };

  const renderVisibilityIcon = (size: "small" | "medium" = "small") => {
    if (visibility === "private") return <LockIcon fontSize={size} />;
    if (visibility === "follows") return <GroupIcon fontSize={size} />;
    return <PublicIcon fontSize={size} />;
  };
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  };

  // Extract mentions from content
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  };

  const createPost = async () => {
    if (!content.trim() && files.length === 0 && !productPreview) {
      setMessage("Write something or attach files to post.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Extract mentions from content
      const mentions = extractMentions(content);
      
      const postData = {
        content,
        title: title || undefined,
        visibility,
        files,
        comments_enabled: commentsEnabled,
        mentions: mentions.length > 0 ? mentions : undefined,
        shared_product_id: productPreview?.id || undefined,
      };
      
      const newPost = await createPostService(token!, postData);

      setMessage("✅ Post created successfully!");
      setContent("");
      setTitle("");
      setFiles([]);
      setProductPreview(null);
      setShowAdvanced(false);
      setCommentsEnabled(true);
      setIsExpanded(false);
      triggerPostCreated(newPost);
      
      setTimeout(() => {
        setMessage("");
      }, 6000);
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "⚠️ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle mentions search
  useEffect(() => {
    const searchMentions = async () => {
      if (mentionSearch && token) {
        try {
          const results = await searchUsersForMentions(mentionSearch, token);
          setMentionResults(results);
        } catch (err) {
          console.error('Failed to search mentions:', err);
          setMentionResults([]);
        }
      } else {
        setMentionResults([]);
      }
    };

    const debounce = setTimeout(searchMentions, 200);
    return () => clearTimeout(debounce);
  }, [mentionSearch, token]);

  // Handle content change with mention detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newContent.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 20) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        setSelectedMentionIndex(0);
        
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const rect = textarea.getBoundingClientRect();
          setMentionPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
          });
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Insert mention into content
  const insertMention = (username: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const newContent = 
        content.slice(0, lastAtSymbol) + 
        `@${username} ` + 
        textAfterCursor;
      
      setContent(newContent);
      setShowMentions(false);
      setMentionSearch("");
      
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastAtSymbol + username.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev < mentionResults.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev > 0 ? prev - 1 : mentionResults.length - 1
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionResults[selectedMentionIndex].username);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && (content.trim() || files.length > 0)) {
        createPost();
      }
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: { xs: 2, sm: 3 },
        bgcolor: 'background.paper',
      }}
    >
      {!isExpanded && (
        <Box
          onClick={() => setIsExpanded(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, sm: 2 },
            cursor: 'pointer',
            p: { xs: 0.5, sm: 1 },
          }}
        >
          <Avatar
            src={user.profile_image || ""}
            alt={user.first_name}
            sx={{ width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 } }}
          />
          <Box
            sx={{
              flex: 1,
              p: { xs: 1.25, sm: 1.5 },
              borderRadius: 5,
              bgcolor: 'action.hover',
              color: 'text.secondary',
              fontSize: { xs: '0.875rem', sm: '0.95rem' },
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            What's on your mind, {user.first_name}?
          </Box>
        </Box>
      )}

      {isExpanded && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Create Post
            </Typography>
            <IconButton size="small" onClick={() => setIsExpanded(false)}>
              <FiX />
            </IconButton>
          </Box>

          {message && (
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                color: message.startsWith("✅") ? "success.main" :
                       message.startsWith("❌") ? "error.main" : "warning.main"
              }}
            >
              {message}
            </Typography>
          )}

          {showAdvanced && (
            <Box sx={{ mb: 2 }}>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: 'var(--mui-palette-divider)',
                  backgroundColor: 'var(--mui-palette-background-default)',
                  color: 'var(--mui-palette-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
                placeholder="Post title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Box>
          )}

          <Box sx={{ position: 'relative', mb: 3 }}>
            <textarea
              ref={textareaRef}
              style={{
                width: '100%',
                padding: '12px 40px 12px 12px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'var(--mui-palette-divider)',
                backgroundColor: 'var(--mui-palette-background-default)',
                color: 'var(--mui-palette-text-primary)',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                minHeight: '100px',
                fontFamily: 'inherit',
              }}
              placeholder="What's on your mind? Type @ to mention someone"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
            />

            <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
              <Tooltip title={showAdvanced ? "Show less options" : "Show more options"} arrow>
                <IconButton 
                  size="small" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  sx={{ 
                    bgcolor: showAdvanced ? 'primary.main' : 'action.hover',
                    color: showAdvanced ? 'white' : 'text.secondary',
                    '&:hover': {
                      bgcolor: showAdvanced ? 'primary.dark' : 'action.selected',
                    }
                  }}
                >
                  {showAdvanced ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  )}
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
              <Tooltip title={visibility === "public" ? "Public" : visibility === "follows" ? "Follows" : "Private"} arrow>
                <IconButton 
                  size="small" 
                  onClick={openVisibilityMenu}
                  sx={{ 
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                  {renderVisibilityIcon("small")}
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={visibilityAnchorEl}
                open={Boolean(visibilityAnchorEl)}
                onClose={closeVisibilityMenu}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <MenuItem onClick={() => selectVisibility("public")}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PublicIcon fontSize="small" />
                    <Typography variant="body2">Public</Typography>
                  </Box>
                </MenuItem>
                <MenuItem onClick={() => selectVisibility("follows")}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" />
                    <Typography variant="body2">Follows</Typography>
                  </Box>
                </MenuItem>
                <MenuItem onClick={() => selectVisibility("private")}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockIcon fontSize="small" />
                    <Typography variant="body2">Private</Typography>
                  </Box>
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <label>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: { xs: 0.5, sm: 1 },
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.75, sm: 1 },
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: 2,
                    cursor: 'pointer',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <FiImage sx={{ fontSize: 16 }} /> 
                  <span style={{ display: 'inline' }}>Add Photo/Video</span>
                </Box>
                <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showAdvanced && (
                <Tooltip title={commentsEnabled ? "Comments enabled" : "Comments disabled"} arrow>
                  <IconButton
                    size="small"
                    onClick={() => setCommentsEnabled(!commentsEnabled)}
                    sx={{
                      bgcolor: commentsEnabled ? 'success.main' : 'action.disabled',
                      color: 'white',
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: commentsEnabled ? 'success.dark' : 'action.disabledBackground',
                      },
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </IconButton>
                </Tooltip>
              )}

              <Box
                component="button"
                onClick={createPost}
                disabled={loading}
                sx={{
                  bgcolor: loading ? 'action.disabledBackground' : 'primary.main',
                  color: 'white',
                  border: 'none',
                  borderRadius: 2,
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 0.75, sm: 1 },
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.5, sm: 1 },
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : 2,
                  '&:hover': {
                    bgcolor: loading ? 'action.disabledBackground' : 'primary.dark',
                    transform: loading ? 'none' : 'scale(1.02)',
                  },
                }}
              >
                {loading ? <><FiLoader sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} /> Posting...</> : <><FiSend /> Post</>}
              </Box>
            </Box>
          </Box>

          {productPreview && (
            <Paper
              elevation={2}
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                border: 1,
                borderColor: 'primary.main',
                bgcolor: 'background.default',
                position: 'relative',
              }}
            >
              <IconButton
                size="small"
                onClick={() => setProductPreview(null)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <FiX />
              </IconButton>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                  component="img"
                  src={productPreview.image}
                  alt={productPreview.title}
                  sx={{
                    width: 100,
                    height: 100,
                    objectFit: 'cover',
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {productPreview.title}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 0.5 }}>
                    ${Number(productPreview.price).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    🛍️ Product Link
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {files.length > 0 && (
            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              {files.map((file, idx) => {
                const url = URL.createObjectURL(file);
                if (file.type.startsWith("image/")) {
                  return (
                    <Box
                      key={idx}
                      component="img"
                      src={url}
                      alt={file.name}
                      sx={{
                        borderRadius: 2,
                        objectFit: 'cover',
                        height: 128,
                        width: '100%',
                        border: 1,
                        borderColor: 'divider',
                      }}
                    />
                  );
                } else {
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        color: 'text.primary',
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                      }}
                    >
                      📄 {file.name}
                    </Box>
                  );
                }
              })}
            </Box>
          )}

          {showMentions && mentionResults.length > 0 && (
            <Paper
              elevation={8}
              sx={{
                position: 'fixed',
                top: mentionPosition.top,
                left: mentionPosition.left,
                maxWidth: 300,
                maxHeight: 200,
                overflow: 'auto',
                zIndex: 1000,
                borderRadius: 2,
              }}
            >
              {mentionResults.map((user, index) => (
                <Box
                  key={user.id}
                  onClick={() => insertMention(user.username)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    cursor: 'pointer',
                    bgcolor: index === selectedMentionIndex ? 'action.hover' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Avatar
                    src={user.profile_image || `https://ui-avatars.com/api/?name=${user.display_name || user.username}&size=32`}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {user.display_name || user.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      @{user.username}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </>
      )}
    </Paper>
  );
};

export default CreatePost;
