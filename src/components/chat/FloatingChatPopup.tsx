import { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, Avatar, Paper, Fade } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
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
        const existingChat = chats.find(
          chat => chat.type === 'direct' && 
          chat.participants?.some(p => p.id === userId)
        );

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

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
          bottom: 16,
          right: 16,
          width: 380,
          height: 500,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          zIndex: 1300,
          bgcolor: 'background.paper',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar
            src={avatarUrl || `https://ui-avatars.com/api/?name=${username}&size=40`}
            alt={username}
            sx={{ width: 40, height: 40 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {username}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Direct Message
            </Typography>
          </Box>
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
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                Loading messages...
              </Typography>
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No messages yet.
                <br />
                Start the conversation!
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
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: isOwn ? 'primary.main' : 'grey.200',
                        ...(isOwn
                          ? { borderBottomRightRadius: 4 }
                          : { borderBottomLeftRadius: 4 }),
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          wordBreak: 'break-word',
                          color: isOwn ? '#ffffff' : '#1a1a1a',
                        }}
                      >
                        {message.content}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            fontSize: '0.7rem',
                            color: isOwn ? '#ffffff' : '#1a1a1a',
                          }}
                        >
                          {formatTime(message.created_at)}
                        </Typography>
                        {isOwn && (
                          <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                            {message.read_by && message.read_by.some(r => r.user_id !== currentUser?.id) ? (
                              // Double check for read
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 8.5L5 11.5L9 7.5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6 8.5L9 11.5L13 7.5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              // Single check for sent
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={loading || sending}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #e0e0e0',
                borderRadius: '20px',
                outline: 'none',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!inputValue.trim() || loading || sending}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&:disabled': {
                  bgcolor: 'grey.300',
                  color: 'grey.500',
                },
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

export default FloatingChatPopup;
