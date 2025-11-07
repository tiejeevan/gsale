import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { socket } from '../socket';
import { useUserContext } from './UserContext';
import type { Chat, Message, TypingUser } from '../types/chat';
import { getUserChats } from '../services/chatService';

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<number, Message[]>;
  typingUsers: Record<number, TypingUser[]>;
  setActiveChat: (chat: Chat | null) => void;
  addMessage: (chatId: number, message: Message) => void;
  updateMessage: (chatId: number, message: Message) => void;
  deleteMessage: (chatId: number, messageId: number) => void;
  addReactionToMessage: (chatId: number, messageId: number, reaction: any) => void;
  removeReactionFromMessage: (chatId: number, messageId: number, userId: number, emoji: string) => void;
  setMessages: (chatId: number, messages: Message[]) => void;
  refreshChats: () => Promise<void>;
  updateChatInList: (updatedChat: Partial<Chat> & { id: number }) => void;
  totalUnreadCount: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { token, currentUser } = useUserContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessagesState] = useState<Record<number, Message[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<number, TypingUser[]>>({});

  // Calculate total unread count
  const totalUnreadCount = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);

  // Fetch chats on mount
  const refreshChats = async () => {
    if (!token) return;
    try {
      const fetchedChats = await getUserChats(token);
      
      // Filter out invalid chats
      const validChats = fetchedChats.filter(chat => {
        // Keep chats that have a title or participants
        const hasTitle = chat.title && chat.title.trim() !== '';
        const hasParticipants = chat.participants && chat.participants.length > 0;
        const hasLastMessage = chat.last_message_content && chat.last_message_content.trim() !== '';
        
        // Keep chat if it has any of these
        return hasTitle || hasParticipants || hasLastMessage;
      });
      
      setChats(validChats);
      
      // Join all chat rooms to receive real-time messages
      if (socket.connected && currentUser) {
        validChats.forEach(chat => {
          socket.emit('join_chat', { chatId: chat.id, userId: currentUser.id });
        });
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  useEffect(() => {
    refreshChats();
  }, [token]);

  // Socket event handlers
  useEffect(() => {
    if (!currentUser) return;

    // Connect socket if not connected (only once)
    if (!socket.connected) {
      socket.connect();
    }

    // Join all chat rooms when socket connects
    const handleConnect = () => {
      if (chats.length > 0) {
        chats.forEach(chat => {
          socket.emit('join_chat', { chatId: chat.id, userId: currentUser.id });
        });
      }
    };

    // Only join if we have chats and socket is connected
    if (socket.connected && chats.length > 0) {
      handleConnect();
    }
    
    // Listen for future connections
    socket.on('connect', handleConnect);

    // New message received
    const handleNewMessage = (message: Message) => {
      addMessage(message.chat_id, message);
      
      // Update chat list
      setChats(prev => {
        const chatIndex = prev.findIndex(c => c.id === message.chat_id);
        if (chatIndex === -1) {
          // New chat, refresh the list
          refreshChats();
          return prev;
        }
        
        const updatedChats = [...prev];
        const chat = { ...updatedChats[chatIndex] };
        
        chat.last_message_at = message.created_at;
        chat.last_message_content = message.content;
        chat.last_message_type = message.type;
        chat.last_message_sender = message.username;
        
        // Increment unread if not from current user and not active chat
        if (message.sender_id !== currentUser.id && activeChat?.id !== message.chat_id) {
          chat.unread_count = (chat.unread_count || 0) + 1;
        }
        
        updatedChats[chatIndex] = chat;
        
        // Sort by last message time
        return updatedChats.sort((a, b) => {
          const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return timeB - timeA;
        });
      });
    };

    // Message edited
    const handleMessageEdited = (message: Message) => {
      updateMessage(message.chat_id, message);
    };

    // Message deleted
    const handleMessageDeleted = ({ messageId, chatId }: { messageId: number; chatId: number }) => {
      deleteMessage(chatId, messageId);
    };

    // User typing
    const handleUserTyping = ({ chatId, userId, username, avatar_url }: any) => {
      if (userId === currentUser.id) return; // Don't show own typing
      
      setTypingUsers(prev => {
        const chatTyping = prev[chatId] || [];
        if (chatTyping.some(u => u.id === userId)) return prev;
        
        return {
          ...prev,
          [chatId]: [...chatTyping, { id: userId, username, avatar_url }],
        };
      });
    };

    // User stopped typing
    const handleUserStopTyping = ({ chatId, userId }: any) => {
      setTypingUsers(prev => {
        const chatTyping = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: chatTyping.filter(u => u.id !== userId),
        };
      });
    };

    // Messages read
    const handleMessagesRead = ({ chatId, userId, lastMessageId }: any) => {
      // If current user read the messages, clear unread count
      if (userId === currentUser.id) {
        setChats(prev => 
          prev.map(chat => 
            chat.id === chatId 
              ? { ...chat, unread_count: 0 }
              : chat
          )
        );
      } else {
        // Someone else read our messages - update read status
        setMessagesState(prev => {
          const chatMessages = prev[chatId] || [];
          
          const updatedMessages = chatMessages.map(msg => {
            // Update read status for messages up to lastMessageId
            if (msg.id <= lastMessageId && msg.sender_id === currentUser.id) {
              const readBy = msg.read_by || [];
              const alreadyRead = readBy.some(r => r.user_id === userId);
              
              if (!alreadyRead) {
                return {
                  ...msg,
                  read_by: [...readBy, { user_id: userId, status: 'read' as const, updated_at: new Date().toISOString() }]
                };
              }
            }
            return msg;
          });
          
          return {
            ...prev,
            [chatId]: updatedMessages
          };
        });
      }
    };

    // Reaction added
    const handleReactionAdded = ({ messageId, chatId, userId, username, emoji }: any) => {
      addReactionToMessage(chatId, messageId, { emoji, user_id: userId, username });
    };

    // Reaction removed
    const handleReactionRemoved = ({ messageId, chatId, userId, emoji }: any) => {
      removeReactionFromMessage(chatId, messageId, userId, emoji);
    };

    // New message notification (for chats not yet in list or when user is not in chat room)
    const handleChatNewMessage = ({ chatId, message }: { chatId: number; message: Message }) => {
      // Check if chat exists in list
      const chatExists = chats.some(c => c.id === chatId);
      
      if (!chatExists) {
        // New chat - refresh the entire list to get it
        refreshChats();
      }
      // If chat exists, handleNewMessage will be called via message:new event
      // No need to call it here to avoid duplicates
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('user:typing', handleUserTyping);
    socket.on('user:stop_typing', handleUserStopTyping);
    socket.on('messages:read', handleMessagesRead);
    socket.on('reaction:added', handleReactionAdded);
    socket.on('reaction:removed', handleReactionRemoved);
    socket.on('chat:new_message', handleChatNewMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('message:new', handleNewMessage);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('user:typing', handleUserTyping);
      socket.off('user:stop_typing', handleUserStopTyping);
      socket.off('messages:read', handleMessagesRead);
      socket.off('reaction:added', handleReactionAdded);
      socket.off('reaction:removed', handleReactionRemoved);
      socket.off('chat:new_message', handleChatNewMessage);
    };
  }, [currentUser, activeChat, chats]);

  // Join/leave chat rooms when active chat changes
  useEffect(() => {
    if (!activeChat || !currentUser) return;

    const joinChat = () => {
      socket.emit('join_chat', { chatId: activeChat.id, userId: currentUser.id });
    };

    if (socket.connected) {
      joinChat();
    } else {
      socket.once('connect', joinChat);
    }

    return () => {
      if (socket.connected) {
        socket.emit('leave_chat', { chatId: activeChat.id });
      }
      socket.off('connect', joinChat);
    };
  }, [activeChat, currentUser]);

  const addMessage = (chatId: number, message: Message) => {
    setMessagesState(prev => {
      const existingMessages = prev[chatId] || [];
      
      // Prevent duplicates - check if message already exists by ID
      const exists = existingMessages.some(m => m.id === message.id);
      if (exists) {
        // Silently ignore duplicates (this is normal with socket + API responses)
        return prev;
      }
      
      // Add message and sort by timestamp to maintain chronological order
      const updatedMessages = [...existingMessages, message].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      return {
        ...prev,
        [chatId]: updatedMessages,
      };
    });
  };

  const updateMessage = (chatId: number, updatedMessage: Message) => {
    setMessagesState(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(msg =>
        msg.id === updatedMessage.id ? updatedMessage : msg
      ),
    }));
  };

  const deleteMessage = (chatId: number, messageId: number) => {
    setMessagesState(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).filter(msg => msg.id !== messageId),
    }));
  };

  const addReactionToMessage = (chatId: number, messageId: number, reaction: any) => {
    setMessagesState(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          return { ...msg, reactions: [...reactions, reaction] };
        }
        return msg;
      }),
    }));
  };

  const removeReactionFromMessage = (chatId: number, messageId: number, userId: number, emoji: string) => {
    setMessagesState(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(msg => {
        if (msg.id === messageId) {
          const reactions = (msg.reactions || []).filter(
            r => !(r.user_id === userId && r.emoji === emoji)
          );
          return { ...msg, reactions };
        }
        return msg;
      }),
    }));
  };

  const setMessages = (chatId: number, newMessages: Message[]) => {
    setMessagesState(prev => ({
      ...prev,
      [chatId]: newMessages,
    }));
  };

  const updateChatInList = (updatedChat: Partial<Chat> & { id: number }) => {
    setChats(prev =>
      prev.map(chat => (chat.id === updatedChat.id ? { ...chat, ...updatedChat } : chat))
    );
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        messages,
        typingUsers,
        setActiveChat,
        addMessage,
        updateMessage,
        deleteMessage,
        addReactionToMessage,
        removeReactionFromMessage,
        setMessages,
        refreshChats,
        updateChatInList,
        totalUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
