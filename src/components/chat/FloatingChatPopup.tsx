import { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, Avatar, Paper, Fade } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
  const { token, currentUser } = useUserContext();
  const { chats, messages: contextMessages, setMessages, addMessage, updateChatInList } = useChatContext();
  const { startDirectChat } = useChat();
  
  const [chatId, setChatId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
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

  // Focus input on mount and when messages change
  useEffect(() => {
    inputRef.current?.focus();
  }, [loading, messages.length]);

  // Handle ESC key to close popup
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: { xs: 8, sm: 16 },
          right: { xs: 8, sm: 16 },
          width: { xs: 224, sm: 320 },
          height: { xs: 320, sm: 450 },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: { xs: 1.5, sm: 2 },
          overflow: 'hidden',
          zIndex: 1300,
          bgcolor: 'background.paper',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: { xs: 1, sm: 2 },
            py: { xs: 0.5, sm: 1.5 },
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 },
            minHeight: { xs: 36, sm: 56 },
          }}
        >
          <Avatar
            onClick={() => navigate(`/profile/${userId}`)}
            src={avatarUrl || `https://ui-avatars.com/api/?name=${username}&size=32`}
            alt={username}
            sx={{ 
              width: { xs: 24, sm: 32 }, 
              height: { xs: 24, sm: 32 },
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 0.8,
              },
              '&:active': {
                opacity: 0.6,
              },
            }}
          />
          <Typography 
            variant="subtitle2" 
            onClick={() => navigate(`/profile/${userId}`)}
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 0.8,
              },
              '&:active': {
                opacity: 0.6,
              },
            }}
          >
            {userId === currentUser?.id ? 'You' : username}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'white',
              padding: 0,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 0.75, sm: 1.5 },
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 0.5, sm: 1 },
            // Custom scrollbar
            '&::-webkit-scrollbar': {
              width: '3px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '2px',
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
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '75%',
                        px: { xs: 0.75, sm: 1.5 },
                        py: { xs: 0.375, sm: 0.75 },
                        borderRadius: { xs: '10px', sm: '16px' },
                        bgcolor: isOwn ? 'primary.main' : 'action.hover',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        ...(isOwn
                          ? { borderBottomRightRadius: '3px' }
                          : { borderBottomLeftRadius: '3px' }),
                        animation: 'fadeIn 0.2s ease-in',
                        '@keyframes fadeIn': {
                          '0%': { opacity: 0, transform: 'translateY(4px)' },
                          '100%': { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          wordBreak: 'break-word',
                          color: isOwn ? 'white' : 'text.primary',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          lineHeight: 1.3,
                        }}
                      >
                        {message.content}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.125 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.6,
                            fontSize: { xs: '0.5625rem', sm: '0.65rem' },
                            color: isOwn ? 'white' : 'text.primary',
                          }}
                        >
                          {formatTime(message.created_at)}
                        </Typography>
                        {isOwn && (
                          <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.125 }}>
                            {message.read_by && message.read_by.some(r => r.user_id !== currentUser?.id) ? (
                              // Double check for read
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                <path d="M2 8.5L5 11.5L9 7.5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6 8.5L9 11.5L13 7.5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              // Single check for sent
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8.5L6 11.5L13 4.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

        {/* Input */}
        <Box
          sx={{
            p: { xs: 0.75, sm: 1.5 },
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            minHeight: { xs: 40, sm: 60 },
          }}
        >
          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center' }}>
            <Box
              component="input"
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e: any) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message..."
              disabled={loading || sending}
              sx={{
                flex: 1,
                padding: { xs: '5px 8px', sm: '7px 12px' },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: { xs: '10px', sm: '16px' },
                outline: 'none',
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                fontFamily: 'inherit',
                bgcolor: 'background.paper',
                color: 'text.primary',
                transition: 'all 0.2s',
                '&::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.5,
                },
                '&:focus': {
                  borderColor: 'primary.main',
                  bgcolor: 'background.paper',
                },
                '&:disabled': {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!inputValue.trim() || loading || sending}
              size="small"
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 },
                minWidth: { xs: 28, sm: 32 },
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&:disabled': {
                  bgcolor: 'grey.300',
                  color: 'grey.500',
                },
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

export default FloatingChatPopup;
