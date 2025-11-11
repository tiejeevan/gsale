import { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, Avatar, Paper, Fade, useTheme, useMediaQuery } from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  EmojiEmotions as EmojiIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import { useChatContext } from '../../context/ChatContext';
import { useChat } from '../../hooks/useChat';
import { getChatMessages, sendMessage, markMessagesAsRead } from '../../services/chatService';
import { socket } from '../../socket';
import type { Message } from '../../types/chat';

interface FloatingChatPopupProps {
  userId: number;
  username: string;
  avatarUrl?: string;
  onClose: () => void;
}

const FloatingChatPopup = ({ userId, username, avatarUrl, onClose }: FloatingChatPopupProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { token, currentUser } = useUserContext();
  const { chats, messages: contextMessages, setMessages, addMessage, updateChatInList } = useChatContext();
  const { startDirectChat } = useChat();
  
  const [chatId, setChatId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialLocationRef = useRef(location.pathname + location.search);
  
  // Use context messages and ensure they're sorted
  const messages = chatId 
    ? (contextMessages[chatId] || []).sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : [];

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

        // Join chat room (socket connection is handled by ChatContext)
        if (socket.connected) {
          socket.emit('join_chat', { chatId: activeChatId, userId: currentUser?.id });
        } else {
          // Wait for connection
          socket.once('connect', () => {
            socket.emit('join_chat', { chatId: activeChatId, userId: currentUser?.id });
          });
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (chatId) {
        socket.emit('leave_chat', { chatId });
      }
    };
  }, [userId, token]);

  // Mark messages as read when new messages arrive
  // Note: We don't listen to socket here - ChatContext already handles message:new events
  // and adds them to the context. We just need to mark them as read.
  useEffect(() => {
    if (!chatId || !token || !currentUser) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender_id !== currentUser.id) {
      // Clear unread count immediately in UI
      updateChatInList({ id: chatId, unread_count: 0 });
      
      // Mark as read on server
      markMessagesAsRead(token, chatId, { lastMessageId: lastMessage.id }).catch(err => {
        console.error('Failed to mark messages as read:', err);
      });
    }
  }, [messages.length, chatId, currentUser?.id, token]);

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
    
    // Optimistically add message to UI immediately
    const tempMessage: Message = {
      id: Date.now(), // Temporary ID
      chat_id: chatId,
      sender_id: currentUser?.id || 0,
      content: messageContent,
      type: 'text',
      reply_to: undefined,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      username: currentUser?.username || '',
      avatar_url: currentUser?.profile_image,
      attachments: [],
      reactions: [],
    };
    
    // Add temp message using context's addMessage (which handles duplicates and sorting)
    addMessage(chatId, tempMessage);
    
    try {
      const response = await sendMessage(token, chatId, {
        content: messageContent,
        type: 'text',
      });
      
      // Replace temp message with real message from server
      if (response.message) {
        // Remove temp message and add real one
        const currentMessages = contextMessages[chatId] || [];
        const withoutTemp = currentMessages.filter(msg => msg.id !== tempMessage.id);
        const withReal = [...withoutTemp, response.message].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(chatId, withReal);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      const currentMessages = contextMessages[chatId] || [];
      setMessages(chatId, currentMessages.filter(msg => msg.id !== tempMessage.id));
      setInputValue(messageContent); // Restore input
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <Fade in timeout={300}>
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
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
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
              {messages.map((message) => {
                const isOwn = message.sender_id === currentUser?.id;
                return (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      mb: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '75%',
                        px: 1.5,
                        py: 0.75,
                        borderRadius: '8px',
                        bgcolor: isOwn ? 'primary.main' : 'background.paper',
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                        ...(isOwn
                          ? { borderTopRightRadius: '2px' }
                          : { borderTopLeftRadius: '2px' }),
                        position: 'relative',
                        animation: 'fadeIn 0.15s ease-out',
                        '@keyframes fadeIn': {
                          '0%': { opacity: 0, transform: 'scale(0.95)' },
                          '100%': { opacity: 1, transform: 'scale(1)' },
                        },
                      }}
                    >
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
                            {message.read_by && message.read_by.some(r => r.user_id !== currentUser?.id) ? (
                              // Double check for read
                              <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                                <path d="M1 5L4 8L8 4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M5 5L8 8L15 1" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              // Single check for sent
                              <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                                <path d="M1 5L5 9L15 1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

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
                transition: 'all 0.2s',
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
    </Fade>
  );
};

export default FloatingChatPopup;
