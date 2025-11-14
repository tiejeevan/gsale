import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatContext } from '../../context/ChatContext';
import { useUserContext } from '../../context/UserContext';
import FloatingChatPopup from './FloatingChatPopup';
import { Box, Paper, Typography, Avatar, Badge, IconButton, Button } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Chat as ChatIcon } from '@mui/icons-material';
 
const MessagesTab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const { chats, totalUnreadCount } = useChatContext();
  const { currentUser } = useUserContext();
  const messagesTabRef = useRef<HTMLDivElement>(null);
 
  // Close expanded tab when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && messagesTabRef.current && !messagesTabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
 
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
 
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);
 
  const handleChatClick = (chatId: number) => {
    setSelectedChatId(chatId);
    setIsExpanded(false);
    // Add hash to URL for back button support on mobile
    navigate(location.pathname + location.search + '#chat', { replace: false });
  };
 
  const handleClosePopup = () => {
    setSelectedChatId(null);
    // Remove hash from URL
    if (location.hash === '#chat') {
      navigate(-1);
    }
  };
 
  // Close popup when hash changes (back button pressed)
  useEffect(() => {
    console.log('[MessagesTab] Hash changed:', location.hash, 'selectedChatId:', selectedChatId);
    if (location.hash !== '#chat' && selectedChatId !== null) {
      console.log('[MessagesTab] Closing chat due to hash change');
      setSelectedChatId(null);
    }
  }, [location.hash, selectedChatId]);

  // Listen for custom event to open specific chat
  useEffect(() => {
    const handleOpenChat = (event: any) => {
      console.log('[MessagesTab] Received openChat event:', event.detail);
      const { chatId } = event.detail;
      if (chatId) {
        console.log('[MessagesTab] Setting selected chat ID:', chatId);
        setSelectedChatId(chatId);
        setIsExpanded(false);
      }
    };

    console.log('[MessagesTab] Adding openChat event listener');
    window.addEventListener('openChat', handleOpenChat);
    return () => {
      console.log('[MessagesTab] Removing openChat event listener');
      window.removeEventListener('openChat', handleOpenChat);
    };
  }, []);
 
  const formatLastMessage = (chat: any) => {
    if (!chat.last_message_content) return 'No messages yet';
    const preview = chat.last_message_content.substring(0, 40);
    return preview.length < chat.last_message_content.length ? `${preview}...` : preview;
  };
 
  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
 
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };
 
  const selectedChat = chats.find(c => c.id === selectedChatId);
 
  return (
    <>
      {/* Messages Tab */}
      <Box ref={messagesTabRef} sx={{ position: 'fixed', bottom: { xs: 56, lg: 0 }, right: 24, zIndex: 40 }}>
        {/* Expanded Chat List */}
        {isExpanded && (
          <Paper
            elevation={8}
            sx={{
              borderRadius: '12px 12px 0 0',
              width: { xs: 224, sm: 320 },
              mb: 0,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                px: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 2 },
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '1rem' } }}>
                Messages
              </Typography>
              <IconButton
                onClick={() => setIsExpanded(false)}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <ExpandMoreIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
              </IconButton>
            </Box>
 
            {/* Chat List */}
            <Box sx={{ maxHeight: { xs: 320, sm: 384 }, overflowY: 'auto' }}>
              {chats.length === 0 ? (
                <Box sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center', color: 'text.secondary' }}>
                  <ChatIcon sx={{ fontSize: { xs: 32, sm: 48 }, mx: 'auto', mb: { xs: 1, sm: 1.5 }, opacity: 0.3 }} />
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Start chat with a user by going to their profile page and clicking on message icon
                  </Typography>
                </Box>
              ) : (
                chats.map(chat => {
                  const isGroup = chat.type === 'group';
                  
                  // For direct chats, get the other participant's name
                  let chatTitle = chat.title || 'User';
                  let avatarUrl = chat.avatar_url;
                  
                  if (!isGroup) {
                    if (chat.participants && chat.participants.length > 0) {
                      // Find the other participant (not the current user)
                      const otherParticipant = chat.participants.find(p => p.id !== currentUser?.id);
                      if (otherParticipant) {
                        chatTitle = otherParticipant.username;
                        avatarUrl = otherParticipant.avatar_url;
                      }
                    } else if (chat.last_message_sender && chat.last_message_sender !== currentUser?.username) {
                      // Fallback: use last message sender as the chat title
                      chatTitle = chat.last_message_sender;
                    }
                  }
                  
                  return (
                    <Button
                      key={chat.id}
                      onClick={() => handleChatClick(chat.id)}
                      fullWidth
                      sx={{
                        p: { xs: 1, sm: 1.5 },
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        borderBottom: 1,
                        borderColor: 'divider',
                        borderRadius: 0,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        '&:active': {
                          bgcolor: 'action.selected',
                          transform: 'scale(0.98)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, width: '100%' }}>
                        {/* Avatar */}
                        <Avatar
                          src={avatarUrl || `https://ui-avatars.com/api/?name=${chatTitle}&size=48`}
                          alt={chatTitle}
                          sx={{
                            width: { xs: 36, sm: 48 },
                            height: { xs: 36, sm: 48 },
                            bgcolor: 'primary.light',
                          }}
                        >
                          {!avatarUrl && chatTitle.charAt(0).toUpperCase()}
                        </Avatar>
 
                        {/* Right Side - Name and Message */}
                        <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          {/* User Name */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                color: 'text.primary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {chatTitle}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, ml: 1, flexShrink: 0 }}>
                              {chat.last_message_at && (
                                <Typography variant="caption" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, color: 'text.secondary' }}>
                                  {formatTime(chat.last_message_at)}
                                </Typography>
                              )}
                              {chat.unread_count > 0 && (
                                <Badge
                                  badgeContent={chat.unread_count}
                                  color="primary"
                                  max={99}
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                      height: { xs: 16, sm: 18 },
                                      minWidth: { xs: 16, sm: 18 },
                                    },
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                          {/* Last Message */}
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: '0.6875rem', sm: '0.8125rem' },
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {chat.last_message_sender && chat.last_message_sender !== currentUser?.username && (
                              <Typography component="span" sx={{ fontWeight: 500 }}>
                                {chat.last_message_sender}:{' '}
                              </Typography>
                            )}
                            {formatLastMessage(chat)}
                          </Typography>
                        </Box>
                      </Box>
                    </Button>
                  );
                })
                .filter(Boolean) // Remove null entries
              )}
            </Box>
          </Paper>
        )}
 
        {/* Collapsed Tab */}
        {!isExpanded && (
          <Button
            onClick={() => setIsExpanded(true)}
            variant="contained"
            sx={{
              px: { xs: 1.5, sm: 3 },
              py: { xs: 1, sm: 1.5 },
              borderRadius: '12px 12px 0 0',
              boxShadow: 3,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.75, sm: 1 },
              position: 'relative',
              textTransform: 'none',
            }}
          >
            <ChatIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '1rem' } }}>
              Messages
            </Typography>
            {totalUnreadCount > 0 && (
              <Badge
                badgeContent={totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                color="error"
                sx={{
                  position: 'absolute',
                  top: { xs: -6, sm: -8 },
                  right: { xs: -6, sm: -8 },
                  '& .MuiBadge-badge': {
                    fontSize: { xs: '0.625rem', sm: '0.75rem' },
                    fontWeight: 700,
                    minWidth: { xs: 18, sm: 20 },
                    height: { xs: 18, sm: 20 },
                  },
                }}
              />
            )}
          </Button>
        )}
      </Box>
 
      {/* Floating Chat Popup */}
      {selectedChat && (() => {
        const otherParticipant = selectedChat.participants?.find(p => p.id !== currentUser?.id);
        const isGroup = selectedChat.type === 'group';
        
        // Don't render if we don't have a valid user ID for direct chats
        if (!isGroup && (!otherParticipant || !otherParticipant.id)) {
          return null;
        }
        
        return (
          <FloatingChatPopup
            userId={otherParticipant?.id || 0}
            username={isGroup ? (selectedChat.title || 'Group Chat') : (otherParticipant?.username || 'User')}
            avatarUrl={isGroup ? selectedChat.avatar_url : otherParticipant?.avatar_url}
            onClose={handleClosePopup}
          />
        );
      })()}
    </>
  );
};
 
export default MessagesTab;