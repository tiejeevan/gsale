import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Box, IconButton, Typography, Avatar, Paper, useTheme, useMediaQuery, CircularProgress } from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  EmojiEmotions as EmojiIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { useUserContext } from '../../context/UserContext';
import { useChatContext } from '../../context/ChatContext';
import { useChat } from '../../hooks/useChat';
import { getChatMessages, sendMessage, markMessagesAsRead } from '../../services/chatService';
import type { Message } from '../../types/chat';

interface FloatingChatPopupProps {
  userId: number;
  username: string;
  avatarUrl?: string;
  prefillMessage?: string;
  onClose: () => void;
}

// Message Bubble Component - Memoized and outside main component to prevent re-creation
interface MessageBubbleProps {
  message: Message;
  currentUserId?: number;
  onReply: (message: Message) => void;
  formatTime: (timestamp: string) => string;
  repliedMessage?: Message | null;
}

const MessageBubble = memo(({ message, currentUserId, onReply, formatTime, repliedMessage }: MessageBubbleProps) => {
  const isOwn = message.sender_id === currentUserId;
  const x = useSpring(0, { stiffness: 300, damping: 30 });
  const swipeDistanceRef = useRef(0);
  
  const bind = useDrag(
    ({ down, movement: [mx], direction: [xDir], last }) => {
      // Swipe to reply - reduced threshold for better UX
      const threshold = 20;
      const swipeDirection = isOwn ? -1 : 1;
      
      // Store the movement distance while dragging
      if (!last && down) {
        swipeDistanceRef.current = mx;
      }
      
      if (last) {
        // Check stored distance instead of current mx (which is 0 on release)
        const finalDistance = swipeDistanceRef.current;
        
        if (Math.abs(finalDistance) > threshold && xDir === swipeDirection) {
          onReply(message);
        }
        x.set(0);
        swipeDistanceRef.current = 0; // Reset for next swipe
      } else {
        x.set(down ? mx : 0);
      }
    },
    {
      axis: 'x',
      bounds: { left: isOwn ? -100 : 0, right: isOwn ? 0 : 100 },
      rubberband: true,
      filterTaps: true,
    }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      style={{ x: x as any, touchAction: 'none' }}
      {...(bind() as any)}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          alignItems: 'flex-end',
          mb: 0.5,
          position: 'relative',
          gap: 0.5,
        }}
      >
        {/* Avatar for other user (left side) */}
        {!isOwn && (
          <Avatar
            src={message.sender_profile_image || undefined}
            sx={{ 
              width: 28, 
              height: 28,
              flexShrink: 0,
            }}
          >
            {message.username?.[0]?.toUpperCase()}
          </Avatar>
        )}
        
        <Box
          sx={{
            maxWidth: { xs: '70%', sm: '75%' },
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            bgcolor: isOwn ? 'primary.main' : 'background.paper',
            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
            ...(isOwn
              ? { borderTopRightRadius: '2px' }
              : { borderTopLeftRadius: '2px' }),
            position: 'relative',
            cursor: 'grab',
            '&:active': {
              cursor: 'grabbing',
            },
          }}
        >
          {message.reply_to && repliedMessage && (
            <Box
              sx={{
                mb: 0.5,
                p: 0.5,
                borderLeft: 3,
                borderColor: isOwn ? 'rgba(255,255,255,0.5)' : 'primary.main',
                bgcolor: isOwn ? 'rgba(255,255,255,0.1)' : 'action.hover',
                borderRadius: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 600 }}>
                {repliedMessage.username}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.7, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {repliedMessage.content}
              </Typography>
            </Box>
          )}
          
          <Typography 
            variant="body2" 
            sx={{ 
              wordBreak: 'break-word',
              color: isOwn ? 'white' : 'text.primary',
              fontSize: '0.9375rem',
              lineHeight: 1.4,
              mb: 0.25,
            }}
          >
            {message.content}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5, 
            justifyContent: 'flex-end',
          }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6875rem',
                color: isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              }}
            >
              {formatTime(message.created_at)}
            </Typography>
            {isOwn && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {message.read_by && message.read_by.some(r => r.user_id !== currentUserId) ? (
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                    <path d="M1 5L4 8L8 4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 5L8 8L15 1" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                    <path d="M1 5L5 9L15 1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Avatar for own messages (right side) */}
        {isOwn && (
          <Avatar
            src={message.sender_profile_image || undefined}
            sx={{ 
              width: 28, 
              height: 28,
              flexShrink: 0,
            }}
          >
            {message.username?.[0]?.toUpperCase()}
          </Avatar>
        )}
      </Box>
    </motion.div>
  );
});

const FloatingChatPopup = ({ userId, username, avatarUrl, prefillMessage, onClose }: FloatingChatPopupProps) => {
  
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { token, currentUser } = useUserContext();
  const { chats, messages: contextMessages, setMessages, addMessage, updateChatInList } = useChatContext();
  const { startDirectChat } = useChat();
  
  const [chatId, setChatId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState(prefillMessage || '');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialLocationRef = useRef(location.pathname + location.search);
  
  // Spring animation for pull to refresh (disabled when typing)
  const pullY = useSpring(0, { stiffness: 300, damping: 30 });
  
  // Get only this chat's messages from context - memoized to prevent re-sorting on every render
  // Only depends on the specific chat's messages, not the entire contextMessages object
  const chatMessages = chatId ? contextMessages[chatId] : undefined;
  
  const messages = useMemo(() => {
    if (!chatId || !chatMessages) return [];
    return [...chatMessages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [chatId, chatMessages]);

  // Initialize chat
  useEffect(() => {
    const initChat = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        // Find existing chat or create new one
        const isSelfChat = userId === currentUser?.id;
        const existingChat = chats.find(chat => {
          if (chat.type !== 'direct') return false;
          
          if (isSelfChat) {
            // For self-chat, find chat where user is the only participant
            return chat.participants?.length === 1 && chat.participants[0].id === userId;
          } else {
            // For regular chat, find chat with exactly these two users
            return chat.participants?.length === 2 &&
                   chat.participants.some(p => p.id === userId) &&
                   chat.participants.some(p => p.id === currentUser?.id);
          }
        });

        let activeChatId: number;
        
        if (existingChat) {
          activeChatId = existingChat.id;
        } else {
          const newChatId = await startDirectChat(userId);
          if (!newChatId) {
            throw new Error('Failed to create chat');
          }
          activeChatId = newChatId;
        }

        setChatId(activeChatId);

        // Load messages from API
        const fetchedMessages = await getChatMessages(token, activeChatId);
        
        // Sort messages by timestamp (oldest first) to ensure proper chronological order
        const sortedMessages = [...fetchedMessages].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Merge with existing context messages (in case there are optimistic updates)
        const existingMessages = contextMessages[activeChatId] || [];
        
        // Create a map of existing message IDs
        const existingIds = new Set(sortedMessages.map(m => m.id));
        
        // Keep optimistic messages (with temp IDs) that aren't in the fetched messages
        const optimisticMessages = existingMessages.filter(m => !existingIds.has(m.id));
        
        // Combine: fetched messages + optimistic messages, then sort by time
        const allMessages = [...sortedMessages, ...optimisticMessages].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(activeChatId, allMessages);

        // Clear unread count immediately in UI
        updateChatInList({ id: activeChatId, unread_count: 0 });

        // Mark as read on server
        if (fetchedMessages.length > 0) {
          await markMessagesAsRead(token, activeChatId, { 
            lastMessageId: fetchedMessages[fetchedMessages.length - 1].id 
          });
        }
      } catch (error) {
        console.error(`Failed to initialize chat:`, error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [userId, token]);

  // Mark messages as read when new messages arrive or chat opens
  useEffect(() => {
    if (!chatId || !token || !currentUser || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Always clear unread count when viewing this chat
    updateChatInList({ id: chatId, unread_count: 0 });
    
    // Mark as read on server if there are messages
    if (lastMessage) {
      markMessagesAsRead(token, chatId, { lastMessageId: lastMessage.id }).catch(() => {
        // Failed to mark as read
      });
    }
  }, [messages, chatId, currentUser?.id, token]); // Trigger on any message change, not just length

  // Scroll to bottom when messages load or change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use instant scroll on initial load, smooth on new messages
      const behavior = loading ? 'auto' : 'smooth';
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, [messages, loading]);

  // Scroll to bottom immediately after loading completes
  useEffect(() => {
    if (!loading && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 100);
    }
  }, [loading]);

  // Don't auto-focus input - removed for better UX

  // Close popup when route changes (handles back button on mobile)
  useEffect(() => {
    const currentLocation = location.pathname + location.search;
    if (currentLocation !== initialLocationRef.current) {
      onClose();
    }
  }, [location, onClose]);

  // Handle ESC key to close popup
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const handleSend = async () => {
    if (!chatId || !token || !inputValue.trim() || sending) return;

    const messageContent = inputValue.trim();
    setSending(true);
    
    // Clear input immediately for better UX
    setInputValue('');
    setReplyTo(null);
    
    try {
      const response = await sendMessage(token, chatId, {
        content: messageContent,
        type: 'text',
        replyTo: replyTo?.id,
      });
      
      // Socket will deliver the message automatically via ChatContext
      // Add fallback in case socket is slow (200ms timeout)
      if (response.message) {
        setTimeout(() => {
          const currentMessages = contextMessages[chatId] || [];
          const hasMessage = currentMessages.some(msg => msg.id === response.message.id);
          
          if (!hasMessage) {
            // Socket didn't deliver, add manually
            addMessage(chatId, response.message);
          }
        }, 200);
      }
    } catch (error) {
      // Restore input on error
      setInputValue(messageContent);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }, []);
  
  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
  }, []);

  // Pull to refresh handler
  const handleRefresh = async () => {
    if (!chatId || !token || refreshing) return;
    
    setRefreshing(true);
    try {
      const fetchedMessages = await getChatMessages(token, chatId);
      const sortedMessages = [...fetchedMessages].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(chatId, sortedMessages);
    } catch (error) {
      // Failed to refresh messages
    } finally {
      setRefreshing(false);
      pullY.set(0);
    }
  };

  // Pull to refresh gesture (disabled when typing)
  const bindPull = useDrag(
    ({ down, movement: [, my], cancel }) => {
      // Disable pull-to-refresh when input is focused (typing)
      if (isInputFocused) {
        cancel();
        return;
      }

      if (messagesContainerRef.current) {
        const scrollTop = messagesContainerRef.current.scrollTop;
        
        // Only allow pull when scrolled to top
        if (scrollTop === 0 && my > 0) {
          pullY.set(down ? Math.min(my, 100) : 0);
          
          // Trigger refresh if pulled enough
          if (!down && my > 80) {
            handleRefresh();
          }
        } else if (scrollTop > 0) {
          cancel();
        }
      }
    },
    {
      axis: 'y',
      filterTaps: true,
      pointer: { touch: true },
      enabled: !isInputFocused, // Disable when typing
    }
  );



  return (
      <motion.div
        initial={{ opacity: 0, y: isMobile ? '100%' : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isMobile ? '100%' : 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ height: '100%', width: '100%' }}
      >
      <Paper
        elevation={isMobile ? 0 : 8}
        sx={{
          position: 'fixed',
          ...(isMobile ? {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            borderRadius: 0,
          } : {
            bottom: 16,
            right: 16,
            width: 420,
            height: 600,
            borderRadius: 2,
          }),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1300,
          bgcolor: 'background.default',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minHeight: 60,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Avatar
            onClick={() => navigate(`/profile/${userId}`)}
            src={avatarUrl || `https://ui-avatars.com/api/?name=${username}&size=40`}
            alt={username}
            sx={{ 
              width: 40, 
              height: 40,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 0.9,
              },
            }}
          />
          
          <Box 
            onClick={() => navigate(`/profile/${userId}`)}
            sx={{ 
              flex: 1, 
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9,
              },
            }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 500,
                fontSize: '1rem',
                lineHeight: 1.2,
              }}
            >
              {userId === currentUser?.id ? 'You' : username}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.8125rem',
                opacity: 0.8,
              }}
            >
              {loading ? 'Loading...' : 'Online'}
            </Typography>
          </Box>
          
          <IconButton
            size="small"
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Messages Area */}
        <Box
          ref={messagesContainerRef}
          {...(!isInputFocused ? (bindPull() as any) : {})}
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 1, sm: 2 },
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            position: 'relative',
            touchAction: isInputFocused ? 'auto' : 'pan-y',
            willChange: isInputFocused ? 'auto' : 'transform',
            backgroundImage: theme.palette.mode === 'dark' 
              ? 'none'
              : 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23f0f0f0\' fill-opacity=\'0.05\'/%3E%3C/svg%3E")',
            // Custom scrollbar
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '3px',
              '&:hover': {
                background: 'rgba(0,0,0,0.3)',
              },
            },
          }}
        >
          {/* Pull to Refresh Indicator */}
          <motion.div
            style={{
              y: pullY as any,
              position: 'absolute',
              top: -50,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
          >
            {refreshing && (
              <CircularProgress size={24} sx={{ color: 'primary.main' }} />
            )}
          </motion.div>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 1 }}>
              <Box sx={{ 
                width: 32, 
                height: 32, 
                border: '3px solid rgba(99, 102, 241, 0.2)',
                borderTop: '3px solid rgb(99, 102, 241)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }} />
              <Typography variant="caption" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 1 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" opacity="0.3">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ px: 2 }}>
                No messages yet
                <br />
                <Typography variant="caption" color="text.secondary">
                  Start the conversation!
                </Typography>
              </Typography>
            </Box>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((message) => {
                  const repliedMessage = message.reply_to 
                    ? messages.find(m => m.id === message.reply_to)
                    : null;
                  
                  return (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      currentUserId={currentUser?.id}
                      onReply={handleReply}
                      formatTime={formatTime}
                      repliedMessage={repliedMessage}
                    />
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Reply Preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: 'action.hover',
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <ReplyIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                    Replying to {replyTo.sender_id === currentUser?.id ? 'yourself' : username}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {replyTo.content}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setReplyTo(null)}>
                  <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <IconButton
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <EmojiIcon />
            </IconButton>
            
            <IconButton
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <AttachFileIcon />
            </IconButton>
            
            <Box
              component="input"
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e: any) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Type a message"
              disabled={loading || sending}
              sx={{
                flex: 1,
                padding: '10px 16px',
                border: 'none',
                borderRadius: '24px',
                outline: 'none',
                fontSize: '0.9375rem',
                fontFamily: 'inherit',
                bgcolor: 'background.default',
                color: 'text.primary',
                transition: 'border-color 0.2s',
                willChange: 'auto',
                '&::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.6,
                },
                '&:disabled': {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                },
              }}
            />
            
            {inputValue.trim() ? (
              <IconButton
                onClick={handleSend}
                disabled={loading || sending}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  width: 42,
                  height: 42,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                }}
              >
                <SendIcon sx={{ fontSize: 20 }} />
              </IconButton>
            ) : (
              <IconButton
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <MicIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>
      </motion.div>
  );
};

export default FloatingChatPopup;
